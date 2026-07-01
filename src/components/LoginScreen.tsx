import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  Plus
} from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Blueprint Style Version Header */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-slate-400 tracking-wider uppercase hidden sm:block z-20">
        SYS_INIT_VER: Enterprise v2.4 // SECURED_SSL_TLS_1.3
      </div>

      {/* Immersive Animated Multi-color Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sphere 1: Sky Blue */}
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-sky-100/60 blur-[120px]"
        />
        {/* Sphere 2: Rose/Pink */}
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 120, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[15%] -right-[10%] w-[60%] h-[60%] rounded-full bg-rose-100/50 blur-[140px]"
        />
        {/* Sphere 3: Amber/Sun */}
        <motion.div
          animate={{ x: [0, 120, 0], y: [0, -100, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-[20%] right-[10%] w-[35%] h-[40%] rounded-full bg-amber-100/40 blur-[100px]"
        />
        {/* Sphere 4: Purple/Lavendar */}
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, -60, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 7 }}
          className="absolute bottom-[20%] left-[5%] w-[40%] h-[45%] rounded-full bg-purple-100/40 blur-[110px]"
        />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-white backdrop-blur-xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="relative group flex items-center justify-center p-4">
              {/* Pulsing ambient aura backdrop for the zoomed-in logo */}
              <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-3xl scale-125 animate-pulse" />
              <div className="relative transform hover:scale-105 transition-transform duration-700">
                <BunyanLogo size={180} />
              </div>
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
                initial={{ opacity: 1, height: 0 }}
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
              نظام التوثيق والوصول المركزي - منصة بنيان السحابية. (Enterprise v2.4)<br/>
              جميع الحقوق محفوظة © {new Date().getFullYear()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginScreen;
