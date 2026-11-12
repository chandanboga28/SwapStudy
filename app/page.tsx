'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import SkillCard from '@/components/SkillCard';
import BookingModal from '@/components/BookingModal';
import { Skill } from '@/types';
import {
  ArrowRight,
  Sparkles,
  Coins,
  GraduationCap,
  Users,
  Repeat,
  CheckCircle2,
  Code,
  Palette,
  Globe,
  Video,
  Mic,
  Binary,
  Star,
  Shield,
  Layers,
  BookOpen,
  Compass,
} from 'lucide-react';

export default function HomePage() {
  const { skills, isLoading } = useApp();
  const { user, allUsers, isLoading: authLoading } = useAuth();
  const [selectedSkillToBook, setSelectedSkillToBook] = useState<Skill | null>(null);

  // Real skills sorted with popular listings first (up to 6)
  const featuredSkills = useMemo(() => {
    return [...skills]
      .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)))
      .slice(0, 6);
  }, [skills]);

  // Real peers from Supabase (or active student profiles with teaching goals)
  const activePeers = useMemo(() => {
    return allUsers
      .filter((u) => u.skillsToTeach.length > 0 || u.skillsToLearn.length > 0)
      .slice(0, 3);
  }, [allUsers]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-24 border-b border-slate-200/80">
        {/* Subtle background mesh glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-100/30 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline, Copy & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ADYPU Student Network • Learn a skill. Teach a skill. Grow together.</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Your next skill is <br className="hidden sm:inline" />
                <span className="text-emerald-700">one connection away.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Learn a skill. Teach a skill. Grow together. Exchange 1-on-1 peer tutoring using non-monetary platform credits—no cash tuition fees required.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  href={user ? '/dashboard' : '/signup'}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xs shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group"
                >
                  {user ? 'Go to Dashboard' : 'Start Learning for Free'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/skills"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center"
                >
                  Explore Skills
                </Link>
              </div>

              {/* Three Value Pillars in Hero */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-xs font-bold text-slate-900">1:1 Peer Sessions</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Direct campus calls</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Platform Credits</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Non-monetary learning time</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Verified ADYPU Campus</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Peer-to-peer accountability</p>
                </div>
              </div>
            </div>

            {/* Right Column: Honest Campus Exchange Mechanism Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-2xl p-6 shadow-md border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                      Credit Cycle Overview
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/70">
                    Platform Credits
                  </span>
                </div>

                {/* Step A: Teach */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                      1 • Share a Skill You Know
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Earn 1–5 Credits/hr
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Publish a topic you can teach (e.g., Python, Figma, Calculus) and earn non-monetary time credits when completed.
                  </p>
                </div>

                <div className="flex items-center justify-center -my-2 relative z-10">
                  <div className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    <span>Escrow Protected Until Session Completion</span>
                  </div>
                </div>

                {/* Step B: Learn or Mutual Swap */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">
                      2 • Learn or Match Reciprocally
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md">
                      Zero Real Money
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Book a 1-on-1 lesson with credits, or match reciprocally with a student who wants what you teach and teaches what you want.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950 text-white text-center text-xs space-y-0.5">
                  <p className="font-semibold text-emerald-300">
                    3 Free Starter Credits on Signup
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    Platform credits carry no monetary value and only represent peer learning hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
              Three Steps
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How SwapStudy Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              A sustainable cycle where every student can be both a teacher and a learner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="card-subtle rounded-xl p-6 space-y-4 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h3 className="text-base font-bold text-slate-900">Share What You Know</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  List skills you feel comfortable explaining—from coding basics and design systems to calculus exam strategies. Outline topics in 2 minutes.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish your listing to the student marketplace</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card-subtle rounded-xl p-6 space-y-4 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shadow-emerald-600/30">
                  02
                </div>
                <h3 className="text-base font-bold text-slate-900">Teach & Earn Credits</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accept booking requests, jump on a 1-on-1 video call, review code or projects, and earn 1 to 3 platform credits when the session concludes.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>Credits deposited directly into your wallet</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card-subtle rounded-xl p-6 space-y-4 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h3 className="text-base font-bold text-slate-900">Learn What You Love</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Spend your credits to book sessions with knowledgeable peers. Get personalized feedback, interview practice, or portfolio reviews.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>3 starter credits granted on registration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills Section */}
      <section className="py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                Skills Directory
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Campus Skills Marketplace
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real peer-taught sessions listed by verified ADYPU &amp; campus students.
              </p>
            </div>

            <Link
              href="/skills"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0"
            >
              Browse All Skills
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Grid of Featured Skills (Live Supabase Data or Honest Empty State) */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[0, 1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="bg-white rounded-xl border border-slate-200 p-5 h-56 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-full bg-slate-100 rounded" />
                    <div className="h-3 w-5/6 bg-slate-100 rounded" />
                  </div>
                  <div className="h-8 w-full bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : featuredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredSkills.map((skill: Skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onBook={(s: Skill) => setSelectedSkillToBook(s)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  {user
                    ? 'Be the first ADYPU student to list a skill'
                    : 'Verified ADYPU Campus Directory'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {user
                    ? 'No peer skill listings are published in your campus directory yet. Share something you know to start earning credits.'
                    : 'Skill listings are visible to signed-in ADYPU & campus students. Sign in or create your student account to view live peer offerings and request swaps.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {user ? (
                  <Link
                    href="/teach"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    + Offer to Teach a Skill
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Join with Campus Email
                    </Link>
                    <Link
                      href="/login"
                      className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Categories Bar */}
          <div className="mt-10 p-5 bg-white rounded-xl border border-slate-200/90 text-center">
            <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
              Browse by Subject Area
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: 'Python & Algorithms', icon: Code, href: '/skills?category=Programming+%26+Tech' },
                { label: 'UI/UX & Figma', icon: Palette, href: '/skills?category=Design+%26+Creative' },
                { label: 'Web Development', icon: Globe, href: '/skills?category=Programming+%26+Tech' },
                { label: 'Video & Editing', icon: Video, href: '/skills?category=Media+%26+Production' },
                { label: 'Public Speaking', icon: Mic, href: '/skills?category=Business+%26+Career' },
                { label: 'Math & Sciences', icon: Binary, href: '/skills?category=Academics+%26+Science' },
              ].map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={idx}
                    href={cat.href}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-emerald-600" />
                    {cat.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Campus Student Profiles (Real Supabase Data) */}
      <section className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
              ADYPU &amp; Peer Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Meet Campus Learners &amp; Mentors
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real students sharing knowledge across ADYPU and partner campuses.
            </p>
          </div>

          {authLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card-subtle rounded-xl p-5 h-44 animate-pulse bg-slate-50" />
              ))}
            </div>
          ) : activePeers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activePeers.map((peer) => (
                <div key={peer.id} className="card-subtle rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{peer.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {peer.major} • {peer.university}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        {peer.totalHoursTaught > 0 ? (
                          <>
                            <span className="flex items-center text-amber-600 font-medium">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                              {peer.repRating.toFixed(1)}
                            </span>
                            <span>•</span>
                            <span>{peer.totalHoursTaught} hrs taught</span>
                          </>
                        ) : (
                          <span>Campus Peer • Class of {peer.graduationYear}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                    {peer.skillsToTeach.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Teaches:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {peer.skillsToTeach.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200/60"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {peer.skillsToLearn.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Wants to Learn:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {peer.skillsToLearn.slice(0, 3).map((l, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-8 text-center max-w-2xl mx-auto space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {user
                  ? 'You are among the founding peers on campus!'
                  : 'Connect with verified ADYPU peers'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {user
                  ? 'Complete your teaching & learning goals in your profile and post in Campus Community to discover classmates looking for skill swaps.'
                  : 'For student privacy, peer profiles are only visible after signing in with your campus account. Sign up in under a minute to see classmates offering sessions.'}
              </p>
              <div className="pt-1 flex flex-wrap justify-center gap-2.5">
                <Link
                  href={user ? '/community' : '/signup'}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  {user ? 'Open Campus Community' : 'Create Student Account'}
                </Link>
                {user && (
                  <Link
                    href="/profile"
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Update My Profile
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
              Why Peer Learning
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for Student Growth
            </h2>
            <p className="text-sm text-slate-600">
              Traditional tutoring is expensive and one-way. SwapStudy creates an equal two-sided exchange.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="card-subtle rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Peer Language</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Students who recently passed a course explain concepts in straightforward, accessible terms without academic pretense.
              </p>
            </div>

            <div className="card-subtle rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Master by Teaching</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Explaining complex topics to another student forces you to organize your mental models and uncover gaps in your own knowledge.
              </p>
            </div>

            <div className="card-subtle rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Project-Based</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Work through real Figma prototypes, coding repos, and presentation slide decks rather than generic theoretical problems.
              </p>
            </div>

            <div className="card-subtle rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Credit Escrow</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zero financial risk. Credits stay in escrow until the session completes and both students confirm the swap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center mx-auto">
            <Coins className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to exchange skills with fellow students?
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
            Create your account today and receive 3 complimentary starter credits to book your first peer tutoring session right away.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Claim 3 Free Credits
            </Link>
            <Link
              href="/skills"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors"
            >
              Explore Tutors
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {selectedSkillToBook && (
        <BookingModal
          skill={selectedSkillToBook}
          onClose={() => setSelectedSkillToBook(null)}
        />
      )}
    </div>
  );
}
