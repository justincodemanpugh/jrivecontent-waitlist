// Sitemap for the public marketing surface. The creator directory used to be
// listed here; it moved behind the brand dashboard in migration 0043, and
// /creators/opt-out is deliberately excluded (noindex, see app/robots.js).
const BASE = "https://www.jrivecontent.com";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
