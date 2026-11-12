'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Repeat,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const { user, allUsers, login, switchDemoUser, isDemoMode, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid email or password.');
        return;
      }
      router.push('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoQuickLogin = (userId: string) => {
    switchDemoUser(userId);
    router.push('/dashboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 bg-[#171715]">
      <div className="w-full max-w-md space-y-6">
        {/* Card */}
        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-7 sm:p-8 shadow-2xl space-y-7">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-[#FF9B45] text-[#171715] flex items-center justify-center">
              <Repeat className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F7F5F0] tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm sm:text-base text-[#AAA69F] mt-1">
                Sign in to access your SwapStudy sessions, matches, and credit wallet.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Student Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@adypu.edu.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-sm text-[#F07878]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] disabled:opacity-50 text-[#171715] text-base font-bold transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Mode Quick Switch */}
          {isDemoMode && allUsers.length > 0 && (
            <div className="pt-5 border-t border-[#37332E] space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#F5B66B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Demo Preview Accounts
              </p>
              <div className="space-y-2">
                {allUsers.slice(0, 3).map((demoUser) => (
                  <button
                    key={demoUser.id}
                    type="button"
                    onClick={() => handleDemoQuickLogin(demoUser.id)}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={demoUser.avatar}
                        alt={demoUser.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#37332E] bg-[#171715]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#F7F5F0] truncate">{demoUser.name}</p>
                        <p className="text-xs text-[#AAA69F] truncate">{demoUser.major}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#FF9B45] shrink-0">
                      {demoUser.credits} Cr
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-sm text-[#AAA69F]">
            New to SwapStudy?{' '}
            <Link href="/signup" className="font-bold text-[#FF9B45] hover:text-[#F5B66B]">
              Create a student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
