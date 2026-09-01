// Sitemap for the public marketing surface. /creators is the reason this
// exists: it's the page meant to be found from search, and its filtered views
// are real URLs (see components/creators/DirectoryFilters.js posting via GET).
const BASE = "https://www.jrivecontent.com";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/creators`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
