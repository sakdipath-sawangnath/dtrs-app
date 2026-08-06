"use client";

/**
 * เปลือกหน้ารายการใน Dashboard: หัวข้อ + พื้นที่เต็ม (ใช้กับ FilterBar + Table)
 */
interface DashboardPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  cardOverflow?: "hidden" | "visible" | "auto";
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
        <h1 className="text-lg sm:text-xl font-bold truncate tracking-tight text-slate-900 dark:text-slate-100 drop-shadow-sm">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1 truncate text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {noCard ? (
        <div className={`flex-1 min-h-0 flex flex-col ${overflowClass}`}>
          {children}
        </div>
      ) : (
        <div className={`flex-1 min-h-0 flex flex-col glass-card overflow-hidden ${overflowClass}`}>
          {children}
        </div>
      )}
    </div>
  );
}
