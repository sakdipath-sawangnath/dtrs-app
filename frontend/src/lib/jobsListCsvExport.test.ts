/**
 * Unit tests: CSV export + ระยะเวลาจบงาน (Meeting Phase D)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildJobsListAuditCsv,
  formatSerialFieldsForCsv,
  workDurationDays,
} from "./jobsListCsvExport";

describe("workDurationDays", () => {
  it("returns empty when no fixDate", () => {
    assert.equal(
      workDurationDays({
        fixDate: null,
        reportDate: "2026-08-01T00:00:00.000Z",
        createdAt: "2026-08-01T00:00:00.000Z",
      }),
      "",
    );
  });

  it("uses reportDate when present", () => {
    assert.equal(
      workDurationDays({
        fixDate: "2026-08-11T00:00:00.000Z",
        reportDate: "2026-08-01T00:00:00.000Z",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      "10",
    );
  });

  it("falls back to createdAt when reportDate missing", () => {
    assert.equal(
      workDurationDays({
        fixDate: "2026-08-05T12:00:00.000Z",
        reportDate: null,
        createdAt: "2026-08-01T12:00:00.000Z",
      }),
      "4",
    );
  });

  it("clamps negative span to 0", () => {
    assert.equal(
      workDurationDays({
        fixDate: "2026-08-01T00:00:00.000Z",
        reportDate: "2026-08-10T00:00:00.000Z",
        createdAt: "2026-08-10T00:00:00.000Z",
      }),
      "0",
    );
  });
});

describe("buildJobsListAuditCsv", () => {
  it("includes ระยะเวลาจบงาน_วัน column and value", () => {
    const csv = buildJobsListAuditCsv([
      {
        id: 1,
        ticketNo: "CM-SHF-2026-0001",
        status: "RESOLVED",
        createdAt: "2026-08-01T00:00:00.000Z",
        reportDate: "2026-08-01T00:00:00.000Z",
        fixDate: "2026-08-03T00:00:00.000Z",
        isOutOfContract: false,
      },
    ]);
    assert.match(csv, /ระยะเวลาจบงาน_วัน/);
    const lines = csv.split("\r\n");
    assert.equal(lines.length >= 2, true);
    assert.match(lines[1]!, /,2,/);
  });

  it("does not include หัวข้อ column", () => {
    const csv = buildJobsListAuditCsv([
      {
        id: 1,
        ticketNo: "T-1",
        title: "should-not-appear-as-column",
        status: "PENDING",
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    ]);
    const header = csv.split("\r\n")[0] ?? "";
    assert.equal(header.includes("หัวข้อ"), false);
    assert.match(header, /สถานที่,รายละเอียด,/);
  });

  it("strips [Reopen …] audit from หมายเหตุการซ่อม", () => {
    const csv = buildJobsListAuditCsv([
      {
        id: 2,
        ticketNo: "T-2",
        status: "IN_PROGRESS",
        createdAt: "2026-08-01T00:00:00.000Z",
        fixNote: "หมายเหตุการแก้ไข123 [Reopen 4/9/2569 10:18:34] test",
      },
    ]);
    const dataLine = csv.split("\r\n")[1] ?? "";
    assert.equal(dataLine.includes("[Reopen"), false);
    assert.match(dataLine, /หมายเหตุการแก้ไข123/);
  });

  it("expands multi-device serial JSON into readable columns (not raw v:1)", () => {
    const packed = JSON.stringify({
      v: 1,
      rows: [
        { n: "ชื่ออุปกรณ์", o: "SN123", x: "SN000" },
        { n: "อุปกรณ์-2", o: "SN0000", x: "SN888" },
      ],
    });
    const csv = buildJobsListAuditCsv([
      {
        id: 571,
        ticketNo: "CM-SHF-2026-0007",
        status: "RESOLVED",
        createdAt: "2026-08-01T00:00:00.000Z",
        oldSerialNumber: packed,
        newSerialNumber: null,
      },
    ]);
    const header = csv.split("\r\n")[0] ?? "";
    const dataLine = csv.split("\r\n")[1] ?? "";
    assert.match(header, /จำนวนอุปกรณ์/);
    assert.match(header, /รายการ_S\/N/);
    assert.equal(dataLine.includes('"v":1'), false);
    assert.match(dataLine, /,2,/);
    assert.match(dataLine, /ชื่ออุปกรณ์/);
    assert.match(dataLine, /อุปกรณ์-2/);
    assert.match(dataLine, /SN0000/);
    assert.match(dataLine, /SN888/);
  });
});

describe("formatSerialFieldsForCsv", () => {
  it("reports device count 2 for packed v1 rows", () => {
    const packed = JSON.stringify({
      v: 1,
      rows: [
        { n: "ชื่ออุปกรณ์", o: "SN123", x: "SN000" },
        { n: "อุปกรณ์-2", o: "SN0000", x: "SN888" },
      ],
    });
    const r = formatSerialFieldsForCsv(packed, null);
    assert.equal(r.deviceCount, "2");
    assert.match(r.serialOld, /ชื่ออุปกรณ์: SN123/);
    assert.match(r.serialOld, /อุปกรณ์-2: SN0000/);
    assert.match(r.serialNew, /SN888/);
    assert.match(r.serialDevices, /2\) อุปกรณ์-2/);
  });
});
