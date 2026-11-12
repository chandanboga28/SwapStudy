'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import ProfileSettingsForm from '@/components/ProfileSettingsForm';
import {
  Star,
  GraduationCap,
  ShieldCheck,
  Coins,
  BookOpen,
  Clock,
  Pencil,
  Sparkles,
  User as UserIcon,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { skills, reviews } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const mySkills = useMemo(() => {
    if (!user) return [];
    return skills.filter((s) => s.teacherId === user.id);
  }, [skills, user]);

  const receivedReviews = useMemo(() => {
    if (!user) return [];
    return reviews.filter((r) => r.teacherId === user.id);
  }, [reviews, user]);

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-44 rounded-3xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
        <div className="h-96 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-8 text-center space-y-5">
          <UserIcon className="w-10 h-10 text-[#2F4D96] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#1F2227]">Sign in to view Profile</h1>
            <p className="text-sm text-[#464B55]">
              Manage your student bio, teaching tags, and learning wishlist.
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

  const formKey = `${user.id}-${user.name}-${user.avatar}-${user.major}-${user.graduationYear}-${user.bio}-${user.skillsToTeach.join('|')}-${user.skillsToLearn.join('|')}`;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Identity Overview Banner */}
      <section className="hero-synth-cobalt bg-[#3B5CA8] text-[#FFFFFF] border-[1.5px] border-[#2C437A] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-[#DCEB8E] bg-[#F8F6F0] shrink-0"
          />
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] truncate">
                {user.name}
              </h1>
              {user.isCollegeVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#DCEB8E] border border-[#25282E] font-mono text-xs font-bold text-[#1F2227]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-[#EDF2FF] flex items-center gap-1.5 truncate font-medium">
              <GraduationCap className="w-4 h-4 text-[#DCEB8E] shrink-0" />
              <span className="truncate">
                {user.major || 'Student'}
                {user.graduationYear ? ` · Class of ${user.graduationYear}` : ''} · {user.university}
              </span>
            </p>
            <p className="text-xs font-mono text-[#DCE5F7] truncate">{user.email}</p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setSavedNotice(false);
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4DC82] hover:bg-[#EDD066] border-[1.5px] border-[#25282E] shadow-[0_2.5px_0_#25282E] text-sm font-bold text-[#1F2227] shrink-0 transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-[#1F2227]" />
            Edit Profile
          </button>
        )}
      </section>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#464B55]">
            <Coins className="w-4 h-4 text-[#2F4D96]" />
            Credits
          </div>
          <p className="text-2xl font-extrabold text-[#1F2227] mt-1 tabular-nums">{user.credits}</p>
        </div>

        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#464B55]">
            <Star className="w-4 h-4 text-[#2F4D96]" />
            Rating
          </div>
          <p className="text-2xl font-extrabold text-[#1F2227] mt-1 tabular-nums">
            {user.repRating > 0 ? user.repRating.toFixed(1) : 'New'}
          </p>
        </div>

        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#464B55]">
            <BookOpen className="w-4 h-4 text-[#195434]" />
            Listings
          </div>
          <p className="text-2xl font-extrabold text-[#1F2227] mt-1 tabular-nums">
            {mySkills.length}
          </p>
        </div>

        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#464B55]">
            <Clock className="w-4 h-4 text-[#9E3922]" />
            Hours Exchanged
          </div>
          <p className="text-2xl font-extrabold text-[#1F2227] mt-1 tabular-nums">
            {user.totalHoursTaught + user.totalHoursLearned}h
          </p>
        </div>
      </div>

      {/* Student Profile Details (Read-Only by default; Edit via button) */}
      <section className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 sm:p-8 space-y-6">
        {savedNotice && !isEditing && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#DCF2E4] border border-[#47785B] text-sm font-semibold text-[#195434]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile details and profile picture saved.</span>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-[#1F2227]">
            {isEditing ? 'Edit Profile Details' : 'Student Profile Details'}
          </h2>
          <p className="text-sm text-[#464B55] mt-0.5">
            {isEditing
              ? 'Update your academic info, teaching skills, and learning goals.'
              : 'Your academic details, bio, teaching subjects, and learning wishlist.'}
          </p>
        </div>

        {isEditing ? (
          <ProfileSettingsForm
            key={formKey}
            user={user}
            onSuccess={() => {
              setSavedNotice(true);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-6">
            {/* Academic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl p-4 space-y-1">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B55]">
                  Full Name
                </p>
                <p className="text-sm font-bold text-[#1F2227]">{user.name}</p>
              </div>
              <div className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl p-4 space-y-1">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B55]">
                  Campus Email
                </p>
                <p className="text-sm font-bold text-[#1F2227] truncate">{user.email}</p>
              </div>
              <div className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl p-4 space-y-1">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B55]">
                  Major / Program
                </p>
                <p className="text-sm font-bold text-[#1F2227]">
                  {user.major || 'Not specified'}
                </p>
              </div>
              <div className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl p-4 space-y-1">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B55]">
                  Graduation Year
                </p>
                <p className="text-sm font-bold text-[#1F2227]">
                  {user.graduationYear ? `Class of ${user.graduationYear}` : 'Not specified'}
                </p>
              </div>
            </div>

            {/* University & Bio */}
            <div className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B55]">
                  About & University
                </p>
                <span className="text-xs font-semibold text-[#2F4D96]">{user.university}</span>
              </div>
              <p className="text-sm text-[#1F2227] leading-relaxed">
                {user.bio?.trim()
                  ? user.bio
                  : 'No student bio added yet. Click Edit Profile to introduce yourself to classmates.'}
              </p>
            </div>

            {/* Teaching & Learning Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9E3922]">
                  Skills I Can Teach
                </p>
                {user.skillsToTeach.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skillsToTeach.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full bg-[#DCEB8E] border border-[#4A4E57] text-xs font-bold text-[#1F2227]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#464B55]">No teaching skills added yet.</p>
                )}
              </div>

              <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#195434]">
                  Skills I Want to Learn
                </p>
                {user.skillsToLearn.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skillsToLearn.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full bg-[#DCF2E4] border border-[#47785B] text-xs font-bold text-[#195434]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#464B55]">No learning goals added yet.</p>
                )}
              </div>
            </div>

            {/* Active Skill Listings Summary */}
            {mySkills.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2F4D96] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Active Teaching Listings ({mySkills.length})
                  </p>
                  <Link
                    href="/teach"
                    className="text-xs font-bold text-[#2F4D96] hover:underline"
                  >
                    Manage Listings
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mySkills.map((skill) => (
                    <Link
                      key={skill.id}
                      href={`/skills/${skill.id}`}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#EFECE4] hover:bg-[#E6E3DA] border border-[#4A4E57] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1F2227] truncate">{skill.title}</p>
                        <p className="text-xs text-[#464B55] mt-0.5">
                          {skill.category} · {skill.sessionDurationMinutes} min · {skill.hourlyCredits} Cr
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#2F4D96] shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Received Peer Reviews */}
      {receivedReviews.length > 0 && (
        <section className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-[#1F2227]">
            Peer Feedback Received ({receivedReviews.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receivedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#1F2227]">{rev.reviewerName}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2F4D96]">
                    <Star className="w-3.5 h-3.5 text-[#8A6500] fill-[#F4DC82]" />
                    {rev.rating}.0
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#9E3922]">{rev.skillTitle}</p>
                <p className="text-sm text-[#464B55]">{rev.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
