'use client';

import React from 'react';
import Link from 'next/link';
import { Repeat, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#111110] border-t border-[#37332E] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#37332E]">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF9B45] text-[#171715] flex items-center justify-center">
                <Repeat className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#F7F5F0]">
                Swap<span className="text-[#FF9B45]">Study</span>
              </span>
            </Link>
            <p className="text-sm sm:text-base text-[#AAA69F] max-w-sm leading-relaxed">
              Peer-to-peer skill exchange for college students. Teach one subject, earn time credits, and learn from verified campus peers without money changing hands.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#65C995] bg-[#22211F] border border-[#37332E] px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              Credit-Protected Escrow Sessions
            </div>
          </div>

          {/* Exchange Links */}
          <div className="md:col-span-2 sm:col-span-4 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5B66B]">Exchange</h4>
            <ul className="space-y-2.5 text-sm text-[#AAA69F]">
              <li>
                <Link href="/skills" className="hover:text-[#F7F5F0] transition-colors">
                  Explore Skills
                </Link>
              </li>
              <li>
                <Link href="/teach" className="hover:text-[#F7F5F0] transition-colors">
                  Offer to Teach
                </Link>
              </li>
              <li>
                <Link href="/credits" className="hover:text-[#F7F5F0] transition-colors">
                  Credit System
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#F7F5F0] transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspace Links */}
          <div className="md:col-span-2 sm:col-span-4 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5B66B]">Workspace</h4>
            <ul className="space-y-2.5 text-sm text-[#AAA69F]">
              <li>
                <Link href="/dashboard" className="hover:text-[#F7F5F0] transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/sessions" className="hover:text-[#F7F5F0] transition-colors">
                  My Sessions
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#F7F5F0] transition-colors">
                  Community Hub
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#F7F5F0] transition-colors">
                  Student Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Quick CTA */}
          <div className="md:col-span-3 space-y-3.5">
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 space-y-3">
              <p className="text-sm font-bold text-[#F7F5F0]">Join Campus Exchange</p>
              <p className="text-xs text-[#AAA69F] leading-relaxed">
                New students receive starter time credits upon signup to book their first learning session.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#171715] bg-[#FF9B45] hover:bg-[#F5B66B] px-4 py-2 rounded-full transition-colors"
              >
                Create Account
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#AAA69F]">
          <p>SwapStudy — Campus Peer Skill Exchange</p>
          <p>Zero cash tuition. Equal time-credit fairness.</p>
        </div>
      </div>
    </footer>
  );
}
