export function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>D1 Explorer</title>
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
      height: 48px;
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
    }
    .nav-brand svg { width: 20px; height: 20px; stroke: var(--primary-color); fill: none; }
    .db-selector-group {
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
      gap: 12px;
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
    }
    .btn:hover { background: var(--primary-hover); }
    .btn-secondary {
      background: var(--secondary-bg);
      color: var(--fg-color);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover { background: var(--hover-bg); }
    .btn-danger { background: var(--danger-color); color: #fff; }
    .btn-danger:hover { opacity: 0.9; }
    .btn-sm { padding: 3px 8px; font-size: 11px; }

    /* Main Container */
    .main-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Left Sidebar: Tables List */
    .sidebar {
      width: 240px;
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
    .tables-list {
      flex: 1;
      overflow-y: auto;
      list-style: none;
    }
    .table-item {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      transition: background 0.15s ease;
    }
    .table-item:hover { background: var(--hover-bg); }
    .table-item.active { background: var(--active-bg); font-weight: 600; }
    .table-name-group {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .table-badge {
      background: var(--badge-bg);
      color: var(--badge-fg);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
    }

    /* Right Workspace Content */
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
    .table-headline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .table-headline h2 {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
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
    }
    table.data-table tr:hover { background: var(--hover-bg); }

    /* Control Bar above table */
    .table-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      gap: 12px;
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      flex-shrink: 0;
    }

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

    /* Form Layout for Insert / Edit */
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

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }
    .modal-overlay.active { display: flex; }
    .modal-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: 500px;
      max-width: 90vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
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
    }
    .modal-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* Code & Output Box */
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
    }
    .empty-state svg { width: 48px; height: 48px; stroke: #555; }
  </style>
</head>
<body>

  <!-- Top Navbar -->
  <div class="navbar">
    <div class="nav-brand">
      <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
      <span>Cloudflare D1 Explorer</span>
    </div>

    <div class="db-selector-group">
      <label style="font-size: 11px; font-weight:600;">Database:</label>
      <select id="dbSelect" class="select-input" onchange="switchDatabase(this.value)">
        <option value="">Scanning databases...</option>
      </select>
      <button class="btn btn-secondary btn-sm" onclick="refreshDatabases()" title="Rescan D1 databases">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        Refresh
      </button>
    </div>

    <div class="nav-stats">
      <div class="stat-badge" id="dbSizeBadge">Size: 0 KB</div>
      <div class="stat-badge" id="tableCountBadge">Tables: 0</div>
      <button class="btn btn-secondary btn-sm" onclick="exportFullSqlDump()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Export Dump
      </button>
    </div>
  </div>

  <!-- Main Container -->
  <div class="main-container">
    
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span>Tables</span>
          <span id="tablesBadge" style="font-size: 10px; opacity: 0.7;">0</span>
        </div>
        <input type="text" id="tableFilterInput" class="text-input" placeholder="Filter tables..." oninput="filterSidebarTables(this.value)">
      </div>
      <ul id="tablesList" class="tables-list">
        <!-- Populated via JS -->
      </ul>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      
      <!-- Content Header & Tabs -->
      <div class="content-header">
        <div class="table-headline">
          <h2 id="currentTableName">Select a Table</h2>
          <div>
            <button class="btn btn-secondary btn-sm" onclick="openNewTableModal()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Table
            </button>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn active" data-tab="browse" onclick="switchTab('browse')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
            Browse
          </button>
          <button class="tab-btn" data-tab="structure" onclick="switchTab('structure')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            Structure
          </button>
          <button class="tab-btn" data-tab="sql" onclick="switchTab('sql')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            SQL Console
          </button>
          <button class="tab-btn" data-tab="insert" onclick="switchTab('insert')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Insert Row
          </button>
          <button class="tab-btn" data-tab="export" onclick="switchTab('export')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export / Import
          </button>
        </div>
      </div>

      <!-- Tab Panes -->

      <!-- 1. BROWSE TAB -->
      <div id="tab-browse" class="tab-content active">
        <div class="table-controls">
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="browseSearchInput" class="text-input" placeholder="Search rows..." style="width: 240px;" onkeydown="if(event.key==='Enter') executeRowSearch()">
            <button class="btn btn-secondary btn-sm" onclick="executeRowSearch()">Filter</button>
            <button class="btn btn-secondary btn-sm" onclick="clearRowSearch()">Clear</button>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 11px; opacity: 0.7;">Per page:</span>
            <select id="pageSizeSelect" class="select-input" onchange="changePageSize(this.value)">
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
          <span id="paginationInfo" style="font-size: 12px; opacity: 0.8;">Showing 0 of 0 records</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" id="btnPrevPage" onclick="prevPage()">&laquo; Previous</button>
            <span id="pageNumberDisplay" style="padding: 4px 8px; font-weight: 600;">Page 1 / 1</span>
            <button class="btn btn-secondary btn-sm" id="btnNextPage" onclick="nextPage()">Next &raquo;</button>
          </div>
        </div>
      </div>

      <!-- 2. STRUCTURE TAB -->
      <div id="tab-structure" class="tab-content">
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

      <!-- 3. SQL CONSOLE TAB -->
      <div id="tab-sql" class="tab-content">
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

      <!-- 4. INSERT ROW TAB -->
      <div id="tab-insert" class="tab-content">
        <div style="max-width: 600px;">
          <h3 style="margin-bottom: 16px;">Insert New Record into <span id="insertTableNameHeader">Table</span></h3>
          <form id="insertRowForm" onsubmit="submitInsertRow(event)">
            <div id="insertFormFields"></div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <button type="submit" class="btn">Save Record</button>
              <button type="button" class="btn btn-secondary" onclick="switchTab('browse')">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 5. EXPORT / IMPORT TAB -->
      <div id="tab-export" class="tab-content">
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
  </div>

  <!-- Edit Row Modal -->
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

  <!-- New Table Modal -->
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

    let currentDbPath = '';
    let currentTable = '';
    let currentPage = 1;
    let currentPageSize = 25;
    let currentSortColumn = '';
    let currentSortOrder = 'ASC';
    let currentSearchQuery = '';
    let currentTableColumns = [];
    let editingRowPk = null;

    // Listen to backend messages
    window.addEventListener('message', event => {
      const msg = event.data;
      switch (msg.type) {
        case 'setDatabases':
          renderDatabaseSelect(msg.databases, msg.selectedPath);
          break;
        case 'setTables':
          renderSidebarTables(msg.tables);
          break;
        case 'setTableData':
          renderBrowseData(msg);
          break;
        case 'setTableStructure':
          renderTableStructure(msg);
          break;
        case 'setQueryResult':
          renderQueryResult(msg);
          break;
        case 'operationSuccess':
          if (msg.message) alert(msg.message);
          refreshCurrentTab();
          break;
        case 'operationError':
          alert('Error: ' + msg.error);
          break;
      }
    });

    function switchDatabase(dbPath) {
      if (!dbPath) return;
      currentDbPath = dbPath;
      vscode.postMessage({ type: 'switchDatabase', dbPath });
    }

    function refreshDatabases() {
      vscode.postMessage({ type: 'refreshDatabases' });
    }

    function renderDatabaseSelect(databases, selectedPath) {
      const select = document.getElementById('dbSelect');
      select.innerHTML = '';
      if (!databases || databases.length === 0) {
        select.innerHTML = '<option value="">No D1 databases found</option>';
        return;
      }

      databases.forEach(db => {
        const opt = document.createElement('option');
        opt.value = db.filePath;
        opt.textContent = db.name;
        if (db.filePath === selectedPath) opt.selected = true;
        select.appendChild(opt);
      });

      if (selectedPath) currentDbPath = selectedPath;
    }

    function renderSidebarTables(tables) {
      const list = document.getElementById('tablesList');
      list.innerHTML = '';
      document.getElementById('tablesBadge').textContent = tables.length;
      document.getElementById('tableCountBadge').textContent = 'Tables: ' + tables.length;

      if (tables.length === 0) {
        list.innerHTML = '<li class="empty-state" style="padding:16px;">No tables found</li>';
        return;
      }

      tables.forEach(t => {
        const li = document.createElement('li');
        li.className = 'table-item' + (t.name === currentTable ? ' active' : '');
        li.onclick = () => selectTable(t.name);
        li.innerHTML = \`
          <div class="table-name-group">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
            <span>\${t.name}</span>
          </div>
          <span class="table-badge">\${t.rowCount}</span>
        \`;
        list.appendChild(li);
      });

      if (!currentTable && tables.length > 0) {
        selectTable(tables[0].name);
      }
    }

    function selectTable(tableName) {
      currentTable = tableName;
      currentPage = 1;
      document.getElementById('currentTableName').textContent = tableName;
      document.getElementById('insertTableNameHeader').textContent = tableName;
      
      // Update sidebar active state
      document.querySelectorAll('.table-item').forEach(el => {
        if (el.querySelector('span')?.textContent === tableName) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });

      refreshCurrentTab();
    }

    function switchTab(tabName) {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
      });
      document.querySelectorAll('.tab-content').forEach(pane => {
        pane.classList.toggle('active', pane.id === 'tab-' + tabName);
      });

      refreshCurrentTab();
    }

    function refreshCurrentTab() {
      const activeTabBtn = document.querySelector('.tab-btn.active');
      const tab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'browse';

      if (!currentTable) return;

      if (tab === 'browse') {
        vscode.postMessage({
          type: 'getTableData',
          tableName: currentTable,
          page: currentPage,
          pageSize: currentPageSize,
          sortColumn: currentSortColumn,
          sortOrder: currentSortOrder,
          searchQuery: currentSearchQuery
        });
      } else if (tab === 'structure' || tab === 'insert') {
        vscode.postMessage({
          type: 'getTableStructure',
          tableName: currentTable
        });
      }
    }

    function renderBrowseData(msg) {
      const headerRow = document.getElementById('browseTableHeader');
      const body = document.getElementById('browseTableBody');
      headerRow.innerHTML = '';
      body.innerHTML = '';

      currentTableColumns = msg.columns;

      // Action column header
      const thAction = document.createElement('th');
      thAction.style.width = '80px';
      thAction.textContent = 'Actions';
      headerRow.appendChild(thAction);

      msg.columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col + (currentSortColumn === col ? (currentSortOrder === 'ASC' ? ' ▲' : ' ▼') : '');
        th.onclick = () => {
          if (currentSortColumn === col) {
            currentSortOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
          } else {
            currentSortColumn = col;
            currentSortOrder = 'ASC';
          }
          refreshCurrentTab();
        };
        headerRow.appendChild(th);
      });

      if (!msg.rows || msg.rows.length === 0) {
        body.innerHTML = \`<tr><td colspan="\${msg.columns.length + 1}" style="text-align:center; padding: 24px; color: #888;">No rows found in table</td></tr>\`;
      } else {
        msg.rows.forEach(rowValues => {
          const tr = document.createElement('tr');
          
          // Row Action Buttons
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

      // Pagination
      document.getElementById('paginationInfo').textContent = \`Showing \${msg.rows.length} of \${msg.totalRows} records\`;
      document.getElementById('pageNumberDisplay').textContent = \`Page \${msg.page} / \${msg.totalPages}\`;
      document.getElementById('btnPrevPage').disabled = msg.page <= 1;
      document.getElementById('btnNextPage').disabled = msg.page >= msg.totalPages;
    }

    function renderTableStructure(msg) {
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

      // Also generate insert form fields if active tab is insert
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
        if (value !== '') {
          rowData[key] = value;
        }
      }
      vscode.postMessage({
        type: 'insertRow',
        tableName: currentTable,
        rowData
      });
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
      currentTableColumns.forEach((col, idx) => {
        pkMap[col] = rowValues[idx];
      });

      vscode.postMessage({
        type: 'deleteRow',
        tableName: currentTable,
        primaryKeyMap: pkMap
      });
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

      vscode.postMessage({
        type: 'executeSql',
        sql
      });
    }

    function renderQueryResult(msg) {
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

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    function filterSidebarTables(query) {
      const q = query.toLowerCase();
      document.querySelectorAll('.table-item').forEach(el => {
        const text = el.querySelector('span')?.textContent.toLowerCase() || '';
        el.style.display = text.includes(q) ? 'flex' : 'none';
      });
    }

    function executeRowSearch() {
      currentSearchQuery = document.getElementById('browseSearchInput').value;
      currentPage = 1;
      refreshCurrentTab();
    }

    function clearRowSearch() {
      document.getElementById('browseSearchInput').value = '';
      currentSearchQuery = '';
      currentPage = 1;
      refreshCurrentTab();
    }

    function prevPage() {
      if (currentPage > 1) {
        currentPage--;
        refreshCurrentTab();
      }
    }

    function nextPage() {
      currentPage++;
      refreshCurrentTab();
    }

    function changePageSize(val) {
      currentPageSize = parseInt(val, 10);
      currentPage = 1;
      refreshCurrentTab();
    }
  </script>
</body>
</html>`;
}
