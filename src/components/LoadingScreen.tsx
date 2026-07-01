/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  FileSpreadsheet, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Compass, 
  Lock, 
  Cpu,
  Layers,
  ChevronLeft
} from 'lucide-react';
import BunyanLogo from './BunyanLogo';

interface LoadingScreenProps {
  siteName: string;
  primaryColor: string;
}

interface Step {
  id: number;
  labelAr: string;
  labelEn: string;
  icon: React.ComponentType<any>;
}

const LOADING_STEPS: Step[] = [
  {
    id: 1,
    labelAr: 'تأسيس الاتصال الآمن بقاعدة البيانات والتحقق من التشفير',
    labelEn: 'Securing database handshake & validation',
    icon: Database,
  },
  {
    id: 2,
    labelAr: 'تحميل ومزامنة المخططات الهندسية وجداول الكميات والبنود',
    labelEn: 'Syncing engineering blueprint matrices & BOQ data',
    icon: FileSpreadsheet,
  },
  {
    id: 3,
    labelAr: 'مزامنة سجل النشاطات الرقمي والتحقق من التواقيع المشفرة',
    labelEn: 'Reconstructing digital audit logs & authority checks',
    icon: Activity,
  },
  {
    id: 4,
    labelAr: 'تطبيق معايير التشفير العالي والتهيؤ لفتح لوحة العمليات',
    labelEn: 'Deploying session shields & compiling dashboard widgets',
    icon: ShieldCheck,
  },
];

