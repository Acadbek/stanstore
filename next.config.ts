import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname)
  },
  webpack: (config) => {
    config.resolve.alias['zod/v3'] = path.resolve(__dirname, 'node_modules/zod');
    return config;
  }
};

export default nextConfig;
