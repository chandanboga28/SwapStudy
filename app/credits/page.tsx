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
        <div className="h-44 rounded-3xl bg-[#22211F] border border-[#37332E] animate-pulse" />
        <div className="h-80 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
          Time-Credit Economy
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F5F0]">
          Credit Wallet & Ledger
        </h1>
        <p className="text-sm sm:text-base text-[#AAA69F] max-w-2xl">
          Track earned credits, escrow holds, refunds, and session settlements across every exchange.
        </p>
      </div>

      {/* Balance Overview Banner */}
      {user ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 hero-bronze rounded-3xl p-7 flex flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F7F5F0]/80">
                Current Available Balance
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171715]/30 border border-[#F7F5F0]/20 text-xs font-bold text-[#F7F5F0]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#65C995]" />
                Escrow Protected
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-extrabold text-[#F7F5F0] tabular-nums">
                {user.credits}
              </span>
              <span className="text-lg font-bold text-[#FF9B45]">Time Credits</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/teach"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors"
              >
                Earn Credits Teaching
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/skills"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#171715]/35 hover:bg-[#171715]/55 border border-[#F7F5F0]/20 text-[#F7F5F0] text-sm font-semibold transition-colors"
              >
                Spend on Sessions
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 flex flex-col justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#65C995]/15 border border-[#65C995]/30 text-[#65C995] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
                  Lifetime Earned
                </p>
                <p className="text-3xl font-extrabold text-[#65C995] mt-1 tabular-nums">
                  +{totalEarned}
                </p>
                <p className="text-xs text-[#AAA69F] mt-1">
                  Includes onboarding bonus, teaching & refunds
                </p>
              </div>
            </div>

            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 flex flex-col justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#FF9B45]/15 border border-[#FF9B45]/30 text-[#FF9B45] flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
                  Total Escrow & Spent
                </p>
                <p className="text-3xl font-extrabold text-[#F7F5F0] mt-1 tabular-nums">
                  -{totalSpent}
                </p>
                <p className="text-xs text-[#AAA69F] mt-1">
                  Reserved across learning bookings
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#F7F5F0]">Track your live credit ledger</h2>
            <p className="text-sm text-[#AAA69F]">
              Log in or create a free student account to view your credit balance and session ledger.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-full bg-[#2B2824] border border-[#37332E] text-[#F7F5F0] text-sm font-semibold"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}

      {/* 3 Economy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-3">
          <Clock className="w-6 h-6 text-[#FF9B45]" />
          <h2 className="text-lg font-bold text-[#F7F5F0]">Equal Time Value</h2>
          <p className="text-sm text-[#AAA69F] leading-relaxed">
            Every hour spent mentoring counts equally across coding, design, writing, and core academics.
          </p>
        </div>

        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-3">
          <ShieldCheck className="w-6 h-6 text-[#65C995]" />
          <h2 className="text-lg font-bold text-[#F7F5F0]">Escrow Refunds</h2>
          <p className="text-sm text-[#AAA69F] leading-relaxed">
            Credits stay locked until session completion and are returned automatically on declines or cancellations.
          </p>
        </div>

        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-3">
          <Repeat className="w-6 h-6 text-[#F5B66B]" />
          <h2 className="text-lg font-bold text-[#F7F5F0]">Reciprocal Swaps</h2>
          <p className="text-sm text-[#AAA69F] leading-relaxed">
            Swap skills directly with a peer so both sessions balance out to zero net credit cost.
          </p>
        </div>
      </div>

      {/* Transaction Ledger */}
      {user && (
        <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#F7F5F0]">Transaction History</h2>

            <div className="inline-flex p-1 rounded-full bg-[#171715] border border-[#37332E] self-start">
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
                      ? 'bg-[#FF9B45] text-[#171715]'
                      : 'text-[#AAA69F] hover:text-[#F7F5F0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-[#37332E]">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        tx.amount >= 0
                          ? 'bg-[#65C995]/15 border-[#65C995]/30 text-[#65C995]'
                          : 'bg-[#F07878]/15 border-[#F07878]/30 text-[#F07878]'
                      }`}
                    >
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-[#F7F5F0] truncate">
                        {tx.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#AAA69F] mt-0.5">{tx.description}</p>
                      <p className="text-xs text-[#AAA69F]/80 mt-1">{tx.date}</p>
                    </div>
                  </div>

                  <span
                    className={`text-lg font-extrabold tabular-nums shrink-0 ${
                      tx.amount >= 0 ? 'text-[#65C995]' : 'text-[#F07878]'
                    }`}
                  >
                    {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} Cr
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[#AAA69F]">
              No transactions found in this category yet.
            </div>
          )}
        </section>
      )}

      {/* FAQs */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#F7F5F0] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#FF9B45]" />
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 space-y-2"
            >
              <h3 className="text-base font-bold text-[#F7F5F0]">{item.q}</h3>
              <p className="text-sm text-[#AAA69F] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
