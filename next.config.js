/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['replicate.delivery', 'pbxt.replicate.delivery'],
  },
}

module.exports = nextConfig 