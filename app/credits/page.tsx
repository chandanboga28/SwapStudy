'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  HelpCircle,
  Repeat,
  Lock,
} from 'lucide-react';

export default function CreditsPage() {
  const { user } = useAuth();
  const { transactions } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'earned' | 'spent'>('all');

  const userTransactions = transactions.filter((t) => {
    if (!user) return true;
    return t.userId === user.id;
  });

  const filteredTransactions = userTransactions.filter((tx) => {
    if (filterType === 'earned') return tx.amount > 0;
    if (filterType === 'spent') return tx.amount < 0;
    return true;
  });

  const totalEarned = userTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = Math.abs(
    userTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  return (
    <div className="min-h-screen py-8 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center sm:text-left space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-800">
            <Coins className="w-3 h-3 text-emerald-600" />
            <span>Platform Credit Economy & Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Credits Work
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            SwapStudy uses non-monetary platform credits—not real money—so every student can trade tutoring hours fairly. Teach classmates to earn credits, then spend them to learn any skill on campus.
          </p>
        </div>

        {/* User Balance Strip */}
        {user && (
          <div className="card-subtle rounded-xl p-5 sm:p-6 bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200/70">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Your Current Balance
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{user.credits}</span>
                  <span className="text-xs font-semibold text-emerald-700">Credits Available</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enables {user.credits} hour(s) of peer tutoring sessions
                </p>
              </div>

              <div className="flex items-center gap-6 border-y sm:border-y-0 sm:border-x border-slate-100 py-3 sm:py-0 sm:px-6">
                <div>
                  <span className="text-[11px] text-slate-400">Lifetime Earned</span>
                  <p className="text-base font-bold text-emerald-600">+{totalEarned} Cr</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Lifetime Spent</span>
                  <p className="text-base font-bold text-slate-700">-{totalSpent} Cr</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/teach"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs text-center shadow-2xs"
                >
                  Earn More
                </Link>
                <Link
                  href="/skills"
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs text-center hover:bg-slate-50"
                >
                  Spend Credits
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* The 3 Pillars of SwapStudy Economy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card-subtle rounded-xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">1:1 Fair Exchange</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every 1 hour you spend teaching earns you 1-3 platform credits. That exact amount allows you to book 1 hour of mentoring in another subject.
            </p>
          </div>

          <div className="card-subtle rounded-xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">3 Starter Bonus Credits</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every student gets 3 complimentary credits upon joining, solving the cold-start problem so you can immediately experience learning from peers.
            </p>
          </div>

          <div className="card-subtle rounded-xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Escrow Quality Guarantee</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              When booking a session, credits are placed in secure escrow. They are only transferred to the teacher after you confirm the session was delivered.
            </p>
          </div>
        </div>

        {/* Ledger Transaction History */}
        <div className="card-subtle rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Credit Transaction Audit Trail
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every credit earned, spent, or refunded is immutably recorded below.
              </p>
            </div>

            <div className="flex items-center gap-1">
              {(['all', 'earned', 'spent'] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                    filterType === ft
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {!user ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-2.5">
                <p className="text-xs font-semibold text-slate-900">Sign in to inspect your personal credit ledger</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Every student receives 3 non-monetary starter platform credits upon signup and can track earned, held, and refunded credits here.
                </p>
                <Link
                  href="/login"
                  className="inline-flex px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Sign In
                </Link>
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-xs truncate">{tx.title}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{tx.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold ${
                          isPositive ? 'text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} Credits
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-800">No matching transactions yet</p>
                <p className="text-[11px] text-slate-500">
                  Book a session or publish a skill listing to start earning and exchanging platform credits.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card-subtle rounded-xl p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Frequently Asked Questions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-600">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 text-xs">Can I purchase credits with real money?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                No. SwapStudy is intentionally non-monetary. The only way to obtain additional credits is by teaching your peers or referring active student contributors.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 text-xs">What happens if a tutor doesn&apos;t show up?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If a session is declined or cancelled, your credits are immediately refunded back into your active wallet balance with zero penalty.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 text-xs">How many credits should I charge?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Standard peer reviews and foundational courses are usually 1 or 2 credits per hour. Specialized topics like advanced algorithms or portfolio reviews can be 3 credits.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 text-xs">Do my credits expire?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Credits remain active indefinitely as long as you maintain an active student profile on SwapStudy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
