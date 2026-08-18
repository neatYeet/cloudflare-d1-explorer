import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export interface TableSummary {
  name: string;
  rowCount: number;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
  columns?: string[];
}

export interface ForeignKeyInfo {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
  rowsAffected: number;
  executionTimeMs: number;
  error?: string;
}

export class D1DatabaseManager {
  private static SQL: SqlJsStatic | null = null;
  private currentDb: Database | null = null;
  private currentFilePath: string | null = null;

  public static async initialize(extensionPath?: string): Promise<void> {
    if (!this.SQL) {
      let wasmPath: string | undefined;
      if (extensionPath) {
        wasmPath = path.join(extensionPath, 'dist', 'sql-wasm.wasm');
      } else {
        const candidates = [
          path.join(__dirname, 'sql-wasm.wasm'),
          path.join(__dirname, 'dist', 'sql-wasm.wasm'),
          path.join(__dirname, '..', 'dist', 'sql-wasm.wasm'),
          path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
          path.join(process.cwd(), 'dist', 'sql-wasm.wasm'),
          path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
        ];
        for (const cand of candidates) {
          if (fs.existsSync(cand)) {
            wasmPath = cand;
            break;
          }
        }
      }

      this.SQL = await initSqlJs({
        locateFile: () => wasmPath || 'sql-wasm.wasm',
      });
    }
  }

  public openDatabase(filePath: string): void {
    if (!D1DatabaseManager.SQL) {
      throw new Error('Sql.js has not been initialized yet.');
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    this.currentDb = new D1DatabaseManager.SQL.Database(fileBuffer);
    this.currentFilePath = filePath;
  }

  public saveToDisk(): void {
    if (!this.currentDb || !this.currentFilePath) return;
    const data = this.currentDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.currentFilePath, buffer);
  }

