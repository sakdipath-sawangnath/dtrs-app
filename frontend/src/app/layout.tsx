import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { sarabun } from '@/lib/fonts';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { FOOTER_ENV_FALLBACK } from "@/lib/appMeta";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: FOOTER_ENV_FALLBACK.appName,
  description: 'ระบบแจ้งซ่อมและจัดการปัญหา — กรมการปกครอง',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={cn("font-sans", geist.variable)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={sarabun.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
