'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowRightLeft,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isDemoMode, allUsers } = useAuth();

  const [email, setEmail] = useState('chandan@swapstudy.edu');
  const [password, setPassword] = useState('demo123456');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123456');
    setIsLoading(true);
    setError(null);
    const res = await login(demoEmail, 'demo123456');
    setIsLoading(false);
    if (res.success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-md w-full space-y-5">
        {/* Brand */}
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-2 mb-1 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-900">
              Swap<span className="text-emerald-600">Study</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sign in to SwapStudy
          </h1>
          <p className="text-xs text-slate-500">
            Access your student skill exchanges, sessions, and credits.
          </p>
        </div>

        {/* Demo Mode Banner */}
        {isDemoMode ? (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Demo Sandbox Mode Active</span>
            </div>
            <p className="text-emerald-700 text-[11px] leading-relaxed">
              Use 1-click student fast login below, or sign in with any student email.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px]">Supabase Auth connected.</span>
          </div>
        )}

        {/* Card Form */}
        <div className="card-subtle rounded-xl p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Email (.edu or campus email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Min 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Fast Logins */}
          {isDemoMode && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                1-Click Fast Student Demo Login
              </span>
              <div className="space-y-1.5">
                {allUsers.slice(0, 3).map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(u.email)}
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200/70 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors text-left text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-800 text-[11px]">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.major} • {u.credits} Cr</p>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-semibold text-[11px]">Sign in →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          New to SwapStudy?{' '}
          <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700 underline">
            Create account & get 3 starter credits
          </Link>
        </p>
      </div>
    </div>
  );
}
