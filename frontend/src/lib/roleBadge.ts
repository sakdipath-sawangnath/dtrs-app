export type RoleBadgePalette = {
  textColor: string;
  bgColor: string;
};

export type RoleBadgeStyleRow = {
  code: string;
  name?: string | null;
  badgeTextColor?: string | null;
  badgeBgColor?: string | null;
};

export type RoleBadgeStyleMap = Record<string, RoleBadgePalette>;

export const DEFAULT_ROLE_BADGE_STYLE_BY_CODE: RoleBadgeStyleMap = {
  ADMIN: { textColor: "#DBEAFE", bgColor: "#1E3A8A" },
  STAFF: { textColor: "#DCFCE7", bgColor: "#166534" },
  USER: { textColor: "#FFEDD5", bgColor: "#9A3412" },
  SUPERVISOR: { textColor: "#E0E7FF", bgColor: "#3730A3" },
};

const DEFAULT_FALLBACK_BADGE: RoleBadgePalette = {
  textColor: "#E2E8F0",
  bgColor: "#334155",
};

export function normalizeHexColorOrNull(input?: string | null): string | null {
  if (input == null) return null;
  const v = String(input).trim();
  if (!v) return null;
  const hex = v.startsWith("#") ? v : `#${v}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return hex.toUpperCase();
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColorOrNull(hex) ?? "#64748B";
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function buildRoleBadgeStyleMap(rows: RoleBadgeStyleRow[]): RoleBadgeStyleMap {
  const map: RoleBadgeStyleMap = { ...DEFAULT_ROLE_BADGE_STYLE_BY_CODE };
  for (const row of rows || []) {
    const code = String(row?.code || "").trim().toUpperCase();
    if (!code) continue;
    const defaultStyle = map[code] ?? DEFAULT_FALLBACK_BADGE;
    map[code] = {
      textColor: normalizeHexColorOrNull(row.badgeTextColor) ?? defaultStyle.textColor,
      bgColor: normalizeHexColorOrNull(row.badgeBgColor) ?? defaultStyle.bgColor,
    };
  }
  return map;
}

export function resolveRoleBadgePalette(
  roleCode: string,
  styleMap?: RoleBadgeStyleMap | null,
): RoleBadgePalette {
  const code = String(roleCode || "").trim().toUpperCase();
  if (!code) return DEFAULT_FALLBACK_BADGE;
  if (styleMap?.[code]) return styleMap[code];
  if (DEFAULT_ROLE_BADGE_STYLE_BY_CODE[code]) return DEFAULT_ROLE_BADGE_STYLE_BY_CODE[code];
  return DEFAULT_FALLBACK_BADGE;
}
