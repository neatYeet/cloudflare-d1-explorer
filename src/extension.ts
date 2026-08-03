import * as vscode from 'vscode';
import { D1TreeDataProvider } from './d1TreeDataProvider';
import { D1WebviewPanel } from './d1WebviewPanel';
import { D1DatabaseInfo } from './d1Scanner';

export function activate(context: vscode.ExtensionContext) {
  console.log('Activating Cloudflare D1 Explorer extension...');

  const treeDataProvider = new D1TreeDataProvider(context.extensionPath);
  vscode.window.registerTreeDataProvider('d1-explorer-tree', treeDataProvider);

  // Command to open webview panel
  const openCmd = vscode.commands.registerCommand(
    'd1-explorer.open',
    (dbInfo?: D1DatabaseInfo, tableName?: string) => {
      D1WebviewPanel.createOrShow(
        context.extensionUri,
        context.extensionPath,
        dbInfo,
        tableName
      );
    }
  );

  // Command to refresh tree view
  const refreshCmd = vscode.commands.registerCommand('d1-explorer.refresh', () => {
    treeDataProvider.refresh();
  });

  context.subscriptions.push(openCmd, refreshCmd);
}

export function deactivate() {}
