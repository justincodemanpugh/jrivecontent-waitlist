/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // The homepage lived here while it was being built.
      { source: "/viral", destination: "/", permanent: true },
    ];
  },
};

module.exports = nextConfig;
