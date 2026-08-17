import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { R2BucketInfo } from './d1Scanner';

export interface R2ObjectSummary {
  key: string;
  blobId: string;
  version: string;
  size: number;
  etag: string;
  uploaded: number; // ms timestamp
  httpMetadata: Record<string, any>;
  customMetadata: Record<string, string>;
  checksums: Record<string, any>;
  isImage: boolean;
  mimeType: string;
  thumbnailUrl?: string; // base64 preview for thumbnails
}

export interface R2BucketSummary {
  totalObjects: number;
  totalSizeBytes: number;
  imageCount: number;
}

export class R2BucketManager {
  private static SQL: SqlJsStatic | null = null;
  private currentDb: Database | null = null;
  private currentBucketInfo: R2BucketInfo | null = null;

  public static async initialize(extensionPath: string): Promise<void> {
    if (!this.SQL) {
      const wasmPath = path.join(extensionPath, 'dist', 'sql-wasm.wasm');
      this.SQL = await initSqlJs({
        locateFile: () => wasmPath,
      });
    }
  }

  public openBucket(bucketInfo: R2BucketInfo): void {
    if (!R2BucketManager.SQL) {
      throw new Error('Sql.js has not been initialized yet.');
    }
    this.currentBucketInfo = bucketInfo;

    if (bucketInfo.sqlitePath && fs.existsSync(bucketInfo.sqlitePath)) {
      const fileBuffer = fs.readFileSync(bucketInfo.sqlitePath);
      this.currentDb = new R2BucketManager.SQL.Database(fileBuffer);
    } else {
      // Create in-memory DB or empty state
      this.currentDb = new R2BucketManager.SQL.Database();
      this.currentDb.exec(`
        CREATE TABLE IF NOT EXISTS _mf_objects (
          key TEXT PRIMARY KEY,
          blob_id TEXT,
          version TEXT NOT NULL,
          size INTEGER NOT NULL,
          etag TEXT NOT NULL,
          uploaded INTEGER NOT NULL,
          checksums TEXT NOT NULL,
          http_metadata TEXT NOT NULL,
          custom_metadata TEXT NOT NULL
        )
      `);
    }
  }

  public saveToDisk(): void {
    if (!this.currentDb || !this.currentBucketInfo?.sqlitePath) return;
    const data = this.currentDb.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(this.currentBucketInfo.sqlitePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.currentBucketInfo.sqlitePath, buffer);
  }

  public getBucketSummary(): R2BucketSummary {
    if (!this.currentDb) {
      return { totalObjects: 0, totalSizeBytes: 0, imageCount: 0 };
    }

    try {
      const countRes = this.currentDb.exec('SELECT COUNT(*), SUM(size) FROM _mf_objects');
      let totalObjects = 0;
      let totalSizeBytes = 0;

      if (countRes.length && countRes[0].values[0]) {
        totalObjects = Number(countRes[0].values[0][0] || 0);
        totalSizeBytes = Number(countRes[0].values[0][1] || 0);
      }

      // Count image objects
      const allKeysRes = this.currentDb.exec('SELECT key, http_metadata FROM _mf_objects');
      let imageCount = 0;
      if (allKeysRes.length && allKeysRes[0].values) {
        for (const row of allKeysRes[0].values) {
          const key = String(row[0] || '');
          let httpMeta: any = {};
          try {
            httpMeta = JSON.parse(String(row[1] || '{}'));
          } catch {}
          const mime = httpMeta.contentType || this.guessMimeType(key);
          if (mime.startsWith('image/')) {
            imageCount++;
          }
        }
      }

      return { totalObjects, totalSizeBytes, imageCount };
    } catch (err) {
      console.error('Error getting bucket summary:', err);
      return { totalObjects: 0, totalSizeBytes: 0, imageCount: 0 };
    }
  }

