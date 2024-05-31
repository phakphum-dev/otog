# README

I took this Clangd Editor from https://github.com/Guyutongxue/clangd-in-browser

The `clangd.js`, `clangd.wasm`, and `clangd.worker.mjs` files were compiled on an Ubuntu 20.04 server

I modified the `main.worker.ts` to make Nextjs bundle `clangd.js` using relative path

The clangd.js was modified to import `clangd.worker.mjs` properly since locateFile is broken

```
allocateUnusedWorker() {
    var worker
    worker = new Worker(new URL('clangd.worker.mjs', import.meta.url), {
        type: 'module',
    })
    PThread.unusedWorkers.push(worker)
},
```

I also configured Nextjs to allow importing external esm, `clangd.worker.mjs`

```
// next.config.js
...
  experimental: {
    esmExternals: 'loose',
  },
```
