/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000'

const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${backendUrl}/api/v1/:path*` },
      { source: '/health', destination: `${backendUrl}/health` },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
