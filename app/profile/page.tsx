'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap,
  Coins,
  Star,
  Plus,
  X,
  Check,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const university = user?.university || '';
  const [major, setMajor] = useState(user?.major || '');
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || '2026');
  const [bio, setBio] = useState(user?.bio || '');

  const [teachTagInput, setTeachTagInput] = useState('');
  const [skillsToTeach, setSkillsToTeach] = useState<string[]>(user?.skillsToTeach || []);

  const [learnTagInput, setLearnTagInput] = useState('');
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>(user?.skillsToLearn || []);

  const [notification, setNotification] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-bold text-slate-900 mb-1">Sign in to view your profile</h2>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleAddTeach = () => {
    if (teachTagInput.trim() && !skillsToTeach.includes(teachTagInput.trim())) {
      setSkillsToTeach([...skillsToTeach, teachTagInput.trim()]);
      setTeachTagInput('');
    }
  };

  const handleRemoveTeach = (skill: string) => {
    setSkillsToTeach(skillsToTeach.filter((s) => s !== skill));
  };

  const handleAddLearn = () => {
    if (learnTagInput.trim() && !skillsToLearn.includes(learnTagInput.trim())) {
      setSkillsToLearn([...skillsToLearn, learnTagInput.trim()]);
      setLearnTagInput('');
    }
  };

  const handleRemoveLearn = (skill: string) => {
    setSkillsToLearn(skillsToLearn.filter((s) => s !== skill));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      university,
      major,
      graduationYear,
      bio,
      skillsToTeach,
      skillsToLearn,
    });
    setNotification('Profile successfully updated!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen py-8 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Toast */}
        {notification && (
          <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-medium shadow-md flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              {notification}
            </span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Profile Header */}
        <div className="card-subtle rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                  {user.isCollegeVerified ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      College Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                      Verification Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {user.major} • {user.university} ({user.graduationYear})
                </p>
                <div className="flex items-center gap-2.5 text-xs mt-2 font-medium">
                  <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[11px]">
                    <Coins className="w-3 h-3 text-emerald-600" />
                    {user.credits} Credits
                  </span>
                  <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 text-[11px]">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {user.repRating} Rating
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/teach"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs"
              >
                + Offer Skill
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="card-subtle rounded-xl p-6 sm:p-7 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Academic Credentials & Exchange Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  College Affiliation
                </label>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                  Institutional Identity
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={university}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                {user.isCollegeVerified && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                College identity is tied to your student account (@{user.collegeId || 'uw'}.edu) and maintained separately from profile text.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Degree & Major
              </label>
              <input
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Graduation Year
              </label>
              <input
                type="text"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Bio & Background
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other students about your interests, coursework, and mentoring style..."
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Skills To Teach */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-semibold text-slate-900">
              Skills You Can Teach & Share
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={teachTagInput}
                onChange={(e) => setTeachTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTeach();
                  }
                }}
                placeholder="Add a skill you can teach..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleAddTeach}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillsToTeach.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-medium"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveTeach(s)}
                    className="text-emerald-600 hover:text-emerald-900 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Skills To Learn */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-semibold text-slate-900">
              Skills You Wish to Learn
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={learnTagInput}
                onChange={(e) => setLearnTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLearn();
                  }
                }}
                placeholder="Add a skill you want to learn..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleAddLearn}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillsToLearn.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveLearn(s)}
                    className="text-slate-500 hover:text-slate-900 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-700">
              Cancel
            </Link>
            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
