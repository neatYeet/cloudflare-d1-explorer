const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').Plugin} */
const copyWasmPlugin = {
  name: 'copy-wasm',
  setup(build) {
    build.onEnd(() => {
      const wasmSource = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
      const wasmDestDir = path.join(__dirname, 'dist');
      const wasmDest = path.join(wasmDestDir, 'sql-wasm.wasm');
      if (!fs.existsSync(wasmDestDir)) {
        fs.mkdirSync(wasmDestDir, { recursive: true });
      }
      if (fs.existsSync(wasmSource)) {
        fs.copyFileSync(wasmSource, wasmDest);
        console.log('Copied sql-wasm.wasm to dist/');
      }
    });
  }
};

async function main() {
  const extensionCtx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: false,
    sourcemap: true,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    plugins: [copyWasmPlugin],
  });

  const mcpCtx = await esbuild.context({
    entryPoints: ['src/mcp.ts'],
    bundle: true,
    format: 'cjs',
    minify: false,
    sourcemap: true,
    platform: 'node',
    outfile: 'dist/mcp.js',
    banner: {
      js: '#!/usr/bin/env node\n',
    },
    external: ['vscode'],
  });

  if (watch) {
    await extensionCtx.watch();
    await mcpCtx.watch();
    console.log('Watching for changes in extension and MCP server...');
  } else {
    await extensionCtx.rebuild();
    await extensionCtx.dispose();
    await mcpCtx.rebuild();
    await mcpCtx.dispose();
    console.log('Build completed successfully for extension and MCP server.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
