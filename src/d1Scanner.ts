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

export class D1Scanner {
  public static async scanWorkspace(): Promise<D1DatabaseInfo[]> {
    const databases: D1DatabaseInfo[] = [];

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
      this.scanDirectoryRecursive(root, databases, visitedDirs, 0);
    }

    return databases;
  }

  private static scanDirectoryRecursive(
    dirPath: string,
    results: D1DatabaseInfo[],
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
          
          // Check for .wrangler/state/v3/d1 directory pattern
          if (entry.name === '.wrangler') {
            this.scanWranglerDirectory(fullPath, results);
          } else if (!['node_modules', '.git', '.turbo', 'dist', 'out'].includes(entry.name)) {
            this.scanDirectoryRecursive(fullPath, results, visited, depth + 1);
          }
        }
      }
    } catch {
      // Ignore permission or inaccessible directory errors
    }
  }

  public static scanWranglerDirectory(wranglerDir: string, results: D1DatabaseInfo[]): void {
    try {
      const d1StateDir = path.join(wranglerDir, 'state', 'v3', 'd1');
      if (!fs.existsSync(d1StateDir)) return;

      const projectPath = path.dirname(wranglerDir);
      const bindingInfo = this.findWranglerBindingName(projectPath);

      this.findSqliteFiles(d1StateDir, projectPath, bindingInfo, results);
    } catch {
      // Ignore errors
    }
  }

  private static findSqliteFiles(
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
          this.findSqliteFiles(fullPath, projectPath, bindingName, results);
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

  private static findWranglerBindingName(projectPath: string): string | undefined {
    // Check wrangler.jsonc, wrangler.json, or wrangler.toml
    const jsoncPath = path.join(projectPath, 'wrangler.jsonc');
    const jsonPath = path.join(projectPath, 'wrangler.json');

    try {
      if (fs.existsSync(jsoncPath)) {
        const content = fs.readFileSync(jsoncPath, 'utf8');
        // Simple regex extract for d1_databases binding or database_name
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
    } catch {
      // Ignore parse errors
    }
    return undefined;
  }
}
