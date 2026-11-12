'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { SkillCategory, SkillLevel } from '@/types';
import {
  Coins,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
} from 'lucide-react';

const CATEGORIES: SkillCategory[] = [
  'Programming & Tech',
  'Design & Creative',
  'Academics & Science',
  'Media & Production',
  'Business & Career',
  'Language & Writing',
];

const LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function TeachSkillPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { addSkill, deleteSkill, skills } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Programming & Tech');
  const [level, setLevel] = useState<SkillLevel>('Beginner');
  const [hourlyCredits, setHourlyCredits] = useState<number>(2);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(60);
  const [description, setDescription] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([
    'Core Fundamentals & Mental Models',
    'Hands-on Live Example Review',
  ]);
  const [prerequisites, setPrerequisites] = useState('A laptop and motivation to learn.');

  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSkillId, setCreatedSkillId] = useState<string | null>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading your teaching studio...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-bold text-slate-900 mb-1">Sign in to Teach a Skill</h2>
        <p className="text-xs text-slate-500 mb-4">You need an active student profile to publish a skill.</p>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const myTaughtSkills = skills.filter((s) => s.teacherId === user.id);

  const handleAddTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    setTopics(topics.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      setError('Skill title must be at least 3 characters long.');
      return;
    }

    if (topics.length === 0) {
      setError('Please add at least one topic or syllabus outline item.');
      return;
    }

    // Duplicate check: Prevent creating duplicate active listing with the exact same title
    const isDuplicate = myTaughtSkills.some(
      (s) => s.title.toLowerCase().trim() === trimmedTitle.toLowerCase()
    );
    if (isDuplicate) {
      setError(`You already have an active listing titled "${trimmedTitle}". Please edit your existing listing or use a different title.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addSkill({
        title: trimmedTitle,
        category,
        level,
        hourlyCredits,
        sessionDurationMinutes,
        description: description.trim(),
        topics,
        prerequisites: [prerequisites.trim()],
      });

      if (res.success) {
        setIsSuccess(true);
        if (res.skill) {
          setCreatedSkillId(res.skill.id);
        }
      } else {
        setError(res.error || 'Failed to list skill.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while publishing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteListing = async (skillId: string, skillTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${skillTitle}"? This cannot be undone.`)) {
      return;
    }

    setDeletingSkillId(skillId);
    setDeleteNotice(null);
    try {
      const res = await deleteSkill(skillId);
      if (res.success) {
        setDeleteNotice({
          type: 'success',
          message: `Successfully deleted "${skillTitle}".`,
        });
      } else {
        setDeleteNotice({
          type: 'error',
          message: res.error || 'Failed to delete skill listing.',
        });
      }
    } catch (err: unknown) {
      setDeleteNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred while deleting.',
      });
    } finally {
      setDeletingSkillId(null);
      setTimeout(() => setDeleteNotice(null), 5000);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="text-center sm:text-left space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-800">
            <Coins className="w-3 h-3 text-emerald-600" />
            <span>Earn 1 to 3 credits for each session you mentor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Offer to Teach a Skill
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            List a topic you feel confident explaining to fellow students. Every session you mentor grants you credits to learn what you want in return.
          </p>
        </div>

        {isSuccess ? (
          <div className="card-subtle rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Skill is Live!</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Students can now discover <span className="font-semibold text-slate-800">&ldquo;{title}&rdquo;</span> on the marketplace and request sessions.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <Link
                href={`/skills/${createdSkillId}`}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs"
              >
                View Your Listing Page
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-subtle rounded-xl p-6 sm:p-7 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skill Title <span className="text-emerald-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Practical Python for Data & APIs, or Intro to Figma Auto-Layout"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Category & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SkillCategory)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Student Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as SkillLevel)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Credits & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Credits Charged per Session (1 to 3)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setHourlyCredits(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        hourlyCredits === val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val} {val === 1 ? 'Credit' : 'Credits'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Standard: 2 credits for intermediate, 3 for specialized topics.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Duration
                </label>
                <div className="flex items-center gap-2">
                  {[45, 60].map((dur) => (
                    <button
                      type="button"
                      key={dur}
                      onClick={() => setSessionDurationMinutes(dur)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        sessionDurationMinutes === dur
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dur} Minutes
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Mentoring Approach
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what concepts you will cover, how you run the session, and what peers will learn..."
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Topics */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topics Covered / Syllabus Outline
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                  placeholder="e.g. Variable Scope & Functions"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-medium"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prerequisites (Optional)
              </label>
              <input
                type="text"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                placeholder="e.g. Laptop with Python 3 installed"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-slate-400 hover:text-slate-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Publish Skill to Marketplace
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Existing Listings Preview */}
        {myTaughtSkills.length > 0 && (
          <div className="card-subtle rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Your Active Listings ({myTaughtSkills.length})
              </h3>
            </div>

            {deleteNotice && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
                  deleteNotice.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {deleteNotice.type === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  {deleteNotice.message}
                </span>
                <button
                  onClick={() => setDeleteNotice(null)}
                  className="text-slate-400 hover:text-slate-600 ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {myTaughtSkills.map((sk) => (
                <div
                  key={sk.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{sk.title}</p>
                    <p className="text-slate-400 text-[11px]">
                      {sk.hourlyCredits} Credits • {sk.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/skills/${sk.id}`}
                      className="font-semibold text-emerald-700 hover:underline text-xs"
                    >
                      View →
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteListing(sk.id, sk.title)}
                      disabled={deletingSkillId === sk.id}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                      title={`Delete "${sk.title}"`}
                    >
                      {deletingSkillId === sk.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin inline-block" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
