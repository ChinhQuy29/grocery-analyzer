/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "bcrypt", "@google/generative-ai"],
  },
  webpack: (config) => {
    // This is needed for bcrypt to work with Next.js
    config.externals = [...config.externals, "bcrypt"];
    return config;
  },
  images: {
    domains: ['placeholder.com'],
  },
};

export default nextConfig;

