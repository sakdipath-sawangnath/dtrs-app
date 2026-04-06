"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Tooltip ข้อความยาว — hover / focus (portal ไป body) */
export function TextHoverTooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const computePos = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.top + r.height / 2,
      left: Math.min(window.innerWidth - 16, r.left + r.width + 10),
    });
  };

  useEffect(() => {
    if (!open) return;
    computePos();
    const onWin = () => computePos();
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);
    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [open]);

  return (
    <>
      <span
        ref={ref}
        tabIndex={0}
        onMouseEnter={() => {
          setOpen(true);
          computePos();
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          setOpen(true);
          computePos();
        }}
        onBlur={() => setOpen(false)}
        className="inline-block max-w-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded"
      >
        {children}
      </span>
      {open && pos
        ? createPortal(
            <div
              className="fixed pointer-events-none"
              style={{
                top: pos.top,
                left: pos.left,
                transform: "translateY(-50%)",
                zIndex: 9999,
              }}
            >
              <div className="max-w-[min(520px,calc(100vw-24px))] bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md shadow-lg whitespace-pre-wrap wrap-break-word border border-white/10">
                {text}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
