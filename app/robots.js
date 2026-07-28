export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "TikTokSpider",
        allow: "/",
      },
    ],
    host: "https://www.jrivecontent.com",
  };
}
