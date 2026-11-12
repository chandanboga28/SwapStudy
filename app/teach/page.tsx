'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { SkillCategory, SkillLevel } from '@/types';
import {
  PlusCircle,
  BookOpen,
  Clock,
  Coins,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';

const CATEGORIES: SkillCategory[] = [
  'Programming & Tech',
  'Design & Creative',
  'Academics & Science',
  'Media & Production',
  'Business & Career',
  'Language & Writing',
];

const LEVELS: SkillLevel[] = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

export default function TeachPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { skills, addSkill, deleteSkill } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Programming & Tech');
  const [level, setLevel] = useState<SkillLevel>('Beginner');
  const [duration, setDuration] = useState<45 | 60>(60);
  const [hourlyCredits, setHourlyCredits] = useState<1 | 2 | 3>(1);
  const [description, setDescription] = useState('');

  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [prereqInput, setPrereqInput] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const myListings = useMemo(() => {
    if (!user) return [];
    return skills.filter((s) => s.teacherId === user.id);
  }, [skills, user]);

  const addTag = (
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const clean = val.trim();
    if (!clean) return;
    if (!list.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setList([...list, clean]);
    }
    setVal('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const finalTopics =
      topicInput.trim() && !topics.includes(topicInput.trim())
        ? [...topics, topicInput.trim()]
        : topics;
    const finalPrereqs =
      prereqInput.trim() && !prerequisites.includes(prereqInput.trim())
        ? [...prerequisites, prereqInput.trim()]
        : prerequisites;

    if (!cleanTitle || !cleanDesc) {
      setErrorMsg('Please provide a skill title and clear session description.');
      return;
    }

    const isDuplicate = myListings.some(
      (s) => s.title.trim().toLowerCase() === cleanTitle.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg('You already have an active listing with this exact title.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await addSkill({
        title: cleanTitle,
        category,
        level,
        hourlyCredits,
        description: cleanDesc,
        topics: finalTopics.length > 0 ? finalTopics : [category],
        prerequisites: finalPrereqs.length > 0 ? finalPrereqs : undefined,
        sessionDurationMinutes: duration,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Could not publish skill listing.');
        return;
      }

      setTitle('');
      setDescription('');
      setTopics([]);
      setTopicInput('');
      setPrerequisites([]);
      setPrereqInput('');
      setSuccessMsg(`"${cleanTitle}" is now live in the marketplace!`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async (skillId: string) => {
    if (deletingId) return;
    setDeletingId(skillId);
    try {
      await deleteSkill(skillId);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-96 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#22211F] border border-[#37332E] rounded-2xl p-8 text-center space-y-5">
          <BookOpen className="w-10 h-10 text-[#FF9B45] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#F7F5F0]">Sign in to Teach a Skill</h1>
            <p className="text-sm text-[#AAA69F]">
              Publish a 1-on-1 peer mentoring session and earn time credits from fellow students.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-full bg-[#2B2824] border border-[#37332E] text-[#F7F5F0] text-sm font-semibold"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
          Mentor Studio
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F5F0]">
          Offer to Teach a Skill
        </h1>
        <p className="text-sm sm:text-base text-[#AAA69F] max-w-2xl">
          Share subjects you understand clearly and earn credits for every completed peer session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Publish Skill Form (7 Cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#22211F] border border-[#37332E] rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-[#37332E]">
            <div className="w-10 h-10 rounded-xl bg-[#FF9B45]/15 border border-[#FF9B45]/30 flex items-center justify-center text-[#FF9B45]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F7F5F0]">Create Skill Listing</h2>
              <p className="text-xs text-[#AAA69F]">Visible immediately to students across your campus</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
              Session Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React Hooks & State Architecture Workshop"
              className="w-full px-4 py-3 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SkillCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#22211F]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Skill Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as SkillLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-[#22211F]">
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Session Duration
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {([45, 60] as const).map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${
                      duration === mins
                        ? 'bg-[#FF9B45] text-[#171715] border-[#FF9B45]'
                        : 'bg-[#171715] text-[#AAA69F] border-[#37332E] hover:text-[#F7F5F0]'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Credit Rate per Session
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((cr) => (
                  <button
                    key={cr}
                    type="button"
                    onClick={() => setHourlyCredits(cr)}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${
                      hourlyCredits === cr
                        ? 'bg-[#FF9B45] text-[#171715] border-[#FF9B45]'
                        : 'bg-[#171715] text-[#AAA69F] border-[#37332E] hover:text-[#F7F5F0]'
                    }`}
                  >
                    {cr} Cr
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
              Session Description
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what learners will walk away knowing and how you run the session..."
              className="w-full px-4 py-3 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none resize-none"
            />
          </div>

          {/* Topics Tag Builder */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
              Key Topics Covered
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(topicInput, setTopicInput, topics, setTopics);
                  }
                }}
                placeholder="e.g. Custom Hooks, Context API"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addTag(topicInput, setTopicInput, topics, setTopics)}
                className="px-4 py-2.5 rounded-xl bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-[#FF9B45] font-bold cursor-pointer"
                aria-label="Add topic"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#F7F5F0]"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTopics(topics.filter((x) => x !== t))}
                      className="text-[#AAA69F] hover:text-[#F07878]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Prerequisites */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
              Prerequisites (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prereqInput}
                onChange={(e) => setPrereqInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(prereqInput, setPrereqInput, prerequisites, setPrerequisites);
                  }
                }}
                placeholder="e.g. Basic JavaScript familiarity"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  addTag(prereqInput, setPrereqInput, prerequisites, setPrerequisites)
                }
                className="px-4 py-2.5 rounded-xl bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-[#F5B66B] font-bold cursor-pointer"
                aria-label="Add prerequisite"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {prerequisites.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prerequisites.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171715] border border-[#37332E] text-xs font-medium text-[#AAA69F]"
                  >
                    {p}
                    <button
                      type="button"
                      onClick={() =>
                        setPrerequisites(prerequisites.filter((x) => x !== p))
                      }
                      className="text-[#AAA69F] hover:text-[#F07878]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-sm text-[#F07878]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#65C995]/10 border border-[#65C995]/30 text-sm text-[#65C995]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] disabled:opacity-50 text-[#171715] text-base font-bold transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing Skill...
              </>
            ) : (
              'Publish Skill Listing'
            )}
          </button>
        </form>

        {/* Active Listings Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#F7F5F0]">
                Your Active Listings ({myListings.length})
              </h2>
            </div>

            {myListings.length > 0 ? (
              <div className="space-y-3.5">
                {myListings.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#F5B66B]">
                          {skill.category}
                        </span>
                        <h3 className="text-base font-bold text-[#F7F5F0] mt-0.5 truncate">
                          {skill.title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171715] border border-[#37332E] text-xs font-bold text-[#FF9B45] shrink-0">
                        <Coins className="w-3.5 h-3.5" />
                        {skill.hourlyCredits} Cr
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#AAA69F]">
                      <span>{skill.level}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {skill.sessionDurationMinutes} min
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#37332E] flex items-center justify-between gap-3">
                      <Link
                        href={`/skills/${skill.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#FF9B45] hover:text-[#F5B66B]"
                      >
                        View Listing
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === skill.id}
                        onClick={() => handleDeleteListing(skill.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#F07878] hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === skill.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-6 text-center space-y-2">
                <BookOpen className="w-7 h-7 text-[#FF9B45] mx-auto" />
                <p className="text-sm font-bold text-[#F7F5F0]">No listings published yet</p>
                <p className="text-xs text-[#AAA69F] leading-relaxed">
                  Publish your first skill listing using the form to start receiving session requests and mutual swap offers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
