import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Wifi, WifiOff, Database, Sparkles, PhoneCall, AlertCircle, ExternalLink, HelpCircle, Phone, Mail } from 'lucide-react';
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
  projects: 'edit',
  transactions: 'edit',
  extracts: 'edit',
  deliveries: 'edit',
  boq: 'edit',
  supplies: 'edit',
  subcontractors: 'edit',
  weeklyReport: 'edit',
  siteWorkers: 'edit',
  fuelDashboard: 'edit',
  equipmentDashboard: 'edit',
  usersManagement: 'edit'
};

export default function LoginScreen({ onLoginSuccess, dbConnected, dbLatency }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Onboarding & Trial states
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    username: '',
    nameAr: '',
    phone: '',
    email: '',
    uid: ''
  });

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const email = result.user.email || '';
      const uid = result.user.uid;
      const displayName = result.user.displayName || '';
      
      // Call modern endpoint to check trial status or onboarding
      const response = await fetch('/api/auth/google-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, uid, displayName })
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'فشلت معالجة حساب جوجل.');
      }
      
      if (resData.onboardingNeeded) {
        setOnboardingData({
          username: email ? email.split('@')[0] : 'user_' + uid.substring(0, 5),
          nameAr: displayName || '',
          phone: '',
          email: email,
          uid: uid
        });
        setIsOnboarding(true);
      } else if (resData.expired) {
        setIsTrialExpired(true);
      } else {
        onLoginSuccess(resData.user);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'فشلت عملية التحقق باستخدام حساب جوجل.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData.username.trim() || !onboardingData.nameAr.trim() || !onboardingData.phone.trim()) {
      setErrorMsg('فضلاً، يرجى كتابة جميع معلومات تفعيل الحساب المطلوبة للمتابعة.');
      return;
    }
    
    setIsOnboardingSaving(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/auth/google-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'فشلت عملية حفظ الحساب السحابية.');
      }
      
      onLoginSuccess(resData.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطأ غير معروف في تهيئة الفترة التجريبية الخاصة بحسابك.');
    } finally {
      setIsOnboardingSaving(false);
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
        className={`w-full ${isTrialExpired ? 'max-w-xl' : 'max-w-md'} bg-white/85 backdrop-blur-xl border border-slate-200/80 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-300`}
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
          {!isOnboarding && !isTrialExpired && (
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">نظام بنيان الذكي</h1>
              <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">
                تأكد أن كافة معلومات وبيانات مشاريعك مؤمنة بالكامل في قواعد بيانات خاصة مشفرة وسرية ولا يمكن الاطلاع عليها لضمان أقصى درجات الأمان والخصوصية
              </p>
            </div>
          )}
        </div>

        {/* Conditional UI rendering inside the Bunyan login card */}
        {(() => {
          if (isTrialExpired) {
            return (
              <div className="space-y-6 text-right font-sans">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                    <AlertCircle size={32} />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block bg-rose-100/60 text-rose-600 border border-rose-200 text-[10px] font-black px-3.5 py-1 rounded-full uppercase">انتهت الفترة التجريبية للاستخدام</span>
                    <h2 className="text-xl font-black text-slate-900 mt-2">انتهى وقت تجربة بنيان الذكي</h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                      انتهت ساعة المعاينة المجانية المخصصة لحساب جوجل الخاص بك. لتفعيل الصلاحيات الكاملة مع دعم مستخلصات ومواقع لا نهائية، يرجى تفعيل حسابك المدفوع.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 border border-slate-200/60 rounded-2xl">
                  <h4 className="text-xs font-black text-slate-800 border-b border-slate-200 pb-1.5 mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>مزايا الترقية للنسخة الكاملة 💎</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-[11px] font-extrabold text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 text-sm">✓</span>
                      <span>إدارة شاملة لجميع الأقسام وتعديل الصلاحيات تفصيلياً (ممنوع / مشاهدة / تعديل)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 text-sm">✓</span>
                      <span>تخزين سحابي حي فوري مؤمن بالكامل وبخاصية التشفير العسكري لحسابات شركتك</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 text-sm">✓</span>
                      <span>تضمين عدد لا نهائي من المشاريع والمقايسات التثمنية ومقاولين الباطن والتوريدات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 text-sm">✓</span>
                      <span>دعم فني ومهندسي مكتب فني مخصصين لمساعدتكم 24 ساعة عبر الهاتف والواتساب</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <a 
                    href="https://wa.me/201115556496?text=أريد تفعيل النسخة الكاملة لنظام بنيان الذكي لإدارة المقاولات والمشاريع"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/15 transition flex items-center justify-center gap-2"
                  >
                    <PhoneCall size={15} />
                    <span>الدعم الفني والمبيعات عبر واتساب: 01115556496</span>
                    <ExternalLink size={12} className="opacity-70" />
                  </a>

                  <a 
                    href="tel:+201115556496"
                    className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 border border-white/5 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Phone size={14} />
                    <span>اتصل هاتفياً بالدعم الفني: 01115556496</span>
                  </a>

                  <a 
                    href="mailto:moatazyoun@gmail.com"
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Mail size={14} />
                    <span>راسلنا بريدياً: moatazyoun@gmail.com</span>
                  </a>

                  <button 
                    type="button"
                    onClick={() => {
                      setIsTrialExpired(false);
                      setIsOnboarding(false);
                    }}
                    className="w-full py-2 text-[10px] text-slate-500 hover:text-slate-800 font-bold transition text-center underline"
                  >
                    العودة لشاشة الدخول والـ ERP
                  </button>
                </div>
              </div>
            );
          }

          if (isOnboarding) {
            return (
              <form onSubmit={handleOnboardingSubmit} className="space-y-5 text-right font-sans">
                <div className="text-center space-y-2 pb-2">
                  <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">استكمال بيانات النسخة التجريبية</h3>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    يرجى استكمال البيانات الإلزامية لتفعيل حسابك التجريبي الفوري لمدة ساعة كاملة والوصول إلى لوحة التحكم.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-black rounded-lg text-right">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block mr-1 uppercase">رابط البريد الإلكتروني (جوجل)</label>
                    <input
                      type="email"
                      disabled
                      value={onboardingData.email}
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold rounded-xl outline-none cursor-not-allowed text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 block mr-1 uppercase">الاسم الشخصي الكامل بالعربية <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="الأسم بالكامل"
                      value={onboardingData.nameAr}
                      onChange={e => setOnboardingData({ ...onboardingData, nameAr: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-500 outline-none transition text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 block mr-1 uppercase">اسم الحساب المستخدم (Username) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسم مستخدم فريد"
                      value={onboardingData.username}
                      onChange={e => setOnboardingData({ ...onboardingData, username: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-500 outline-none transition text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 block mr-1 uppercase">رقم هاتف العمل الخاص بك <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute right-3.5 top-3.5 text-slate-400" size={15} />
                      <input
                        type="tel"
                        required
                        placeholder="مثال: 0101XXXXXXXX"
                        value={onboardingData.phone}
                        onChange={e => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                        className="w-full pl-4 pr-10.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-500 outline-none transition text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isOnboardingSaving}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-98 transition flex items-center justify-center gap-1.5 disabled:opacity-45"
                  >
                    {isOnboardingSaving ? 'جاري تهيئة الحساب السحابي...' : 'تفعيل رخصة الفترة التجريبية الآن'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsOnboarding(false);
                      setErrorMsg('');
                    }}
                    className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline transition text-center"
                  >
                    إلغاء والعودة لشاشة الدخول
                  </button>
                </div>
              </form>
            );
          }

          return (
            <>
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
            </>
          );
        })()}

        {/* Real-time DB Status Indicator inside Login Screen of Bunyan ERP */}
        {!isOnboarding && !isTrialExpired && (
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
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1.5 font-sans leading-relaxed">
          <p>تأكد أن كافة بيانات ومعلومات هذا المشروع مؤمنة بالكامل داخل قواعد بيانات مشفرة وخاصة، ولا يمكن الاطلاع عليها إلا من خلال طاقم العمل المصرح له.</p>
        </div>
      </motion.div>
    </div>
  );
}
