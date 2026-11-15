import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const RegisterPage: React.FC = () => {
  const location = useLocation();
  const prefilledEmail = (location.state as any)?.email || '';

  const [form, setForm] = useState({
    pnr: '',
    name: '',
    email: prefilledEmail,
    password: '',
    department: 'Computer Science',
    role: 'STUDENT',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: any) => {
      const userObj = data.user || {
        pnr: data.pnr || form.pnr,
        name: data.name || form.name,
        email: data.email || form.email,
        role: data.role || form.role,
        department: data.department || form.department,
      };
      login(data.token, userObj);
      toast.success(`Welcome, ${userObj.name}! Your account has been created.`);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Registration failed. Please check your details.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(form);
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#20144d] selection:text-white flex flex-col justify-between">
      {/* ────────────────── TOP NAVIGATION ────────────────── */}
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
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Already registered?</span>
            <Link
              to="/login"
              className="px-5 py-2 rounded-lg border border-slate-700 text-slate-900 text-xs sm:text-sm font-semibold tracking-wider hover:bg-slate-50 transition-colors uppercase"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* ────────────────── MAIN REGISTER STAGE ────────────────── */}
      <main className="relative flex-1 flex items-center justify-center py-12 px-6 sm:px-10 overflow-hidden">
        {/* Subtle background dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #1e293b 1.5px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Floating Doodles */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-3, 2, -3] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden lg:flex absolute top-16 left-12 xl:left-28 z-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.06)] border border-slate-100 items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Instant Team Invite</h4>
            <p className="text-[10px] text-slate-400">Join via your PNR</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="hidden lg:flex absolute bottom-20 right-12 xl:right-28 z-10 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.06)] border border-slate-100 items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-800">100% Free for Students</span>
        </motion.div>

        {/* ────── CENTER REGISTER CARD ────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg relative z-20"
        >
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-[0_16px_50px_rgba(0,0,0,0.06)]">
            {/* Header */}
            <div className="text-center mb-6">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#f59e0b] bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
                Student & Coordinator Registration
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Create your <span className="text-[#f59e0b]">Account</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                Join your university workspace to propose projects and track marks
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  label="PNR Number"
                  type="text"
                  placeholder="e.g. STU2026001"
                  value={form.pnr}
                  onChange={(e) => update('pnr', e.target.value)}
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="alex.johnson@university.edu"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Department"
                  type="text"
                  placeholder="Computer Science"
                  value={form.department}
                  onChange={(e) => update('department', e.target.value)}
                  required
                />
                <Select
                  label="Role"
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  options={[
                    { value: 'STUDENT', label: 'Student' },
                    { value: 'COORDINATOR', label: 'Coordinator' },
                  ]}
                />
              </div>

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a secure password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
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
                className="w-full h-11 bg-[#20144d] hover:bg-[#2e1d6d] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 mt-2"
                loading={isPending}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Complete Registration
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#20144d] font-bold hover:underline">
                Log In here
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="py-6 border-t border-slate-100 bg-white text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <BrandLogo textSize="sm" />
          <p>© 2026 AcadTrack · University Capstone & Project Management. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-slate-600">Home</Link>
            <Link to="/login" className="hover:text-slate-600">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
