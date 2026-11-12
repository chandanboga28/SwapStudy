'use client';

import React, { useState } from 'react';
import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import { Star, X, CheckCircle2, Coins, AlertCircle, Loader2 } from 'lucide-react';

interface ReviewModalProps {
  session: Session;
  onClose: () => void;
  onCompleted?: () => void;
}

export default function ReviewModal({ session, onClose, onCompleted }: ReviewModalProps) {
  const { completeSession } = useApp();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDone, setIsDone] = useState(false);

  const ratingLabel = (value: number) => {
    switch (value) {
      case 5:
        return 'Outstanding — exceeded expectations';
      case 4:
        return 'Great session — very helpful';
      case 3:
        return 'Good session — solid overview';
      case 2:
        return 'Could be clearer';
      default:
        return 'Needs improvement';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await completeSession(
        session.id,
        rating,
        comment.trim() || 'Great learning session!'
      );
      if (!result.success) {
        setErrorMsg(result.error || 'Failed to complete session.');
        return;
      }

      setIsDone(true);
      onCompleted?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {isDone ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#65C995]/15 border border-[#65C995]/30 text-[#65C995] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#F7F5F0]">Session Completed</h3>
              <p className="text-sm text-[#AAA69F] leading-relaxed">
                {session.credits} {session.credits === 1 ? 'credit has' : 'credits have'} been released from escrow to{' '}
                <strong className="text-[#F7F5F0]">{session.teacherName}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 border-b border-[#37332E] flex items-center justify-between bg-[#1B1A18]">
              <div>
                <h3 className="text-lg font-bold text-[#F7F5F0]">Complete & Review Session</h3>
                <p className="text-xs text-[#AAA69F] mt-0.5 truncate">{session.skillTitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#2B2824] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Escrow Release Info */}
              <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF9B45]/15 border border-[#FF9B45]/30 flex items-center justify-center text-[#FF9B45] shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm text-[#AAA69F] leading-relaxed">
                  Confirming completion transfers{' '}
                  <strong className="text-[#F7F5F0]">
                    {session.credits} {session.credits === 1 ? 'credit' : 'credits'}
                  </strong>{' '}
                  from escrow to <strong className="text-[#F7F5F0]">{session.teacherName}</strong>.
                </p>
              </div>

              {/* Star Rating */}
              <div className="space-y-2.5 text-center">
                <label className="block text-sm font-bold text-[#F7F5F0]">
                  How was your session with {session.teacherName}?
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 rounded-xl hover:bg-[#2B2824] transition-transform hover:scale-110 cursor-pointer"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active
                              ? 'text-[#FF9B45] fill-[#FF9B45]'
                              : 'text-[#37332E]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-semibold text-[#F5B66B]">
                  {ratingLabel(hoverRating || rating)}
                </p>
              </div>

              {/* Written Review */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                  Written Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share what helped most during the session..."
                  className="w-full px-4 py-3 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none resize-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-sm text-[#F07878]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#65C995] hover:bg-[#53b984] disabled:opacity-50 text-[#171715] text-sm font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Releasing Credits...
                    </>
                  ) : (
                    'Complete & Release Credit'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
