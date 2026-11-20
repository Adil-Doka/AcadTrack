import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const LoginPage: React.FC = () => {
  const [pnr, setPnr] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: any) => {
      const userObj = data.user || {
        pnr: data.pnr,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department || '',
      };
      login(data.token, userObj);
      toast.success(`Welcome back, ${userObj.name || userObj.pnr}!`);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      let msg =
        err.response?.data?.message ||
        (err.response?.data?.fieldErrors ? Object.values(err.response.data.fieldErrors)[0] : null);

      if (!msg) {
        if (err.message === 'Network Error' || !err.response) {
          msg = 'Cannot connect to backend server. Please ensure the backend is running on http://localhost:8080.';
        } else {
          msg = err.message || 'Invalid credentials';
        }
      }
      toast.error(msg as string);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnr || !password) return;
    mutate({ pnr, password });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#20144d] selection:text-white flex flex-col justify-between">
      {/* ────────────────── TOP NAVIGATION (Same as Home Page) ────────────────── */}
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <BrandLogo textSize="lg" />

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <Link to="/#features" className="hover:text-slate-900 transition-colors">
              Features
            </Link>
            <Link to="/#resources" className="hover:text-slate-900 transition-colors">
              Workflow
            </Link>
            <Link to="/#contact" className="hover:text-slate-900 transition-colors">
              Support
            </Link>
          </nav>

          {/* Top Right Action Button */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">New student?</span>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-lg bg-[#20144d] text-white text-xs sm:text-sm font-semibold tracking-wider hover:bg-[#2e1d6d] transition-all shadow-md uppercase"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ────────────────── MAIN LOGIN STAGE (Clean White with Floating Doodles) ────────────────── */}
      <main className="relative flex-1 flex items-center justify-center py-12 px-6 sm:px-10 overflow-hidden">
        {/* Subtle background dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #1e293b 1.5px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* ────── FLOATING DOODLE CARDS AROUND LOGIN CARD ────── */}
        {/* Floating "Completed" Badge (Top-Left) */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-4, -2, -4] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden lg:block absolute top-16 left-16 xl:left-32 z-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.06)] border border-slate-100 w-44"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-extrabold text-slate-800">Verified Access</h4>
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 bg-slate-200 rounded-full w-4/5" />
            <div className="h-1.5 bg-slate-100 rounded-full w-3/5" />
          </div>
        </motion.div>

        {/* Floating Emoji Pill (Top-Right) */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [3, 1, 3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="hidden lg:flex absolute top-20 right-16 xl:right-32 z-10 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.06)] border border-slate-100 items-center gap-2"
        >
          <span className="text-xl">😊</span>
          <span className="text-xl">🚀</span>
          <span className="text-xl">🎯</span>
        </motion.div>

        {/* Floating Tracks Pill (Bottom-Left) */}
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="hidden lg:flex absolute bottom-20 left-16 xl:left-36 z-10 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-slate-100 items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 leading-tight">120+ Tracks</h5>
            <p className="text-[10px] text-slate-400">University Approved</p>
          </div>
        </motion.div>

        {/* Floating Orange Diamond (Bottom-Right) */}
        <motion.div
          animate={{ rotate: [45, 65, 45], scale: [1, 1.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden lg:block absolute bottom-24 right-24 xl:right-40 z-10 w-4 h-4 bg-amber-500 rounded-sm shadow-sm"
        />

        {/* Floating Indigo Dot */}
        <div className="hidden lg:block absolute bottom-36 right-72 z-10 w-3 h-3 rounded-full bg-[#20144d]" />

        {/* ────── CENTER LOGIN CARD ────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md relative z-20"
        >
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-[0_16px_50px_rgba(0,0,0,0.06)]">
            {/* Header Badge */}
            <div className="text-center mb-6">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#f59e0b] bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
                Project Portal
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Log In to <span className="text-[#f59e0b]">AcadTrack</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                Sign in with your University PNR and password
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="PNR Number"
                type="text"
                placeholder="e.g. COORD001 or STU2026001"
                value={pnr}
                onChange={(e) => setPnr(e.target.value)}
                required
                autoFocus
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                className="w-full h-11 bg-[#20144d] hover:bg-[#2b1b6d] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 mt-2"
                loading={isPending}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Account
              </Button>
            </form>

            {/* Switch to Register */}
            <div className="mt-6 text-center text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-[#20144d] font-bold hover:underline">
                Sign up free
              </Link>
            </div>

            {/* Quick Demo Credentials Pill */}
            <div className="mt-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Coordinator Demo Credentials:</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                <span>PNR: <strong className="text-slate-800">COORD001</strong></span>
                <span>Pass: <strong className="text-slate-800">Coordinator@123</strong></span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ────────────────── FOOTER (Same as Home Page) ────────────────── */}
      <footer className="py-6 border-t border-slate-100 bg-white text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <BrandLogo textSize="sm" />
          <p>© 2026 AcadTrack · University Capstone & Project Management. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-slate-600">Home</Link>
            <Link to="/register" className="hover:text-slate-600">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