export default function LoadingScreen({ siteName, primaryColor }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    // Realistic multi-stage loading simulation for maximum user-delight and luxury feel
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) {
          return 99; // Hold at 99% until parent releases isDbLoaded
        }
        
        // Dynamic speed based on progress (fast start, gradual secure deceleration)
        let increment = 1;
        if (prev < 25) {
          increment = Math.floor(Math.random() * 8) + 5; // fast handshake
        } else if (prev < 60) {
          increment = Math.floor(Math.random() * 4) + 2; // moderate load
        } else if (prev < 85) {
          increment = Math.floor(Math.random() * 2) + 1; // detailed verify
        } else {
          increment = Math.random() > 0.7 ? 1 : 0; // deceleration secure hold
        }

        const next = Math.min(prev + increment, 99);

        // Update step index based on progress ranges
        if (next < 25) {
          setActiveStepIndex(0);
        } else if (next < 55) {
          setActiveStepIndex(1);
        } else if (next < 80) {
          setActiveStepIndex(2);
        } else {
          setActiveStepIndex(3);
        }

        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans text-right select-none" 
      dir="rtl"
      id="bunyan-luxury-loader"
    >
      {/* 1. Structural Blueprint Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft engineering primary colored glowing auras */}
        <div 
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.14] transition-all duration-1000"
          style={{ backgroundColor: primaryColor }}
        />
        <div 
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[130px] opacity-[0.08] transition-all duration-1000"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Dynamic slow floating particle rings */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 0.95, 1]
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-10 w-96 h-96 rounded-full border border-slate-150/50 border-dashed pointer-events-none flex items-center justify-center"
        >
          <div className="w-80 h-80 rounded-full border border-dashed border-slate-200/30" />
        </motion.div>

        {/* Elegant light architectural structural grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Monospace coordinates decor in corners (Blueprint Style) */}
        <div className="absolute top-6 left-6 font-mono text-[9px] text-slate-400 tracking-wider uppercase hidden sm:block">
          SYS_INIT_VER: Enterprise v2.4 // SECURED_SSL_TLS_1.3
        </div>
        <div className="absolute top-6 right-6 font-mono text-[9px] text-slate-400 tracking-wider uppercase hidden sm:block">
          COORDINATES // LAT: 30.0444° N, LON: 31.2357° E
        </div>
      </div>

      {/* 2. Main Luxury Card Container */}
      <motion.div 
        initial={{ opacity: 1, y: 35, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[40px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.06)] relative overflow-hidden flex flex-col md:flex-row gap-8 md:gap-10 items-center z-10"
      >
        {/* Subtle interior border-accent of active primary theme color */}
        <div 
          className="absolute inset-x-0 top-0 h-[3px] transition-all duration-1000"
          style={{ backgroundColor: primaryColor }}
        />

        {/* LEFT COLUMN: Highly-detailed architectural rotating dial & logo */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative">
          
          <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
            {/* Outer technical compass circle with degrees (Rotating Indeterminate) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 rounded-full border border-slate-200/80 border-dashed"
            >
              {/* Radial degree ticks */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <div 
                  key={deg} 
                  className="absolute top-1/2 left-1/2 w-full h-[1px] bg-transparent origin-center flex justify-between px-1"
                  style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
                >
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                </div>
              ))}
            </motion.div>

            {/* Inner primary color glowing circular wheel */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-4 rounded-full border-[2px] border-slate-100 flex items-center justify-center"
              style={{ borderColor: `${primaryColor}15` }}
            >
              {/* Spinning primary accent arc segment */}
              <div 
                className="absolute inset-0 rounded-full border-[3px] border-transparent transition-all duration-1000"
                style={{ 
                  borderTopColor: primaryColor,
                  borderRightColor: primaryColor,
                  opacity: 1.65
                }}
              />
            </motion.div>

            {/* Micro blueprint ticks */}
            <div className="absolute inset-8 rounded-full border border-slate-150/40" />

            {/* Center pulsing Bunyan Emblem */}
            <motion.div
              animate={{ 
                scale: [0.97, 1.05, 0.97],
                boxShadow: [
                  '0 0 20px 0px rgba(0,0,0,0.02)',
                  `0 0 30px 4px ${primaryColor}12`,
                  '0 0 20px 0px rgba(0,0,0,0.02)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-28 h-28 md:w-32 md:h-32 bg-white border border-slate-150/80 rounded-3xl flex items-center justify-center p-4.5 shadow-md z-10"
            >
              <BunyanLogo 
                className="w-20 h-20" 
                iconClassName="fill-slate-900" 
                barsClassName="transition-all duration-1000"
                dotClassName="transition-all duration-1000"
              />
            </motion.div>

            {/* Glowing dot tracking outer circle */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 pointer-events-none"
            >
              <div 
                className="w-2.5 h-2.5 rounded-full absolute -top-1.25 left-1/2 -translate-x-1/2 shadow-md transition-all duration-1000 animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
            </motion.div>
          </div>

          {/* Large dynamic premium percentage */}
          <div className="mt-6 text-center space-y-1">
            <div className="inline-flex items-baseline gap-1">
              <motion.span 
                key={progress}
                initial={{ opacity: 1.5, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl font-black text-slate-900 font-mono tracking-tight"
              >
                {progress}
              </motion.span>
              <span className="text-sm font-black text-slate-400 font-mono">%</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-black">
              [ ENGINE_INITIALIZATION_MATRIX ]
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: App naming, target site details & state checklist */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-650 border border-slate-200">
              <Cpu className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>جاري تحميل السجلات الرقمية</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
              نظام بنيان لإدارة الإنشاءات
            </h2>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              يرجى الانتظار بينما نقوم بتأمين وبناء بيئة العمل الخاصة بك ومزامنة كافة الجداول وقواعد البيانات.
            </p>
          </div>

          {/* Selected Site Details */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-all duration-1000"
              style={{ backgroundColor: primaryColor }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[9.5px] text-slate-400 font-black block uppercase tracking-wider">موقع التشغيل النشط</span>
              <span className="text-xs font-black text-slate-850 block truncate">{siteName || 'بوابة الإدارة المركزية'}</span>
            </div>
          </div>

          {/* Interactive loading step checkboxes */}
          <div className="space-y-3">
            {LOADING_STEPS.map((step, idx) => {
              const isChecked = progress > (idx === 0 ? 25 : idx === 1 ? 55 : idx === 2 ? 80 : 100);
              const isActive = activeStepIndex === idx;
              const StepIcon = step.icon;

              return (
                <div 
                  key={step.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-500 ${
                    isActive 
                      ? 'bg-white border-slate-250 shadow-xs' 
                      : isChecked 
                        ? 'bg-slate-50/40 border-slate-150/60 opacity-70'
                        : 'border-transparent opacity-40'
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="shrink-0 mt-0.5">
                    {isChecked ? (
                      <motion.span
                        initial={{ scale: 0.7, opacity: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-emerald-600 block"
                      >
                        <CheckCircle2 className="w-5 h-5 fill-emerald-50" />
                      </motion.span>
                    ) : isActive ? (
                      <div className="relative flex items-center justify-center">
                        <span 
                          className="animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span 
                          className="relative inline-flex rounded-full h-2.5 w-2.5"
                          style={{ backgroundColor: primaryColor }}
                        />
                      </div>
                    ) : (
                      <Lock className="w-4 h-4 text-slate-350" />
                    )}
                  </div>

                  {/* Step texts */}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span 
                      className={`text-xs font-black block transition-all ${
                        isActive 
                          ? 'text-slate-900' 
                          : isChecked 
                            ? 'text-slate-550 line-through decoration-slate-300' 
                            : 'text-slate-400'
                      }`}
                    >
                      {step.labelAr}
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-400 font-mono block tracking-wide uppercase">
                      {step.labelEn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </motion.div>

      {/* 3. Luxury Security Footer details */}
      <div className="mt-8 font-sans flex items-center gap-2 text-[11px] text-slate-400/80 font-bold z-10">
        <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
        <span>قناة اتصال مشفرة بالكامل ومعززة بـ AES-256 SSL. كافة عملياتك مسجلة بسجل النشاط الآمن.</span>
      </div>
    </div>
  );
}
