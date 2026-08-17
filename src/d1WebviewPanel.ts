import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { D1DatabaseInfo, R2BucketInfo, D1Scanner } from './d1Scanner';
import { D1DatabaseManager } from './d1DatabaseManager';
import { R2BucketManager } from './r2BucketManager';
import { getWebviewContent } from './webviewHtml';

export interface WebviewPanelOptions {
  initialDbInfo?: D1DatabaseInfo;
  initialTable?: string;
  initialBucketInfo?: R2BucketInfo;
  initialObjectKey?: string;
  initialMode?: 'd1' | 'r2';
}

export class D1WebviewPanel {
  public static currentPanel: D1WebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly extensionPath: string;

  private currentDbInfo: D1DatabaseInfo | undefined;
  private currentBucketInfo: R2BucketInfo | undefined;
  private allDatabases: D1DatabaseInfo[] = [];
  private allBuckets: R2BucketInfo[] = [];

  private dbManager: D1DatabaseManager;
  private r2Manager: R2BucketManager;
  private currentMode: 'd1' | 'r2' = 'd1';

  public static createOrShow(
    extensionUri: vscode.Uri,
    extensionPath: string,
    options?: WebviewPanelOptions
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (D1WebviewPanel.currentPanel) {
      D1WebviewPanel.currentPanel.panel.reveal(column);
      if (options) {
        D1WebviewPanel.currentPanel.applyOptions(options);
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'cloudflareExplorer',
      'Cloudflare D1 & R2 Explorer',
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
      options
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    extensionPath: string,
    options?: WebviewPanelOptions
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.extensionPath = extensionPath;
    this.dbManager = new D1DatabaseManager();
    this.r2Manager = new R2BucketManager();

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
    this.initializePanel(options);
  }

  private async initializePanel(options?: WebviewPanelOptions): Promise<void> {
    await D1DatabaseManager.initialize(this.extensionPath);
    await R2BucketManager.initialize(this.extensionPath);
    await this.scanAndSendResources();

    if (options) {
      this.applyOptions(options);
    } else if (this.allDatabases.length > 0) {
      this.loadDatabase(this.allDatabases[0]);
    } else if (this.allBuckets.length > 0) {
      this.loadR2Bucket(this.allBuckets[0]);
    }
  }

  private async scanAndSendResources(): Promise<void> {
    const { databases, r2Buckets } = await D1Scanner.scanAll();
    this.allDatabases = databases;
    this.allBuckets = r2Buckets;

    this.panel.webview.postMessage({
      type: 'setResources',
      databases: this.allDatabases,
      r2Buckets: this.allBuckets,
      selectedDbPath: this.currentDbInfo?.filePath,
      selectedBucketId: this.currentBucketInfo?.id,
      currentMode: this.currentMode,
    });
  }

  public applyOptions(options: WebviewPanelOptions): void {
    if (options.initialMode) {
      this.currentMode = options.initialMode;
    }

    if (options.initialMode === 'r2' || options.initialBucketInfo) {
      if (options.initialBucketInfo) {
        this.loadR2Bucket(options.initialBucketInfo, options.initialObjectKey);
      } else if (this.allBuckets.length > 0) {
        this.loadR2Bucket(this.allBuckets[0], options.initialObjectKey);
      }
    } else {
      if (options.initialDbInfo) {
        this.loadDatabase(options.initialDbInfo, options.initialTable);
      } else if (this.allDatabases.length > 0) {
        this.loadDatabase(this.allDatabases[0], options.initialTable);
      }
    }
  }

  public loadDatabase(dbInfo: D1DatabaseInfo, initialTable?: string): void {
    try {
      this.currentMode = 'd1';
      this.currentDbInfo = dbInfo;
      this.dbManager.openDatabase(dbInfo.filePath);

      const tables = this.dbManager.getTables();
      this.panel.webview.postMessage({
        type: 'setTables',
        tables,
        dbInfo,
        initialTable,
      });

      this.panel.title = `D1: ${dbInfo.name}`;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to open D1 database: ${err.message}`);
    }
  }

  public loadR2Bucket(bucketInfo: R2BucketInfo, initialObjectKey?: string): void {
    try {
      this.currentMode = 'r2';
      this.currentBucketInfo = bucketInfo;
      this.r2Manager.openBucket(bucketInfo);

      const summary = this.r2Manager.getBucketSummary();
      this.panel.webview.postMessage({
        type: 'setR2Bucket',
        bucketInfo,
        summary,
        initialObjectKey,
      });

      this.panel.title = `R2: ${bucketInfo.name}`;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to open R2 bucket: ${err.message}`);
    }
  }

  private async handleWebviewMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'refreshResources':
        await this.scanAndSendResources();
        break;

      case 'switchMode':
        this.currentMode = message.mode;
        if (this.currentMode === 'd1' && this.allDatabases.length > 0) {
          if (!this.currentDbInfo) this.loadDatabase(this.allDatabases[0]);
        } else if (this.currentMode === 'r2' && this.allBuckets.length > 0) {
          if (!this.currentBucketInfo) this.loadR2Bucket(this.allBuckets[0]);
        }
        break;

      case 'switchDatabase':
        const selectedDb = this.allDatabases.find((d) => d.filePath === message.dbPath);
        if (selectedDb) {
          this.loadDatabase(selectedDb);
        }
        break;

      case 'switchR2Bucket':
        const selectedBucket = this.allBuckets.find((b) => b.id === message.bucketId || b.bucketName === message.bucketId);
        if (selectedBucket) {
          this.loadR2Bucket(selectedBucket);
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

      // =================== R2 Messages ===================
      case 'getR2Objects':
        const r2Data = this.r2Manager.getObjects(
          message.page || 1,
          message.pageSize || 24,
          message.searchQuery,
          message.filterType || 'all',
          message.sortColumn || 'uploaded',
          message.sortOrder || 'DESC'
        );
        const summary = this.r2Manager.getBucketSummary();
        this.panel.webview.postMessage({
          type: 'setR2Objects',
          ...r2Data,
          summary,
        });
        break;

      case 'getR2ObjectDetails':
        if (message.key) {
          const details = this.r2Manager.getObjectDetails(message.key);
          this.panel.webview.postMessage({
            type: 'setR2ObjectDetails',
            ...details,
          });
        }
        break;

      case 'uploadR2Object':
        if (message.key && message.base64Data) {
          const result = this.r2Manager.putObject(
            message.key,
            message.base64Data,
            message.contentType,
            message.customMetadata
          );
          if (result.error) {
            this.panel.webview.postMessage({ type: 'operationError', error: result.error });
          } else {
            this.panel.webview.postMessage({
              type: 'operationSuccess',
              message: `Object "${message.key}" uploaded successfully`,
            });
          }
        }
        break;

      case 'deleteR2Object':
        if (message.key) {
          const result = this.r2Manager.deleteObject(message.key);
          if (result.error) {
            this.panel.webview.postMessage({ type: 'operationError', error: result.error });
          } else {
            this.panel.webview.postMessage({
              type: 'operationSuccess',
              message: `Object "${message.key}" deleted successfully`,
            });
          }
        }
        break;

      case 'exportR2Object':
        if (message.key) {
          const defaultFileName = path.basename(message.key);
          const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultFileName),
            title: `Export ${message.key}`,
          });

