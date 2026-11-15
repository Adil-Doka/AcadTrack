import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { HeroIllustration } from '@/components/doodles/HeroIllustration';
import { useAuthStore } from '@/stores/authStore';
import {
  ArrowRight,
  CheckCircle2,
  Users,
  FolderOpen,
  Calendar,
  Award,
  Sparkles,
  GitBranch,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [emailInput, setEmailInput] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register', { state: { email: emailInput } });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#20144d] selection:text-white">
      {/* ────────────────── TOP NAVIGATION (Matches Reference Image) ────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <BrandLogo textSize="lg" />

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <a href="#home" className="text-slate-900 font-semibold hover:text-[#20144d] transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-[#20144d] transition-colors">
              About Us
            </a>
            <a href="#resources" className="hover:text-[#20144d] transition-colors">
              Resources
            </a>
            <a href="#features" className="hover:text-[#20144d] transition-colors">
              Features
            </a>
            <a href="#contact" className="hover:text-[#20144d] transition-colors">
              Contact Us
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-lg bg-[#20144d] text-white text-xs sm:text-sm font-bold hover:bg-[#2b1b6d] transition-all shadow-sm hover:shadow flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-lg border border-slate-700 text-slate-900 text-xs sm:text-sm font-semibold tracking-wider hover:bg-slate-50 transition-colors uppercase"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-lg bg-[#20144d] text-white text-xs sm:text-sm font-semibold tracking-wider hover:bg-[#2e1d6d] transition-all shadow-md uppercase"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ────────────────── HERO SECTION (Matches Reference Image) ────────────────── */}
      <section id="home" className="relative pt-12 pb-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Explore new skills from <br className="hidden sm:inline" />
              <span className="text-[#f59e0b]">your passions</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              Find your true passion by joining our project workspace. We have 100+ capstone tracks that
              can help you to get what you really want for your bright future.
            </p>
          </motion.div>

          {/* Email / PNR Input Box CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 max-w-md mx-auto"
          >
            <form
              onSubmit={handleGetStarted}
              className="flex items-center p-1.5 bg-white border border-slate-300 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] focus-within:border-[#20144d] focus-within:ring-2 focus-within:ring-[#20144d]/10 transition-all"
            >
              <input
                type="text"
                placeholder="Your Email or PNR here..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                className="shrink-0 px-5 py-2.5 bg-[#20144d] hover:bg-[#2b1b6d] text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
              >
                Get Started Free
              </button>
            </form>
          </motion.div>

          {/* ────────────────── ANIMATED DOODLE SCENE ────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </section>

      {/* ────────────────── FEATURES BENTO SECTION ────────────────── */}
      <section id="features" className="py-20 bg-slate-50/70 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold text-[#f59e0b] tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Powerful Academic Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Everything you need for seamless project management
            </h2>
            <p className="text-sm text-slate-500 mt-3">
              Eliminate email trails and scattered spreadsheets. A single workspace for students and project coordinators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#20144d] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Team Formation & Approvals</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Assemble project cohorts with 2–4 student members. Leaders manage invites with automatic validation by coordinators.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#f59e0b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">GitHub Metrics Sync</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Sync live repository commits, stars, contributor velocity, and pull requests directly into your academic dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Criterion-Based Grading</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Objective scoring across technical depth, innovation, presentation, and documentation with structured feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── WORKFLOW / HOW IT WORKS ────────────────── */}
      <section id="resources" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">How AcadTrack Works</h2>
            <p className="text-sm text-slate-500 mt-2">
              Three simple steps to transition from project idea to published honors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-[#20144d] text-white font-bold flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Create Team & Proposal</h4>
              <p className="text-xs text-slate-500">
                Form your group, define scope & tech stack, and submit for coordinator clearance.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white font-bold flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Submit Deliverables</h4>
              <p className="text-xs text-slate-500">
                Upload synopsis reports, architecture diagrams, and code archives before deadlines.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Track Rubric Grades</h4>
              <p className="text-xs text-slate-500">
                View criteria-wise marks, coordinator comments, and aggregate percentage in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── CALL TO ACTION ────────────────── */}
      <section id="contact" className="py-16 bg-[#20144d] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to lead your project with confidence?
          </h2>
          <p className="mt-3 text-slate-300 text-sm max-w-lg mx-auto">
            Join thousands of university engineering and computer science students actively tracking their milestones.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3 bg-[#f59e0b] hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95"
            >
              Register Account Now
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-sm border border-white/20 transition-all"
            >
              Coordinator Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="py-10 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <BrandLogo textSize="sm" />
          <p>© 2026 AcadTrack · Academic Project & Capstone Management System. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#home" className="hover:text-slate-900">Privacy</a>
            <a href="#home" className="hover:text-slate-900">Terms</a>
            <a href="#contact" className="hover:text-slate-900">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
