import { defineConfig } from 'tsup'

import { findAllPackageMetadatas } from '@otog/workspace'

const noExternal = findAllPackageMetadatas()
  .map((p) => p.name)
  .filter((name) => name !== '@otog/database')

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  noExternal: noExternal,
  minify: false,
  clean: true,
  format: ['esm'],
  sourcemap: true,
  banner: {
    // This is a workaround for https://github.com/evanw/esbuild/issues/1921
    js: `const require = (await import("node:module")).createRequire(import.meta.url);
const __filename = (await import("node:url")).fileURLToPath(import.meta.url);
const __dirname = (await import("node:path")).dirname(__filename);`,
  },
})
