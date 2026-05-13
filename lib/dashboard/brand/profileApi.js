// Client-side helper for the Settings → Profile tab.

export async function updateBrandProfile(patch) {
  const res = await fetch("/api/brand/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not save profile.");
  return data;
}
