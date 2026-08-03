import * as vscode from 'vscode';
import { D1DatabaseInfo, D1Scanner } from './d1Scanner';
import { D1DatabaseManager } from './d1DatabaseManager';
import { getWebviewContent } from './webviewHtml';

export class D1WebviewPanel {
  public static currentPanel: D1WebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly extensionPath: string;

  private currentDbInfo: D1DatabaseInfo | undefined;
  private allDatabases: D1DatabaseInfo[] = [];
  private dbManager: D1DatabaseManager;

  public static createOrShow(
    extensionUri: vscode.Uri,
    extensionPath: string,
    initialDbInfo?: D1DatabaseInfo,
    initialTable?: string
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (D1WebviewPanel.currentPanel) {
      D1WebviewPanel.currentPanel.panel.reveal(column);
      if (initialDbInfo) {
        D1WebviewPanel.currentPanel.loadDatabase(initialDbInfo, initialTable);
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'd1Explorer',
      'Cloudflare D1 Explorer',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      }
    );

    D1WebviewPanel.currentPanel = new D1WebviewPanel(
      panel,
      extensionUri,
      extensionPath,
      initialDbInfo,
      initialTable
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    extensionPath: string,
    initialDbInfo?: D1DatabaseInfo,
    initialTable?: string
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.extensionPath = extensionPath;
    this.dbManager = new D1DatabaseManager();

    this.panel.webview.html = getWebviewContent();

    this.panel.onDidDispose(() => this.dispose(), null, []);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        await this.handleWebviewMessage(message);
      },
      null,
      []
    );

    // Initial setup
    this.initializePanel(initialDbInfo, initialTable);
  }

  private async initializePanel(initialDbInfo?: D1DatabaseInfo, initialTable?: string): Promise<void> {
    await D1DatabaseManager.initialize(this.extensionPath);
    await this.scanAndSendDatabases();

    if (initialDbInfo) {
      this.loadDatabase(initialDbInfo, initialTable);
    } else if (this.allDatabases.length > 0) {
      this.loadDatabase(this.allDatabases[0], initialTable);
    }
  }

  private async scanAndSendDatabases(): Promise<void> {
    this.allDatabases = await D1Scanner.scanWorkspace();
    this.panel.webview.postMessage({
      type: 'setDatabases',
      databases: this.allDatabases,
      selectedPath: this.currentDbInfo?.filePath,
    });
  }

  public loadDatabase(dbInfo: D1DatabaseInfo, initialTable?: string): void {
    try {
      this.currentDbInfo = dbInfo;
      this.dbManager.openDatabase(dbInfo.filePath);

      const tables = this.dbManager.getTables();
      this.panel.webview.postMessage({
        type: 'setTables',
        tables,
        initialTable,
      });

      this.panel.title = `D1: ${dbInfo.name}`;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to open D1 database: ${err.message}`);
    }
  }

  private async handleWebviewMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'refreshDatabases':
        await this.scanAndSendDatabases();
        break;

      case 'switchDatabase':
        const selectedDb = this.allDatabases.find((d) => d.filePath === message.dbPath);
        if (selectedDb) {
          this.loadDatabase(selectedDb);
        }
        break;

      case 'getTableData':
        if (message.tableName) {
          const data = this.dbManager.getTableData(
            message.tableName,
            message.page || 1,
            message.pageSize || 25,
            message.sortColumn,
            message.sortOrder,
            message.searchQuery
          );
          this.panel.webview.postMessage({
            type: 'setTableData',
            tableName: message.tableName,
            ...data,
          });
        }
        break;

      case 'getTableStructure':
        if (message.tableName) {
          const struct = this.dbManager.getTableStructure(message.tableName);
          this.panel.webview.postMessage({
            type: 'setTableStructure',
            tableName: message.tableName,
            ...struct,
          });
        }
        break;

      case 'executeSql':
        if (message.sql) {
          const result = this.dbManager.executeQuery(message.sql);
          this.panel.webview.postMessage({
            type: 'setQueryResult',
            ...result,
          });
          // Refresh table list if table created or dropped
          if (/^\s*(CREATE|DROP|ALTER)\b/i.test(message.sql)) {
            const tables = this.dbManager.getTables();
            this.panel.webview.postMessage({ type: 'setTables', tables });
          }
        }
        break;

      case 'insertRow':
        if (message.tableName && message.rowData) {
          const result = this.dbManager.insertRow(message.tableName, message.rowData);
          if (result.error) {
            this.panel.webview.postMessage({ type: 'operationError', error: result.error });
          } else {
            this.panel.webview.postMessage({ type: 'operationSuccess', message: 'Record inserted successfully' });
          }
        }
        break;

      case 'updateRow':
        if (message.tableName && message.primaryKeyMap && message.updatedData) {
          const result = this.dbManager.updateRow(
            message.tableName,
            message.primaryKeyMap,
            message.updatedData
          );
          if (result.error) {
            this.panel.webview.postMessage({ type: 'operationError', error: result.error });
          } else {
            this.panel.webview.postMessage({ type: 'operationSuccess', message: 'Record updated successfully' });
          }
        }
        break;

      case 'deleteRow':
        if (message.tableName && message.primaryKeyMap) {
          const result = this.dbManager.deleteRow(message.tableName, message.primaryKeyMap);
          if (result.error) {
            this.panel.webview.postMessage({ type: 'operationError', error: result.error });
          } else {
            this.panel.webview.postMessage({ type: 'operationSuccess', message: 'Record deleted successfully' });
          }
        }
        break;

      case 'exportSqlDump':
        const dumpSql = this.dbManager.exportSqlDump(message.tableName);
        const doc = await vscode.workspace.openTextDocument({
          content: dumpSql,
          language: 'sql',
        });
        await vscode.window.showTextDocument(doc);
        break;
    }
  }

  public dispose(): void {
    D1WebviewPanel.currentPanel = undefined;
    this.panel.dispose();
  }
}
