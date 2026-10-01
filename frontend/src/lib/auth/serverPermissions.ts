import { getServerApiBaseUrl } from '@/lib/serverApiBase';
import { unwrapApiData } from '@/lib/apiResponse';

/**
 * ดึง permissions ของผู้ใช้จาก Backend อย่างเป็นทางการ (Server-Side)
 * โดยใช้ accessToken ที่อยู่ใน session
 */
export async function fetchServerPermissions(accessToken?: string): Promise<string[] | null> {
  if (!accessToken) return null;

  const apiBase = getServerApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/roles/me/permissions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const raw = await res.json().catch(() => null);
    const data = unwrapApiData<{ permissions?: string[] }>(raw);
    return Array.isArray(data?.permissions) ? data.permissions : [];
  } catch (error) {
    console.error('[fetchServerPermissions] Failed to fetch server permissions', error);
    return null;
  }
}
