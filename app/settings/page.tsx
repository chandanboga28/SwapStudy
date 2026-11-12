'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Clock,
  LogOut,
  Video,
  Coins,
  ArrowUpRight,
  Bell,
  Eye,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  Save,
} from 'lucide-react';

interface GeneralPreferences {
  notifySessionRequests: boolean;
  notifySwapProposals: boolean;
  notifyDirectMessages: boolean;
  weeklySummaryDigest: boolean;
  showOnlineStatus: boolean;
  discoverableInMatches: boolean;
  allowDirectSwaps: boolean;
  showCompletedHours: boolean;
  defaultDurationMinutes: '45' | '60' | '90';
  reminderLeadMinutes: '15' | '30' | '60';
  autoPromptMeetLink: boolean;
}

const DEFAULT_PREFERENCES: GeneralPreferences = {
  notifySessionRequests: true,
  notifySwapProposals: true,
  notifyDirectMessages: true,
  weeklySummaryDigest: false,
  showOnlineStatus: true,
  discoverableInMatches: true,
  allowDirectSwaps: true,
  showCompletedHours: true,
  defaultDurationMinutes: '60',
  reminderLeadMinutes: '30',
  autoPromptMeetLink: true,
};

function loadUserPreferences(userId: string): GeneralPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(`swapstudy_settings_${userId}`);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-[#CEC9BC] last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-bold text-[#1F2227] cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-[#464B55] mt-0.5">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-[1.5px] border-[#4A4E57] transition-colors cursor-pointer ${
          checked ? 'bg-[#3B5CA8]' : 'bg-[#E6E3DA]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full border border-[#25282E] transition-transform ${
            checked ? 'translate-x-6 bg-[#DCEB8E]' : 'translate-x-1 bg-[#F8F6F0]'
          }`}
        />
      </button>
    </div>
  );
}

function GeneralSettingsWorkspace({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => Promise<void>;
}) {
  const [prefs, setPrefs] = useState<GeneralPreferences>(() => loadUserPreferences(user.id));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const updatePref = <K extends keyof GeneralPreferences>(
    key: K,
    value: GeneralPreferences[K]
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setStatusMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(`swapstudy_settings_${user.id}`, JSON.stringify(prefs));
    } catch {
      // Ignore storage quota errors in private browsing
    }
    setStatusMessage('General settings saved for your account.');
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFERENCES);
    try {
      window.localStorage.setItem(
        `swapstudy_settings_${user.id}`,
        JSON.stringify(DEFAULT_PREFERENCES)
      );
    } catch {
      // Ignore storage errors
    }
    setStatusMessage('Preferences restored to default settings.');
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
            GENERAL_SETTINGS // PREFERENCES
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2227]">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-[#464B55]">
            Configure notifications, campus privacy visibility, session defaults, and account controls.
          </p>
        </div>

        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F8F6F0] hover:bg-[#E6E3DA] border-[1.5px] border-[#4A4E57] text-sm font-semibold text-[#1F2227] shrink-0 transition-colors"
        >
          View Profile
          <ArrowUpRight className="w-4 h-4 text-[#2F4D96]" />
        </Link>
      </div>

      {/* Account & Campus Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#464B55]">
            <ShieldCheck className="w-4 h-4 text-[#195434]" />
            Campus Scope
          </div>
          <p className="text-base font-bold text-[#1F2227] truncate">{user.university}</p>
          <p className="text-xs text-[#464B55] truncate">{user.email}</p>
        </div>

        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#464B55]">
            <Clock className="w-4 h-4 text-[#2F4D96]" />
            Scheduling Timezone
          </div>
          <p className="text-base font-bold text-[#1F2227]">Asia / Kolkata (IST)</p>
          <p className="text-xs text-[#464B55]">Aligned across bookings &amp; swaps</p>
        </div>

        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#464B55]">
            <Video className="w-4 h-4 text-[#9E3922]" />
            Video Conferencing
          </div>
          <p className="text-base font-bold text-[#1F2227]">Google Meet Rooms</p>
          <p className="text-xs text-[#464B55]">Shared per confirmed session</p>
        </div>
      </div>

      {/* General Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications & Alerts */}
          <section className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="w-9 h-9 rounded-xl bg-[#F4DC82] border border-[#4A4E57] flex items-center justify-center text-[#1F2227]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1F2227]">Notifications &amp; Alerts</h2>
                <p className="text-xs text-[#464B55]">Choose which campus events notify you.</p>
              </div>
            </div>

            <div>
              <ToggleRow
                id="notify-requests"
                label="Session Booking Requests"
                description="Alert when a peer books one of your teaching listings."
                checked={prefs.notifySessionRequests}
                onChange={(val) => updatePref('notifySessionRequests', val)}
              />
              <ToggleRow
                id="notify-swaps"
                label="Mutual Swap Proposals"
                description="Notify when a classmate proposes a 1-on-1 skill swap."
                checked={prefs.notifySwapProposals}
                onChange={(val) => updatePref('notifySwapProposals', val)}
              />
              <ToggleRow
                id="notify-messages"
                label="Direct Inbox Messages"
                description="Show unread badges for new messages from peers."
                checked={prefs.notifyDirectMessages}
                onChange={(val) => updatePref('notifyDirectMessages', val)}
              />
              <ToggleRow
                id="weekly-digest"
                label="Weekly Activity Summary"
                description="Receive a recap of hours taught, learned, and credit flow."
                checked={prefs.weeklySummaryDigest}
                onChange={(val) => updatePref('weeklySummaryDigest', val)}
              />
            </div>
          </section>

          {/* Privacy & Campus Visibility */}
          <section className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="w-9 h-9 rounded-xl bg-[#DCEB8E] border border-[#4A4E57] flex items-center justify-center text-[#1F2227]">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1F2227]">Privacy &amp; Visibility</h2>
                <p className="text-xs text-[#464B55]">Control how peers discover and interact with you.</p>
              </div>
            </div>

            <div>
              <ToggleRow
                id="show-online"
                label="Show Active Campus Status"
                description="Let matched peers see when you are active on SwapStudy."
                checked={prefs.showOnlineStatus}
                onChange={(val) => updatePref('showOnlineStatus', val)}
              />
              <ToggleRow
                id="discoverable-matches"
                label="Appear in Smart Matches"
                description="Include your teaching &amp; learning tags in peer recommendations."
                checked={prefs.discoverableInMatches}
                onChange={(val) => updatePref('discoverableInMatches', val)}
              />
              <ToggleRow
                id="allow-swaps"
                label="Allow Direct Swap Invitations"
                description="Permit verified students to send you reciprocal swap proposals."
                checked={prefs.allowDirectSwaps}
                onChange={(val) => updatePref('allowDirectSwaps', val)}
              />
              <ToggleRow
                id="show-hours"
                label="Display Exchange Hours"
                description="Show total taught and learned hours on your peer card."
                checked={prefs.showCompletedHours}
                onChange={(val) => updatePref('showCompletedHours', val)}
              />
            </div>
          </section>
        </div>

        {/* Session & Meeting Defaults */}
        <section className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6E3DA] border border-[#4A4E57] flex items-center justify-center text-[#2F4D96]">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1F2227]">Session &amp; Meeting Defaults</h2>
              <p className="text-xs text-[#464B55]">
                Set default slot lengths, session reminders, and Google Meet prompts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="default-duration"
                className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2"
              >
                Default Session Duration
              </label>
              <select
                id="default-duration"
                value={prefs.defaultDurationMinutes}
                onChange={(e) =>
                  updatePref('defaultDurationMinutes', e.target.value as '45' | '60' | '90')
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm font-semibold text-[#1F2227] focus:outline-none"
              >
                <option value="45">45 minutes (Quick Focus)</option>
                <option value="60">60 minutes (Standard 1 Credit)</option>
                <option value="90">90 minutes (Deep Workshop)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reminder-lead"
                className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2"
              >
                Session Reminder Lead Time
              </label>
              <select
                id="reminder-lead"
                value={prefs.reminderLeadMinutes}
                onChange={(e) =>
                  updatePref('reminderLeadMinutes', e.target.value as '15' | '30' | '60')
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm font-semibold text-[#1F2227] focus:outline-none"
              >
                <option value="15">15 minutes before start</option>
                <option value="30">30 minutes before start</option>
                <option value="60">1 hour before start</option>
              </select>
            </div>
          </div>

          <div className="pt-1 border-t border-[#CEC9BC]">
            <ToggleRow
              id="auto-meet-prompt"
              label="Prompt for Google Meet Link on Confirmation"
              description="Highlight meeting link setup immediately after accepting a teaching request."
              checked={prefs.autoPromptMeetLink}
              onChange={(val) => updatePref('autoPromptMeetLink', val)}
            />
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#DCF2E4] border border-[#47785B] text-sm font-semibold text-[#195434]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] text-sm font-bold text-[#1F2227] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-sm font-bold text-[#FFFFFF] transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </section>
      </form>

      {/* Wallet & Sign Out Row */}
      <section className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E6E3DA] border border-[#4A4E57] flex items-center justify-center text-[#2F4D96]">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-bold text-[#1F2227]">Account &amp; Session Control</p>
            <p className="text-sm text-[#464B55]">
              Signed in as {user.email} · Current balance: {user.credits} credits
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/credits"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] text-sm font-bold text-[#1F2227] transition-colors"
          >
            Credit Wallet
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#FCE7E3] hover:bg-[#F8D4CD] border-[1.5px] border-[#B34B39] text-sm font-bold text-[#8F2618] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}

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
        <div className="h-32 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
        <div className="h-96 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-8 text-center space-y-5">
          <SettingsIcon className="w-10 h-10 text-[#2F4D96] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#1F2227]">Sign in to access Settings</h1>
            <p className="text-sm text-[#464B55]">
              Configure notifications, campus visibility, and session preferences.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return <GeneralSettingsWorkspace key={user.id} user={user} onLogout={handleLogout} />;
}
