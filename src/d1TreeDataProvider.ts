import * as vscode from 'vscode';
import { D1DatabaseInfo, R2BucketInfo, D1Scanner } from './d1Scanner';
import { D1DatabaseManager } from './d1DatabaseManager';
import { R2BucketManager } from './r2BucketManager';

export type TreeItemType = 'category' | 'database' | 'table' | 'bucket' | 'object';

export class CloudflareTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: TreeItemType,
    public readonly dbInfo?: D1DatabaseInfo,
    public readonly tableName?: string,
    public readonly bucketInfo?: R2BucketInfo,
    public readonly objectKey?: string
  ) {
    super(label, collapsibleState);

    if (itemType === 'category') {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'category';
    } else if (itemType === 'database') {
      this.iconPath = new vscode.ThemeIcon('database');
      this.tooltip = dbInfo ? `${dbInfo.name}\n${dbInfo.filePath}` : label;
      this.contextValue = 'database';
      this.command = {
        command: 'd1-explorer.open',
        title: 'Open D1 Manager',
        arguments: [dbInfo],
      };
    } else if (itemType === 'table') {
      this.iconPath = new vscode.ThemeIcon('table');
      this.tooltip = `Table: ${tableName}`;
      this.contextValue = 'table';
      this.command = {
        command: 'd1-explorer.open',
        title: 'Open Table',
        arguments: [dbInfo, tableName],
      };
    } else if (itemType === 'bucket') {
      this.iconPath = new vscode.ThemeIcon('archive');
      this.tooltip = bucketInfo ? `${bucketInfo.name}\n${bucketInfo.blobsDir}` : label;
      this.contextValue = 'bucket';
      this.command = {
        command: 'd1-explorer.openR2',
        title: 'Open R2 Bucket Manager',
        arguments: [bucketInfo],
      };
    } else if (itemType === 'object') {
      this.iconPath = new vscode.ThemeIcon('file-media');
      this.tooltip = `Object: ${objectKey}`;
      this.contextValue = 'object';
      this.command = {
        command: 'd1-explorer.openR2',
        title: 'Open R2 Object',
        arguments: [bucketInfo, objectKey],
      };
    }
  }
}

export class D1TreeDataProvider implements vscode.TreeDataProvider<CloudflareTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CloudflareTreeItem | undefined | null | void> =
    new vscode.EventEmitter<CloudflareTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CloudflareTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private databases: D1DatabaseInfo[] = [];
  private r2Buckets: R2BucketInfo[] = [];

  constructor(private extensionPath: string) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: CloudflareTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: CloudflareTreeItem): Promise<CloudflareTreeItem[]> {
    if (!element) {
      const { databases, r2Buckets } = await D1Scanner.scanAll();
      this.databases = databases;
      this.r2Buckets = r2Buckets;

      if (databases.length === 0 && r2Buckets.length === 0) {
        const noItem = new vscode.TreeItem('No D1 databases or R2 buckets found', vscode.TreeItemCollapsibleState.None);
        noItem.iconPath = new vscode.ThemeIcon('info');
        return [noItem as CloudflareTreeItem];
      }

      const items: CloudflareTreeItem[] = [];

      // D1 Databases Category
      if (databases.length > 0) {
        items.push(
          new CloudflareTreeItem(
            `D1 Databases (${databases.length})`,
            vscode.TreeItemCollapsibleState.Expanded,
            'category'
          )
        );
      }

      // R2 Buckets Category
      if (r2Buckets.length > 0) {
        items.push(
          new CloudflareTreeItem(
            `R2 Storage Buckets (${r2Buckets.length})`,
            vscode.TreeItemCollapsibleState.Expanded,
            'category'
          )
        );
      }

      return items;
    }

    // Category children
    if (element.itemType === 'category') {
      if (element.label.startsWith('D1 Databases')) {
        return this.databases.map((db) => {
          const sizeKb = (db.sizeBytes / 1024).toFixed(1);
          return new CloudflareTreeItem(
            `${db.name} (${sizeKb} KB)`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'database',
            db
          );
        });
      }

      if (element.label.startsWith('R2 Storage Buckets')) {
        return this.r2Buckets.map((bucket) => {
          return new CloudflareTreeItem(
            bucket.name,
            vscode.TreeItemCollapsibleState.None,
            'bucket',
            undefined,
            undefined,
            bucket
          );
        });
      }
    }

    // Database children (Tables)
    if (element.itemType === 'database' && element.dbInfo) {
      try {
        await D1DatabaseManager.initialize(this.extensionPath);
        const mgr = new D1DatabaseManager();
        mgr.openDatabase(element.dbInfo.filePath);
        const tables = mgr.getTables();

        return tables.map(
          (t) =>
            new CloudflareTreeItem(
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
        return [errItem as CloudflareTreeItem];
      }
    }

    return [];
  }
}
