'use client';

import React, { useMemo } from 'react';
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
  Settings,
  User as UserIcon,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { skills, reviews } = useApp();

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
        <div className="h-44 rounded-3xl bg-[#22211F] border border-[#37332E] animate-pulse" />
        <div className="h-96 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#22211F] border border-[#37332E] rounded-2xl p-8 text-center space-y-5">
          <UserIcon className="w-10 h-10 text-[#FF9B45] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#F7F5F0]">Sign in to view Profile</h1>
            <p className="text-sm text-[#AAA69F]">
              Manage your student bio, teaching tags, and learning wishlist.
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

  const formKey = `${user.id}-${user.name}-${user.major}-${user.graduationYear}-${user.bio}-${user.skillsToTeach.join('|')}-${user.skillsToLearn.join('|')}`;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Identity Overview Banner */}
      <section className="hero-bronze rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-[#F7F5F0]/25 bg-[#171715] shrink-0"
          />
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F7F5F0] truncate">
                {user.name}
              </h1>
              {user.isCollegeVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171715]/35 border border-[#65C995]/40 text-xs font-bold text-[#65C995]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-[#F7F5F0]/85 flex items-center gap-1.5 truncate">
              <GraduationCap className="w-4 h-4 text-[#FF9B45] shrink-0" />
              <span className="truncate">
                {user.major || 'Student'}
                {user.graduationYear ? ` · Class of ${user.graduationYear}` : ''} · {user.university}
              </span>
            </p>
            <p className="text-xs text-[#F7F5F0]/75 truncate">{user.email}</p>
          </div>
        </div>

        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#171715]/40 hover:bg-[#171715]/60 border border-[#F7F5F0]/20 text-sm font-bold text-[#F7F5F0] shrink-0 transition-colors"
        >
          <Settings className="w-4 h-4 text-[#FF9B45]" />
          Account Settings
        </Link>
      </section>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            <Coins className="w-4 h-4 text-[#FF9B45]" />
            Credits
          </div>
          <p className="text-2xl font-extrabold text-[#F7F5F0] mt-1 tabular-nums">{user.credits}</p>
        </div>

        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            <Star className="w-4 h-4 text-[#FF9B45]" />
            Rating
          </div>
          <p className="text-2xl font-extrabold text-[#F7F5F0] mt-1 tabular-nums">
            {user.repRating > 0 ? user.repRating.toFixed(1) : 'New'}
          </p>
        </div>

        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            <BookOpen className="w-4 h-4 text-[#65C995]" />
            Listings
          </div>
          <p className="text-2xl font-extrabold text-[#F7F5F0] mt-1 tabular-nums">
            {mySkills.length}
          </p>
        </div>

        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            <Clock className="w-4 h-4 text-[#F5B66B]" />
            Hours Exchanged
          </div>
          <p className="text-2xl font-extrabold text-[#F7F5F0] mt-1 tabular-nums">
            {user.totalHoursTaught + user.totalHoursLearned}h
          </p>
        </div>
      </div>

      {/* Edit Profile & Skill Tags */}
      <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#F7F5F0]">Edit Academic Profile & Skills</h2>
          <p className="text-sm text-[#AAA69F] mt-0.5">
            Keep your teaching topics and learning wishlist accurate so Smart Match surfaces better swaps.
          </p>
        </div>
        <ProfileSettingsForm key={formKey} user={user} />
      </section>

      {/* Received Peer Reviews */}
      {receivedReviews.length > 0 && (
        <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-[#F7F5F0]">
            Peer Feedback Received ({receivedReviews.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receivedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#F7F5F0]">{rev.reviewerName}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF9B45]">
                    <Star className="w-3.5 h-3.5 fill-[#FF9B45]" />
                    {rev.rating}.0
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#F5B66B]">{rev.skillTitle}</p>
                <p className="text-sm text-[#AAA69F]">{rev.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
