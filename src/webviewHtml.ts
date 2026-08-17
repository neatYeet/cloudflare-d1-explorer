export function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloudflare D1 & R2 Explorer</title>
  <style>
    :root {
      --bg-color: var(--vscode-editor-background, #1e1e1e);
      --sidebar-bg: var(--vscode-sideBar-background, #252526);
      --fg-color: var(--vscode-editor-foreground, #cccccc);
      --card-bg: var(--vscode-editorWidget-background, #2d2d2d);
      --border-color: var(--vscode-widget-border, #3c3c3c);
      --primary-color: var(--vscode-button-background, #0e639c);
      --primary-hover: var(--vscode-button-hoverBackground, #1177bb);
      --primary-fg: var(--vscode-button-foreground, #ffffff);
      --secondary-bg: var(--vscode-input-background, #3c3c3c);
      --hover-bg: var(--vscode-list-hoverBackground, #2a2d2e);
      --active-bg: var(--vscode-list-activeSelectionBackground, #094771);
      --badge-bg: var(--vscode-badge-background, #4d4d4d);
      --badge-fg: var(--vscode-badge-foreground, #ffffff);
      --cf-orange: #f38020;
      --cf-orange-hover: #fa8f32;
      --font-family: var(--vscode-font-family, system-ui, -apple-system, sans-serif);
      --success-color: #388e3c;
      --danger-color: #d32f2f;
      --warning-color: #f57c00;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family);
      background-color: var(--bg-color);
      color: var(--fg-color);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      font-size: 13px;
    }

    /* Top Navigation Bar */
    .navbar {
      height: 52px;
      background: var(--sidebar-bg);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      gap: 16px;
      flex-shrink: 0;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 14px;
      color: var(--fg-color);
      cursor: pointer;
    }
    .nav-brand svg { width: 22px; height: 22px; stroke: var(--cf-orange); fill: none; }

    /* Segmented Mode Switcher */
    .mode-switcher {
      display: flex;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
    }
    .mode-btn {
      background: transparent;
      border: none;
      color: var(--fg-color);
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0.7;
      transition: all 0.15s ease;
    }
    .mode-btn:hover { opacity: 1; background: var(--hover-bg); }
    .mode-btn.active {
      background: var(--primary-color);
      color: var(--primary-fg);
      opacity: 1;
      font-weight: 600;
    }
    .mode-btn.active.r2-active {
      background: #c76008;
    }

    .resource-selector-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .select-input, .text-input {
      background: var(--secondary-bg);
      color: var(--fg-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 12px;
      outline: none;
    }
    .select-input:focus, .text-input:focus {
      border-color: var(--primary-color);
    }

    .nav-stats {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .stat-badge {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn {
      background: var(--primary-color);
      color: var(--primary-fg);
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;
      text-decoration: none;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn-cf { background: var(--cf-orange); color: #fff; }
    .btn-cf:hover { background: var(--cf-orange-hover); }
    .btn-secondary {
      background: var(--secondary-bg);
      color: var(--fg-color);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover { background: var(--hover-bg); }
    .btn-danger { background: var(--danger-color); color: #fff; }
    .btn-danger:hover { opacity: 0.9; }
    .btn-sm { padding: 4px 8px; font-size: 11px; }
    .btn-icon { padding: 5px; border-radius: 4px; }

    /* Main Container */
    .main-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Left Sidebar */
    .sidebar {
      width: 260px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-header {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sidebar-title {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sidebar-list {
      flex: 1;
      overflow-y: auto;
      list-style: none;
    }
    .sidebar-item {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      transition: background 0.15s ease;
    }
    .sidebar-item:hover { background: var(--hover-bg); }
    .sidebar-item.active { background: var(--active-bg); font-weight: 600; }
    .sidebar-item-name {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sidebar-badge {
      background: var(--badge-bg);
      color: var(--badge-fg);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      white-space: nowrap;
    }

    /* Right Workspace Content Area */
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-color);
    }

    /* Content Header & Tabs */
    .content-header {
      padding: 12px 16px 0 16px;
      border-bottom: 1px solid var(--border-color);
      background: var(--sidebar-bg);
    }
    .headline-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .headline-bar h2 {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .headline-tag {
      font-size: 11px;
      font-weight: normal;
      background: var(--secondary-bg);
      border: 1px solid var(--border-color);
      padding: 2px 8px;
      border-radius: 4px;
      color: #aaa;
    }

    .tabs {
      display: flex;
      gap: 4px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--fg-color);
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0.7;
    }
    .tab-btn:hover { opacity: 1; }
    .tab-btn.active {
      border-bottom-color: var(--primary-color);
      opacity: 1;
      font-weight: 600;
    }
    .tab-btn.r2-tab.active {
      border-bottom-color: var(--cf-orange);
    }

    /* Tab Panes */
    .tab-content {
      flex: 1;
      overflow: auto;
      padding: 16px;
      display: none;
    }
    .tab-content.active {
      display: flex;
      flex-direction: column;
    }

    /* Table Component Style */
    .data-table-wrapper {
      flex: 1;
      overflow: auto;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--card-bg);
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }
    table.data-table th {
      background: var(--sidebar-bg);
      color: var(--fg-color);
      font-weight: 600;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 10;
      white-space: nowrap;
      user-select: none;
      cursor: pointer;
    }
    table.data-table th:hover { background: var(--hover-bg); }
    table.data-table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
    table.data-table tr:hover { background: var(--hover-bg); }

    /* Control Bar */
    .table-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      flex-shrink: 0;
    }

    /* =================== R2 Specific Styles =================== */
    .r2-filter-pills {
      display: flex;
      gap: 4px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 2px;
    }
    .r2-pill-btn {
      background: transparent;
      border: none;
      color: var(--fg-color);
      padding: 4px 10px;
      font-size: 11px;
      border-radius: 3px;
      cursor: pointer;
      opacity: 0.7;
    }
    .r2-pill-btn:hover { opacity: 1; }
    .r2-pill-btn.active {
      background: var(--primary-color);
      color: #fff;
      opacity: 1;
      font-weight: 600;
    }
    .r2-pill-btn.r2-active.active {
      background: var(--cf-orange);
    }

    /* Gallery Cards Grid */
    .r2-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px;
      padding-bottom: 16px;
    }
    .r2-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      position: relative;
    }
    .r2-card:hover {
      transform: translateY(-2px);
      border-color: var(--cf-orange);
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    }
    .r2-card-preview {
      height: 140px;
      background: repeating-conic-gradient(#222 0% 25%, #2a2a2a 0% 50%) 50% / 16px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }
    .r2-card-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .r2-card-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
      color: #fff;
      font-size: 9px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 3px;
      border: 1px solid rgba(255,255,255,0.1);
      text-transform: uppercase;
    }
    .r2-card-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: var(--card-bg);
    }
    .r2-card-key {
      font-weight: 600;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--fg-color);
    }
    .r2-card-meta {
      font-size: 11px;
      color: #888;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .r2-card-actions {
      display: flex;
      gap: 4px;
      margin-top: 6px;
      border-top: 1px solid var(--border-color);
      padding-top: 6px;
      justify-content: flex-end;
    }

    /* Thumbnail in table */
    .table-thumb {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      background: repeating-conic-gradient(#222 0% 25%, #2a2a2a 0% 50%) 50% / 12px 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid var(--border-color);
      cursor: pointer;
    }
    .table-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Modal Overlay & Card */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(3px);
    }
    .modal-overlay.active { display: flex; }
    .modal-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: 550px;
      max-width: 92vw;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 12px 32px rgba(0,0,0,0.6);
    }
    .modal-card.modal-large {
      width: 900px;
      max-width: 94vw;
      height: 85vh;
    }
    .modal-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
    }
    .modal-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .modal-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      background: var(--sidebar-bg);
    }

    /* Inspector Split View */
    .inspector-split {
      display: flex;
      height: 100%;
      gap: 16px;
    }
    .inspector-image-container {
      flex: 1.2;
      background: repeating-conic-gradient(#181818 0% 25%, #242424 0% 50%) 50% / 20px 20px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      min-height: 280px;
    }
    .inspector-image-viewport {
      flex: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      padding: 16px;
    }
    .inspector-image-viewport img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.2s ease;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .image-zoom-toolbar {
      position: absolute;
      bottom: 12px;
      display: flex;
      gap: 4px;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(4px);
      padding: 4px 8px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.1);
      z-index: 10;
    }
    .inspector-meta-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }
    .meta-group {
      background: var(--sidebar-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .meta-group-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      gap: 8px;
    }
    .meta-label { color: #888; white-space: nowrap; }
    .meta-val {
      font-weight: 500;
      word-break: break-all;
      text-align: right;
    }
    .meta-val.code {
      font-family: monospace;
      font-size: 11px;
    }

    /* Drag and Drop Zone */
    .dropzone {
      border: 2px dashed var(--border-color);
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      background: var(--card-bg);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .dropzone:hover, .dropzone.dragover {
      border-color: var(--cf-orange);
      background: rgba(243, 128, 32, 0.05);
    }
    .dropzone svg { width: 44px; height: 44px; stroke: #888; }

    /* SQL Editor Pane */
    .sql-editor-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
    }
    .sql-textarea {
      width: 100%;
      height: 140px;
      background: var(--card-bg);
      color: var(--fg-color);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 12px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 13px;
      outline: none;
      resize: vertical;
    }
    .sql-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .sql-snippets {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    /* Form Layout */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }
    .form-group label {
      font-weight: 600;
      font-size: 12px;
    }
    .form-control {
      background: var(--secondary-bg);
      color: var(--fg-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
    }
    .form-control:focus {
      border-color: var(--primary-color);
    }

    .code-box {
      background: #141414;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #888;
      gap: 12px;
      text-align: center;
      height: 100%;
    }
    .empty-state svg { width: 48px; height: 48px; stroke: #555; }

    /* Overview Metrics Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .metric-card-label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 600; }
    .metric-card-value { font-size: 20px; font-weight: bold; color: var(--fg-color); }
  </style>
</head>
<body>

  <!-- Top Navbar -->
  <div class="navbar">
    <div class="nav-brand" onclick="refreshAllResources()">
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
      <span>Cloudflare Explorer</span>
    </div>

    <!-- Mode Switcher: D1 vs R2 -->
    <div class="mode-switcher">
      <button class="mode-btn active" id="modeBtnD1" onclick="setAppMode('d1')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
        D1 Databases
      </button>
      <button class="mode-btn" id="modeBtnR2" onclick="setAppMode('r2')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        R2 Storage
      </button>
    </div>

    <!-- Resource Dropdown Selector -->
    <div class="resource-selector-group">
      <label id="resourceSelectorLabel" style="font-size: 11px; font-weight:600;">Database:</label>
      <select id="resourceSelect" class="select-input" onchange="onResourceSelectChange(this.value)">
        <option value="">Scanning resources...</option>
      </select>
      <button class="btn btn-secondary btn-sm" onclick="refreshAllResources()" title="Rescan local D1 & R2 resources">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        Refresh
      </button>
    </div>

    <!-- Stats & Actions -->
    <div class="nav-stats">
      <div class="stat-badge" id="navStat1">Size: 0 KB</div>
      <div class="stat-badge" id="navStat2">Tables: 0</div>
      <button class="btn btn-secondary btn-sm" id="navActionBtn" onclick="onNavActionClick()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span id="navActionText">Export Dump</span>
      </button>
    </div>
  </div>

  <!-- Main Container -->
  <div class="main-container">
    
    <!-- Left Sidebar -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span id="sidebarSectionTitle">Tables</span>
          <span id="sidebarCountBadge" class="sidebar-badge">0</span>
        </div>
        <input type="text" id="sidebarFilterInput" class="text-input" placeholder="Filter..." oninput="filterSidebarList(this.value)">
      </div>
      <ul id="sidebarList" class="sidebar-list">
        <!-- Populated via JS -->
      </ul>
    </div>

    <!-- Right Content Area -->
    <div class="content-area">

      <!-- ====================== D1 VIEW WRAPPER ====================== -->
      <div id="d1ViewWrapper" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
        <!-- D1 Header & Tabs -->
        <div class="content-header">
          <div class="headline-bar">
            <h2 id="currentTableName">Select a Table</h2>
            <div>
              <button class="btn btn-secondary btn-sm" onclick="openNewTableModal()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New Table
              </button>
            </div>
          </div>

          <div class="tabs">
            <button class="tab-btn active" data-tab="d1-browse" onclick="switchD1Tab('d1-browse')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
              Browse
            </button>
            <button class="tab-btn" data-tab="d1-structure" onclick="switchD1Tab('d1-structure')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              Structure
            </button>
            <button class="tab-btn" data-tab="d1-sql" onclick="switchD1Tab('d1-sql')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
              SQL Console
            </button>
            <button class="tab-btn" data-tab="d1-insert" onclick="switchD1Tab('d1-insert')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Insert Row
            </button>
            <button class="tab-btn" data-tab="d1-export" onclick="switchD1Tab('d1-export')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export / Dump
            </button>
          </div>
        </div>

        <!-- D1 Tab Panes -->
        <!-- 1. BROWSE -->
        <div id="tab-d1-browse" class="tab-content active">
          <div class="table-controls">
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="text" id="d1BrowseSearchInput" class="text-input" placeholder="Search rows..." style="width: 240px;" onkeydown="if(event.key==='Enter') executeD1RowSearch()">
              <button class="btn btn-secondary btn-sm" onclick="executeD1RowSearch()">Filter</button>
              <button class="btn btn-secondary btn-sm" onclick="clearD1RowSearch()">Clear</button>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 11px; opacity: 0.7;">Per page:</span>
              <select id="d1PageSizeSelect" class="select-input" onchange="changeD1PageSize(this.value)">
                <option value="10">10</option>
                <option value="25" selected>25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div class="data-table-wrapper">
            <table class="data-table" id="browseDataTable">
              <thead><tr id="browseTableHeader"></tr></thead>
              <tbody id="browseTableBody"></tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <span id="d1PaginationInfo" style="font-size: 12px; opacity: 0.8;">Showing 0 of 0 records</span>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" id="btnD1PrevPage" onclick="prevD1Page()">&laquo; Previous</button>
              <span id="d1PageNumberDisplay" style="padding: 4px 8px; font-weight: 600;">Page 1 / 1</span>
              <button class="btn btn-secondary btn-sm" id="btnD1NextPage" onclick="nextD1Page()">Next &raquo;</button>
            </div>
          </div>
        </div>

        <!-- 2. STRUCTURE -->
        <div id="tab-d1-structure" class="tab-content">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <h4 style="margin-bottom: 8px;">Columns Schema</h4>
              <div class="data-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>CID</th>
                      <th>Column Name</th>
                      <th>Data Type</th>
                      <th>Nullable</th>
                      <th>Default Value</th>
                      <th>Primary Key</th>
                    </tr>
                  </thead>
                  <tbody id="structureColumnsBody"></tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 style="margin-bottom: 8px;">Indexes</h4>
              <div class="data-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Seq</th>
                      <th>Index Name</th>
                      <th>Unique</th>
                      <th>Columns</th>
                    </tr>
                  </thead>
                  <tbody id="structureIndexesBody"></tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 style="margin-bottom: 8px;">CREATE TABLE DDL</h4>
              <div class="code-box" id="structureDdlBox">SELECT * FROM sqlite_master;</div>
            </div>
          </div>
        </div>

        <!-- 3. SQL CONSOLE -->
        <div id="tab-d1-sql" class="tab-content">
          <div class="sql-editor-container">
            <div class="sql-snippets">
              <span style="font-size: 11px; font-weight:600; align-self: center;">Quick Snippets:</span>
              <button class="btn btn-secondary btn-sm" onclick="insertSqlSnippet('select')">SELECT *</button>
              <button class="btn btn-secondary btn-sm" onclick="insertSqlSnippet('count')">SELECT COUNT</button>
              <button class="btn btn-secondary btn-sm" onclick="insertSqlSnippet('insert')">INSERT INTO</button>
              <button class="btn btn-secondary btn-sm" onclick="insertSqlSnippet('update')">UPDATE</button>
              <button class="btn btn-secondary btn-sm" onclick="insertSqlSnippet('delete')">DELETE</button>
            </div>

            <textarea id="sqlQueryTextarea" class="sql-textarea" placeholder="Type SQL query here... (e.g. SELECT * FROM users;)"></textarea>

            <div class="sql-actions">
              <button class="btn" onclick="runCustomSql()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Execute Query
              </button>
              <span id="sqlExecutionStatus" style="font-size: 12px; color: var(--success-color);"></span>
            </div>

            <h4 style="margin-top: 12px;">Query Results</h4>
            <div class="data-table-wrapper" style="flex: 1;">
              <table class="data-table">
                <thead><tr id="sqlResultHeader"></tr></thead>
                <tbody id="sqlResultBody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 4. INSERT ROW -->
        <div id="tab-d1-insert" class="tab-content">
          <div style="max-width: 600px;">
            <h3 style="margin-bottom: 16px;">Insert Record into <span id="insertTableNameHeader">Table</span></h3>
            <form id="insertRowForm" onsubmit="submitInsertRow(event)">
              <div id="insertFormFields"></div>
              <div style="display: flex; gap: 8px; margin-top: 16px;">
                <button type="submit" class="btn">Save Record</button>
                <button type="button" class="btn btn-secondary" onclick="switchD1Tab('d1-browse')">Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <!-- 5. EXPORT / DUMP -->
        <div id="tab-d1-export" class="tab-content">
          <div style="max-width: 600px; display: flex; flex-direction: column; gap: 20px;">
            <div style="background: var(--card-bg); border: 1px solid var(--border-color); padding: 16px; border-radius: 6px;">
              <h3>Export Database / Table</h3>
              <p style="margin: 8px 0; color: #888;">Generate SQL dump containing CREATE TABLE definitions and INSERT statements.</p>
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn" onclick="exportTableSqlDump()">Export Current Table SQL</button>
                <button class="btn btn-secondary" onclick="exportFullSqlDump()">Export Full Database SQL</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ====================== R2 VIEW WRAPPER ====================== -->
      <div id="r2ViewWrapper" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
        <!-- R2 Header & Tabs -->
        <div class="content-header">
          <div class="headline-bar">
            <h2>
              <span id="currentBucketName">Select a Bucket</span>
              <span class="headline-tag" id="currentBucketBindingBadge">Binding: None</span>
            </h2>
            <div>
              <button class="btn btn-cf btn-sm" onclick="switchR2Tab('r2-upload')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Upload File / Image
              </button>
            </div>
          </div>

          <div class="tabs">
            <button class="tab-btn r2-tab active" data-tab="r2-objects" onclick="switchR2Tab('r2-objects')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Objects Browser
            </button>
            <button class="tab-btn r2-tab" data-tab="r2-upload" onclick="switchR2Tab('r2-upload')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Upload Object
            </button>
            <button class="tab-btn r2-tab" data-tab="r2-overview" onclick="switchR2Tab('r2-overview')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Bucket Overview
            </button>
          </div>
        </div>

        <!-- R2 Tab Panes -->
        <!-- 1. OBJECTS BROWSER -->
        <div id="tab-r2-objects" class="tab-content active">
          <div class="table-controls">
            <!-- Left controls: Search & Filter Pills -->
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <input type="text" id="r2SearchInput" class="text-input" placeholder="Search objects by key..." style="width: 220px;" onkeydown="if(event.key==='Enter') executeR2Search()">
              <button class="btn btn-secondary btn-sm" onclick="executeR2Search()">Search</button>
              <button class="btn btn-secondary btn-sm" onclick="clearR2Search()">Clear</button>

              <div class="r2-filter-pills">
                <button class="r2-pill-btn r2-active active" id="r2PillAll" onclick="setR2FilterType('all')">All Objects</button>
                <button class="r2-pill-btn r2-active" id="r2PillImages" onclick="setR2FilterType('images')">Images Only</button>
                <button class="r2-pill-btn r2-active" id="r2PillOther" onclick="setR2FilterType('other')">Other Files</button>
              </div>
            </div>

            <!-- Right controls: Sort, View Switcher & Page Size -->
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 11px; opacity: 0.7;">Sort:</span>
              <select id="r2SortSelect" class="select-input" onchange="changeR2Sort(this.value)">
                <option value="uploaded_DESC" selected>Uploaded (Newest)</option>
                <option value="uploaded_ASC">Uploaded (Oldest)</option>
                <option value="key_ASC">Key Name (A-Z)</option>
                <option value="key_DESC">Key Name (Z-A)</option>
                <option value="size_DESC">Size (Largest)</option>
                <option value="size_ASC">Size (Smallest)</option>
              </select>

              <!-- View Mode Toggle: Grid vs Table -->
              <div class="r2-filter-pills">
                <button class="r2-pill-btn active" id="r2ViewGridBtn" onclick="setR2ViewMode('grid')" title="Gallery Grid View">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
                <button class="r2-pill-btn" id="r2ViewTableBtn" onclick="setR2ViewMode('table')" title="Detailed Table View">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </button>
              </div>

              <select id="r2PageSizeSelect" class="select-input" onchange="changeR2PageSize(this.value)">
                <option value="12">12</option>
                <option value="24" selected>24</option>
                <option value="48">48</option>
                <option value="96">96</option>
              </select>
            </div>
          </div>

          <!-- Objects Grid / Table Container -->
          <div id="r2ObjectsContainer" style="flex: 1; overflow-y: auto;">
            <!-- Gallery Grid -->
            <div id="r2GalleryGrid" class="r2-gallery-grid"></div>

            <!-- Table View -->
            <div id="r2TableView" class="data-table-wrapper" style="display: none;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">Preview</th>
                    <th>Object Key</th>
                    <th>MIME Type</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>ETag</th>
                    <th style="width: 110px;">Actions</th>
                  </tr>
                </thead>
                <tbody id="r2TableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- Pagination Bar -->
          <div class="pagination-bar">
            <span id="r2PaginationInfo" style="font-size: 12px; opacity: 0.8;">Showing 0 of 0 objects</span>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" id="btnR2PrevPage" onclick="prevR2Page()">&laquo; Previous</button>
              <span id="r2PageNumberDisplay" style="padding: 4px 8px; font-weight: 600;">Page 1 / 1</span>
              <button class="btn btn-secondary btn-sm" id="btnR2NextPage" onclick="nextR2Page()">Next &raquo;</button>
            </div>
          </div>
        </div>

        <!-- 2. UPLOAD OBJECT TAB -->
        <div id="tab-r2-upload" class="tab-content">
          <div style="max-width: 650px; display: flex; flex-direction: column; gap: 16px;">
            <div class="dropzone" id="uploadDropzone" onclick="triggerFilePicker()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <div style="font-weight: 600; font-size: 14px;">Click to select a local file or image</div>
              <div style="font-size: 12px; color: #888;">Supports WEBP, PNG, JPG, SVG, GIF, AVIF, JSON, PDF, and all binary files</div>
            </div>

            <!-- Upload preview & config card -->
            <div id="uploadConfigCard" style="display: none; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 16px;">
              <h4 style="margin-bottom: 12px;">Object Configuration</h4>

              <div id="uploadImagePreviewContainer" style="margin-bottom: 12px; text-align: center; display: none;">
                <img id="uploadImagePreview" style="max-height: 160px; border-radius: 4px; border: 1px solid var(--border-color);" alt="Upload preview">
              </div>

              <div class="form-group">
                <label>Object Key (Path in bucket)</label>
                <input type="text" id="uploadKeyInput" class="form-control" placeholder="e.g. images/photo.webp">
              </div>

              <div class="form-group">
                <label>Content-Type (MIME)</label>
                <input type="text" id="uploadMimeInput" class="form-control" placeholder="e.g. image/webp">
              </div>

              <div class="form-group">
                <label>Custom Metadata (JSON key-value)</label>
                <textarea id="uploadCustomMetaInput" class="form-control" style="height: 70px; font-family: monospace;" placeholder='{"author": "John", "category": "featured"}'></textarea>
              </div>

              <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px;">
                <button class="btn btn-secondary" onclick="cancelUpload()">Cancel</button>
                <button class="btn btn-cf" onclick="submitUpload()">Upload to Bucket</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. BUCKET OVERVIEW TAB -->
        <div id="tab-r2-overview" class="tab-content">
          <div style="max-width: 750px; display: flex; flex-direction: column; gap: 16px;">
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-card-label">Total Objects</div>
                <div class="metric-card-value" id="overviewTotalObjects">0</div>
              </div>
              <div class="metric-card">
                <div class="metric-card-label">Total Storage</div>
                <div class="metric-card-value" id="overviewTotalSize">0 MB</div>
              </div>
              <div class="metric-card">
                <div class="metric-card-label">Images</div>
                <div class="metric-card-value" id="overviewImageCount">0</div>
              </div>
            </div>

            <div class="meta-group">
              <div class="meta-group-title">Bucket Properties</div>
              <div class="meta-row"><span class="meta-label">Bucket Name:</span><span class="meta-val" id="overviewBucketName">-</span></div>
              <div class="meta-row"><span class="meta-label">Wrangler Binding:</span><span class="meta-val" id="overviewBinding">-</span></div>
              <div class="meta-row"><span class="meta-label">Project Directory:</span><span class="meta-val code" id="overviewProjectPath">-</span></div>
              <div class="meta-row"><span class="meta-label">Local Blobs Path:</span><span class="meta-val code" id="overviewBlobsPath">-</span></div>
              <div class="meta-row"><span class="meta-label">Metadata SQLite:</span><span class="meta-val code" id="overviewSqlitePath">-</span></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- ====================== IMAGE & METADATA INSPECTOR MODAL ====================== -->
  <div class="modal-overlay" id="inspectorModal">
    <div class="modal-card modal-large">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          <span id="inspectorTitleKey">Object Inspector</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="closeModal('inspectorModal')">&times;</button>
      </div>

      <div class="modal-body" style="padding: 0;">
        <div class="inspector-split" style="padding: 16px;">
          <!-- Left: Visual Image Preview -->
          <div class="inspector-image-container">
            <div class="inspector-image-viewport">
              <img id="inspectorImage" src="" alt="Object preview">
              <div id="inspectorNonImagePlaceholder" style="display: none;" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                <span>Non-image file</span>
              </div>
            </div>

            <!-- Image zoom controls -->
            <div class="image-zoom-toolbar" id="inspectorZoomBar">
              <button class="btn btn-secondary btn-sm btn-icon" onclick="zoomInspectorImage(-0.25)" title="Zoom Out">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button class="btn btn-secondary btn-sm" onclick="resetInspectorZoom()" id="inspectorZoomDisplay">100%</button>
              <button class="btn btn-secondary btn-sm btn-icon" onclick="zoomInspectorImage(0.25)" title="Zoom In">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          </div>

          <!-- Right: Metadata & Attributes -->
          <div class="inspector-meta-container">
            <div class="meta-group">
              <div class="meta-group-title">Key & Location</div>
              <div class="meta-row"><span class="meta-label">Key:</span><span class="meta-val" id="inspMetaKey">-</span></div>
              <div class="meta-row"><span class="meta-label">Blob ID:</span><span class="meta-val code" id="inspMetaBlobId">-</span></div>
              <div class="meta-row"><span class="meta-label">Disk File:</span><span class="meta-val code" id="inspMetaDiskPath">-</span></div>
            </div>

            <div class="meta-group">
              <div class="meta-group-title">File Details</div>
              <div class="meta-row"><span class="meta-label">Dimensions:</span><span class="meta-val" id="inspMetaDimensions">-</span></div>
              <div class="meta-row"><span class="meta-label">File Size:</span><span class="meta-val" id="inspMetaSize">-</span></div>
              <div class="meta-row"><span class="meta-label">MIME Type:</span><span class="meta-val" id="inspMetaMime">-</span></div>
              <div class="meta-row"><span class="meta-label">Uploaded:</span><span class="meta-val" id="inspMetaUploaded">-</span></div>
              <div class="meta-row"><span class="meta-label">ETag:</span><span class="meta-val code" id="inspMetaEtag">-</span></div>
            </div>

            <div class="meta-group">
              <div class="meta-group-title">HTTP Metadata</div>
              <div id="inspHttpMetaList"></div>
            </div>

            <div class="meta-group">
              <div class="meta-group-title">Custom Metadata</div>
              <div id="inspCustomMetaList"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="copyInspectorDataUri()">Copy Data URI</button>
        <button class="btn btn-secondary" onclick="copyInspectorKey()">Copy Key</button>
        <button class="btn btn-secondary" onclick="exportInspectorObject()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download File
        </button>
        <button class="btn btn-danger" onclick="deleteInspectorObject()">Delete Object</button>
      </div>
    </div>
  </div>

  <!-- Edit Row Modal (D1) -->
  <div class="modal-overlay" id="editRowModal">
    <div class="modal-card">
      <div class="modal-header">
        <span>Edit Record</span>
        <button class="btn btn-secondary btn-sm" onclick="closeModal('editRowModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="editRowForm">
          <div id="editFormFields"></div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('editRowModal')">Cancel</button>
        <button class="btn" onclick="submitEditRow()">Update Record</button>
      </div>
    </div>
  </div>

  <!-- New Table Modal (D1) -->
  <div class="modal-overlay" id="newTableModal">
    <div class="modal-card">
      <div class="modal-header">
        <span>Create New Table</span>
        <button class="btn btn-secondary btn-sm" onclick="closeModal('newTableModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Table Name</label>
          <input type="text" id="newTableNameInput" class="form-control" placeholder="e.g. products">
        </div>
        <div class="form-group">
          <label>Columns (SQL definition syntax)</label>
          <textarea id="newTableColsInput" class="form-control" style="height: 100px; font-family: monospace;" placeholder="id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('newTableModal')">Cancel</button>
        <button class="btn" onclick="submitCreateNewTable()">Create Table</button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // App Global State
    let currentAppMode = 'd1'; // 'd1' | 'r2'
    let allDatabases = [];
    let allBuckets = [];

    // D1 State
    let currentDbPath = '';
    let currentDbInfo = null;
    let currentTable = '';
    let d1CurrentPage = 1;
    let d1PageSize = 25;
    let d1SortColumn = '';
    let d1SortOrder = 'ASC';
    let d1SearchQuery = '';
    let currentTableColumns = [];
    let editingRowPk = null;

    // R2 State
    let currentBucketId = '';
    let currentBucketInfo = null;
    let r2CurrentPage = 1;
    let r2PageSize = 24;
    let r2SortColumn = 'uploaded';
    let r2SortOrder = 'DESC';
    let r2SearchQuery = '';
    let r2FilterType = 'all'; // 'all' | 'images' | 'other'
    let r2ViewMode = 'grid'; // 'grid' | 'table'
    let r2CurrentObjects = [];

    // Inspector State
    let currentInspectorObject = null;
    let currentInspectorDataUri = '';
    let currentInspectorZoom = 1;

    // Pending Upload State
    let pendingUploadData = null;

    // Message handler
    window.addEventListener('message', event => {
      const msg = event.data;
      switch (msg.type) {
        case 'setResources':
          allDatabases = msg.databases || [];
          allBuckets = msg.r2Buckets || [];
          if (msg.currentMode) setAppMode(msg.currentMode, false);
          renderResourceDropdown();
          break;

        case 'setTables':
          currentDbInfo = msg.dbInfo;
          renderD1SidebarTables(msg.tables);
          if (msg.initialTable) selectTable(msg.initialTable);
          break;

        case 'setTableData':
          renderD1BrowseData(msg);
          break;

        case 'setTableStructure':
          renderD1TableStructure(msg);
          break;

        case 'setQueryResult':
          renderD1QueryResult(msg);
          break;

        case 'setR2Bucket':
          currentBucketInfo = msg.bucketInfo;
          renderR2BucketOverview(msg.bucketInfo, msg.summary);
          refreshR2Objects();
          if (msg.initialObjectKey) {
            openR2ObjectInspector(msg.initialObjectKey);
          }
          break;

        case 'setR2Objects':
          renderR2Objects(msg);
          break;

        case 'setR2ObjectDetails':
          populateInspectorDetails(msg);
          break;

        case 'fileSelectedForUpload':
          handleFileSelectedForUpload(msg);
          break;

        case 'operationSuccess':
          if (msg.message) alert(msg.message);
          if (currentAppMode === 'd1') refreshD1CurrentTab();
          else refreshR2Objects();
          break;

        case 'operationError':
          alert('Error: ' + msg.error);
          break;
      }
    });

    // ==========================================
    // Core Mode & Resource Switching
    // ==========================================
    function setAppMode(mode, notify = true) {
      currentAppMode = mode;

      const btnD1 = document.getElementById('modeBtnD1');
      const btnR2 = document.getElementById('modeBtnR2');
      const d1Wrapper = document.getElementById('d1ViewWrapper');
      const r2Wrapper = document.getElementById('r2ViewWrapper');
      const navActionText = document.getElementById('navActionText');

      if (mode === 'd1') {
        btnD1.classList.add('active');
        btnR2.classList.remove('active', 'r2-active');
        d1Wrapper.style.display = 'flex';
        r2Wrapper.style.display = 'none';
        document.getElementById('resourceSelectorLabel').textContent = 'Database:';
        document.getElementById('sidebarSectionTitle').textContent = 'Tables';
        navActionText.textContent = 'Export Dump';
      } else {
        btnR2.classList.add('active', 'r2-active');
        btnD1.classList.remove('active');
        d1Wrapper.style.display = 'none';
        r2Wrapper.style.display = 'flex';
        document.getElementById('resourceSelectorLabel').textContent = 'R2 Bucket:';
        document.getElementById('sidebarSectionTitle').textContent = 'Buckets';
        navActionText.textContent = 'Upload File';
      }

      renderResourceDropdown();
      if (notify) {
        vscode.postMessage({ type: 'switchMode', mode });
      }
    }

    function renderResourceDropdown() {
      const select = document.getElementById('resourceSelect');
      select.innerHTML = '';

      if (currentAppMode === 'd1') {
        if (!allDatabases || allDatabases.length === 0) {
          select.innerHTML = '<option value="">No D1 databases found</option>';
          renderD1SidebarTables([]);
          return;
        }

        allDatabases.forEach(db => {
          const opt = document.createElement('option');
          opt.value = db.filePath;
          opt.textContent = db.name;
          if (db.filePath === currentDbPath) opt.selected = true;
          select.appendChild(opt);
        });

        if (!currentDbPath && allDatabases.length > 0) {
          currentDbPath = allDatabases[0].filePath;
        }
      } else {
        if (!allBuckets || allBuckets.length === 0) {
          select.innerHTML = '<option value="">No R2 buckets found</option>';
          renderR2SidebarBuckets([]);
          return;
        }

        allBuckets.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.id;
          opt.textContent = b.name;
          if (b.id === currentBucketId) opt.selected = true;
          select.appendChild(opt);
        });

        renderR2SidebarBuckets(allBuckets);

        if (!currentBucketId && allBuckets.length > 0) {
          currentBucketId = allBuckets[0].id;
        }
      }
    }

    function onResourceSelectChange(val) {
      if (!val) return;
      if (currentAppMode === 'd1') {
        currentDbPath = val;
        vscode.postMessage({ type: 'switchDatabase', dbPath: val });
      } else {
        currentBucketId = val;
        vscode.postMessage({ type: 'switchR2Bucket', bucketId: val });
      }
    }

    function refreshAllResources() {
      vscode.postMessage({ type: 'refreshResources' });
    }

    function onNavActionClick() {
      if (currentAppMode === 'd1') {
        exportFullSqlDump();
      } else {
        switchR2Tab('r2-upload');
      }
    }

    // ==========================================
    // D1 Explorer Logic
    // ==========================================
    function renderD1SidebarTables(tables) {
      if (currentAppMode !== 'd1') return;
      const list = document.getElementById('sidebarList');
      list.innerHTML = '';
      document.getElementById('sidebarCountBadge').textContent = tables.length;
      document.getElementById('navStat2').textContent = 'Tables: ' + tables.length;

      if (currentDbInfo) {
        document.getElementById('navStat1').textContent = 'Size: ' + (currentDbInfo.sizeBytes / 1024).toFixed(1) + ' KB';
      }

      if (tables.length === 0) {
        list.innerHTML = '<li class="empty-state" style="padding:16px;">No tables found</li>';
        return;
      }

      tables.forEach(t => {
        const li = document.createElement('li');
        li.className = 'sidebar-item' + (t.name === currentTable ? ' active' : '');
        li.onclick = () => selectTable(t.name);
        li.innerHTML = \`
          <div class="sidebar-item-name">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
            <span>\${t.name}</span>
          </div>
          <span class="sidebar-badge">\${t.rowCount}</span>
        \`;
        list.appendChild(li);
      });

      if (!currentTable && tables.length > 0) {
        selectTable(tables[0].name);
      }
    }

    function selectTable(tableName) {
      currentTable = tableName;
      d1CurrentPage = 1;
      document.getElementById('currentTableName').textContent = tableName;
      document.getElementById('insertTableNameHeader').textContent = tableName;

      document.querySelectorAll('.sidebar-item').forEach(el => {
        if (el.querySelector('span')?.textContent === tableName) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });

      refreshD1CurrentTab();
    }

    function switchD1Tab(tabName) {
      document.querySelectorAll('#d1ViewWrapper .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
      });
      document.querySelectorAll('#d1ViewWrapper .tab-content').forEach(pane => {
        pane.classList.toggle('active', pane.id === 'tab-' + tabName);
      });

      refreshD1CurrentTab();
    }

    function refreshD1CurrentTab() {
      const activeTabBtn = document.querySelector('#d1ViewWrapper .tab-btn.active');
      const tab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'd1-browse';

      if (!currentTable) return;

      if (tab === 'd1-browse') {
        vscode.postMessage({
          type: 'getTableData',
          tableName: currentTable,
          page: d1CurrentPage,
          pageSize: d1PageSize,
          sortColumn: d1SortColumn,
          sortOrder: d1SortOrder,
          searchQuery: d1SearchQuery
        });
      } else if (tab === 'd1-structure' || tab === 'd1-insert') {
        vscode.postMessage({
          type: 'getTableStructure',
          tableName: currentTable
        });
      }
    }

    function renderD1BrowseData(msg) {
      const headerRow = document.getElementById('browseTableHeader');
      const body = document.getElementById('browseTableBody');
      headerRow.innerHTML = '';
      body.innerHTML = '';

      currentTableColumns = msg.columns;

      const thAction = document.createElement('th');
      thAction.style.width = '80px';
      thAction.textContent = 'Actions';
      headerRow.appendChild(thAction);

      msg.columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col + (d1SortColumn === col ? (d1SortOrder === 'ASC' ? ' ▲' : ' ▼') : '');
        th.onclick = () => {
          if (d1SortColumn === col) {
            d1SortOrder = d1SortOrder === 'ASC' ? 'DESC' : 'ASC';
          } else {
            d1SortColumn = col;
            d1SortOrder = 'ASC';
          }
          refreshD1CurrentTab();
        };
        headerRow.appendChild(th);
      });

      if (!msg.rows || msg.rows.length === 0) {
        body.innerHTML = \`<tr><td colspan="\${msg.columns.length + 1}" style="text-align:center; padding: 24px; color: #888;">No rows found in table</td></tr>\`;
      } else {
        msg.rows.forEach(rowValues => {
          const tr = document.createElement('tr');
          const tdAction = document.createElement('td');
          tdAction.innerHTML = \`
            <button class="btn btn-secondary btn-sm" onclick='openEditRowModal(\${JSON.stringify(rowValues)})' title="Edit">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn btn-danger btn-sm" onclick='deleteRowConfirm(\${JSON.stringify(rowValues)})' title="Delete">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          \`;
          tr.appendChild(tdAction);

          rowValues.forEach(val => {
            const td = document.createElement('td');
            if (val === null || val === undefined) {
              td.innerHTML = '<span style="color:#777; font-style:italic;">NULL</span>';
            } else {
              td.textContent = String(val);
            }
            tr.appendChild(td);
          });
          body.appendChild(tr);
        });
      }

      document.getElementById('d1PaginationInfo').textContent = \`Showing \${msg.rows.length} of \${msg.totalRows} records\`;
      document.getElementById('d1PageNumberDisplay').textContent = \`Page \${msg.page} / \${msg.totalPages}\`;
      document.getElementById('btnD1PrevPage').disabled = msg.page <= 1;
      document.getElementById('btnD1NextPage').disabled = msg.page >= msg.totalPages;
    }

    function renderD1TableStructure(msg) {
      const colBody = document.getElementById('structureColumnsBody');
      colBody.innerHTML = '';
      msg.columns.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${c.cid}</td>
          <td style="font-weight:600;">\${c.name}</td>
          <td><code>\${c.type}</code></td>
          <td>\${c.notnull ? 'No' : 'Yes'}</td>
          <td>\${c.dflt_value !== null && c.dflt_value !== undefined ? c.dflt_value : '<span style="color:#777;">NULL</span>'}</td>
          <td>\${c.pk ? '<span style="color:var(--primary-color); font-weight:bold;">PRIMARY KEY</span>' : '-'}</td>
        \`;
        colBody.appendChild(tr);
      });

      const idxBody = document.getElementById('structureIndexesBody');
      idxBody.innerHTML = '';
      if (!msg.indexes || msg.indexes.length === 0) {
        idxBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">No indexes defined</td></tr>';
      } else {
        msg.indexes.forEach(idx => {
          const tr = document.createElement('tr');
          tr.innerHTML = \`
            <td>\${idx.seq}</td>
            <td style="font-weight:600;">\${idx.name}</td>
            <td>\${idx.unique ? 'YES' : 'NO'}</td>
            <td>\${idx.columns ? idx.columns.join(', ') : '-'}</td>
          \`;
          idxBody.appendChild(tr);
        });
      }

      document.getElementById('structureDdlBox').textContent = msg.createSql || 'N/A';
      renderInsertFormFields(msg.columns);
    }

    function renderInsertFormFields(columns) {
      const container = document.getElementById('insertFormFields');
      container.innerHTML = '';
      columns.forEach(col => {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.innerHTML = \`
          <label>\${col.name} <span style="font-size:10px; color:#888;">(\${col.type})</span></label>
          <input type="text" name="\${col.name}" class="form-control" placeholder="\${col.dflt_value ? 'Default: ' + col.dflt_value : 'Enter value...'}" \${col.pk && col.type.includes('INT') ? 'placeholder="Auto-increment (leave blank for new ID)"' : ''}>
        \`;
        container.appendChild(group);
      });
    }

    function submitInsertRow(e) {
      e.preventDefault();
      const form = document.getElementById('insertRowForm');
      const formData = new FormData(form);
      const rowData = {};
      for (const [key, value] of formData.entries()) {
        if (value !== '') rowData[key] = value;
      }
      vscode.postMessage({ type: 'insertRow', tableName: currentTable, rowData });
    }

    function openEditRowModal(rowValues) {
      const container = document.getElementById('editFormFields');
      container.innerHTML = '';
      const pkMap = {};
      currentTableColumns.forEach((col, idx) => {
        pkMap[col] = rowValues[idx];
        const group = document.createElement('div');
        group.className = 'form-group';
        group.innerHTML = \`
          <label>\${col}</label>
          <input type="text" data-col="\${col}" class="form-control" value="\${rowValues[idx] !== null && rowValues[idx] !== undefined ? String(rowValues[idx]).replace(/"/g, '&quot;') : ''}">
        \`;
        container.appendChild(group);
      });
      editingRowPk = pkMap;
      document.getElementById('editRowModal').classList.add('active');
    }

    function submitEditRow() {
      const updatedData = {};
      document.querySelectorAll('#editFormFields input').forEach(input => {
        const col = input.getAttribute('data-col');
        updatedData[col] = input.value;
      });
      vscode.postMessage({
        type: 'updateRow',
        tableName: currentTable,
        primaryKeyMap: editingRowPk,
        updatedData
      });
      closeModal('editRowModal');
    }

    function deleteRowConfirm(rowValues) {
      if (!confirm('Are you sure you want to delete this row?')) return;
      const pkMap = {};
      currentTableColumns.forEach((col, idx) => { pkMap[col] = rowValues[idx]; });
      vscode.postMessage({ type: 'deleteRow', tableName: currentTable, primaryKeyMap: pkMap });
    }

    function insertSqlSnippet(type) {
      const textarea = document.getElementById('sqlQueryTextarea');
      if (type === 'select') textarea.value = \`SELECT * FROM "\${currentTable}" LIMIT 50;\`;
      else if (type === 'count') textarea.value = \`SELECT COUNT(*) FROM "\${currentTable}";\`;
      else if (type === 'insert') textarea.value = \`INSERT INTO "\${currentTable}" VALUES (...);\`;
      else if (type === 'update') textarea.value = \`UPDATE "\${currentTable}" SET column = 'value' WHERE id = 1;\`;
      else if (type === 'delete') textarea.value = \`DELETE FROM "\${currentTable}" WHERE id = 1;\`;
    }

    function runCustomSql() {
      const sql = document.getElementById('sqlQueryTextarea').value;
      if (!sql.trim()) return;
      vscode.postMessage({ type: 'executeSql', sql });
    }

    function renderD1QueryResult(msg) {
      const statusEl = document.getElementById('sqlExecutionStatus');
      if (msg.error) {
        statusEl.style.color = 'var(--danger-color)';
        statusEl.textContent = 'Error: ' + msg.error;
      } else {
        statusEl.style.color = 'var(--success-color)';
        statusEl.textContent = \`Query executed in \${msg.executionTimeMs}ms. Rows affected: \${msg.rowsAffected}\`;
      }

      const headerRow = document.getElementById('sqlResultHeader');
      const body = document.getElementById('sqlResultBody');
      headerRow.innerHTML = '';
      body.innerHTML = '';

      if (msg.columns && msg.columns.length) {
        msg.columns.forEach(col => {
          const th = document.createElement('th');
          th.textContent = col;
          headerRow.appendChild(th);
        });

        msg.values.forEach(rowValues => {
          const tr = document.createElement('tr');
          rowValues.forEach(val => {
            const td = document.createElement('td');
            td.textContent = val !== null && val !== undefined ? String(val) : 'NULL';
            tr.appendChild(td);
          });
          body.appendChild(tr);
        });
      }
    }

    function exportTableSqlDump() {
      vscode.postMessage({ type: 'exportSqlDump', tableName: currentTable });
    }

    function exportFullSqlDump() {
      vscode.postMessage({ type: 'exportSqlDump' });
    }

    function openNewTableModal() {
      document.getElementById('newTableModal').classList.add('active');
    }

    function submitCreateNewTable() {
      const name = document.getElementById('newTableNameInput').value.trim();
      const cols = document.getElementById('newTableColsInput').value.trim();
      if (!name || !cols) return alert('Table name and column definitions are required');
      const sql = \`CREATE TABLE "\${name}" (\${cols});\`;
      vscode.postMessage({ type: 'executeSql', sql });
      closeModal('newTableModal');
    }

    function executeD1RowSearch() {
      d1SearchQuery = document.getElementById('d1BrowseSearchInput').value;
      d1CurrentPage = 1;
      refreshD1CurrentTab();
    }

    function clearD1RowSearch() {
      document.getElementById('d1BrowseSearchInput').value = '';
      d1SearchQuery = '';
      d1CurrentPage = 1;
      refreshD1CurrentTab();
    }

    function prevD1Page() {
      if (d1CurrentPage > 1) { d1CurrentPage--; refreshD1CurrentTab(); }
    }

    function nextD1Page() {
      d1CurrentPage++;
      refreshD1CurrentTab();
    }

    function changeD1PageSize(val) {
      d1PageSize = parseInt(val, 10);
      d1CurrentPage = 1;
      refreshD1CurrentTab();
    }

    // ==========================================
    // R2 Explorer Logic
    // ==========================================
    function renderR2SidebarBuckets(buckets) {
      if (currentAppMode !== 'r2') return;
      const list = document.getElementById('sidebarList');
      list.innerHTML = '';
      document.getElementById('sidebarCountBadge').textContent = buckets.length;

      if (buckets.length === 0) {
        list.innerHTML = '<li class="empty-state" style="padding:16px;">No R2 buckets found</li>';
        return;
      }

      buckets.forEach(b => {
        const li = document.createElement('li');
        li.className = 'sidebar-item' + (b.id === currentBucketId ? ' active' : '');
        li.onclick = () => selectR2Bucket(b.id);
        li.innerHTML = \`
          <div class="sidebar-item-name">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            <span>\${b.name}</span>
          </div>
          <span class="sidebar-badge" style="background:#c76008;">R2</span>
        \`;
        list.appendChild(li);
      });
    }

    function selectR2Bucket(bucketId) {
      currentBucketId = bucketId;
      document.querySelectorAll('.sidebar-item').forEach(el => {
        if (el.querySelector('span')?.textContent === bucketId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
      vscode.postMessage({ type: 'switchR2Bucket', bucketId });
    }

    function switchR2Tab(tabName) {
      document.querySelectorAll('#r2ViewWrapper .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
      });
      document.querySelectorAll('#r2ViewWrapper .tab-content').forEach(pane => {
        pane.classList.toggle('active', pane.id === 'tab-' + tabName);
      });
      if (tabName === 'r2-objects') {
        refreshR2Objects();
      }
    }

    function renderR2BucketOverview(bucketInfo, summary) {
      document.getElementById('currentBucketName').textContent = bucketInfo.bucketName || bucketInfo.name;
      document.getElementById('currentBucketBindingBadge').textContent = 'Binding: ' + (bucketInfo.wranglerBinding || 'None');

      const sizeFormatted = formatBytes(summary?.totalSizeBytes || 0);
      document.getElementById('navStat1').textContent = 'Size: ' + sizeFormatted;
      document.getElementById('navStat2').textContent = 'Objects: ' + (summary?.totalObjects || 0);

      document.getElementById('overviewTotalObjects').textContent = summary?.totalObjects || 0;
      document.getElementById('overviewTotalSize').textContent = sizeFormatted;
      document.getElementById('overviewImageCount').textContent = summary?.imageCount || 0;

      document.getElementById('overviewBucketName').textContent = bucketInfo.bucketName;
      document.getElementById('overviewBinding').textContent = bucketInfo.wranglerBinding || 'N/A';
      document.getElementById('overviewProjectPath').textContent = bucketInfo.projectPath;
      document.getElementById('overviewBlobsPath').textContent = bucketInfo.blobsDir;
      document.getElementById('overviewSqlitePath').textContent = bucketInfo.sqlitePath || 'N/A';
    }

    function refreshR2Objects() {
      vscode.postMessage({
        type: 'getR2Objects',
        page: r2CurrentPage,
        pageSize: r2PageSize,
        searchQuery: r2SearchQuery,
        filterType: r2FilterType,
        sortColumn: r2SortColumn,
        sortOrder: r2SortOrder
      });
    }

    function renderR2Objects(msg) {
      r2CurrentObjects = msg.objects || [];
      const grid = document.getElementById('r2GalleryGrid');
      const tableBody = document.getElementById('r2TableBody');
      grid.innerHTML = '';
      tableBody.innerHTML = '';

      if (msg.summary) {
        document.getElementById('navStat1').textContent = 'Size: ' + formatBytes(msg.summary.totalSizeBytes || 0);
        document.getElementById('navStat2').textContent = 'Objects: ' + (msg.summary.totalObjects || 0);
      }

      if (r2CurrentObjects.length === 0) {
        const emptyHtml = \`
          <div class="empty-state" style="grid-column: 1 / -1; padding: 48px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            <div>No objects found in this bucket</div>
            <button class="btn btn-cf btn-sm" onclick="switchR2Tab('r2-upload')">Upload an Object</button>
          </div>
        \`;
        grid.innerHTML = emptyHtml;
        tableBody.innerHTML = \`<tr><td colspan="7" style="text-align:center; padding: 32px; color: #888;">No objects found</td></tr>\`;
      } else {
        r2CurrentObjects.forEach(obj => {
          // Render Grid Card
          const card = document.createElement('div');
          card.className = 'r2-card';
          card.onclick = () => openR2ObjectInspector(obj.key);

          const ext = obj.key.split('.').pop()?.toUpperCase() || 'FILE';
          const sizeStr = formatBytes(obj.size);
          const dateStr = new Date(obj.uploaded).toLocaleDateString();

          let previewContent = '';
          if (obj.isImage && obj.thumbnailUrl) {
            previewContent = \`<img src="\${obj.thumbnailUrl}" alt="\${escapeHtml(obj.key)}">\`;
          } else {
            previewContent = \`
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            \`;
          }

          card.innerHTML = \`
            <div class="r2-card-preview">
              \${previewContent}
              <div class="r2-card-badge">\${ext}</div>
            </div>
            <div class="r2-card-body">
              <div class="r2-card-key" title="\${escapeHtml(obj.key)}">\${escapeHtml(obj.key)}</div>
              <div class="r2-card-meta">
                <span>\${sizeStr}</span>
                <span>\${dateStr}</span>
              </div>
              <div class="r2-card-actions" onclick="event.stopPropagation()">
                <button class="btn btn-secondary btn-sm btn-icon" onclick="openR2ObjectInspector('\${escapeHtml(obj.key)}')" title="Inspect">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>
                <button class="btn btn-secondary btn-sm btn-icon" onclick="exportR2Object('\${escapeHtml(obj.key)}')" title="Download">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="deleteR2ObjectConfirm('\${escapeHtml(obj.key)}')" title="Delete">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          \`;
          grid.appendChild(card);

          // Render Table Row
          const tr = document.createElement('tr');
          tr.onclick = () => openR2ObjectInspector(obj.key);
          tr.style.cursor = 'pointer';

          let thumbHtml = '';
          if (obj.isImage && obj.thumbnailUrl) {
            thumbHtml = \`<div class="table-thumb"><img src="\${obj.thumbnailUrl}" alt=""></div>\`;
          } else {
            thumbHtml = \`<div class="table-thumb"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>\`;
          }

          tr.innerHTML = \`
            <td>\${thumbHtml}</td>
            <td style="font-weight:600;" title="\${escapeHtml(obj.key)}">\${escapeHtml(obj.key)}</td>
            <td><code>\${obj.mimeType}</code></td>
            <td>\${sizeStr}</td>
            <td>\${new Date(obj.uploaded).toLocaleString()}</td>
            <td><code style="font-size:10px;">\${obj.etag.substring(0, 10)}...</code></td>
            <td onclick="event.stopPropagation()">
              <button class="btn btn-secondary btn-sm" onclick="openR2ObjectInspector('\${escapeHtml(obj.key)}')" title="Inspect">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
              <button class="btn btn-secondary btn-sm" onclick="exportR2Object('\${escapeHtml(obj.key)}')" title="Download">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteR2ObjectConfirm('\${escapeHtml(obj.key)}')" title="Delete">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </td>
          \`;
          tableBody.appendChild(tr);
        });
      }

      document.getElementById('r2PaginationInfo').textContent = \`Showing \${r2CurrentObjects.length} of \${msg.totalObjects} objects\`;
      document.getElementById('r2PageNumberDisplay').textContent = \`Page \${msg.page} / \${msg.totalPages}\`;
      document.getElementById('btnR2PrevPage').disabled = msg.page <= 1;
      document.getElementById('btnR2NextPage').disabled = msg.page >= msg.totalPages;
    }

    function setR2ViewMode(mode) {
      r2ViewMode = mode;
      document.getElementById('r2ViewGridBtn').classList.toggle('active', mode === 'grid');
      document.getElementById('r2ViewTableBtn').classList.toggle('active', mode === 'table');
      document.getElementById('r2GalleryGrid').style.display = mode === 'grid' ? 'grid' : 'none';
      document.getElementById('r2TableView').style.display = mode === 'table' ? 'block' : 'none';
    }

    function setR2FilterType(type) {
      r2FilterType = type;
      document.getElementById('r2PillAll').classList.toggle('active', type === 'all');
      document.getElementById('r2PillImages').classList.toggle('active', type === 'images');
      document.getElementById('r2PillOther').classList.toggle('active', type === 'other');
      r2CurrentPage = 1;
      refreshR2Objects();
    }

    function changeR2Sort(val) {
      const parts = val.split('_');
      r2SortColumn = parts[0];
      r2SortOrder = parts[1];
      r2CurrentPage = 1;
      refreshR2Objects();
    }

    function executeR2Search() {
      r2SearchQuery = document.getElementById('r2SearchInput').value;
      r2CurrentPage = 1;
      refreshR2Objects();
    }

    function clearR2Search() {
      document.getElementById('r2SearchInput').value = '';
      r2SearchQuery = '';
      r2CurrentPage = 1;
      refreshR2Objects();
    }

    function prevR2Page() {
      if (r2CurrentPage > 1) { r2CurrentPage--; refreshR2Objects(); }
    }

    function nextR2Page() {
      r2CurrentPage++;
      refreshR2Objects();
    }

    function changeR2PageSize(val) {
      r2PageSize = parseInt(val, 10);
      r2CurrentPage = 1;
      refreshR2Objects();
    }

    // ==========================================
    // Image & Metadata Inspector
    // ==========================================
    function openR2ObjectInspector(key) {
      vscode.postMessage({ type: 'getR2ObjectDetails', key });
    }

    function populateInspectorDetails(msg) {
      if (!msg.object) {
        alert(msg.error || 'Object could not be loaded');
        return;
      }

      currentInspectorObject = msg.object;
      currentInspectorDataUri = msg.dataUri || msg.object.thumbnailUrl || '';
      currentInspectorZoom = 1;

      document.getElementById('inspectorTitleKey').textContent = msg.object.key;
      document.getElementById('inspMetaKey').textContent = msg.object.key;
      document.getElementById('inspMetaBlobId').textContent = msg.object.blobId;
      document.getElementById('inspMetaDiskPath').textContent = msg.blobPath || 'Stored in blobs directory';
      document.getElementById('inspMetaSize').textContent = \`\${formatBytes(msg.object.size)} (\${msg.object.size} bytes)\`;
      document.getElementById('inspMetaMime').textContent = msg.object.mimeType;
      document.getElementById('inspMetaUploaded').textContent = new Date(msg.object.uploaded).toLocaleString();
      document.getElementById('inspMetaEtag').textContent = msg.object.etag;

      const imgEl = document.getElementById('inspectorImage');
      const placeholder = document.getElementById('inspectorNonImagePlaceholder');
      const zoomBar = document.getElementById('inspectorZoomBar');

      if (msg.object.isImage && currentInspectorDataUri) {
        imgEl.style.display = 'block';
        imgEl.src = currentInspectorDataUri;
        placeholder.style.display = 'none';
        zoomBar.style.display = 'flex';

        imgEl.onload = () => {
          document.getElementById('inspMetaDimensions').textContent = \`\${imgEl.naturalWidth} \u00D7 \${imgEl.naturalHeight} px\`;
        };
      } else {
        imgEl.style.display = 'none';
        placeholder.style.display = 'flex';
        zoomBar.style.display = 'none';
        document.getElementById('inspMetaDimensions').textContent = 'N/A (Non-image)';
      }

      // HTTP Metadata
      const httpList = document.getElementById('inspHttpMetaList');
      httpList.innerHTML = '';
      const httpKeys = Object.keys(msg.object.httpMetadata || {});
      if (httpKeys.length === 0) {
        httpList.innerHTML = '<div style="color:#777; font-size:11px;">No HTTP headers set</div>';
      } else {
        httpKeys.forEach(k => {
          const row = document.createElement('div');
          row.className = 'meta-row';
          row.innerHTML = \`<span class="meta-label">\${k}:</span><span class="meta-val">\${msg.object.httpMetadata[k]}</span>\`;
          httpList.appendChild(row);
        });
      }

      // Custom Metadata
      const customList = document.getElementById('inspCustomMetaList');
      customList.innerHTML = '';
      const customKeys = Object.keys(msg.object.customMetadata || {});
      if (customKeys.length === 0) {
        customList.innerHTML = '<div style="color:#777; font-size:11px;">No custom metadata attached</div>';
      } else {
        customKeys.forEach(k => {
          const row = document.createElement('div');
          row.className = 'meta-row';
          row.innerHTML = \`<span class="meta-label">\${k}:</span><span class="meta-val">\${msg.object.customMetadata[k]}</span>\`;
          customList.appendChild(row);
        });
      }

      resetInspectorZoom();
      document.getElementById('inspectorModal').classList.add('active');
    }

    function zoomInspectorImage(delta) {
      currentInspectorZoom = Math.max(0.25, Math.min(4, currentInspectorZoom + delta));
      const img = document.getElementById('inspectorImage');
      img.style.transform = \`scale(\${currentInspectorZoom})\`;
      document.getElementById('inspectorZoomDisplay').textContent = Math.round(currentInspectorZoom * 100) + '%';
    }

    function resetInspectorZoom() {
      currentInspectorZoom = 1;
      const img = document.getElementById('inspectorImage');
      img.style.transform = 'scale(1)';
      document.getElementById('inspectorZoomDisplay').textContent = '100%';
    }

    function copyInspectorDataUri() {
      if (!currentInspectorDataUri) return alert('No Data URI available');
      navigator.clipboard.writeText(currentInspectorDataUri);
      alert('Base64 Data URI copied to clipboard!');
    }

    function copyInspectorKey() {
      if (!currentInspectorObject) return;
      navigator.clipboard.writeText(currentInspectorObject.key);
      alert('Key copied to clipboard: ' + currentInspectorObject.key);
    }

    function exportInspectorObject() {
      if (!currentInspectorObject) return;
      vscode.postMessage({ type: 'exportR2Object', key: currentInspectorObject.key });
    }

    function exportR2Object(key) {
      vscode.postMessage({ type: 'exportR2Object', key });
    }

    function deleteInspectorObject() {
      if (!currentInspectorObject) return;
      if (!confirm(\`Are you sure you want to delete "\${currentInspectorObject.key}"?\`)) return;
      vscode.postMessage({ type: 'deleteR2Object', key: currentInspectorObject.key });
      closeModal('inspectorModal');
    }

    function deleteR2ObjectConfirm(key) {
      if (!confirm(\`Are you sure you want to delete "\${key}"?\`)) return;
      vscode.postMessage({ type: 'deleteR2Object', key });
    }

    // ==========================================
    // R2 Upload Handling
    // ==========================================
    function triggerFilePicker() {
      vscode.postMessage({ type: 'pickFileToUpload' });
    }

    function handleFileSelectedForUpload(msg) {
      pendingUploadData = msg;
      document.getElementById('uploadConfigCard').style.display = 'block';
      document.getElementById('uploadKeyInput').value = msg.fileName;
      document.getElementById('uploadMimeInput').value = msg.contentType;

      const previewContainer = document.getElementById('uploadImagePreviewContainer');
      const previewImg = document.getElementById('uploadImagePreview');

      if (msg.contentType.startsWith('image/')) {
        previewContainer.style.display = 'block';
        previewImg.src = \`data:\${msg.contentType};base64,\${msg.base64Data}\`;
      } else {
        previewContainer.style.display = 'none';
      }
    }

    function cancelUpload() {
      pendingUploadData = null;
      document.getElementById('uploadConfigCard').style.display = 'none';
    }

    function submitUpload() {
      if (!pendingUploadData) return;
      const key = document.getElementById('uploadKeyInput').value.trim();
      const contentType = document.getElementById('uploadMimeInput').value.trim();
      let customMetadata = {};

      const rawCustom = document.getElementById('uploadCustomMetaInput').value.trim();
      if (rawCustom) {
        try {
          customMetadata = JSON.parse(rawCustom);
        } catch (e) {
          return alert('Invalid JSON in Custom Metadata field');
        }
      }

      if (!key) return alert('Object key is required');

      vscode.postMessage({
        type: 'uploadR2Object',
        key,
        base64Data: pendingUploadData.base64Data,
        contentType,
        customMetadata
      });

      cancelUpload();
      switchR2Tab('r2-objects');
    }

    // ==========================================
    // Utilities & Helpers
    // ==========================================
    function filterSidebarList(query) {
      const q = query.toLowerCase();
      document.querySelectorAll('.sidebar-item').forEach(el => {
        const text = el.querySelector('span')?.textContent.toLowerCase() || '';
        el.style.display = text.includes(q) ? 'flex' : 'none';
      });
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2) + ' ' + sizes[i];
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  </script>
</body>
</html>`;
}
