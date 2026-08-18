# Cloudflare D1 & R2 Explorer

A dual-purpose toolkit for local Cloudflare D1 databases and R2 storage buckets:
1. **VS Code Extension**: Visual phpMyAdmin and S3-style manager with SQL console, table structure viewer, pagination, search, and image preview.
2. **Model Context Protocol (MCP) Server**: Stdio MCP server allowing AI agents (Antigravity, Claude Desktop, Cursor, Cline, Windsurf, etc.) to discover, query, read, write, and manage local D1 SQLite databases and R2 storage buckets without manual scripts or Wrangler CLI piping.

---

## MCP Server (For AI Agents)

The MCP server automatically scans for local `.wrangler/state/v3/d1` and `.wrangler/state/v3/r2` resources across workspace directories and standard project locations.

### Configuration

Add the server to your MCP client configuration (`mcp_config.json`, `claude_desktop_config.json`, or IDE settings):

```json
{
  "mcpServers": {
    "cloudflare-d1-r2": {
      "command": "node",
      "args": ["c:/project/d1-explorer/dist/mcp.js"]
    }
  }
}
```

Or run via npm/pnpm script:
```bash
pnpm run mcp
```

### Available MCP Tools

#### Discovery Tools
- `d1_list_databases`: Discover and list all local Cloudflare D1 databases with file paths, sizes, and wrangler bindings.
  - *Parameters*: `search_root` (optional string)
- `r2_list_buckets`: Discover and list all local Cloudflare R2 storage buckets and summaries (object count, total size, image count).
  - *Parameters*: `search_root` (optional string)

#### Cloudflare D1 Database Tools
- `d1_list_tables`: List all tables and row counts in a database.
  - *Parameters*: `database` (database name, binding, ID, or path), `search_root` (optional string)
- `d1_get_schema`: Get table schema structure, column definitions, data types, indexes, foreign keys, and CREATE TABLE SQL.
  - *Parameters*: `database` (string), `table` (optional string), `search_root` (optional string)
- `d1_select_query` (Read-Only): Execute read-only SQL queries (`SELECT`, `EXPLAIN`, `PRAGMA`). Mutation queries are blocked.
  - *Parameters*: `database` (string), `sql` (string), `search_root` (optional string)
- `d1_write_query` (Mutations): Execute write / mutation SQL statements (`INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `REPLACE`).
  - *Parameters*: `database` (string), `sql` (string), `search_root` (optional string)
- `d1_export_dump`: Export a complete SQL dump (schema DDL and INSERT statements) for a database or specific table.
  - *Parameters*: `database` (string), `table` (optional string), `search_root` (optional string)

#### Cloudflare R2 Storage Tools
- `r2_list_objects`: List objects inside a bucket with pagination, search, and filter options.
  - *Parameters*: `bucket` (string), `search_query` (optional string), `filter_type` (`"all"` | `"images"` | `"other"`), `page` (optional number), `page_size` (optional number), `search_root` (optional string)
- `r2_get_object`: Get object metadata and contents (as utf-8 text or base64 binary).
  - *Parameters*: `bucket` (string), `key` (string), `encoding` (`"utf-8"` | `"base64"`), `search_root` (optional string)
- `r2_put_object`: Upload or create an object with content, content-type, and custom metadata.
  - *Parameters*: `bucket` (string), `key` (string), `content` (string), `is_base64` (optional boolean), `content_type` (optional string), `custom_metadata` (optional key-value record), `search_root` (optional string)
- `r2_delete_object`: Delete an object from a bucket and remove its underlying Miniflare blob.
  - *Parameters*: `bucket` (string), `key` (string), `search_root` (optional string)
- `r2_export_file`: Export an R2 object directly to a local file destination on disk.
  - *Parameters*: `bucket` (string), `key` (string), `destination_path` (string), `search_root` (optional string)

---

## Development

```bash
# Install dependencies
pnpm install

# Build extension and MCP server
pnpm run build

# Watch mode
pnpm run watch
```

## License
MIT
