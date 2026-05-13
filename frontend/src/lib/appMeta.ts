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

export const FOOTER_ENV_FALLBACK: AppMeta = {
  appName: firstNonEmpty(process.env.NEXT_PUBLIC_APP_NAME, "ระบบแจ้งซ่อม CCTV") ?? "ระบบแจ้งซ่อม CCTV",
  companyName:
    firstNonEmpty(process.env.NEXT_PUBLIC_COMPANY_NAME, "Forth Co., Ltd.") ?? "Forth Co., Ltd.",
  version: firstNonEmpty(process.env.NEXT_PUBLIC_APP_VERSION, packageVersion) ?? packageVersion,
};

export function resolveFooterAppMeta(input?: Partial<AppMeta> | null): AppMeta {
  return {
    appName: firstNonEmpty(input?.appName, FOOTER_ENV_FALLBACK.appName) ?? FOOTER_ENV_FALLBACK.appName,
    companyName:
      firstNonEmpty(input?.companyName, FOOTER_ENV_FALLBACK.companyName) ?? FOOTER_ENV_FALLBACK.companyName,
    version: firstNonEmpty(input?.version, FOOTER_ENV_FALLBACK.version) ?? FOOTER_ENV_FALLBACK.version,
  };
}

export function formatAppVersionBadge(version: string): string {
  const trimmed = version.trim();
  if (!trimmed) return "";
  return /^v/i.test(trimmed) ? trimmed : `v${trimmed}`;
}
