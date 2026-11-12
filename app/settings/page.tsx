'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProfileSettingsForm from '@/components/ProfileSettingsForm';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Clock,
  LogOut,
  Video,
  Coins,
  ArrowUpRight,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-32 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
        <div className="h-96 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#22211F] border border-[#37332E] rounded-2xl p-8 text-center space-y-5">
          <SettingsIcon className="w-10 h-10 text-[#FF9B45] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#F7F5F0]">Sign in to access Settings</h1>
            <p className="text-sm text-[#AAA69F]">
              Configure your academic profile, skill tags, and exchange preferences.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const formKey = `settings-${user.id}-${user.name}-${user.major}-${user.graduationYear}-${user.bio}-${user.skillsToTeach.join('|')}-${user.skillsToLearn.join('|')}`;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
            Preferences & Account
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F5F0]">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-[#AAA69F]">
            Manage your SwapStudy student profile, matching skills, and campus session settings.
          </p>
        </div>

        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] shrink-0"
        >
          View Public Profile
          <ArrowUpRight className="w-4 h-4 text-[#FF9B45]" />
        </Link>
      </div>

      {/* Account & Campus Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            <ShieldCheck className="w-4 h-4 text-[#65C995]" />
            Campus Scope
          </div>
          <p className="text-base font-bold text-[#F7F5F0] truncate">{user.university}</p>
          <p className="text-xs text-[#AAA69F] truncate">{user.email}</p>
        </div>

        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            <Clock className="w-4 h-4 text-[#FF9B45]" />
            Scheduling Timezone
          </div>
          <p className="text-base font-bold text-[#F7F5F0]">Asia / Kolkata (IST)</p>
          <p className="text-xs text-[#AAA69F]">Aligned across bookings & swaps</p>
        </div>

        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            <Video className="w-4 h-4 text-[#F5B66B]" />
            Video Conferencing
          </div>
          <p className="text-base font-bold text-[#F7F5F0]">Google Meet Links</p>
          <p className="text-xs text-[#AAA69F]">Shared per confirmed session</p>
        </div>
      </div>

      {/* Main Editable Profile & Skill Preferences Card */}
      <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#F7F5F0]">Profile & Matching Preferences</h2>
          <p className="text-sm text-[#AAA69F] mt-0.5">
            Changes sync immediately to Supabase and update your Smart Match recommendations.
          </p>
        </div>

        <ProfileSettingsForm key={formKey} user={user} />
      </section>

      {/* Wallet & Sign Out Row */}
      <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#2B2824] border border-[#37332E] flex items-center justify-center text-[#FF9B45]">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-bold text-[#F7F5F0]">Session & Wallet Session Control</p>
            <p className="text-sm text-[#AAA69F]">
              Signed in as {user.email} · Current balance: {user.credits} credits
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#2B2824] hover:bg-[#F07878]/15 border border-[#37332E] hover:border-[#F07878]/40 text-sm font-bold text-[#F07878] transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </section>
    </div>
  );
}

