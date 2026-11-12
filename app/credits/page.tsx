'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Repeat,
  Clock,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';

export default function CreditsWalletPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { transactions, isLoading: appLoading } = useApp();
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');

  const userTransactions = useMemo(() => {
    if (!user) return [];
    return transactions.filter((t) => t.userId === user.id);
  }, [transactions, user]);

  const totalEarned = useMemo(
    () => userTransactions.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0),
    [userTransactions]
  );

  const totalSpent = useMemo(
    () =>
      userTransactions
        .filter((t) => t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0),
    [userTransactions]
  );

  const filteredTransactions = useMemo(() => {
    if (filter === 'earned') return userTransactions.filter((t) => t.amount > 0);
    if (filter === 'spent') return userTransactions.filter((t) => t.amount < 0);
    return userTransactions;
  }, [userTransactions, filter]);

  const faqs = [
    {
      q: 'How are time credits valued?',
      a: '1 Credit represents one standard peer learning session hour (typically 45–60 minutes). Mentors can list skills at 1–3 credits depending on prep depth.',
    },
    {
      q: 'What happens when a session request is pending?',
      a: 'Your credit is held safely in SwapStudy escrow rather than sent immediately. If the teacher declines or you cancel before completion, the escrow is refunded automatically.',
    },
    {
      q: 'How do mutual swaps affect credit balances?',
      a: 'Both sessions use symmetric escrow protection. Once both sessions are completed, each student pays 1 credit for learning and earns 1 credit for teaching—resulting in zero net cost.',
    },
    {
      q: 'How do I earn more credits when my balance is low?',
      a: 'Publish a skill listing under Offer to Teach. Whenever a classmate books your listing and completes the session, credits transfer directly into your wallet.',
    },
  ];

  if (authLoading || appLoading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-44 rounded-3xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
        <div className="h-80 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
          Time-Credit Economy
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2227]">
          Credit Wallet & Ledger
        </h1>
        <p className="text-sm sm:text-base text-[#464B55] max-w-2xl">
          Track earned credits, escrow holds, refunds, and session settlements across every exchange.
        </p>
      </div>

      {/* Balance Overview Banner */}
      {user ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 hero-synth-cobalt bg-[#3B5CA8] text-[#FFFFFF] border-[1.5px] border-[#2C437A] rounded-2xl p-7 flex flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#EDF2FF]">
                Current Available Balance
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#25282E] border border-[#4A4E57] text-xs font-mono font-bold text-[#7AD6A1]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7AD6A1]" />
                Escrow Protected
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-extrabold text-[#FFFFFF] tabular-nums">
                {user.credits}
              </span>
              <span className="font-mono text-lg font-bold text-[#DCEB8E]">Time Credits</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/teach"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#F4DC82] hover:bg-[#EDD066] border-[1.5px] border-[#25282E] shadow-[0_2.5px_0_#25282E] text-[#1F2227] text-xs font-mono font-bold transition-colors"
              >
                Earn Credits Teaching
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/skills"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#EFECE4] border-[1.5px] border-[#25282E] shadow-[0_2.5px_0_#25282E] text-[#1F2227] text-xs font-mono font-bold transition-colors"
              >
                Spend on Sessions
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 flex flex-col justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#DCF2E4] border border-[#47785B] text-[#195434] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#464B55]">
                  Lifetime Earned
                </p>
                <p className="text-3xl font-extrabold text-[#195434] mt-1 tabular-nums">
                  +{totalEarned}
                </p>
                <p className="text-xs text-[#464B55] mt-1">
                  Includes onboarding bonus, teaching & refunds
                </p>
              </div>
            </div>

            <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 flex flex-col justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#DCEB8E] border border-[#4A4E57] text-[#1F2227] flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#464B55]">
                  Total Escrow & Spent
                </p>
                <p className="text-3xl font-extrabold text-[#1F2227] mt-1 tabular-nums">
                  -{totalSpent}
                </p>
                <p className="text-xs text-[#464B55] mt-1">
                  Reserved across learning bookings
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1F2227]">Track your live credit ledger</h2>
            <p className="text-sm text-[#464B55]">
              Log in or create a free student account to view your credit balance and session ledger.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-[#1F2227] text-sm font-semibold"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}

      {/* 3 Economy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-3">
          <Clock className="w-6 h-6 text-[#2F4D96]" />
          <h2 className="text-lg font-bold text-[#1F2227]">Equal Time Value</h2>
          <p className="text-sm text-[#464B55] leading-relaxed">
            Every hour spent mentoring counts equally across coding, design, writing, and core academics.
          </p>
        </div>

        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-3">
          <ShieldCheck className="w-6 h-6 text-[#195434]" />
          <h2 className="text-lg font-bold text-[#1F2227]">Escrow Refunds</h2>
          <p className="text-sm text-[#464B55] leading-relaxed">
            Credits stay locked until session completion and are returned automatically on declines or cancellations.
          </p>
        </div>

        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-3">
          <Repeat className="w-6 h-6 text-[#9E3922]" />
          <h2 className="text-lg font-bold text-[#1F2227]">Reciprocal Swaps</h2>
          <p className="text-sm text-[#464B55] leading-relaxed">
            Swap skills directly with a peer so both sessions balance out to zero net credit cost.
          </p>
        </div>
      </div>

      {/* Transaction Ledger */}
      {user && (
        <section className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#1F2227]">Transaction History</h2>

            <div className="inline-flex p-1 rounded-full bg-[#EFECE4] border border-[#4A4E57] self-start">
              {[
                { key: 'all', label: 'All' },
                { key: 'earned', label: 'Earned / Refunds' },
                { key: 'spent', label: 'Escrow / Spent' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key as 'all' | 'earned' | 'spent')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    filter === tab.key
                      ? 'bg-[#3B5CA8] text-[#FFFFFF]'
                      : 'text-[#464B55] hover:text-[#1F2227]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-[#CEC9BC]">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        tx.amount >= 0
                          ? 'bg-[#DCF2E4] border-[#47785B] text-[#195434]'
                          : 'bg-[#FCE7E3] border-[#B34B39] text-[#8F2618]'
                      }`}
                    >
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-[#1F2227] truncate">
                        {tx.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#464B55] mt-0.5">{tx.description}</p>
                      <p className="text-xs text-[#464B55] mt-1">{tx.date}</p>
                    </div>
                  </div>

                  <span
                    className={`text-lg font-extrabold tabular-nums shrink-0 ${
                      tx.amount >= 0 ? 'text-[#195434]' : 'text-[#8F2618]'
                    }`}
                  >
                    {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} Cr
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[#464B55]">
              No transactions found in this category yet.
            </div>
          )}
        </section>
      )}

      {/* FAQs */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#1F2227] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#2F4D96]" />
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 space-y-2"
            >
              <h3 className="text-base font-bold text-[#1F2227]">{item.q}</h3>
              <p className="text-sm text-[#464B55] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
