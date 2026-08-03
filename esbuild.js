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
  const ctx = await esbuild.context({
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

  if (watch) {
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Build completed successfully.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
