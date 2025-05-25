/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ['@otog/ui'],
  experimental: {
    esmExternals: 'loose',
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  output: 'standalone',
}
