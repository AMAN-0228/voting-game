/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['@prisma/client'],
  eslint: {
    ignoreDuringBuilds: true, // ✅ skip ESLint errors during next build
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ skip TS errors during next build
  },

  webpack: (config, { isServer }) => {
    // Only externalize socket.io-client on the server side
    if (isServer) {
      config.externals = [...config.externals, 'socket.io-client']
    }
    return config
  },
}

export default config