/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ['@otog/ui'],
  experimental: {
    esmExternals: 'loose',
  },
  output: 'standalone',
}
