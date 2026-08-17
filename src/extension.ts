import * as vscode from 'vscode';
import { D1TreeDataProvider } from './d1TreeDataProvider';
import { D1WebviewPanel } from './d1WebviewPanel';
import { D1DatabaseInfo, R2BucketInfo } from './d1Scanner';

export function activate(context: vscode.ExtensionContext) {
  console.log('Activating Cloudflare D1 & R2 Explorer extension...');

  const treeDataProvider = new D1TreeDataProvider(context.extensionPath);
  vscode.window.registerTreeDataProvider('d1-explorer-tree', treeDataProvider);

  // Command to open D1 manager in webview panel
  const openCmd = vscode.commands.registerCommand(
    'd1-explorer.open',
    (dbInfo?: D1DatabaseInfo, tableName?: string) => {
      D1WebviewPanel.createOrShow(
        context.extensionUri,
        context.extensionPath,
        { initialDbInfo: dbInfo, initialTable: tableName, initialMode: 'd1' }
      );
    }
  );

  // Command to open R2 manager in webview panel
  const openR2Cmd = vscode.commands.registerCommand(
    'd1-explorer.openR2',
    (bucketInfo?: R2BucketInfo, objectKey?: string) => {
      D1WebviewPanel.createOrShow(
        context.extensionUri,
        context.extensionPath,
        { initialBucketInfo: bucketInfo, initialObjectKey: objectKey, initialMode: 'r2' }
      );
    }
  );

  // Command to refresh tree view
  const refreshCmd = vscode.commands.registerCommand('d1-explorer.refresh', () => {
    treeDataProvider.refresh();
  });

  context.subscriptions.push(openCmd, openR2Cmd, refreshCmd);
}

export function deactivate() {}
