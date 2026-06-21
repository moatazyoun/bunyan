import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  ChevronRight, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  AlertCircle,
  Construction,
  Network,
  Database,
  ShieldCheck,
  Globe,
  Plus
} from 'lucide-react';
import { auth } from '../lib/firebase';
import BunyanLogo from './BunyanLogo';

interface LoginScreenProps {
  onLogin: (user: any) => void;
  dbConnected?: boolean | null;
  dbLatency?: number;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, dbConnected, dbLatency }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Onboarding state for new Google users
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);
  const [googleData, setGoogleData] = useState<{ email: string; displayName: string; uid: string } | null>(null);
  const [onboardingForm, setOnboardingForm] = useState({
    username: '',
    nameAr: '',
    phone: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || data.message || 'فشل تسجيل الدخول. يرجى مراجعة البيانات.');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleData) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/google-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...onboardingForm,
          email: googleData.email,
          uid: googleData.uid
        }),
      });

      const data = await response.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || data.message || 'فشل تفعيل الحساب.');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 select-none relative overflow-hidden">
      
      {/* Immersive Animated Multi-color Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sphere 1: Sky Blue */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-sky-100/60 blur-[120px]"
        />
        {/* Sphere 2: Rose/Pink */}
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 120, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-[15%] -right-[10%] w-[60%] h-[60%] rounded-full bg-rose-100/50 blur-[140px]"
        />
        {/* Sphere 3: Amber/Sun */}
        <motion.div
          animate={{
            x: [0, 120, 0],
            y: [0, -100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute top-[20%] right-[10%] w-[35%] h-[40%] rounded-full bg-amber-100/40 blur-[100px]"
        />
        {/* Sphere 4: Purple/Lavendar */}
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 7
          }}
          className="absolute bottom-[20%] left-[5%] w-[40%] h-[45%] rounded-full bg-purple-100/40 blur-[110px]"
        />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <AnimatePresence mode="wait">
          {!onboardingNeeded ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="bg-white/80 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-white backdrop-blur-xl"
            >
              <div className="flex flex-col items-center mb-10">
                <div className="mb-6 transform hover:scale-110 transition-transform duration-500">
                   <BunyanLogo size={64} color="#0f172a" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 font-sans">بنيان</h1>
                <p className="text-slate-500 text-sm font-medium">المنصة الشاملة لإدارة المشاريع الهندسية</p>
                <div className="mt-4 flex gap-2">
                   <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">Enterprise v4.0</span>
                   <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">ERP System</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 mr-3 block">اسم المستخدم</label>
                  <div className="relative group">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                    <input
                      type="text"
                      className="w-full pr-12 pl-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all outline-none"
                      placeholder="Username"
                      dir="ltr"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 mr-3 block">كلمة المرور</label>
                  <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                    <input
                      type="password"
                      className="w-full pr-12 pl-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all outline-none"
                      placeholder="••••••••"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-semibold leading-relaxed"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <div className="pt-2">
                  <button
                    disabled={isLoading}
                    className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-sm shadow-[0_20px_40px_-12px_rgba(15,23,42,0.3)] hover:bg-slate-800 disabled:bg-slate-400 active:scale-98 transition duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>تسجيل الدخول للنظام</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-50 text-center space-y-4">
                {dbConnected !== undefined && (
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      dbConnected === null ? 'bg-amber-400 animate-pulse' :
                      dbConnected ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Database: {dbConnected === null ? 'Checking...' : dbConnected ? `Ready (${dbLatency}ms)` : 'Offline'}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 font-medium font-sans leading-relaxed">
                  نظام التوثيق والوصول المركزي - منصة بنيان السحابية.<br/>
                  جميع الحقوق محفوظة © {new Date().getFullYear()}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-200"
            >
              <div className="mb-8">
                <div className="bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white rotate-3">
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 font-sans tracking-tight">مرحباً بك في بنيان</h2>
                <p className="text-slate-500 text-sm font-medium">يرجى إكمال بيانات تسجيل الحساب التجريبي للبدء.</p>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 mr-2 block">اسم المستخدم المقترح</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pr-11 pl-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                      placeholder="Username"
                      dir="ltr"
                      required
                      value={onboardingForm.username}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 mr-2 block">الاسم بالكامل (عربي)</label>
                  <div className="relative">
                    <Construction className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pr-11 pl-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all font-sans"
                      placeholder="إسمك في النظام"
                      required
                      value={onboardingForm.nameAr}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, nameAr: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 mr-2 block">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pr-11 pl-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                      placeholder="012XXXXXXXX"
                      dir="ltr"
                      required
                      value={onboardingForm.phone}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 rounded-2xl flex gap-3 text-red-700 text-xs font-bold items-start border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    disabled={isLoading}
                    className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-sm shadow-[0_20px_40px_-12px_rgba(15,23,42,0.3)] hover:bg-slate-800 disabled:bg-slate-400 transition-all active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>تفعيل الحساب والبدء</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Highlights beneath login */}
        {!onboardingNeeded && (
          <div className="mt-12 grid grid-cols-2 gap-4 px-2">
            {[
              { icon: ShieldCheck, title: "بيانات مشفرة", desc: "أمان مترافق مع بروتوكول TLS" },
              { icon: Globe, title: "وصول سحابي", desc: "من أي مكان في العالم" }
            ].map((f, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="flex flex-col items-center text-center p-4"
              >
                <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center mb-3 text-slate-900">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-[12px] font-black text-slate-800 mb-1">{f.title}</h3>
                <p className="text-[10px] text-slate-400 leading-tight font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
