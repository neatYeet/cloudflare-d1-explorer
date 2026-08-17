import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface D1DatabaseInfo {
  id: string;
  name: string;
  filePath: string;
  sizeBytes: number;
  projectPath: string;
  wranglerBinding?: string;
}

export interface R2BucketInfo {
  id: string;
  name: string;
  bucketName: string;
  projectPath: string;
  blobsDir: string;
  sqlitePath?: string;
  wranglerBinding?: string;
  objectCount?: number;
  totalSizeBytes?: number;
}

export class D1Scanner {
  public static async scanWorkspace(): Promise<D1DatabaseInfo[]> {
    const { databases } = await this.scanAll();
    return databases;
  }

  public static async scanR2Buckets(): Promise<R2BucketInfo[]> {
    const { r2Buckets } = await this.scanAll();
    return r2Buckets;
  }

  public static async scanAll(): Promise<{
    databases: D1DatabaseInfo[];
    r2Buckets: R2BucketInfo[];
  }> {
    const databases: D1DatabaseInfo[] = [];
    const r2Buckets: R2BucketInfo[] = [];

    // Common search locations: workspace folders and standard project paths
    const searchRoots: string[] = [];

    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        searchRoots.push(folder.uri.fsPath);
      }
    }

    // Also include default known project parent if applicable (e.g., c:\project)
    const extraKnownPath = path.resolve('c:/project');
    if (fs.existsSync(extraKnownPath) && !searchRoots.includes(extraKnownPath)) {
      searchRoots.push(extraKnownPath);
    }

    const visitedDirs = new Set<string>();

    for (const root of searchRoots) {
      this.scanDirectoryRecursive(root, databases, r2Buckets, visitedDirs, 0);
    }

    return { databases, r2Buckets };
  }

  private static scanDirectoryRecursive(
    dirPath: string,
    d1Results: D1DatabaseInfo[],
    r2Results: R2BucketInfo[],
    visited: Set<string>,
    depth: number
  ): void {
    if (depth > 6 || visited.has(dirPath)) return;
    visited.add(dirPath);

    try {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dirPath, entry.name);

          // Check for .wrangler directory pattern
          if (entry.name === '.wrangler') {
            this.scanWranglerD1Directory(fullPath, d1Results);
            this.scanWranglerR2Directory(fullPath, r2Results);
          } else if (!['node_modules', '.git', '.turbo', 'dist', 'out'].includes(entry.name)) {
            this.scanDirectoryRecursive(fullPath, d1Results, r2Results, visited, depth + 1);
          }
        }
      }
    } catch {
      // Ignore permission or inaccessible directory errors
    }
  }

  public static scanWranglerD1Directory(wranglerDir: string, results: D1DatabaseInfo[]): void {
    try {
      const d1StateDir = path.join(wranglerDir, 'state', 'v3', 'd1');
      if (!fs.existsSync(d1StateDir)) return;

      const projectPath = path.dirname(wranglerDir);
      const bindingInfo = this.findWranglerD1BindingName(projectPath);

      this.findD1SqliteFiles(d1StateDir, projectPath, bindingInfo, results);
    } catch {
      // Ignore errors
    }
  }

  public static scanWranglerR2Directory(wranglerDir: string, results: R2BucketInfo[]): void {
    try {
      const r2StateDir = path.join(wranglerDir, 'state', 'v3', 'r2');
      if (!fs.existsSync(r2StateDir)) return;

      const projectPath = path.dirname(wranglerDir);
      const projectName = path.basename(projectPath);
      const r2Bindings = this.findWranglerR2Bindings(projectPath);

      // Look for DO SQLite files in miniflare-R2BucketObject
      const doDir = path.join(r2StateDir, 'miniflare-R2BucketObject');
      const sqliteFiles: string[] = [];
      if (fs.existsSync(doDir)) {
        const doEntries = fs.readdirSync(doDir);
        for (const file of doEntries) {
          if (file.endsWith('.sqlite') && !file.startsWith('metadata')) {
            sqliteFiles.push(path.join(doDir, file));
          }
        }
      }

      // Check subdirectories in r2StateDir
      const r2Entries = fs.readdirSync(r2StateDir, { withFileTypes: true });
      for (const entry of r2Entries) {
        if (entry.isDirectory() && entry.name !== 'miniflare-R2BucketObject') {
          const bucketName = entry.name;
          const blobsDir = path.join(r2StateDir, bucketName, 'blobs');
          const binding = r2Bindings.find((b) => b.bucketName === bucketName);

          const displayName = binding?.binding
            ? `${projectName} (${binding.binding})`
            : `${projectName} [${bucketName}]`;

          // Match SQLite file
          const sqlitePath = sqliteFiles.length > 0 ? sqliteFiles[0] : undefined;

          // Check if already in results
          const existing = results.find((r) => r.blobsDir === blobsDir);
          if (!existing) {
            results.push({
              id: `${projectName}-${bucketName}`,
              name: displayName,
              bucketName,
              projectPath,
              blobsDir,
              sqlitePath,
              wranglerBinding: binding?.binding,
            });
          }
        }
      }

      // Also check if any r2Bindings exist that may not have created a blob dir yet
      for (const b of r2Bindings) {
        const blobsDir = path.join(r2StateDir, b.bucketName, 'blobs');
        const existing = results.find((r) => r.bucketName === b.bucketName && r.projectPath === projectPath);
        if (!existing) {
          const displayName = b.binding
            ? `${projectName} (${b.binding})`
            : `${projectName} [${b.bucketName}]`;

          results.push({
            id: `${projectName}-${b.bucketName}`,
            name: displayName,
            bucketName: b.bucketName,
            projectPath,
            blobsDir,
            sqlitePath: sqliteFiles[0],
            wranglerBinding: b.binding,
          });
        }
      }
    } catch {
      // Ignore errors
    }
  }

  private static findD1SqliteFiles(
    dirPath: string,
    projectPath: string,
    bindingName: string | undefined,
    results: D1DatabaseInfo[]
  ): void {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          this.findD1SqliteFiles(fullPath, projectPath, bindingName, results);
        } else if (entry.isFile() && entry.name.endsWith('.sqlite') && !entry.name.startsWith('metadata')) {
          const stats = fs.statSync(fullPath);
          const projectName = path.basename(projectPath);
          const shortHash = entry.name.replace('.sqlite', '').substring(0, 8);
          const displayName = bindingName
            ? `${projectName} (${bindingName})`
            : `${projectName} [${shortHash}]`;

          // Avoid duplicate entries
          if (!results.some((d) => d.filePath === fullPath)) {
            results.push({
              id: entry.name,
              name: displayName,
              filePath: fullPath,
              sizeBytes: stats.size,
              projectPath,
              wranglerBinding: bindingName,
            });
          }
        }
      }
    } catch {
      // Ignore errors
    }
  }

  private static findWranglerD1BindingName(projectPath: string): string | undefined {
    const jsoncPath = path.join(projectPath, 'wrangler.jsonc');
    const jsonPath = path.join(projectPath, 'wrangler.json');
    const tomlPath = path.join(projectPath, 'wrangler.toml');

    try {
      if (fs.existsSync(jsoncPath)) {
        const content = fs.readFileSync(jsoncPath, 'utf8');
        const dbNameMatch = content.match(/"database_name"\s*:\s*"([^"]+)"/);
        if (dbNameMatch) return dbNameMatch[1];
        const bindingMatch = content.match(/"binding"\s*:\s*"([^"]+)"/);
        if (bindingMatch) return bindingMatch[1];
      }
      if (fs.existsSync(jsonPath)) {
        const content = fs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed.d1_databases && parsed.d1_databases[0]) {
          return parsed.d1_databases[0].database_name || parsed.d1_databases[0].binding;
        }
      }
      if (fs.existsSync(tomlPath)) {
        const content = fs.readFileSync(tomlPath, 'utf8');
        const dbNameMatch = content.match(/database_name\s*=\s*"([^"]+)"/);
        if (dbNameMatch) return dbNameMatch[1];
        const bindingMatch = content.match(/binding\s*=\s*"([^"]+)"/);
        if (bindingMatch) return bindingMatch[1];
      }
    } catch {
      // Ignore parse errors
    }
    return undefined;
  }

  private static findWranglerR2Bindings(projectPath: string): Array<{ binding?: string; bucketName: string }> {
    const jsoncPath = path.join(projectPath, 'wrangler.jsonc');
    const jsonPath = path.join(projectPath, 'wrangler.json');
    const tomlPath = path.join(projectPath, 'wrangler.toml');
    const bindings: Array<{ binding?: string; bucketName: string }> = [];

    try {
      if (fs.existsSync(jsoncPath)) {
        const content = fs.readFileSync(jsoncPath, 'utf8');
        const r2Match = content.match(/"r2_buckets"\s*:\s*\[([\s\S]*?)\]/);
        if (r2Match) {
          const bucketBlocks = r2Match[1].match(/\{[\s\S]*?\}/g);
          if (bucketBlocks) {
            for (const block of bucketBlocks) {
              const binding = block.match(/"binding"\s*:\s*"([^"]+)"/)?.[1];
              const bucketName = block.match(/"bucket_name"\s*:\s*"([^"]+)"/)?.[1];
              if (bucketName) bindings.push({ binding, bucketName });
            }
          }
        }
      }
      if (fs.existsSync(jsonPath)) {
        const content = fs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.r2_buckets)) {
          for (const b of parsed.r2_buckets) {
            if (b.bucket_name) {
              bindings.push({ binding: b.binding, bucketName: b.bucket_name });
            }
          }
        }
      }
      if (fs.existsSync(tomlPath)) {
        const content = fs.readFileSync(tomlPath, 'utf8');
        const matches = content.matchAll(/\[\[r2_buckets\]\][\s\S]*?bucket_name\s*=\s*"([^"]+)"(?:[\s\S]*?binding\s*=\s*"([^"]+)")?/g);
        for (const match of matches) {
          const bucketName = match[1];
          const binding = match[2];
          if (bucketName) bindings.push({ binding, bucketName });
        }
      }
    } catch {
      // Ignore parse errors
    }

    return bindings;
  }
}
