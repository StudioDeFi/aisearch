import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    GATEWAY_URL: process.env.GATEWAY_URL ?? 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/gateway/:path*',
        destination: `${process.env.GATEWAY_URL ?? 'http://localhost:3001'}/:path*`,
      },
    ]
  },
}

export default nextConfig
