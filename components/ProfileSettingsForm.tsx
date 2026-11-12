'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';

interface ProfileSettingsFormProps {
  user: User;
}

export default function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const { updateUser } = useAuth();

  const [name, setName] = useState(user.name);
  const [university] = useState(user.university);
  const [major, setMajor] = useState(user.major || '');
  const [graduationYear, setGraduationYear] = useState(user.graduationYear || '2027');
  const [bio, setBio] = useState(user.bio || '');
  const [skillsToTeach, setSkillsToTeach] = useState<string[]>(user.skillsToTeach || []);
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>(user.skillsToLearn || []);

  const [teachInput, setTeachInput] = useState('');
  const [learnInput, setLearnInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const addSkillTag = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const clean = input.trim();
    if (!clean) return;
    if (!list.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setList([...list, clean]);
    }
    setInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const finalTeach =
      teachInput.trim() && !skillsToTeach.includes(teachInput.trim())
        ? [...skillsToTeach, teachInput.trim()]
        : skillsToTeach;

    const finalLearn =
      learnInput.trim() && !skillsToLearn.includes(learnInput.trim())
        ? [...skillsToLearn, learnInput.trim()]
        : skillsToLearn;

    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await updateUser({
        name: name.trim(),
        major: major.trim(),
        graduationYear,
        bio: bio.trim(),
        skillsToTeach: finalTeach,
        skillsToLearn: finalLearn,
      });

      if (!res.success) {
        setSaveMessage({ type: 'error', text: res.error || 'Could not update profile.' });
        return;
      }

      setTeachInput('');
      setLearnInput('');
      setSkillsToTeach(finalTeach);
      setSkillsToLearn(finalLearn);
      setSaveMessage({ type: 'success', text: 'Profile and skill preferences saved.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
            University
          </label>
          <input
            type="text"
            value={university}
            disabled
            className="w-full px-4 py-2.5 rounded-xl bg-[#111110] border border-[#37332E] text-[15px] text-[#AAA69F] cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
            Major / Department
          </label>
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="B.Tech Computer Science"
            className="w-full px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
            Graduation Year
          </label>
          <select
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] focus:outline-none"
          >
            {['2025', '2026', '2027', '2028', '2029', '2030'].map((yr) => (
              <option key={yr} value={yr} className="bg-[#22211F]">
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
          Short Bio
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell peers about your academic interests, projects, and what you enjoy teaching..."
          className="w-full px-4 py-3 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Skills To Teach */}
        <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
            Skills You Teach
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={teachInput}
              onChange={(e) => setTeachInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkillTag(teachInput, setTeachInput, skillsToTeach, setSkillsToTeach);
                }
              }}
              placeholder="Add skill tag..."
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                addSkillTag(teachInput, setTeachInput, skillsToTeach, setSkillsToTeach)
              }
              className="px-3 py-2 rounded-xl bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] font-bold cursor-pointer"
              aria-label="Add teaching skill"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillsToTeach.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171715] border border-[#37332E] text-xs font-semibold text-[#F7F5F0]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setSkillsToTeach(skillsToTeach.filter((t) => t !== tag))}
                  className="text-[#AAA69F] hover:text-[#F07878]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Skills To Learn */}
        <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#65C995]">
            Learning Wishlist
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={learnInput}
              onChange={(e) => setLearnInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkillTag(learnInput, setLearnInput, skillsToLearn, setSkillsToLearn);
                }
              }}
              placeholder="Add wishlist tag..."
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                addSkillTag(learnInput, setLearnInput, skillsToLearn, setSkillsToLearn)
              }
              className="px-3 py-2 rounded-xl bg-[#65C995] hover:bg-[#53b984] text-[#171715] font-bold cursor-pointer"
              aria-label="Add learning skill"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillsToLearn.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171715] border border-[#37332E] text-xs font-semibold text-[#F7F5F0]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setSkillsToLearn(skillsToLearn.filter((t) => t !== tag))}
                  className="text-[#AAA69F] hover:text-[#F07878]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium ${
            saveMessage.type === 'error'
              ? 'bg-[#F07878]/10 border-[#F07878]/30 text-[#F07878]'
              : 'bg-[#65C995]/10 border-[#65C995]/30 text-[#65C995]'
          }`}
        >
          {saveMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] disabled:opacity-50 text-[#171715] text-sm font-bold transition-colors cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

