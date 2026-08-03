import * as vscode from 'vscode';
import { D1DatabaseInfo, D1Scanner } from './d1Scanner';
import { D1DatabaseManager } from './d1DatabaseManager';

export class D1TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'database' | 'table',
    public readonly dbInfo?: D1DatabaseInfo,
    public readonly tableName?: string
  ) {
    super(label, collapsibleState);

    if (type === 'database') {
      this.iconPath = new vscode.ThemeIcon('database');
      this.tooltip = dbInfo ? `${dbInfo.name}\n${dbInfo.filePath}` : label;
      this.contextValue = 'database';
      this.command = {
        command: 'd1-explorer.open',
        title: 'Open D1 Manager',
        arguments: [dbInfo],
      };
    } else {
      this.iconPath = new vscode.ThemeIcon('table');
      this.tooltip = `Table: ${tableName}`;
      this.contextValue = 'table';
      this.command = {
        command: 'd1-explorer.open',
        title: 'Open Table',
        arguments: [dbInfo, tableName],
      };
    }
  }
}

export class D1TreeDataProvider implements vscode.TreeDataProvider<D1TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<D1TreeItem | undefined | null | void> =
    new vscode.EventEmitter<D1TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<D1TreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private databases: D1DatabaseInfo[] = [];

  constructor(private extensionPath: string) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: D1TreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: D1TreeItem): Promise<D1TreeItem[]> {
    if (!element) {
      // Root items: Databases
      this.databases = await D1Scanner.scanWorkspace();
      if (this.databases.length === 0) {
        const noDbItem = new vscode.TreeItem('No D1 SQLite databases found', vscode.TreeItemCollapsibleState.None);
        noDbItem.iconPath = new vscode.ThemeIcon('info');
        return [noDbItem as D1TreeItem];
      }

      return this.databases.map((db) => {
        const sizeKb = (db.sizeBytes / 1024).toFixed(1);
        return new D1TreeItem(
          `${db.name} (${sizeKb} KB)`,
          vscode.TreeItemCollapsibleState.Collapsed,
          'database',
          db
        );
      });
    }

    if (element.type === 'database' && element.dbInfo) {
      // Child items: Tables in this database
      try {
        await D1DatabaseManager.initialize(this.extensionPath);
        const mgr = new D1DatabaseManager();
        mgr.openDatabase(element.dbInfo.filePath);
        const tables = mgr.getTables();

        return tables.map(
          (t) =>
            new D1TreeItem(
              `${t.name} (${t.rowCount})`,
              vscode.TreeItemCollapsibleState.None,
              'table',
              element.dbInfo,
              t.name
            )
        );
      } catch (err) {
        const errItem = new vscode.TreeItem('Error reading database', vscode.TreeItemCollapsibleState.None);
        errItem.iconPath = new vscode.ThemeIcon('error');
        return [errItem as D1TreeItem];
      }
    }

    return [];
  }
}
