import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PPR is now enabled via cacheComponents in Next.js 16+
  cacheComponents: true,
  turbopack: {
    // Ensure Turbopack treats the repo root as the project root.
    root: path.resolve(__dirname)
  }
};

export default nextConfig;
