/** ADMIN → Admin, SITE_MANAGER → Site Manager */
export function formatRoleLabel(role?: string | null): string {
  const raw = String(role ?? "").trim();
  if (!raw) return "";
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
