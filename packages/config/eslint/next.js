const { defineConfig } = require('eslint-define-config')
const base = require('./base')

module.exports = defineConfig({
  ...base,
  plugins: [...base.plugins, 'react-hooks'],
  extends: [
    ...base.extends,
    require.resolve('@vercel/style-guide/eslint/next'),
  ],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
})
