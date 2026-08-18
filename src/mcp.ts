import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { D1Scanner } from './d1Scanner';
import { D1DatabaseManager } from './d1DatabaseManager';
import { R2BucketManager } from './r2BucketManager';

async function main() {
  // Initialize sql.js engines
  await D1DatabaseManager.initialize();
  await R2BucketManager.initialize();

  const server = new McpServer({
    name: 'cloudflare-d1-r2-explorer',
    version: '1.2.0',
  });

  const dbManager = new D1DatabaseManager();
  const r2Manager = new R2BucketManager();

  // D1 Tool: List Databases
  server.tool(
    'd1_list_databases',
    'Discover and list all local Cloudflare D1 databases in the workspace or specified search root directories.',
    {
      search_root: z
        .string()
        .optional()
        .describe('Optional workspace directory or root path to search for .wrangler/state/v3/d1 databases'),
    },
    async ({ search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const databases = await D1Scanner.scanWorkspace(roots);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: databases.length,
                  databases: databases.map((d) => ({
                    id: d.id,
                    name: d.name,
                    binding: d.wranglerBinding || null,
                    projectPath: d.projectPath,
                    filePath: d.filePath,
                    sizeBytes: d.sizeBytes,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to scan D1 databases: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // D1 Tool: List Tables
  server.tool(
    'd1_list_tables',
    'List all tables and their row counts in a local Cloudflare D1 database.',
    {
      database: z
        .string()
        .describe('Database identifier: database name, binding name, ID, or direct SQLite file path'),
      search_root: z.string().optional().describe('Optional search root directory to resolve database'),
    },
    async ({ database, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const dbInfo = await D1Scanner.findDatabase(database, roots);
        if (!dbInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Database not found matching: "${database}"` }],
          };
        }

        dbManager.openDatabase(dbInfo.filePath);
        const tables = dbManager.getTables();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  database: dbInfo.name,
                  filePath: dbInfo.filePath,
                  tableCount: tables.length,
                  tables,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error reading tables: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // D1 Tool: Get Schema
  server.tool(
    'd1_get_schema',
    'Get structure, column definitions, data types, indexes, foreign keys, and CREATE TABLE SQL for tables in a D1 database.',
    {
      database: z
        .string()
        .describe('Database identifier: database name, binding name, ID, or direct SQLite file path'),
      table: z
        .string()
        .optional()
        .describe('Specific table name to inspect. If omitted, returns schema for all tables in the database.'),
      search_root: z.string().optional().describe('Optional search root directory to resolve database'),
    },
    async ({ database, table, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const dbInfo = await D1Scanner.findDatabase(database, roots);
        if (!dbInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Database not found matching: "${database}"` }],
          };
        }

        dbManager.openDatabase(dbInfo.filePath);

        if (table) {
          const structure = dbManager.getTableStructure(table);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ database: dbInfo.name, table, ...structure }, null, 2),
              },
            ],
          };
        }

        const fullSchema = dbManager.getAllTablesStructure();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ database: dbInfo.name, schema: fullSchema }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching schema: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // D1 Tool: Select Query (Read-Only)
  server.tool(
    'd1_select_query',
    'Execute a read-only SQL query (SELECT, EXPLAIN, PRAGMA) against a local Cloudflare D1 database. Write mutations (INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, etc.) are blocked.',
    {
      database: z
        .string()
        .describe('Database identifier: database name, binding name, ID, or direct SQLite file path'),
      sql: z.string().describe('The read-only SQL query statement to execute (SELECT, EXPLAIN, PRAGMA)'),
      search_root: z.string().optional().describe('Optional search root directory to resolve database'),
    },
    async ({ database, sql, search_root }) => {
      try {
        const trimmed = sql.trim();
        // Check for mutation keywords
        if (
          !/^\s*(SELECT|EXPLAIN|PRAGMA|WITH)\b/i.test(trimmed) ||
          /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|REPLACE|VACUUM|ATTACH|DETACH)\b/i.test(trimmed)
        ) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: 'Blocked: d1_select_query only allows read-only queries (SELECT, EXPLAIN, PRAGMA). For database mutations (INSERT, UPDATE, DELETE, CREATE, DROP, ALTER), use the d1_write_query tool instead.',
              },
            ],
          };
        }

        const roots = search_root ? [search_root] : undefined;
        const dbInfo = await D1Scanner.findDatabase(database, roots);
        if (!dbInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Database not found matching: "${database}"` }],
          };
        }

        dbManager.openDatabase(dbInfo.filePath);
        const result = dbManager.executeQuery(sql);

        if (result.error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    database: dbInfo.name,
                    sql,
                    error: result.error,
                    executionTimeMs: result.executionTimeMs,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  database: dbInfo.name,
                  sql,
                  columns: result.columns,
                  rowCount: result.values.length,
                  rows: result.values,
                  executionTimeMs: result.executionTimeMs,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error executing select query: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // D1 Tool: Write Query (Mutations)
  server.tool(
    'd1_write_query',
    'Execute a write / mutation SQL query (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, REPLACE) against a local Cloudflare D1 database. Persists changes to disk.',
    {
      database: z
        .string()
        .describe('Database identifier: database name, binding name, ID, or direct SQLite file path'),
      sql: z.string().describe('The write/mutation SQL statement to execute'),
      search_root: z.string().optional().describe('Optional search root directory to resolve database'),
    },
    async ({ database, sql, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const dbInfo = await D1Scanner.findDatabase(database, roots);
        if (!dbInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Database not found matching: "${database}"` }],
          };
        }

        dbManager.openDatabase(dbInfo.filePath);
        const result = dbManager.executeQuery(sql);

        if (result.error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    database: dbInfo.name,
                    sql,
                    error: result.error,
                    executionTimeMs: result.executionTimeMs,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  database: dbInfo.name,
                  sql,
                  rowsAffected: result.rowsAffected,
                  executionTimeMs: result.executionTimeMs,
                  message: `Write query executed successfully (${result.rowsAffected} row(s) affected)`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error executing write query: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // D1 Tool: Export Dump
  server.tool(
    'd1_export_dump',
    'Export a complete SQL dump (schema DDL and INSERT statements) for a local D1 database or a specific table.',
    {
      database: z
        .string()
        .describe('Database identifier: database name, binding name, ID, or direct SQLite file path'),
      table: z.string().optional().describe('Optional specific table name to dump'),
      search_root: z.string().optional().describe('Optional search root directory to resolve database'),
    },
    async ({ database, table, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const dbInfo = await D1Scanner.findDatabase(database, roots);
        if (!dbInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Database not found matching: "${database}"` }],
          };
        }

        dbManager.openDatabase(dbInfo.filePath);
        const dump = dbManager.exportSqlDump(table);

        return {
          content: [{ type: 'text', text: dump }],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error exporting dump: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // R2 Tool: List Buckets
  server.tool(
    'r2_list_buckets',
    'Discover and list all local Cloudflare R2 storage buckets and their summaries in the workspace or search roots.',
    {
      search_root: z
        .string()
        .optional()
        .describe('Optional workspace directory or root path to search for .wrangler/state/v3/r2 buckets'),
    },
    async ({ search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const buckets = await D1Scanner.scanR2Buckets(roots);

        const bucketSummaries = buckets.map((b) => {
          try {
            r2Manager.openBucket(b);
            const summary = r2Manager.getBucketSummary();
            return {
              id: b.id,
              name: b.name,
              bucketName: b.bucketName,
              binding: b.wranglerBinding || null,
              projectPath: b.projectPath,
              blobsDir: b.blobsDir,
              totalObjects: summary.totalObjects,
              totalSizeBytes: summary.totalSizeBytes,
              imageCount: summary.imageCount,
            };
          } catch {
            return {
              id: b.id,
              name: b.name,
              bucketName: b.bucketName,
              binding: b.wranglerBinding || null,
              projectPath: b.projectPath,
              blobsDir: b.blobsDir,
            };
          }
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: buckets.length, buckets: bucketSummaries }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to scan R2 buckets: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // R2 Tool: List Objects
  server.tool(
    'r2_list_objects',
    'List objects inside a local Cloudflare R2 bucket with search, filtering, and pagination.',
    {
      bucket: z.string().describe('Bucket identifier: bucket name, binding name, ID, or blobs directory path'),
      search_query: z.string().optional().describe('Search filter for object key or custom metadata'),
      filter_type: z
        .enum(['all', 'images', 'other'])
        .optional()
        .describe('Filter objects by type: "all", "images", or "other" (default: "all")'),
      page: z.number().optional().describe('Page number (default: 1)'),
      page_size: z.number().optional().describe('Number of items per page (default: 50)'),
      search_root: z.string().optional().describe('Optional search root directory to resolve bucket'),
    },
    async ({ bucket, search_query, filter_type, page, page_size, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const bucketInfo = await D1Scanner.findR2Bucket(bucket, roots);
        if (!bucketInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `R2 Bucket not found matching: "${bucket}"` }],
          };
        }

        r2Manager.openBucket(bucketInfo);
        const result = r2Manager.getObjects(
          page || 1,
          page_size || 50,
          search_query,
          filter_type || 'all'
        );

        // Strip thumbnail data URL to keep output clean and fast
        const cleanObjects = result.objects.map((o) => ({
          key: o.key,
          size: o.size,
          etag: o.etag,
          version: o.version,
          uploaded: o.uploaded,
          uploadedDate: new Date(o.uploaded).toISOString(),
          mimeType: o.mimeType,
          isImage: o.isImage,
          httpMetadata: o.httpMetadata,
          customMetadata: o.customMetadata,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  bucket: bucketInfo.bucketName,
                  totalObjects: result.totalObjects,
                  page: result.page,
                  pageSize: result.pageSize,
                  totalPages: result.totalPages,
                  objects: cleanObjects,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing R2 objects: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // R2 Tool: Get Object
  server.tool(
    'r2_get_object',
    'Get object metadata and contents from a local Cloudflare R2 bucket.',
    {
      bucket: z.string().describe('Bucket identifier: bucket name, binding name, ID, or blobs directory path'),
      key: z.string().describe('Object key / path in the bucket'),
      encoding: z
        .enum(['utf-8', 'base64'])
        .optional()
        .describe('Encoding to return object content in: "utf-8" for text, "base64" for binary files (default: "utf-8")'),
      search_root: z.string().optional().describe('Optional search root directory to resolve bucket'),
    },
    async ({ bucket, key, encoding, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const bucketInfo = await D1Scanner.findR2Bucket(bucket, roots);
        if (!bucketInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `R2 Bucket not found matching: "${bucket}"` }],
          };
        }

        r2Manager.openBucket(bucketInfo);
        const result = r2Manager.getObjectContent(key, encoding || 'utf-8');

        if (result.error || !result.object) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Object not found or unreadable: ${result.error || 'Unknown error'}` }],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  bucket: bucketInfo.bucketName,
                  key: result.object.key,
                  size: result.size,
                  etag: result.object.etag,
                  mimeType: result.object.mimeType,
                  uploaded: result.object.uploaded,
                  uploadedDate: new Date(result.object.uploaded).toISOString(),
                  httpMetadata: result.object.httpMetadata,
                  customMetadata: result.object.customMetadata,
                  encoding: encoding || 'utf-8',
                  content: result.content,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error reading R2 object: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // R2 Tool: Put Object
  server.tool(
    'r2_put_object',
    'Upload or create an object in a local Cloudflare R2 bucket with content, content-type, and custom metadata.',
    {
      bucket: z.string().describe('Bucket identifier: bucket name, binding name, ID, or blobs directory path'),
      key: z.string().describe('Object key / path in the bucket'),
      content: z.string().describe('Object content as raw text or base64 encoded string'),
      is_base64: z
        .boolean()
        .optional()
        .describe('Set to true if content is base64 encoded binary data (default: false)'),
      content_type: z
        .string()
        .optional()
        .describe('MIME content type (e.g. application/json, text/plain, image/png)'),
      custom_metadata: z
        .record(z.string(), z.string())
        .optional()
        .describe('Custom user metadata key-value pairs'),
      search_root: z.string().optional().describe('Optional search root directory to resolve bucket'),
    },
    async ({ bucket, key, content, is_base64, content_type, custom_metadata, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const bucketInfo = await D1Scanner.findR2Bucket(bucket, roots);
        if (!bucketInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `R2 Bucket not found matching: "${bucket}"` }],
          };
        }

        r2Manager.openBucket(bucketInfo);
        const result = r2Manager.putObject(
          key,
          content,
          content_type,
          custom_metadata,
          is_base64 ?? false
        );

        if (!result.success) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Failed to put object: ${result.error || 'Unknown error'}` }],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  bucket: bucketInfo.bucketName,
                  key,
                  message: `Object "${key}" successfully saved in R2 bucket "${bucketInfo.bucketName}"`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error putting R2 object: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // R2 Tool: Delete Object
  server.tool(
    'r2_delete_object',
    'Delete an object from a local Cloudflare R2 bucket and clean up its underlying Miniflare blob.',
    {
      bucket: z.string().describe('Bucket identifier: bucket name, binding name, ID, or blobs directory path'),
      key: z.string().describe('Object key / path to delete'),
      search_root: z.string().optional().describe('Optional search root directory to resolve bucket'),
    },
    async ({ bucket, key, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const bucketInfo = await D1Scanner.findR2Bucket(bucket, roots);
        if (!bucketInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `R2 Bucket not found matching: "${bucket}"` }],
          };
        }

        r2Manager.openBucket(bucketInfo);
        const result = r2Manager.deleteObject(key);

        if (!result.success) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Failed to delete object: ${result.error || 'Unknown error'}` }],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  bucket: bucketInfo.bucketName,
                  key,
                  message: `Object "${key}" deleted successfully from "${bucketInfo.bucketName}"`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error deleting R2 object: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // R2 Tool: Export Object to File
  server.tool(
    'r2_export_file',
    'Export an R2 object directly to a local destination file path on disk.',
    {
      bucket: z.string().describe('Bucket identifier: bucket name, binding name, ID, or blobs directory path'),
      key: z.string().describe('Object key / path to export'),
      destination_path: z.string().describe('Target file path where the object should be written'),
      search_root: z.string().optional().describe('Optional search root directory to resolve bucket'),
    },
    async ({ bucket, key, destination_path, search_root }) => {
      try {
        const roots = search_root ? [search_root] : undefined;
        const bucketInfo = await D1Scanner.findR2Bucket(bucket, roots);
        if (!bucketInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `R2 Bucket not found matching: "${bucket}"` }],
          };
        }

        r2Manager.openBucket(bucketInfo);
        const result = r2Manager.exportObjectToFile(key, destination_path);

        if (!result.success) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Failed to export object: ${result.error || 'Unknown error'}` }],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  bucket: bucketInfo.bucketName,
                  key,
                  destination_path,
                  message: `Object "${key}" exported to "${destination_path}" successfully`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error exporting R2 object: ${err?.message || String(err)}` }],
        };
      }
    }
  );

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal error in MCP server:', err);
  process.exit(1);
});