  public getTables(): TableSummary[] {
    if (!this.currentDb) return [];
    try {
      const res = this.currentDb.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC"
      );
      if (!res.length || !res[0].values) return [];

      const tables: TableSummary[] = [];
      for (const row of res[0].values) {
        const tableName = String(row[0]);
        let count = 0;
        try {
          const countRes = this.currentDb.exec(`SELECT COUNT(*) FROM "${tableName}"`);
          if (countRes.length && countRes[0].values[0]) {
            count = Number(countRes[0].values[0][0]);
          }
        } catch {
          count = 0;
        }
        tables.push({ name: tableName, rowCount: count });
      }
      return tables;
    } catch (err) {
      console.error('Error fetching tables:', err);
      return [];
    }
  }

  public getTableStructure(tableName: string): {
    columns: ColumnInfo[];
    indexes: IndexInfo[];
    foreignKeys: ForeignKeyInfo[];
    createSql: string;
  } {
    if (!this.currentDb) {
      return { columns: [], indexes: [], foreignKeys: [], createSql: '' };
    }

    // Columns
    const colsRes = this.currentDb.exec(`PRAGMA table_info("${tableName}")`);
    const columns: ColumnInfo[] = [];
    if (colsRes.length && colsRes[0].values) {
      for (const row of colsRes[0].values) {
        columns.push({
          cid: Number(row[0]),
          name: String(row[1]),
          type: String(row[2]),
          notnull: Number(row[3]),
          dflt_value: row[4],
          pk: Number(row[5]),
        });
      }
    }

    // Indexes
    const idxRes = this.currentDb.exec(`PRAGMA index_list("${tableName}")`);
    const indexes: IndexInfo[] = [];
    if (idxRes.length && idxRes[0].values) {
      for (const row of idxRes[0].values) {
        const indexName = String(row[1]);
        const unique = Number(row[2]);
        const origin = String(row[3] || '');
        const partial = Number(row[4] || 0);

        // Fetch index columns
        const cols: string[] = [];
        try {
          const idxColsRes = this.currentDb.exec(`PRAGMA index_info("${indexName}")`);
          if (idxColsRes.length && idxColsRes[0].values) {
            for (const colRow of idxColsRes[0].values) {
              cols.push(String(colRow[2]));
            }
          }
        } catch {
          // ignore
        }

        indexes.push({
          seq: Number(row[0]),
          name: indexName,
          unique,
          origin,
          partial,
          columns: cols,
        });
      }
    }

    // Foreign Keys
    const fkRes = this.currentDb.exec(`PRAGMA foreign_key_list("${tableName}")`);
    const foreignKeys: ForeignKeyInfo[] = [];
    if (fkRes.length && fkRes[0].values) {
      for (const row of fkRes[0].values) {
        foreignKeys.push({
          id: Number(row[0]),
          seq: Number(row[1]),
          table: String(row[2]),
          from: String(row[3]),
          to: String(row[4]),
          on_update: String(row[5]),
          on_delete: String(row[6]),
        });
      }
    }

    // Create SQL statement
    let createSql = '';
    const sqlRes = this.currentDb.exec(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name="${tableName}"`
    );
    if (sqlRes.length && sqlRes[0].values && sqlRes[0].values[0]) {
      createSql = String(sqlRes[0].values[0][0]);
    }

    return { columns, indexes, foreignKeys, createSql };
  }

  public getAllTablesStructure(): Record<
    string,
    {
      columns: ColumnInfo[];
      indexes: IndexInfo[];
      foreignKeys: ForeignKeyInfo[];
      createSql: string;
    }
  > {
    const tables = this.getTables();
    const result: Record<
      string,
      {
        columns: ColumnInfo[];
        indexes: IndexInfo[];
        foreignKeys: ForeignKeyInfo[];
        createSql: string;
      }
    > = {};
    for (const t of tables) {
      result[t.name] = this.getTableStructure(t.name);
    }
    return result;
  }

  public getTableData(
    tableName: string,
    page: number = 1,
    pageSize: number = 25,
    sortColumn?: string,
    sortOrder: 'ASC' | 'DESC' = 'ASC',
    searchQuery?: string
  ): {
    columns: string[];
    rows: any[][];
    totalRows: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    if (!this.currentDb) {
      return { columns: [], rows: [], totalRows: 0, page: 1, pageSize, totalPages: 0 };
    }

    let whereClause = '';
    if (searchQuery && searchQuery.trim()) {
      // Fetch table info to build search condition across all columns
      const cols = this.getTableStructure(tableName).columns;
      if (cols.length > 0) {
        const sanitizedSearch = searchQuery.replace(/'/g, "''");
        const conditions = cols.map(
          (c: ColumnInfo) => `CAST("${c.name}" AS TEXT) LIKE '%${sanitizedSearch}%'`
        );
        whereClause = `WHERE ${conditions.join(' OR ')}`;
      }
    }

    // Count total rows matching filter
    let totalRows = 0;
    const countRes = this.currentDb.exec(`SELECT COUNT(*) FROM "${tableName}" ${whereClause}`);
    if (countRes.length && countRes[0].values[0]) {
      totalRows = Number(countRes[0].values[0][0]);
    }

    const totalPages = Math.ceil(totalRows / pageSize) || 1;
    const validPage = Math.max(1, Math.min(page, totalPages));
    const offset = (validPage - 1) * pageSize;

    let orderClause = '';
    if (sortColumn) {
      orderClause = `ORDER BY "${sortColumn}" ${sortOrder}`;
    }

    const query = `SELECT * FROM "${tableName}" ${whereClause} ${orderClause} LIMIT ${pageSize} OFFSET ${offset}`;
    const dataRes = this.currentDb.exec(query);

    let columns: string[] = [];
    let rows: any[][] = [];

    if (dataRes.length && dataRes[0]) {
      columns = dataRes[0].columns;
      rows = dataRes[0].values;
    } else {
      // Fallback columns if table is empty
      const colsInfo = this.getTableStructure(tableName).columns;
      columns = colsInfo.map((c: ColumnInfo) => c.name);
    }

    return {
      columns,
      rows,
      totalRows,
      page: validPage,
      pageSize,
      totalPages,
    };
  }

  public executeQuery(sql: string): QueryResult {
    if (!this.currentDb) {
      return { columns: [], values: [], rowsAffected: 0, executionTimeMs: 0, error: 'Database not open' };
    }

    const startTime = Date.now();
    try {
      const isWriteQuery = /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|PRAGMA|REPLACE)\b/i.test(sql);
      const res = this.currentDb.exec(sql);
      const executionTimeMs = Date.now() - startTime;

      let rowsAffected = 0;
      if (isWriteQuery) {
        const changesRes = this.currentDb.exec('SELECT changes()');
        if (changesRes.length && changesRes[0].values[0]) {
          rowsAffected = Number(changesRes[0].values[0][0]);
        }
        this.saveToDisk();
      }

      if (res.length > 0 && res[0]) {
        return {
          columns: res[0].columns,
          values: res[0].values,
          rowsAffected,
          executionTimeMs,
        };
      }

      return {
        columns: [],
        values: [],
        rowsAffected,
        executionTimeMs,
      };
    } catch (err: any) {
      return {
        columns: [],
        values: [],
        rowsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        error: err?.message || String(err),
      };
    }
  }

  public insertRow(tableName: string, rowData: Record<string, any>): QueryResult {
    const columns = Object.keys(rowData);
    const values = Object.values(rowData);

    const colNames = columns.map((c: string) => `"${c}"`).join(', ');
    const placeholders = values.map(() => '?').join(', ');

    const sql = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})`;

    if (!this.currentDb) {
      return { columns: [], values: [], rowsAffected: 0, executionTimeMs: 0, error: 'No database open' };
    }

    const startTime = Date.now();
    try {
      const stmt = this.currentDb.prepare(sql);
      stmt.run(values);
      stmt.free();

      const changesRes = this.currentDb.exec('SELECT changes()');
      const rowsAffected = changesRes[0]?.values[0]?.[0] ? Number(changesRes[0].values[0][0]) : 1;

      this.saveToDisk();
      return { columns: [], values: [], rowsAffected, executionTimeMs: Date.now() - startTime };
    } catch (err: any) {
      return { columns: [], values: [], rowsAffected: 0, executionTimeMs: Date.now() - startTime, error: err.message };
    }
  }

  public updateRow(
    tableName: string,
    primaryKeyMap: Record<string, any>,
    updatedData: Record<string, any>
  ): QueryResult {
    if (!this.currentDb) {
      return { columns: [], values: [], rowsAffected: 0, executionTimeMs: 0, error: 'No database open' };
    }

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [col, val] of Object.entries(updatedData)) {
      setClauses.push(`"${col}" = ?`);
      values.push(val);
    }

    const whereClauses: string[] = [];
    for (const [pkCol, pkVal] of Object.entries(primaryKeyMap)) {
      whereClauses.push(`"${pkCol}" = ?`);
      values.push(pkVal);
    }

    const sql = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;

    const startTime = Date.now();
    try {
      const stmt = this.currentDb.prepare(sql);
      stmt.run(values);
      stmt.free();

      const changesRes = this.currentDb.exec('SELECT changes()');
      const rowsAffected = changesRes[0]?.values[0]?.[0] ? Number(changesRes[0].values[0][0]) : 1;

      this.saveToDisk();
      return { columns: [], values: [], rowsAffected, executionTimeMs: Date.now() - startTime };
    } catch (err: any) {
      return { columns: [], values: [], rowsAffected: 0, executionTimeMs: Date.now() - startTime, error: err.message };
    }
  }

  public deleteRow(tableName: string, primaryKeyMap: Record<string, any>): QueryResult {
    if (!this.currentDb) {
      return { columns: [], values: [], rowsAffected: 0, executionTimeMs: 0, error: 'No database open' };
    }

    const whereClauses: string[] = [];
    const values: any[] = [];
    for (const [pkCol, pkVal] of Object.entries(primaryKeyMap)) {
      whereClauses.push(`"${pkCol}" = ?`);
      values.push(pkVal);
    }

    const sql = `DELETE FROM "${tableName}" WHERE ${whereClauses.join(' AND ')}`;

    const startTime = Date.now();
    try {
      const stmt = this.currentDb.prepare(sql);
      stmt.run(values);
      stmt.free();

      const changesRes = this.currentDb.exec('SELECT changes()');
      const rowsAffected = changesRes[0]?.values[0]?.[0] ? Number(changesRes[0].values[0][0]) : 1;

      this.saveToDisk();
      return { columns: [], values: [], rowsAffected, executionTimeMs: Date.now() - startTime };
    } catch (err: any) {
      return { columns: [], values: [], rowsAffected: 0, executionTimeMs: Date.now() - startTime, error: err.message };
    }
  }

  public exportSqlDump(tableName?: string): string {
    if (!this.currentDb) return '';

    let dump = `-- Cloudflare D1 Explorer Database Dump\n-- Generated on ${new Date().toISOString()}\n\nPRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\n\n`;

    const tables = tableName ? [{ name: tableName }] : this.getTables();

    for (const t of tables) {
      const struct = this.getTableStructure(t.name);
      if (struct.createSql) {
        dump += `-- Table structure for ${t.name}\n${struct.createSql};\n\n`;
      }

      const rowsRes = this.currentDb.exec(`SELECT * FROM "${t.name}"`);
      if (rowsRes.length && rowsRes[0] && rowsRes[0].values.length) {
        dump += `-- Data for ${t.name}\n`;
        const cols = rowsRes[0].columns.map((c: string) => `"${c}"`).join(', ');
        for (const row of rowsRes[0].values) {
          const valStrs = row.map((v: any) => {
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return String(v);
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          dump += `INSERT INTO "${t.name}" (${cols}) VALUES (${valStrs.join(', ')});\n`;
        }
        dump += '\n';
      }
    }

    dump += 'COMMIT;\n';
    return dump;
  }
}
