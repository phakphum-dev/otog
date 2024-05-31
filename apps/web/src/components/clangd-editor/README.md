# README

I took this Clangd Editor from https://github.com/Guyutongxue/clangd-in-browser

The `clangd.js`, `clangd.wasm`, and `clangd.worker.mjs` files were compiled on an Ubuntu 20.04 server

I modified the `main.worker.ts` to make Nextjs bundle `clangd.js` from main worker using relative path

I also config Nextjs to allow importing external esm (`clangd.worker.mjs`)

```
// next.config.js
...
  experimental: {
    esmExternals: 'loose',
  },
```
