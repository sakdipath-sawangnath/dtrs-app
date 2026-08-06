import packageJson from "../../package.json";

export type AppMeta = {
  appName: string;
  companyName: string;
  version: string;
};

function firstNonEmpty(...values: Array<string | undefined | null>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

const packageVersion = firstNonEmpty(packageJson.version) ?? "0.1.0";

/** Version badge SoT: NEXT_PUBLIC_APP_VERSION → frontend/package.json (never DB). */
export const FOOTER_ENV_FALLBACK: AppMeta = {
  appName: firstNonEmpty(process.env.NEXT_PUBLIC_APP_NAME, "ระบบแจ้งซ่อม") ?? "ระบบแจ้งซ่อม",
  companyName:
    firstNonEmpty(process.env.NEXT_PUBLIC_COMPANY_NAME, "Forth Co., Ltd.") ?? "Forth Co., Ltd.",
  version: firstNonEmpty(process.env.NEXT_PUBLIC_APP_VERSION, packageVersion) ?? packageVersion,
};

/**
 * Resolve footer meta. `input` may supply appName/companyName (e.g. from DB).
 * `input.version` is ignored — product version comes only from env / package.json.
 */
export function resolveFooterAppMeta(input?: Partial<AppMeta> | null): AppMeta {
  return {
    appName: firstNonEmpty(input?.appName, FOOTER_ENV_FALLBACK.appName) ?? FOOTER_ENV_FALLBACK.appName,
    companyName:
      firstNonEmpty(input?.companyName, FOOTER_ENV_FALLBACK.companyName) ?? FOOTER_ENV_FALLBACK.companyName,
    version: FOOTER_ENV_FALLBACK.version,
  };
}

export function formatAppVersionBadge(version: string): string {
  const trimmed = version.trim();
  if (!trimmed) return "";
  return /^v/i.test(trimmed) ? trimmed : `v${trimmed}`;
}
