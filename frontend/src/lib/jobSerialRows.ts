/** เก็บใน DB เดิม: Job.oldSerialNumber + Job.newSerialNumber — แถวเดียวแบบเดิมเป็น plain text; หลายแถวเป็น JSON ใน oldSerialNumber เท่านั้น */

export const JOB_SERIAL_ROWS_MAX = 4;

export type JobSerialRowForm = {
  deviceName: string;
  oldSerial: string;
  newSerial: string;
};

/** Serial: 0–9 / A–Z / '-' */
export function normalizeSerialNumberInput(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
}

export function emptyJobSerialRow(): JobSerialRowForm {
  return { deviceName: "", oldSerial: "", newSerial: "" };
}

export function parseJobSerialRowsFromDb(
  oldSerialNumber: string | null | undefined,
  newSerialNumber: string | null | undefined,
): JobSerialRowForm[] {
  const o = (oldSerialNumber ?? "").trim();
  if (o.startsWith("{")) {
    try {
      const j = JSON.parse(o) as {
        v?: number;
        rows?: Array<{ n?: string; o?: string; x?: string }>;
      };
      if (j?.v === 1 && Array.isArray(j.rows)) {
        const rows = j.rows.slice(0, JOB_SERIAL_ROWS_MAX).map((r) => ({
          deviceName: String(r.n ?? "")
            .trim()
            .slice(0, 200),
          oldSerial: normalizeSerialNumberInput(String(r.o ?? "")),
          newSerial: normalizeSerialNumberInput(String(r.x ?? "")),
        }));
        return rows.length > 0 ? rows : [emptyJobSerialRow()];
      }
    } catch {
      /* legacy fallback */
    }
  }
  return [
    {
      deviceName: "",
      oldSerial: normalizeSerialNumberInput(o),
      newSerial: normalizeSerialNumberInput(String(newSerialNumber ?? "").trim()),
    },
  ];
}

/** คืนค่าสำหรับ FormData — ว่างทั้งคู่ = ล้างใน DB */
export function serializeJobSerialRowsToFormFields(rows: JobSerialRowForm[]): {
  oldSerialNumber: string;
  newSerialNumber: string;
} {
  const filtered = rows
    .slice(0, JOB_SERIAL_ROWS_MAX)
    .map((r) => ({
      n: r.deviceName.trim().slice(0, 200),
      o: normalizeSerialNumberInput(r.oldSerial),
      x: normalizeSerialNumberInput(r.newSerial),
    }))
    .filter((r) => r.n.length > 0 || r.o.length > 0 || r.x.length > 0);

  if (filtered.length === 0) {
    return { oldSerialNumber: "", newSerialNumber: "" };
  }
  if (filtered.length === 1 && !filtered[0].n) {
    return {
      oldSerialNumber: filtered[0].o,
      newSerialNumber: filtered[0].x,
    };
  }
  return {
    oldSerialNumber: JSON.stringify({
      v: 1,
      rows: filtered.map((r) => ({ n: r.n, o: r.o, x: r.x })),
    }),
    newSerialNumber: "",
  };
}
