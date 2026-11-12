'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useMessaging } from '@/context/MessagingContext';
import { X, Repeat, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface SkillSwapInviteModalProps {
  conversationId: string;
  partner: User;
  onClose: () => void;
}

export default function SkillSwapInviteModal({
  conversationId,
  partner,
  onClose,
}: SkillSwapInviteModalProps) {
  const { user } = useAuth();
  const { skills } = useApp();
  const { sendSkillSwapInvitation } = useMessaging();

  const myListings = useMemo(
    () => (user ? skills.filter((s) => s.teacherId === user.id) : []),
    [skills, user]
  );
  const partnerListings = useMemo(
    () => skills.filter((s) => s.teacherId === partner.id),
    [skills, partner.id]
  );

  const [offeredId, setOfferedId] = useState(myListings[0]?.id || '');
  const [requestedId, setRequestedId] = useState(partnerListings[0]?.id || '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const offeredSkill = myListings.find((s) => s.id === offeredId) || myListings[0];
  const requestedSkill = partnerListings.find((s) => s.id === requestedId) || partnerListings[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!offeredSkill || !requestedSkill) {
      setErrorMsg('Both participants need an active skill listing to send a swap invitation.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await sendSkillSwapInvitation(conversationId, {
        offeredSkillId: offeredSkill.id,
        offeredSkillTitle: offeredSkill.title,
        requestedSkillId: requestedSkill.id,
        requestedSkillTitle: requestedSkill.title,
        credits: requestedSkill.hourlyCredits || 1,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to send skill swap invitation.');
        return;
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2227]/45 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#CEC9BC] bg-[#E6E3DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#2F4D96]" />
            <h2 className="text-lg font-bold text-[#1F2227]">
              Invite {partner.name} to Swap Skills
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#464B55] hover:text-[#1F2227] hover:bg-[#E6E3DA] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {myListings.length === 0 || partnerListings.length === 0 ? (
            <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-5 space-y-3 text-sm text-[#464B55]">
              <p>
                {myListings.length === 0
                  ? 'Publish at least one skill listing first so you can offer it in this exchange.'
                  : `${partner.name} has not published an active skill listing yet.`}
              </p>
              {myListings.length === 0 && (
                <Link
                  href="/teach"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F4D96] hover:text-[#9E3922]"
                >
                  Offer a Skill
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2F4D96] mb-2">
                  You Teach
                </label>
                <select
                  value={offeredSkill?.id || ''}
                  onChange={(e) => setOfferedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
                >
                  {myListings.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#F8F6F0]">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#195434] mb-2">
                  You Want to Learn From {partner.name}
                </label>
                <select
                  value={requestedSkill?.id || ''}
                  onChange={(e) => setRequestedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
                >
                  {partnerListings.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#F8F6F0]">
                      {s.title} ({s.hourlyCredits} Cr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                  Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Share suggested availability or what you hope to focus on..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none resize-none"
                />
              </div>
            </>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-xs text-[#8F2618]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-sm font-semibold text-[#1F2227] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || myListings.length === 0 || partnerListings.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] disabled:opacity-50 border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
