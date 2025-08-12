/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['@prisma/client'],
  webpack: (config, { isServer }) => {
    // Only externalize socket.io-client on the server side
    if (isServer) {
      config.externals = [...config.externals, 'socket.io-client']
    }
    return config
  },
}

export default config