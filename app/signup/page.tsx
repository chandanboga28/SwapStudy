'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowRightLeft,
  Mail,
  Lock,
  User as UserIcon,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Coins,
  Plus,
  X,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('Ajeenkya DY Patil University');
  const [major, setMajor] = useState('');

  // Skill tags
  const [teachInput, setTeachInput] = useState('');
  const [skillsToTeach, setSkillsToTeach] = useState<string[]>([]);
  const [learnInput, setLearnInput] = useState('');
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleAddTeachSkill = () => {
    const trimmed = teachInput.trim();
    if (trimmed && !skillsToTeach.includes(trimmed)) {
      setSkillsToTeach([...skillsToTeach, trimmed]);
      setTeachInput('');
    }
  };

  const handleRemoveTeachSkill = (skill: string) => {
    setSkillsToTeach(skillsToTeach.filter((s) => s !== skill));
  };

  const handleAddLearnSkill = () => {
    const trimmed = learnInput.trim();
    if (trimmed && !skillsToLearn.includes(trimmed)) {
      setSkillsToLearn([...skillsToLearn, trimmed]);
      setLearnInput('');
    }
  };

  const handleRemoveLearnSkill = (skill: string) => {
    setSkillsToLearn(skillsToLearn.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your campus email address.');
      return;
    }

    if (!university.trim()) {
      setError('Please enter your university or college name.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const finalTeach =
      teachInput.trim() && !skillsToTeach.includes(teachInput.trim())
        ? [...skillsToTeach, teachInput.trim()]
        : skillsToTeach;

    const finalLearn =
      learnInput.trim() && !skillsToLearn.includes(learnInput.trim())
        ? [...skillsToLearn, learnInput.trim()]
        : skillsToLearn;

    if (finalTeach.length === 0) {
      setError('Please add at least one skill you can share or teach.');
      return;
    }

    if (finalLearn.length === 0) {
      setError('Please add at least one skill you want to learn.');
      return;
    }

    setSkillsToTeach(finalTeach);
    setSkillsToLearn(finalLearn);
    setTeachInput('');
    setLearnInput('');
    setIsLoading(true);

    try {
      const res = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        university: university.trim(),
        major: major.trim() || 'General Studies',
        skillsToTeach: finalTeach,
        skillsToLearn: finalLearn,
      });

      if (res.success) {
        if (res.needsEmailConfirmation) {
          setConfirmationMessage(
            `Account created for ${email.trim()}. Please check your inbox and verify your email address before signing in.`
          );
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(res.error || 'Failed to create account.');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-xl w-full space-y-5">
        {/* Brand */}
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-2 mb-1 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-900">
              Swap<span className="text-emerald-600">Study</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Create Your Student Profile
          </h1>
          <p className="text-xs text-slate-500">
            Every student has something valuable to teach and something exciting to learn.
          </p>
        </div>

        {/* Bonus Callout */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
              3 Starter Platform Credits
            </p>
            <p className="text-[11px] text-emerald-800">
              New student members receive <strong>3 non-monetary platform credits</strong> to book peer learning sessions right away.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="card-subtle rounded-xl p-6 sm:p-7 space-y-4">
          {confirmationMessage ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Confirm your campus email</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{confirmationMessage}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Go to Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@adypu.edu.in"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* University & Major */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  University / College
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Ajeenkya DY Patil University (ADYPU)"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Major / Field of Study
                </label>
                <input
                  type="text"
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Skills I Can Teach */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-900 mb-0.5">
                Skills you can teach or share <span className="text-emerald-600">*</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                What can you help peers with? (e.g. Python, Calculus, Video Editing)
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTeachSkill();
                    }
                  }}
                  placeholder="Type a skill and hit Add"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddTeachSkill}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skillsToTeach.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveTeachSkill(skill)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Skills I Want to Learn */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-900 mb-0.5">
                Skills you want to learn <span className="text-emerald-600">*</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                What are you hoping to study? (e.g. Figma, Next.js, Spanish)
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={learnInput}
                  onChange={(e) => setLearnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLearnSkill();
                    }
                  }}
                  placeholder="Type a skill and hit Add"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddLearnSkill}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skillsToLearn.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveLearnSkill(skill)}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 mt-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up student profile...
                </span>
              ) : (
                <>
                  Create Account & Claim 3 Credits
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
