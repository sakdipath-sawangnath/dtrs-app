/**
 * Unit tests: CSV export + ระยะเวลาจบงาน (Meeting Phase D)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildJobsListAuditCsv,
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
        ticketNo: "CM-SHF-2002-0001",
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
});
