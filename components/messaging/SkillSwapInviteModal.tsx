'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useMessaging } from '@/context/MessagingContext';
import { X, ArrowRightLeft, Sparkles, BookOpen, Clock, AlertCircle } from 'lucide-react';

interface SkillSwapInviteModalProps {
  partner: User;
  conversationId: string;
  onClose: () => void;
}

export default function SkillSwapInviteModal({
  partner,
  conversationId,
  onClose,
}: SkillSwapInviteModalProps) {
  const { user } = useAuth();
  const { skills } = useApp();
  const { sendSkillSwapInvitation } = useMessaging();

  // Skills taught by current user
  const userTeachingSkills = skills.filter((s) => s.teacherId === user?.id);
  const fallbackUserSkills = user?.skillsToTeach || [];

  // Skills taught by partner
  const partnerTeachingSkills = skills.filter((s) => s.teacherId === partner.id);
  const fallbackPartnerSkills = partner.skillsToTeach || [];

  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState<string>(
    userTeachingSkills[0]?.title || fallbackUserSkills[0] || 'Python Programming from Scratch'
  );

  const [selectedRequestedSkill, setSelectedRequestedSkill] = useState<string>(
    partnerTeachingSkills[0]?.title || fallbackPartnerSkills[0] || 'UI/UX Design & Figma Mastery'
  );

  const [note, setNote] = useState(
    `Hey ${partner.name.split(' ')[0]}! Would love to swap a session of ${selectedOfferedSkill} for ${selectedRequestedSkill}. Let's coordinate our schedules!`
  );
  const [error, setError] = useState<string | null>(null);

  // Update default note when skill selection changes
  const handleOfferedChange = (val: string) => {
    setSelectedOfferedSkill(val);
    setNote(`Hey ${partner.name.split(' ')[0]}! Would love to swap a session of ${val} for ${selectedRequestedSkill}. Let's coordinate our schedules!`);
  };

  const handleRequestedChange = (val: string) => {
    setSelectedRequestedSkill(val);
    setNote(`Hey ${partner.name.split(' ')[0]}! Would love to swap a session of ${selectedOfferedSkill} for ${val}. Let's coordinate our schedules!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be signed in to send an invitation.');
      return;
    }

    if (!selectedOfferedSkill || !selectedRequestedSkill) {
      setError('Please select both an offered skill and a requested skill.');
      return;
    }

    const offeredSkillObj = skills.find((s) => s.title === selectedOfferedSkill);
    const requestedSkillObj = skills.find((s) => s.title === selectedRequestedSkill);

    const credits = requestedSkillObj?.hourlyCredits || offeredSkillObj?.hourlyCredits || 2;

    const res = sendSkillSwapInvitation(conversationId, {
      offeredSkillId: offeredSkillObj?.id || `skill-custom-${Date.now()}`,
      offeredSkillTitle: selectedOfferedSkill,
      requestedSkillId: requestedSkillObj?.id || `skill-custom-${Date.now() + 1}`,
      requestedSkillTitle: selectedRequestedSkill,
      credits,
      note: note.trim(),
    });

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to send Skill Swap invitation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Invite to Skill Swap</h2>
              <p className="text-xs text-emerald-100">Exchange knowledge with {partner.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Skill Pair Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* You Teach */}
            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <label className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                You Teach
              </label>
              <select
                value={selectedOfferedSkill}
                onChange={(e) => handleOfferedChange(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {userTeachingSkills.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title} ({s.hourlyCredits} Cr/hr)
                  </option>
                ))}
                {userTeachingSkills.length === 0 &&
                  fallbackUserSkills.map((title, idx) => (
                    <option key={idx} value={title}>
                      {title}
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-emerald-700/80 block">
                Offered from your verified teaching skills
              </span>
            </div>

            {/* You Learn */}
            <div className="space-y-1.5 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80">
              <label className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                You Learn
              </label>
              <select
                value={selectedRequestedSkill}
                onChange={(e) => handleRequestedChange(e.target.value)}
                className="w-full bg-white border border-teal-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {partnerTeachingSkills.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title} ({s.hourlyCredits} Cr/hr)
                  </option>
                ))}
                {partnerTeachingSkills.length === 0 &&
                  fallbackPartnerSkills.map((title, idx) => (
                    <option key={idx} value={title}>
                      {title}
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-teal-700/80 block">
                {partner.name.split(' ')[0]}&apos;s active skills
              </span>
            </div>
          </div>

          {/* Personal Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Personal Swap Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Suggest session goals, topics, or times that work for you..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Educational Escrow Explainer */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              How Skill Swaps Work:
            </div>
            <p className="text-slate-500 leading-relaxed">
              Invitations help students agree on learning topics. When accepted, either student can schedule the session.
              Credits are only held in escrow when an actual session time is booked.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Send Swap Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
