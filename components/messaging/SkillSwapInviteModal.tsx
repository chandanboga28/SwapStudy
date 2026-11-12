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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#37332E] bg-[#1B1A18] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#FF9B45]" />
            <h2 className="text-lg font-bold text-[#F7F5F0]">
              Invite {partner.name} to Swap Skills
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#2B2824] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {myListings.length === 0 || partnerListings.length === 0 ? (
            <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-5 space-y-3 text-sm text-[#AAA69F]">
              <p>
                {myListings.length === 0
                  ? 'Publish at least one skill listing first so you can offer it in this exchange.'
                  : `${partner.name} has not published an active skill listing yet.`}
              </p>
              {myListings.length === 0 && (
                <Link
                  href="/teach"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF9B45] hover:text-[#F5B66B]"
                >
                  Offer a Skill
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#FF9B45] mb-2">
                  You Teach
                </label>
                <select
                  value={offeredSkill?.id || ''}
                  onChange={(e) => setOfferedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
                >
                  {myListings.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#22211F]">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#65C995] mb-2">
                  You Want to Learn From {partner.name}
                </label>
                <select
                  value={requestedSkill?.id || ''}
                  onChange={(e) => setRequestedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
                >
                  {partnerListings.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#22211F]">
                      {s.title} ({s.hourlyCredits} Cr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                  Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Share suggested availability or what you hope to focus on..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none resize-none"
                />
              </div>
            </>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-xs text-[#F07878]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#2B2824] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || myListings.length === 0 || partnerListings.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] disabled:opacity-50 text-[#171715] text-sm font-bold cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
