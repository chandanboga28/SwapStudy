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
        <div className="h-96 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-8 text-center space-y-5">
          <BookOpen className="w-10 h-10 text-[#2F4D96] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#1F2227]">Sign in to Teach a Skill</h1>
            <p className="text-sm text-[#464B55]">
              Publish a 1-on-1 peer mentoring session and earn time credits from fellow students.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-[#1F2227] text-sm font-semibold"
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
        <p className="text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
          Mentor Studio
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2227]">
          Offer to Teach a Skill
        </h1>
        <p className="text-sm sm:text-base text-[#464B55] max-w-2xl">
          Share subjects you understand clearly and earn credits for every completed peer session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Publish Skill Form (7 Cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-[#CEC9BC]">
            <div className="w-10 h-10 rounded-xl bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] flex items-center justify-center text-[#1F2227]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F2227]">Create Skill Listing</h2>
              <p className="text-xs text-[#464B55]">Visible immediately to students across your campus</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
              Session Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React Hooks & State Architecture Workshop"
              className="w-full px-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-[15px] text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SkillCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#F8F6F0]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                Skill Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as SkillLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-[#F8F6F0]">
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
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
                        ? 'bg-[#3B5CA8] text-[#FFFFFF] border-[#2A3F75] shadow-[0_2px_0_#2A3F75]'
                        : 'bg-[#EFECE4] text-[#464B55] border-[#4A4E57] hover:text-[#1F2227]'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
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
                        ? 'bg-[#3B5CA8] text-[#FFFFFF] border-[#2A3F75] shadow-[0_2px_0_#2A3F75]'
                        : 'bg-[#EFECE4] text-[#464B55] border-[#4A4E57] hover:text-[#1F2227]'
                    }`}
                  >
                    {cr} Cr
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
              Session Description
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what learners will walk away knowing and how you run the session..."
              className="w-full px-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none resize-none"
            />
          </div>

          {/* Topics Tag Builder */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55]">
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addTag(topicInput, setTopicInput, topics, setTopics)}
                className="px-4 py-2.5 rounded-xl bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-[#2F4D96] font-bold cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-xs font-semibold text-[#1F2227]"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTopics(topics.filter((x) => x !== t))}
                      className="text-[#464B55] hover:text-[#8F2618]"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55]">
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  addTag(prereqInput, setPrereqInput, prerequisites, setPrerequisites)
                }
                className="px-4 py-2.5 rounded-xl bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-[#9E3922] font-bold cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFECE4] border border-[#4A4E57] text-xs font-medium text-[#464B55]"
                  >
                    {p}
                    <button
                      type="button"
                      onClick={() =>
                        setPrerequisites(prerequisites.filter((x) => x !== p))
                      }
                      className="text-[#464B55] hover:text-[#8F2618]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-sm text-[#8F2618]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#DCF2E4] border border-[#47785B] text-sm text-[#195434]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] disabled:opacity-50 border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-base font-bold transition-colors cursor-pointer"
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
          <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1F2227]">
                Your Active Listings ({myListings.length})
              </h2>
            </div>

            {myListings.length > 0 ? (
              <div className="space-y-3.5">
                {myListings.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#9E3922]">
                          {skill.category}
                        </span>
                        <h3 className="text-base font-bold text-[#1F2227] mt-0.5 truncate">
                          {skill.title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFECE4] border border-[#4A4E57] text-xs font-bold text-[#2F4D96] shrink-0">
                        <Coins className="w-3.5 h-3.5" />
                        {skill.hourlyCredits} Cr
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#464B55]">
                      <span>{skill.level}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {skill.sessionDurationMinutes} min
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#CEC9BC] flex items-center justify-between gap-3">
                      <Link
                        href={`/skills/${skill.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#2F4D96] hover:text-[#9E3922]"
                      >
                        View Listing
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === skill.id}
                        onClick={() => handleDeleteListing(skill.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8F2618] hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === skill.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-6 text-center space-y-2">
                <BookOpen className="w-7 h-7 text-[#2F4D96] mx-auto" />
                <p className="text-sm font-bold text-[#1F2227]">No listings published yet</p>
                <p className="text-xs text-[#464B55] leading-relaxed">
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
