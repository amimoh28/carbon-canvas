/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript source; Next transpiles them.
  transpilePackages: ["@carbon-canvas/estimation", "@carbon-canvas/schema"],
};

export default nextConfig;
