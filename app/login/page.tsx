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
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Card */}
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[4px_4px_0_#C5C0B4] rounded-2xl p-7 sm:p-8 space-y-7">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] shadow-[2px_2px_0_#B9B4A8] text-[#1F2227] flex items-center justify-center">
                <Repeat className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#25282E] text-[#CCE27A] border border-[#4A4E57]">
                AUTH_CONSOLE
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2227] tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm sm:text-base text-[#464B55] mt-1">
                Sign in to access your SwapStudy sessions, matches, and credit wallet.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2F4D96] mb-2">
                Student Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@adypu.edu.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-[15px] text-[#1F2227] placeholder-[#5A606B] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2F4D96] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-[15px] text-[#1F2227] placeholder-[#5A606B] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-sm font-medium text-[#8F2618]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] disabled:opacity-50 border-[1.5px] border-[#2A3F75] shadow-[0_2.5px_0_#2A3F75] text-[#FFFFFF] text-base font-bold transition-colors cursor-pointer"
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
            <div className="pt-5 border-t border-[#CEC9BC] space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#2F4D96] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Demo Preview Accounts
              </p>
              <div className="space-y-2">
                {allUsers.slice(0, 3).map((demoUser) => (
                  <button
                    key={demoUser.id}
                    type="button"
                    onClick={() => handleDemoQuickLogin(demoUser.id)}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#E6E3DA] hover:bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={demoUser.avatar}
                        alt={demoUser.name}
                        className="w-8 h-8 rounded-lg object-cover border border-[#4A4E57] bg-[#F8F6F0]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1F2227] truncate">{demoUser.name}</p>
                        <p className="text-xs text-[#464B55] truncate">{demoUser.major}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#25282E] text-[#CCE27A] shrink-0">
                      {demoUser.credits} Cr
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-sm text-[#464B55]">
            New to SwapStudy?{' '}
            <Link href="/signup" className="font-bold text-[#2F4D96] hover:underline">
              Create a student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
