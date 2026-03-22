"use client";

import React from 'react';
import { Cctv, Radio, ShieldCheck } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

const FloatingBubbles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(30)].map((_, i) => {
      // Create smaller, crisp tech-particles 
      const size = 3 + (i * 11) % 6; // sizes between 3px and 8px
      const left = (i * 13) % 100;
      const delay = (i * 0.7) % 7;
      const duration = 12 + (i * 1.3) % 10;
      
      return (
        <div 
          key={i}
          className="absolute rounded-full bg-blue-400/80 animate-float shadow-[0_0_8px_rgba(96,165,250,0.8)]"
          style={{
             width: `${size}px`,
             height: `${size}px`,
             left: `${left}%`,
             animationDelay: `${delay}s`,
             animationDuration: `${duration}s`
          }}
        />
      );
    })}
  </div>
);

const TechCctvWatermark = () => (
  <div className="relative flex items-center justify-center">
    {/* Outer rotating dashed ring */}
    <div className="absolute rounded-full border-[1.5px] border-white/60 h-[280px] w-[280px] border-dashed animate-[spin_12s_linear_infinite]" />
    {/* Inner rotating ring */}
    <div className="absolute rounded-full border-[2px] border-white/40 border-t-transparent border-b-transparent h-[210px] w-[210px] animate-[spin_8s_linear_infinite_reverse]" />
    <Cctv size={110} strokeWidth={1.5} className="text-white relative z-10" />
    <Radio size={48} strokeWidth={1.5} className="text-white absolute -top-10 -right-6 animate-[pulse_2s_ease-in-out_infinite]" />
    <ShieldCheck size={42} strokeWidth={1.5} className="text-white absolute -bottom-6 -left-4" />
  </div>
);

interface PublicLayoutShellProps {
  children: React.ReactNode;
  subtitle?: string;
}

export default function PublicLayoutShell({ children, subtitle }: PublicLayoutShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a1128] text-white overflow-hidden">
      <SiteHeader subtitle={subtitle} isDark={true} />

      <main className="flex-1 px-4 py-6 sm:py-10 min-w-0 flex justify-center relative">
        {/* Professional corporate animated background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          
          {/* Main animated tech gradient background - Full screen */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1128] via-[#0f2140] to-[#0a1128] overflow-hidden">
            
            {/* Soft Ambient Light Flares */}
            <div className="absolute top-[5%] -left-[10%] w-[50%] h-[80%] bg-blue-500/15 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[60%] bg-sky-400/10 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite] delay-500" />
            
            {/* Subtle Tech Grid overlay */}
            <div className="absolute inset-0 [background-image:linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,black_30%,transparent_100%)] opacity-80" />

            {/* Floating Particles (Bubbles) */}
            <FloatingBubbles />

            {/* Horizontal Scanning Line (CCTV scanning concept) */}
            <div className="absolute left-0 right-0 h-[80px] bg-gradient-to-b from-transparent via-blue-400/20 to-transparent blur-[2px] animate-scan" style={{ animationDuration: '6s' }} />

            {/* Big Recognizable CCTV Watermark composed of Lucide Icons */}
            <div className="absolute -right-8 md:right-[5%] top-[10%] text-white opacity-[0.05] z-0 transform -rotate-12">
               <TechCctvWatermark />
            </div>

          </div>
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 w-full max-w-3xl text-slate-800 animate-fade-in">
          {children}
        </div>
      </main>

      <SiteFooter isDark={true} />
    </div>
  );
}
