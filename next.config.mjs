/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', '@napi-rs/canvas', 'pdfjs-dist'],
  },
  webpack: (config, { isServer }) => {
    config.cache = {
      type: 'filesystem',
      maxMemoryGenerations: 0,
    };
    return config;
  },
};

export default nextConfig;
