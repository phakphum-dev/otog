/* eslint-env node */
const { defineConfig } = require('eslint-define-config')

const base = require('@otog/config/eslint/react-internal.js')
module.exports = defineConfig({
  ...base,
  rules: { ...base.rules, 'no-redeclare': 'off' },
})
