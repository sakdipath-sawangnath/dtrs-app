/**
 * Cascade ตัวเลือกสถานที่จาก Site (public report) — ไม่โหลด /sites ทั้งก้อน
 * GET /sites/options/provinces | districts | subdistricts | agencies | stations
 */

import { unwrapApiData } from '@/lib/apiResponse';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4100/api';

function asStringArray(raw: unknown): string[] {
  const payload = unwrapApiData(raw);
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const r = await fetch(`${API}${path}`, { signal, cache: 'no-store' });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

export async function fetchSiteOptionProvinces(
  signal?: AbortSignal,
): Promise<string[]> {
  return asStringArray(await getJson('/sites/options/provinces', signal));
}

export async function fetchSiteOptionDistricts(
  province: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const q = new URLSearchParams({ province });
  return asStringArray(
    await getJson(`/sites/options/districts?${q}`, signal),
  );
}

export async function fetchSiteOptionSubdistricts(
  province: string,
  district: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const q = new URLSearchParams({ province, district });
  return asStringArray(
    await getJson(`/sites/options/subdistricts?${q}`, signal),
  );
}

export async function fetchSiteOptionAgencies(
  province: string,
  district: string,
  subdistrict?: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const q = new URLSearchParams({ province, district });
  if (subdistrict?.trim()) q.set('subdistrict', subdistrict.trim());
  return asStringArray(
    await getJson(`/sites/options/agencies?${q}`, signal),
  );
}

export async function fetchSiteOptionStations(
  province: string,
  district: string,
  agency: string,
  subdistrict?: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const q = new URLSearchParams({ province, district, agency });
  if (subdistrict?.trim()) q.set('subdistrict', subdistrict.trim());
  return asStringArray(
    await getJson(`/sites/options/stations?${q}`, signal),
  );
}
