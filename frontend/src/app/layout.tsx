import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { sarabun } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'CCTV Maintenance',
  description: 'ระบบแจ้งซ่อมและจัดการปัญหา CCTV',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={sarabun.variable} data-scroll-behavior="smooth">
      <body className={sarabun.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