  public getObjects(
    page: number = 1,
    pageSize: number = 24,
    searchQuery?: string,
    filterType: 'all' | 'images' | 'other' = 'all',
    sortColumn: string = 'uploaded',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): {
    objects: R2ObjectSummary[];
    totalObjects: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    if (!this.currentDb) {
      return { objects: [], totalObjects: 0, page: 1, pageSize, totalPages: 0 };
    }

    try {
      let whereClauses: string[] = [];

      if (searchQuery && searchQuery.trim()) {
        const sanitized = searchQuery.trim().replace(/'/g, "''");
        whereClauses.push(`(key LIKE '%${sanitized}%' OR custom_metadata LIKE '%${sanitized}%')`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count total matching
      let totalObjects = 0;
      const countRes = this.currentDb.exec(`SELECT COUNT(*) FROM _mf_objects ${whereSql}`);
      if (countRes.length && countRes[0].values[0]) {
        totalObjects = Number(countRes[0].values[0][0] || 0);
      }

      const totalPages = Math.ceil(totalObjects / pageSize) || 1;
      const validPage = Math.max(1, Math.min(page, totalPages));
      const offset = (validPage - 1) * pageSize;

      // Validate sort column
      const validSortCols = ['uploaded', 'size', 'key', 'etag'];
      const safeSortCol = validSortCols.includes(sortColumn) ? sortColumn : 'uploaded';
      const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

      const query = `
        SELECT key, blob_id, version, size, etag, uploaded, checksums, http_metadata, custom_metadata
        FROM _mf_objects
        ${whereSql}
        ORDER BY ${safeSortCol} ${safeSortOrder}
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      const dataRes = this.currentDb.exec(query);
      const objects: R2ObjectSummary[] = [];

      if (dataRes.length && dataRes[0]?.values) {
        for (const row of dataRes[0].values) {
          const key = String(row[0] || '');
          const blobId = String(row[1] || '');
          const version = String(row[2] || '');
          const size = Number(row[3] || 0);
          const etag = String(row[4] || '');
          const uploaded = Number(row[5] || 0);

          let checksums: any = {};
          let httpMetadata: any = {};
          let customMetadata: any = {};

          try { checksums = JSON.parse(String(row[6] || '{}')); } catch {}
          try { httpMetadata = JSON.parse(String(row[7] || '{}')); } catch {}
          try { customMetadata = JSON.parse(String(row[8] || '{}')); } catch {}

          const mimeType = httpMetadata.contentType || this.guessMimeType(key);
          const isImage = mimeType.startsWith('image/') || this.isImageExtension(key);

          // Apply filter type if images only or other only
          if (filterType === 'images' && !isImage) continue;
          if (filterType === 'other' && isImage) continue;

          // Generate thumbnail for small/medium images (under 4MB)
          let thumbnailUrl: string | undefined = undefined;
          if (isImage && this.currentBucketInfo?.blobsDir) {
            const blobPath = path.join(this.currentBucketInfo.blobsDir, blobId);
            if (fs.existsSync(blobPath) && size <= 4 * 1024 * 1024) {
              try {
                const blobBuf = fs.readFileSync(blobPath);
                thumbnailUrl = `data:${mimeType};base64,${blobBuf.toString('base64')}`;
              } catch {
                // Ignore preview generation error
              }
            }
          }

          objects.push({
            key,
            blobId,
            version,
            size,
            etag,
            uploaded,
            httpMetadata,
            customMetadata,
            checksums,
            isImage,
            mimeType,
            thumbnailUrl,
          });
        }
      }

      return {
        objects,
        totalObjects,
        page: validPage,
        pageSize,
        totalPages,
      };
    } catch (err) {
      console.error('Error fetching R2 objects:', err);
      return { objects: [], totalObjects: 0, page: 1, pageSize, totalPages: 0 };
    }
  }

  public getObjectDetails(key: string): {
    object: R2ObjectSummary | null;
    dataUri?: string;
    blobPath?: string;
    error?: string;
  } {
    if (!this.currentDb) {
      return { object: null, error: 'Bucket not open' };
    }

    try {
      const sanitizedKey = key.replace(/'/g, "''");
      const res = this.currentDb.exec(`
        SELECT key, blob_id, version, size, etag, uploaded, checksums, http_metadata, custom_metadata
        FROM _mf_objects
        WHERE key = '${sanitizedKey}'
        LIMIT 1
      `);

      if (!res.length || !res[0]?.values?.[0]) {
        return { object: null, error: 'Object not found' };
      }

      const row = res[0].values[0];
      const blobId = String(row[1] || '');
      const version = String(row[2] || '');
      const size = Number(row[3] || 0);
      const etag = String(row[4] || '');
      const uploaded = Number(row[5] || 0);

      let checksums: any = {};
      let httpMetadata: any = {};
      let customMetadata: any = {};

      try { checksums = JSON.parse(String(row[6] || '{}')); } catch {}
      try { httpMetadata = JSON.parse(String(row[7] || '{}')); } catch {}
      try { customMetadata = JSON.parse(String(row[8] || '{}')); } catch {}

      const mimeType = httpMetadata.contentType || this.guessMimeType(key);
      const isImage = mimeType.startsWith('image/') || this.isImageExtension(key);

      let dataUri: string | undefined = undefined;
      let blobPath: string | undefined = undefined;

      if (this.currentBucketInfo?.blobsDir) {
        blobPath = path.join(this.currentBucketInfo.blobsDir, blobId);
        if (fs.existsSync(blobPath)) {
          try {
            const blobBuf = fs.readFileSync(blobPath);
            dataUri = `data:${mimeType};base64,${blobBuf.toString('base64')}`;
          } catch {
            // Ignore preview read error
          }
        }
      }

      const object: R2ObjectSummary = {
        key,
        blobId,
        version,
        size,
        etag,
        uploaded,
        httpMetadata,
        customMetadata,
        checksums,
        isImage,
        mimeType,
        thumbnailUrl: dataUri,
      };

      return { object, dataUri, blobPath };
    } catch (err: any) {
      return { object: null, error: err?.message || String(err) };
    }
  }

  public putObject(
    key: string,
    base64Data: string,
    contentType?: string,
    customMetadata?: Record<string, string>
  ): { success: boolean; error?: string } {
    if (!this.currentDb || !this.currentBucketInfo) {
      return { success: false, error: 'No bucket open' };
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const mime = contentType || this.guessMimeType(key);

      // Ensure blobs directory exists
      if (!fs.existsSync(this.currentBucketInfo.blobsDir)) {
        fs.mkdirSync(this.currentBucketInfo.blobsDir, { recursive: true });
      }

      // Generate Miniflare blob ID: sha256 of content + 16-hex timestamp
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      const timestampHex = Date.now().toString(16).padStart(16, '0');
      const blobId = `${sha256}${timestampHex}`;
      const etag = crypto.createHash('md5').update(buffer).digest('hex');
      const version = crypto.randomBytes(16).toString('hex');
      const uploaded = Date.now();

      const httpMetaStr = JSON.stringify({ contentType: mime });
      const customMetaStr = JSON.stringify(customMetadata || {});

      // Write blob file to disk
      const blobFilePath = path.join(this.currentBucketInfo.blobsDir, blobId);
      fs.writeFileSync(blobFilePath, buffer);

      // Insert or update SQLite record
      const stmt = this.currentDb.prepare(`
        INSERT OR REPLACE INTO _mf_objects (
          key, blob_id, version, size, etag, uploaded, checksums, http_metadata, custom_metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([key, blobId, version, buffer.length, etag, uploaded, '{}', httpMetaStr, customMetaStr]);
      stmt.free();

      this.saveToDisk();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  public deleteObject(key: string): { success: boolean; error?: string } {
    if (!this.currentDb || !this.currentBucketInfo) {
      return { success: false, error: 'No bucket open' };
    }

    try {
      const sanitizedKey = key.replace(/'/g, "''");
      const res = this.currentDb.exec(`SELECT blob_id FROM _mf_objects WHERE key = '${sanitizedKey}'`);
      const blobId = res[0]?.values?.[0]?.[0] ? String(res[0].values[0][0]) : null;

      // Delete record from SQLite
      this.currentDb.exec(`DELETE FROM _mf_objects WHERE key = '${sanitizedKey}'`);
      this.saveToDisk();

      // Delete blob file if no other object references it
      if (blobId && this.currentBucketInfo.blobsDir) {
        const checkOther = this.currentDb.exec(`SELECT COUNT(*) FROM _mf_objects WHERE blob_id = '${blobId}'`);
        const count = checkOther[0]?.values?.[0]?.[0] ? Number(checkOther[0].values[0][0]) : 0;
        if (count === 0) {
          const blobPath = path.join(this.currentBucketInfo.blobsDir, blobId);
          if (fs.existsSync(blobPath)) {
            fs.unlinkSync(blobPath);
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  public exportObjectToFile(key: string, destinationFilePath: string): { success: boolean; error?: string } {
    if (!this.currentDb || !this.currentBucketInfo) {
      return { success: false, error: 'No bucket open' };
    }

    try {
      const sanitizedKey = key.replace(/'/g, "''");
      const res = this.currentDb.exec(`SELECT blob_id FROM _mf_objects WHERE key = '${sanitizedKey}'`);
      if (!res.length || !res[0]?.values?.[0]) {
        return { success: false, error: 'Object not found' };
      }

      const blobId = String(res[0].values[0][0]);
      const blobPath = path.join(this.currentBucketInfo.blobsDir, blobId);

      if (!fs.existsSync(blobPath)) {
        return { success: false, error: 'Blob file missing on disk' };
      }

      fs.copyFileSync(blobPath, destinationFilePath);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  private isImageExtension(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif', '.ico', '.bmp'].includes(ext);
  }

  private guessMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const map: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif',
      '.avif': 'image/avif',
      '.ico': 'image/x-icon',
      '.bmp': 'image/bmp',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mp3',
    };
    return map[ext] || 'application/octet-stream';
  }
}
