/** รูปแบบมาตรฐาน backend `{ success, data: T }` — ใช้กับ axios/fetch หลัง parse JSON */
export function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

/** ดึง array จาก response /users/assignable (หลายรูปแบบ wrapper) */
export function extractAssignableArray(root: unknown): unknown[] {
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== "object") return [];
  const o = root as Record<string, unknown>;
  const data = o.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner.items)) return inner.items;
  }
  return [];
}

export function asRecord(v: unknown): Record<string, unknown> | undefined {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return undefined;
}

export function axiosErrorData(err: unknown): Record<string, unknown> | undefined {
  return asRecord((err as { response?: { data?: unknown } })?.response?.data);
}

/** ข้อความ error จาก body แบบมาตรฐาน backend (error.details / error.message / message) */
export function formatApiErrorDetail(payload: Record<string, unknown> | undefined): string | undefined {
  if (!payload) return undefined;
  const err = asRecord(payload.error);
  const detailsRaw = err?.details;
  if (Array.isArray(detailsRaw) && detailsRaw.length > 0) {
    const lines = detailsRaw.map((d) => {
      const r = asRecord(d);
      const f = typeof r?.field === "string" ? r.field : "";
      const m = typeof r?.message === "string" ? r.message : "";
      return `${f ? `${f}: ` : ""}${m}`.trim();
    }).filter(Boolean);
    if (lines.length) return lines.join("\n");
  }
  if (typeof err?.message === "string") return err.message;
  if (typeof payload.message === "string") return payload.message;
  return undefined;
}
