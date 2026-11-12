'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Repeat,
  User as UserIcon,
  Mail,
  Lock,
  GraduationCap,
  BookOpen,
  Plus,
  X,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function SignupPage() {
  const { user, signup, isLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('Ajeenkya DY Patil University (ADYPU)');
  const [major, setMajor] = useState('');
  const [graduationYear, setGraduationYear] = useState('2027');

  const [teachInput, setTeachInput] = useState('');
  const [skillsToTeach, setSkillsToTeach] = useState<string[]>([]);
  const [learnInput, setLearnInput] = useState('');
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const addTag = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!list.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setList([...list, trimmed]);
    }
    setter('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const finalTeach =
      teachInput.trim() && !skillsToTeach.includes(teachInput.trim())
        ? [...skillsToTeach, teachInput.trim()]
        : skillsToTeach;

    const finalLearn =
      learnInput.trim() && !skillsToLearn.includes(learnInput.trim())
        ? [...skillsToLearn, learnInput.trim()]
        : skillsToLearn;

    if (!name.trim() || !email.trim() || !password || !major.trim()) {
      setErrorMsg('Please fill out your name, email, password, and major.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        university: university.trim() || 'Ajeenkya DY Patil University (ADYPU)',
        major: major.trim(),
        graduationYear,
        skillsToTeach: finalTeach,
        skillsToLearn: finalLearn,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Could not create account.');
        return;
      }

      if (res.needsEmailConfirmation) {
        setNeedsEmailConfirmation(true);
        return;
      }

      router.push('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  if (needsEmailConfirmation) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#171715]">
        <div className="w-full max-w-md bg-[#22211F] border border-[#37332E] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#65C995]/15 border border-[#65C995]/30 text-[#65C995] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#F7F5F0]">Check your inbox</h1>
            <p className="text-sm text-[#AAA69F] leading-relaxed">
              We sent a confirmation link to <strong className="text-[#F7F5F0]">{email}</strong>. Verify your email address, then log in to start swapping skills.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 bg-[#171715]">
      <div className="w-full max-w-2xl bg-[#22211F] border border-[#37332E] rounded-2xl p-7 sm:p-10 shadow-2xl space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[#FF9B45] text-[#171715] flex items-center justify-center">
            <Repeat className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F7F5F0] tracking-tight">
              Create your student account
            </h1>
            <p className="text-sm sm:text-base text-[#AAA69F] mt-1">
              Get matched with classmates who want to learn what you know and teach what you need.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Account Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Campus Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@adypu.edu.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Major / Program
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="B.Tech Computer Science"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                University
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Grad Year
              </label>
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] focus:outline-none"
              >
                {['2025', '2026', '2027', '2028', '2029', '2030'].map((yr) => (
                  <option key={yr} value={yr} className="bg-[#22211F]">
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skills Tag Builders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* Can Teach */}
            <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
                Skills You Can Teach
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(teachInput, setTeachInput, skillsToTeach, setSkillsToTeach);
                    }
                  }}
                  placeholder="e.g. Python, Figma"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTag(teachInput, setTeachInput, skillsToTeach, setSkillsToTeach)}
                  className="px-3 py-2 rounded-xl bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] font-bold transition-colors shrink-0 cursor-pointer"
                  aria-label="Add skill to teach"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {skillsToTeach.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skillsToTeach.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171715] border border-[#37332E] text-xs font-semibold text-[#F7F5F0]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          setSkillsToTeach(skillsToTeach.filter((t) => t !== tag))
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

            {/* Want to Learn */}
            <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#65C995]">
                Skills You Want to Learn
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={learnInput}
                  onChange={(e) => setLearnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(learnInput, setLearnInput, skillsToLearn, setSkillsToLearn);
                    }
                  }}
                  placeholder="e.g. React, UI Design"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTag(learnInput, setLearnInput, skillsToLearn, setSkillsToLearn)}
                  className="px-3 py-2 rounded-xl bg-[#65C995] hover:bg-[#53b984] text-[#171715] font-bold transition-colors shrink-0 cursor-pointer"
                  aria-label="Add skill to learn"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {skillsToLearn.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skillsToLearn.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171715] border border-[#37332E] text-xs font-semibold text-[#F7F5F0]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          setSkillsToLearn(skillsToLearn.filter((t) => t !== tag))
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
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-sm text-[#F07878]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
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
                Creating Account...
              </>
            ) : (
              <>
                Create Student Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[#AAA69F]">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#FF9B45] hover:text-[#F5B66B]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
