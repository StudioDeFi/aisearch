import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // GATEWAY_URL is only needed server-side (API routes/rewrites); omit from env to avoid
  // baking the internal service URL into the client bundle and freezing it at build time.
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
