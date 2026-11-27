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
      // Signing up starts with the app link. A sign-up address that says why
      // it was opened (an invite, a saved plan, a creator) still shows the form.
      {
        source: "/signup",
        missing: [
          { type: "query", key: "role" },
          { type: "query", key: "next" },
          { type: "query", key: "error" },
        ],
        destination: "/start",
        permanent: false,
      },
      // The old "brand or creator?" screen.
      { source: "/choose-role", destination: "/start", permanent: false },
    ];
  },
};

module.exports = nextConfig;
