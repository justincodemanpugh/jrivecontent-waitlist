/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // The homepage lived here while it was being built.
      { source: "/viral", destination: "/", permanent: true },
      // The old scan page. The home page link box replaced it; a link that
      // already names an app goes straight into the questions. Temporary
      // redirects, so the page can come back.
      { source: "/vibecode", has: [{ type: "query", key: "app" }], destination: "/start", permanent: false },
      { source: "/vibecode", destination: "/", permanent: false },
    ];
  },
};

module.exports = nextConfig;
