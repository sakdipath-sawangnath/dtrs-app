"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatSlashDateInput,
  formatThaiDateTimeDisplay,
  joinLocalDateTime,
  parseSlashDateInput,
  splitLocalDateTime,
} from "@/lib/formatThaiDateTimeDisplay";
import { GLASS_FIELD, GLASS_LABEL } from "./jobDetailStyles";

/** คู่ date + time แทน datetime-local — แสดงบรรทัดพ.ศ. ให้สอดคล้องส่วนอื่นของหน้า */
export default function BackfillDateTimeFields({
  groupAriaLabel,
  dateId,
  timeId,
  value,
  onChange,
  onValidityChange,
  disabled,
}: {
  groupAriaLabel: string;
  dateId: string;
  timeId: string;
  value: string;
  onChange: (v: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  disabled: boolean;
}) {
  const { date, time } = splitLocalDateTime(value);
  const [dateText, setDateText] = useState(() => formatSlashDateInput(date));

  useEffect(() => {
    setDateText(formatSlashDateInput(date));
  }, [date]);

  const parsedDate = useMemo(() => parseSlashDateInput(dateText), [dateText]);
  const isDateValid = dateText.trim() === "" || parsedDate != null;

  useEffect(() => {
    onValidityChange?.(isDateValid);
  }, [isDateValid, onValidityChange]);

  const preview = parsedDate
    ? formatThaiDateTimeDisplay(joinLocalDateTime(parsedDate, time || "00:00"))
    : null;

  return (
    <div
      role="group"
      aria-label={groupAriaLabel}
      className="space-y-1.5 min-w-0"
      lang="th"
    >
      <p className={GLASS_LABEL}>{groupAriaLabel}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0">
          <label htmlFor={dateId} className="mb-1 block text-[10px] font-medium text-slate-500">
            วันที่ (ปฏิทิน)
          </label>
          <input
            id={dateId}
            type="text"
            className={GLASS_FIELD}
            value={dateText}
            placeholder="dd/mm/yyyy"
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            onChange={(e) => {
              const nextDateText = e.target.value.replace(/[^\d/]/g, "").slice(0, 10);
              setDateText(nextDateText);
              if (!nextDateText.trim()) {
                onChange("");
                return;
              }
              const nextDate = parseSlashDateInput(nextDateText);
              if (!nextDate) {
                onChange("");
                return;
              }
              onChange(joinLocalDateTime(nextDate, time || "00:00"));
            }}
            disabled={disabled}
            aria-invalid={!isDateValid}
          />
          <p className="mt-1 text-[10px] text-slate-500">
            กรอกเป็น <code className="font-mono text-slate-300">dd/mm/yyyy</code> เช่น 05/11/2026
          </p>
          {!isDateValid ? (
            <p className="mt-1 text-[10px] text-red-300" role="alert">
              รูปแบบวันที่ต้องเป็น <code className="font-mono text-red-200">dd/mm/yyyy</code> และต้องเป็นวันที่จริง
            </p>
          ) : null}
        </div>
        <div className="w-full sm:w-38 shrink-0">
          <label htmlFor={timeId} className="mb-1 block text-[10px] font-medium text-slate-500">
            เวลา (24 ชม.)
          </label>
          <input
            id={timeId}
            type="time"
            step={60}
            className={GLASS_FIELD}
            value={time}
            onChange={(e) => {
              const nextTime = e.target.value;
              if (!parsedDate) return;
              onChange(joinLocalDateTime(parsedDate, nextTime));
            }}
            disabled={disabled || !parsedDate}
          />
        </div>
      </div>
      {preview ? (
        <p className="text-xs text-slate-400 leading-relaxed pt-0.5" aria-live="polite">
          <span className="text-slate-500">แสดงเป็นปฏิทินไทย (พ.ศ.): </span>
          <span className="font-medium tabular-nums text-slate-200">{preview}</span>
        </p>
      ) : null}
    </div>
  );
}
