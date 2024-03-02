const { defineConfig } = require('eslint-define-config')
const base = require('./base')

module.exports = defineConfig({
  ...base,
  plugins: [...base.plugins, 'react-hooks'],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    browser: true,
  },
})
