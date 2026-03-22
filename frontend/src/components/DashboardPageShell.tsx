"use client";

/**
 * เปลือกหน้ารายการใน Dashboard: หัวข้อ + พื้นที่เต็ม (ใช้กับ FilterBar + Table)
 * ทุกหน้ารายการใช้ wrapper นี้เพื่อแสดงผลเต็มพื้นที่และรูปแบบเดียวกัน
 */
interface DashboardPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /**
   * ควบคุม overflow ของ container card ภายใน shell
   * - ค่า default: `hidden` (เหมือนเดิม)
   * - ใช้เมื่ออยากให้ scrollbar ฝั่งนอกของหน้าใช้งานได้
   */
  cardOverflow?: "hidden" | "visible" | "auto";
  /**
   * หากเป็น true จะไม่แสดงกรอบ card พื้นหลังขนาดใหญ่ (เหมาะกับหน้าที่ children จัดการ card เอง)
   */
  noCard?: boolean;
}

export default function DashboardPageShell({
  title,
  subtitle,
  children,
  cardOverflow = "hidden",
  noCard = false,
}: DashboardPageShellProps) {
  const overflowClass =
    cardOverflow === "visible"
      ? "overflow-visible"
      : cardOverflow === "auto"
        ? "overflow-auto"
        : "overflow-hidden";

  return (
    <div className="animate-fade-up w-full min-w-0 flex flex-col h-full">
      <div className="mb-4 sm:mb-5 shrink-0 px-1">
        <h1 className="text-lg sm:text-xl font-bold truncate text-white tracking-tight drop-shadow-sm">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1 truncate text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {noCard ? (
        <div className={`flex-1 min-h-0 flex flex-col ${overflowClass}`}>
          {children}
        </div>
      ) : (
        <div
          className={`flex-1 min-h-0 flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl overflow-hidden ${overflowClass}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