          if (saveUri) {
            const result = this.r2Manager.exportObjectToFile(message.key, saveUri.fsPath);
            if (result.error) {
              vscode.window.showErrorMessage(`Export failed: ${result.error}`);
            } else {
              vscode.window.showInformationMessage(`Exported ${message.key} to ${saveUri.fsPath}`);
            }
          }
        }
        break;

      case 'pickFileToUpload':
        const fileUris = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: 'Select file to upload to R2',
          filters: {
            'All Files': ['*'],
            Images: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'avif', 'ico'],
          },
        });

        if (fileUris && fileUris.length > 0) {
          const filePath = fileUris[0].fsPath;
          const fileName = path.basename(filePath);
          const fileBuffer = fs.readFileSync(filePath);
          const base64Data = fileBuffer.toString('base64');
          const ext = path.extname(fileName).toLowerCase();

          const mimeMap: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.gif': 'image/gif',
            '.avif': 'image/avif',
            '.ico': 'image/x-icon',
            '.json': 'application/json',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
          };
          const contentType = mimeMap[ext] || 'application/octet-stream';

          this.panel.webview.postMessage({
            type: 'fileSelectedForUpload',
            fileName,
            fileSize: fileBuffer.length,
            contentType,
            base64Data,
          });
        }
        break;
    }
  }

  public dispose(): void {
    D1WebviewPanel.currentPanel = undefined;
    this.panel.dispose();
  }
}
