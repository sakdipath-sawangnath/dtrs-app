"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Button } from "@/components/ui/button";

type Props = {
  /** ความสูง canvas (ความกว้างเต็ม parent) */
  height?: number;
  disabled?: boolean;
  className?: string;
  onStrokeChange?: (hasStroke: boolean) => void;
  handleRef?: MutableRefObject<SignaturePadHandle | null>;
};

/**
 * แผ่นวาดลายเซ็น — รองรับเมาส์/ทัช (pointer events)
 */
export type SignaturePadHandle = {
  clear: () => void;
  hasStroke: () => boolean;
  toBlob: (type?: string, quality?: number) => Promise<Blob | null>;
};

export default function SignaturePad({
  height = 160,
  disabled = false,
  className = "",
  onStrokeChange,
  handleRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const labelId = useId();

  const setInk = useCallback(
    (v: boolean) => {
      setHasInk(v);
      onStrokeChange?.(v);
    },
    [onStrokeChange],
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const cssW = parent?.clientWidth || 320;
    const cssH = height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.25;
    ctx.strokeStyle = "#0f172a";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);
  }, [height]);

  useEffect(() => {
    resizeCanvas();
    const onResize = () => {
      // clear on resize to avoid stretch artifacts
      resizeCanvas();
      setInk(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas, setInk]);

  const pos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!hasInk) setInk(true);
  };

  const endStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const clear = useCallback(() => {
    resizeCanvas();
    setInk(false);
  }, [resizeCanvas, setInk]);

  const toBlob = useCallback(
    (type = "image/png", quality?: number) =>
      new Promise<Blob | null>((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas || !hasInk) {
          resolve(null);
          return;
        }
        canvas.toBlob((b) => resolve(b), type, quality);
      }),
    [hasInk],
  );

  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      clear,
      hasStroke: () => hasInk,
      toBlob,
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef, clear, toBlob, hasInk]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="rounded-xl border border-[var(--glass-card-border)] overflow-hidden bg-white touch-none"
        aria-labelledby={labelId}
      >
        <canvas
          ref={canvasRef}
          className={`block w-full ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-crosshair"}`}
          style={{ height }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          aria-label="แผ่นวาดลายเซ็น"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p id={labelId} className="text-xs glass-muted-text">
          {hasInk ? "มีลายเซ็นแล้ว" : "วาดลายเซ็นในช่องด้านบน"}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !hasInk}
          onClick={clear}
          className="min-h-11 rounded-xl cursor-pointer"
        >
          ล้าง
        </Button>
      </div>
    </div>
  );
}
