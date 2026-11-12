'use client';

import React from 'react';
import Link from 'next/link';
import { Repeat, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#E6E3DA] border-t-[1.5px] border-[#4A4E57] mt-auto text-[#1F2227]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#B9B4A8]">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="inline-flex items-center gap-2 bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] rounded-lg px-3 py-1.5 shadow-[2px_2px_0_#B9B4A8]">
                <Repeat className="w-4 h-4 stroke-[2.5] text-[#1F2227]" />
                <span className="font-extrabold text-lg tracking-tight text-[#1F2227]">
                  SwapStudy!
                </span>
              </div>
            </Link>
            <p className="text-sm sm:text-base text-[#464B55] max-w-sm leading-relaxed">
              Peer-to-peer skill exchange for college students. Teach one subject, earn time credits, and learn from verified campus peers without money changing hands.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#195434] bg-[#DCF2E4] border border-[#47785B] px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
              Credit-Protected Escrow Sessions
            </div>
          </div>

          {/* Exchange Links */}
          <div className="md:col-span-2 sm:col-span-4 space-y-3.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#2F4D96]">
              Exchange
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-[#464B55]">
              <li>
                <Link href="/skills" className="hover:text-[#1F2227] transition-colors">
                  Explore Skills
                </Link>
              </li>
              <li>
                <Link href="/teach" className="hover:text-[#1F2227] transition-colors">
                  Offer to Teach
                </Link>
              </li>
              <li>
                <Link href="/credits" className="hover:text-[#1F2227] transition-colors">
                  Credit System
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#1F2227] transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspace Links */}
          <div className="md:col-span-2 sm:col-span-4 space-y-3.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#2F4D96]">
              Workspace
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-[#464B55]">
              <li>
                <Link href="/dashboard" className="hover:text-[#1F2227] transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/sessions" className="hover:text-[#1F2227] transition-colors">
                  My Sessions
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#1F2227] transition-colors">
                  Community Hub
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#1F2227] transition-colors">
                  Student Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Quick CTA */}
          <div className="md:col-span-3 space-y-3.5">
            <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 space-y-3">
              <p className="text-sm font-extrabold text-[#1F2227]">Join Campus Exchange</p>
              <p className="text-xs text-[#464B55] leading-relaxed">
                New students receive starter time credits upon signup to book their first learning session.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFFFFF] bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] px-4 py-2 rounded-lg transition-colors"
              >
                Create Account
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#464B55]">
          <p>SWAPSTUDY // CAMPUS PEER SKILL EXCHANGE</p>
          <p>ZERO CASH TUITION · EQUAL TIME-CREDIT FAIRNESS</p>
        </div>
      </div>
    </footer>
  );
}
