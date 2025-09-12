/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Next.js resolves workspace root correctly when multiple lockfiles exist
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
