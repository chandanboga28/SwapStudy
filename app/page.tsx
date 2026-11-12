'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Skill } from '@/types';
import SkillCard from '@/components/SkillCard';
import BookingModal from '@/components/BookingModal';
import {
  ArrowUpRight,
  ArrowRight,
  Repeat,
  Coins,
  BookOpen,
  ShieldCheck,
  Video,
  Sparkles,
  Users,
  CheckCircle2,
  Code2,
  Palette,
  Calculator,
  Briefcase,
  Film,
  PenTool,
  Star,
} from 'lucide-react';

const SUBJECT_AREAS = [
  { name: 'Programming & Tech', icon: Code2 },
  { name: 'Design & Creative', icon: Palette },
  { name: 'Academics & Science', icon: Calculator },
  { name: 'Business & Career', icon: Briefcase },
  { name: 'Media & Production', icon: Film },
  { name: 'Language & Writing', icon: PenTool },
];

export default function LandingPage() {
  const { skills, isLoading: skillsLoading } = useApp();
  const { user, allUsers } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const featuredSkills = skills.slice(0, 6);
  const activePeers = allUsers.slice(0, 4);

  return (
    <div className="bg-[#171715] text-[#F7F5F0]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22211F] border border-[#37332E] text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
              <Sparkles className="w-3.5 h-3.5" />
              Campus Time-Credit Skill Exchange
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight text-[#F7F5F0] leading-[1.08]">
              Learn a skill.{' '}
              <span className="text-[#FF9B45]">Teach a skill.</span>{' '}
              Grow together.
            </h1>

            <p className="text-base sm:text-lg text-[#AAA69F] leading-relaxed max-w-xl">
              SwapStudy replaces costly tutoring with an equal-footing student exchange. Teach 1 hour of what you know, earn time credits, and book verified 1-on-1 peer sessions across your campus.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-base font-bold transition-colors"
                >
                  Open Workspace
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-base font-bold transition-colors"
                >
                  Start Swapping Free
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              )}

              <Link
                href="/skills"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-[#F7F5F0] text-base font-semibold transition-colors"
              >
                Explore Marketplace
                <ArrowRight className="w-4 h-4 text-[#AAA69F]" />
              </Link>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-sm text-[#AAA69F]">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#65C995]" />
                Escrow-protected bookings
              </span>
              <span className="inline-flex items-center gap-2">
                <Video className="w-4 h-4 text-[#F5B66B]" />
                Integrated Google Meet links
              </span>
            </div>
          </div>

          {/* Right LearnWell-Inspired Editorial Showcase Panel */}
          <div className="lg:col-span-6">
            <div className="hero-bronze rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#F7F5F0]/80">
                    How Credits Circulate
                  </p>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#F7F5F0] mt-1">
                    One fair campus currency
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171715]/30 border border-[#F7F5F0]/20 text-xs font-bold text-[#F7F5F0]">
                  <Repeat className="w-3.5 h-3.5 text-[#FF9B45]" />
                  1 Hr = 1 Credit
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-[#F7F5F0] text-[#171715] rounded-2xl p-4 flex flex-col justify-between min-h-[168px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#7D5736]">01</span>
                    <BookOpen className="w-5 h-5 text-[#171715]" />
                  </div>
                  <div className="pt-4">
                    <h3 className="text-base font-extrabold leading-snug">Teach a Skill</h3>
                    <p className="text-xs text-[#171715]/75 mt-1 leading-relaxed">
                      Host a 60-min peer session in coding, design, or coursework.
                    </p>
                  </div>
                </div>

                <div className="bg-[#F5B66B] text-[#171715] rounded-2xl p-4 flex flex-col justify-between min-h-[168px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#171715]/70">02</span>
                    <Coins className="w-5 h-5 text-[#171715]" />
                  </div>
                  <div className="pt-4">
                    <h3 className="text-base font-extrabold leading-snug">Earn Credits</h3>
                    <p className="text-xs text-[#171715]/80 mt-1 leading-relaxed">
                      Credits release automatically from escrow after completion.
                    </p>
                  </div>
                </div>

                <div className="bg-[#E6DFD5] text-[#171715] rounded-2xl p-4 flex flex-col justify-between min-h-[168px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#7D5736]">03</span>
                    <Repeat className="w-5 h-5 text-[#171715]" />
                  </div>
                  <div className="pt-4">
                    <h3 className="text-base font-extrabold leading-snug">Learn Any Topic</h3>
                    <p className="text-xs text-[#171715]/75 mt-1 leading-relaxed">
                      Redeem credits for 1-on-1 help or propose a mutual swap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#171715]/35 border border-[#F7F5F0]/15 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-medium text-[#F7F5F0]">
                  Zero tuition fees. Built for mutual peer accountability.
                </p>
                <Link
                  href="/credits"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold shrink-0 transition-colors"
                >
                  Wallet Rules
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-[#37332E] bg-[#111110]/70 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
              Workflow
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F5F0]">
              From listing to live session in three clear steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#2B2824] border border-[#37332E] text-[#FF9B45] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#F7F5F0]">1. Match by Skills</h3>
              <p className="text-sm sm:text-base text-[#AAA69F] leading-relaxed">
                Add what you can teach and what you want to learn. SwapStudy highlights mutual exchanges and direct peer listings.
              </p>
            </div>

            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#2B2824] border border-[#37332E] text-[#F5B66B] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#F7F5F0]">2. Schedule with Escrow</h3>
              <p className="text-sm sm:text-base text-[#AAA69F] leading-relaxed">
                Pick a future IST date and time. Credits are securely held in escrow until the session is completed or refunded in full if declined.
              </p>
            </div>

            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#2B2824] border border-[#37332E] text-[#65C995] flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#F7F5F0]">3. Meet & Complete</h3>
              <p className="text-sm sm:text-base text-[#AAA69F] leading-relaxed">
                Teachers share a verified Google Meet link directly on the session card. After meeting, submit feedback to release credits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills & Subject Areas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
              Live Marketplace
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F5F0]">
              Featured campus skills
            </h2>
          </div>
          <Link
            href="/skills"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF9B45] hover:text-[#F5B66B] transition-colors"
          >
            Browse all skills
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Subject Area Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SUBJECT_AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <Link
                key={area.name}
                href={`/skills?category=${encodeURIComponent(area.name)}`}
                className="bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] hover:border-[#FF9B45]/50 rounded-2xl p-4 flex flex-col gap-2.5 transition-all group"
              >
                <Icon className="w-5 h-5 text-[#FF9B45]" />
                <span className="text-sm font-semibold text-[#F7F5F0] group-hover:text-[#FF9B45] transition-colors leading-snug">
                  {area.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Skills Grid */}
        {skillsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse"
              />
            ))}
          </div>
        ) : featuredSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onBook={(s) => setSelectedSkill(s)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-10 text-center space-y-4">
            <BookOpen className="w-8 h-8 text-[#FF9B45] mx-auto" />
            <h3 className="text-xl font-bold text-[#F7F5F0]">No skill listings published yet</h3>
            <p className="text-sm text-[#AAA69F] max-w-md mx-auto">
              Be the first peer mentor to list a session and help kickstart your campus skill exchange.
            </p>
            <Link
              href="/teach"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors"
            >
              Offer to Teach
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Active Campus Peers */}
      <section className="border-t border-[#37332E] bg-[#111110]/70 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
                Campus Network
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F5F0]">
                Peers ready to collaborate
              </h2>
            </div>
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF9B45] hover:text-[#F5B66B]"
            >
              Open Community Hub
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {activePeers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {activePeers.map((peer) => (
                <div
                  key={peer.id}
                  className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-11 h-11 rounded-full object-cover border border-[#37332E] bg-[#171715] shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#F7F5F0] truncate">{peer.name}</h3>
                      <p className="text-xs text-[#AAA69F] truncate">{peer.major || peer.university}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {peer.skillsToTeach.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#171715] border border-[#37332E] text-xs font-medium text-[#AAA69F]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#37332E] flex items-center justify-between text-xs text-[#AAA69F]">
                    <span className="inline-flex items-center gap-1 font-bold text-[#F7F5F0]">
                      <Star className="w-3.5 h-3.5 text-[#FF9B45] fill-[#FF9B45]" />
                      {peer.repRating > 0 ? peer.repRating.toFixed(1) : 'New'}
                    </span>
                    <span>{peer.totalHoursTaught}h taught</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#2B2824] border border-[#37332E] flex items-center justify-center text-[#FF9B45] shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F7F5F0]">Connect with ADYPU classmates</h3>
                  <p className="text-sm text-[#AAA69F]">
                    Sign in to discover verified campus peers, smart swap matches, and active study circles.
                  </p>
                </div>
              </div>
              <Link
                href="/community"
                className="px-5 py-2.5 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] shrink-0"
              >
                Explore Community
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Peer Learning + Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: 'Reciprocal Fairness',
              desc: 'Mutual swaps pair two learners teaching one another with symmetric credit accountability.',
            },
            {
              title: 'Zero Financial Barrier',
              desc: 'Every student starts with onboarding time credits and earns more by mentoring classmates.',
            },
            {
              title: 'Verified Campus Scope',
              desc: 'Collaborate inside a focused student ecosystem with shared academic schedules.',
            },
            {
              title: 'Direct Communication',
              desc: 'Coordinate topics via built-in messaging before confirming session times or Meet rooms.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-3"
            >
              <CheckCircle2 className="w-5 h-5 text-[#65C995]" />
              <h3 className="text-lg font-bold text-[#F7F5F0]">{item.title}</h3>
              <p className="text-sm text-[#AAA69F] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Final Bronze CTA */}
        <div className="hero-bronze rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F7F5F0] tracking-tight">
              Ready to exchange your first skill this week?
            </h2>
            <p className="text-base text-[#F7F5F0]/85 leading-relaxed">
              Create your student profile in minutes, list a topic you already understand well, and learn from peers across campus.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-base font-bold transition-colors"
            >
              {user ? 'Go to Dashboard' : 'Create Free Account'}
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {selectedSkill && (
        <BookingModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </div>
  );
}
