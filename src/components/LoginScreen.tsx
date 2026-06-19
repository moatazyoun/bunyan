import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Wifi, WifiOff, Database } from 'lucide-react';
import { motion } from 'motion/react';
import BunyanLogo from './BunyanLogo';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { UserItem, UserModulePermissions } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserItem) => void;
  dbConnected?: boolean | null;
  dbLatency?: number;
}

const DEFAULT_FULL_PERMISSIONS: UserModulePermissions = {
  projects: true,
  supplies: true,
  equipment: true,
  contractors: true,
  finance: true,
  usersManagement: true
};

export default function LoginScreen({ onLoginSuccess, dbConnected, dbLatency }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Ensure Google users are treated as 'admin' with full permissions
      onLoginSuccess({
        username: result.user.email?.split('@')[0] || result.user.uid,
        nameAr: result.user.displayName || 'مستخدم جوجل',
        role: 'admin',
        permissions: DEFAULT_FULL_PERMISSIONS,
        assignedProjects: []
      });
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'فشلت عملية التحقق باستخدام حساب جوجل.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('فضلاً، يرجى ملء اسم المستخدم وكلمة المرور بالكامل.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشلت عملية التحقق من الهوية وصلاحية الدخول.');
      }

      // Dispatch login success event
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans" dir="rtl">
      
      {/* Interactive moving gradient background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft floating circle 1 */}
        <motion.div
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -40, 50, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-12 -left-12 w-72 h-72 bg-gradient-to-tr from-indigo-200/40 to-sky-200/40 rounded-full blur-3xl"
        />

        {/* Soft floating circle 2 */}
        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 60, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-br from-amber-100/50 to-pink-100/50 rounded-full blur-3xl"
        />

        {/* Soft floating circle 3 */}
        <motion.div
          animate={{
            x: [0, 30, -40, 0],
            y: [0, 50, -40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-20 left-1/4 w-80 h-80 bg-gradient-to-tr from-emerald-100/40 to-teal-100/40 rounded-full blur-3xl"
        />

        {/* Delicate structural grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle decorative inner corner colors */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto w-18 h-18 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl flex items-center justify-center p-2 transition duration-305 shadow-md hover:shadow-lg">
            <BunyanLogo 
              className="w-14 h-14" 
              iconClassName="fill-slate-800" 
              barsClassName="fill-indigo-600" 
              dotClassName="fill-amber-500" 
            />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">نظام بنيان الذكي</h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">
              تأكد أن كافة معلومات وبيانات مشاريعك مؤمنة بالكامل في قواعد بيانات خاصة مشفرة وسرية ولا يمكن الاطلاع عليها لضمان أقصى درجات الأمان والخصوصية
            </p>
          </div>
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-bold rounded-xl text-right flex items-start gap-2.5"
          >
            <span className="shrink-0 mt-0.5 font-mono">•</span>
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-slate-700">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3.5 top-3.5 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="أدخل اسم الحساب"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full pl-4 pr-10.5 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-right"
                id="login-username"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-3.5 text-slate-400" size={17} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور الخاصة بك"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-11 pr-10.5 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-right font-mono"
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            id="login-submit-btn"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري التحقق والمطابقة...
              </span>
            ) : (
              <>
                <span>تسجيل الدخول الآمن للـ ERP</span>
                <ArrowRight size={15} className="rotate-180 shrink-0" />
              </>
            )}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">أو عبر فايربيز</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isGoogleLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الاتصال بجوجل فايربيز...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>تسجيل الدخول الصحيح بحساب جوجل</span>
              </>
            )}
          </button>
        </form>

        {/* Real-time DB Status Indicator inside Login Screen of Bunyan ERP */}
        <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-slate-500" />
            <span className="text-slate-700 font-bold">حالة قاعدة البيانات:</span>
          </div>
          {dbConnected === null ? (
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              جاري الفحص الدقيق...
            </span>
          ) : dbConnected ? (
            <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono">
              <Wifi size={14} className="text-emerald-500" />
              <span>متصل سحابياً</span>
              <span className="text-[10px] text-emerald-600/80 font-medium">({dbLatency}ms)</span>
            </span>
          ) : (
            <span className="text-rose-600 font-bold flex items-center gap-1.5">
              <WifiOff size={14} className="text-rose-500" />
              <span>أنت أوفلاين (الـ LocalStorage)</span>
            </span>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1.5 font-sans leading-relaxed">
          <p>تأكد أن كافة بيانات ومعلومات هذا المشروع مؤمنة بالكامل داخل قواعد بيانات مشفرة وخاصة، ولا يمكن الاطلاع عليها إلا من خلال طاقم العمل المصرح له.</p>
        </div>
      </motion.div>
    </div>
  );
}
