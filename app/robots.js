export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Utility page, not content. Also noindex'd via its own metadata.
        disallow: ["/creators/opt-out"],
      },
      {
        userAgent: "TikTokSpider",
        allow: "/",
      },
    ],
    sitemap: "https://www.jrivecontent.com/sitemap.xml",
    host: "https://www.jrivecontent.com",
  };
}
