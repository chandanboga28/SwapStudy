import React from 'react';
import Link from 'next/link';
import { ArrowRightLeft, Shield, GraduationCap, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Swap<span className="text-emerald-600">Study</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Student-to-student skill exchange. Teach what you know, earn platform credits, and learn from peers without spending money.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-medium border border-emerald-200/60">
              <GraduationCap className="w-3 h-3 text-emerald-600" />
              100% Peer-to-Peer
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <Link href="/skills" className="hover:text-emerald-600 transition-colors">
                  Explore Skills
                </Link>
              </li>
              <li>
                <Link href="/teach" className="hover:text-emerald-600 transition-colors">
                  Offer to Teach
                </Link>
              </li>
              <li>
                <Link href="/credits" className="hover:text-emerald-600 transition-colors">
                  Credit Economy & Ledger
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-emerald-600 transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Hub */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3">Student Hub</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/sessions" className="hover:text-emerald-600 transition-colors">
                  My Booked Sessions
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-emerald-600 transition-colors">
                  Profile & Skills
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-600 transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Values */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3">Our Motto</h4>
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
              <p className="text-xs font-semibold text-slate-900">
                &ldquo;Learn a skill. Teach a skill. Grow together.&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Every student has something valuable to teach and something exciting to learn. We eliminate financial barriers to peer tutoring.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 SwapStudy Inc. Built for university students everywhere.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-500">
              <Shield className="w-3 h-3 text-emerald-600" />
              Verified Student Network
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Credit-Based Guarantee
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
