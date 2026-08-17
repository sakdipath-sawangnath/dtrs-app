/**
 * Helpers สำหรับ cascade จังหวัด → อำเภอ → ตำบล (lazy-load จาก /locations/*)
 */

import { unwrapApiData } from '@/lib/apiResponse';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4100/api';

export type LocationProvinceOption = {
  id: number;
  name: string;
  districtCount?: number;
};

export type LocationDistrictOption = {
  id: number;
  name: string;
  provinceId: number;
  subdistrictCount?: number;
};

export type LocationSubdistrictOption = {
  id: number;
  name: string;
  districtId: number;
};

function asArray<T>(raw: unknown): T[] {
  const payload = unwrapApiData(raw);
  return Array.isArray(payload) ? (payload as T[]) : [];
}

export async function fetchLocationProvinces(
  signal?: AbortSignal,
): Promise<LocationProvinceOption[]> {
  const r = await fetch(`${API}/locations/provinces`, {
    signal,
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`locations/provinces ${r.status}`);
  return asArray<LocationProvinceOption>(await r.json());
}

export async function fetchLocationDistricts(
  provinceId: number,
  signal?: AbortSignal,
): Promise<LocationDistrictOption[]> {
  const r = await fetch(`${API}/locations/provinces/${provinceId}/districts`, {
    signal,
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`locations/districts ${r.status}`);
  return asArray<LocationDistrictOption>(await r.json());
}

export async function fetchLocationSubdistricts(
  districtId: number,
  signal?: AbortSignal,
): Promise<LocationSubdistrictOption[]> {
  const r = await fetch(`${API}/locations/districts/${districtId}/subdistricts`, {
    signal,
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`locations/subdistricts ${r.status}`);
  return asArray<LocationSubdistrictOption>(await r.json());
}

export function sortThaiNames(a: string, b: string): number {
  return a.localeCompare(b, 'th');
}
