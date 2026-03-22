import React from 'react';
import { ShieldCheck } from 'lucide-react';

// SiteFooter — shared across ALL pages
export default function SiteFooter({ isDark = false }: { isDark?: boolean }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${isDark ? 'border-t border-slate-700/50 mt-auto relative z-10' : 'bg-white/80 backdrop-blur-md border-t border-slate-200/80 mt-auto relative z-10'}`}>
      <div className="w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] sm:text-sm">
        
        {/* Left Side: System Name & Copyright */}
        <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <ShieldCheck size={16} className={`${isDark ? 'text-blue-400' : 'text-blue-600'} shrink-0`} />
          <span className="wrap-break-word">
            © {currentYear} ระบบแจ้งซ่อม CCTV
          </span>
        </div>

        {/* Right Side: Company & Version Badge */}
        <div className="flex items-center gap-3">
          <span className={`font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Forth Co., Ltd.</span>
          <div className={`flex items-center pl-3 border-l ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold tracking-wide border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
              v2.0
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
