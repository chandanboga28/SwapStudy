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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2227]/45 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {isDone ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#DCF2E4] border border-[#47785B] text-[#195434] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1F2227]">Session Completed</h3>
              <p className="text-sm text-[#464B55] leading-relaxed">
                {session.credits} {session.credits === 1 ? 'credit has' : 'credits have'} been released from escrow to{' '}
                <strong className="text-[#1F2227]">{session.teacherName}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 border-b border-[#CEC9BC] flex items-center justify-between bg-[#E6E3DA]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2227]">Complete & Review Session</h3>
                <p className="text-xs text-[#464B55] mt-0.5 truncate">{session.skillTitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#464B55] hover:text-[#1F2227] hover:bg-[#E6E3DA] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Escrow Release Info */}
              <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] flex items-center justify-center text-[#1F2227] shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm text-[#464B55] leading-relaxed">
                  Confirming completion transfers{' '}
                  <strong className="text-[#1F2227]">
                    {session.credits} {session.credits === 1 ? 'credit' : 'credits'}
                  </strong>{' '}
                  from escrow to <strong className="text-[#1F2227]">{session.teacherName}</strong>.
                </p>
              </div>

              {/* Star Rating */}
              <div className="space-y-2.5 text-center">
                <label className="block text-sm font-bold text-[#1F2227]">
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
                        className="p-1.5 rounded-xl hover:bg-[#E6E3DA] transition-transform hover:scale-110 cursor-pointer"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active
                              ? 'text-[#8A6500] fill-[#F4DC82]'
                              : 'text-[#7B766B]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-semibold text-[#9E3922]">
                  {ratingLabel(hoverRating || rating)}
                </p>
              </div>

              {/* Written Review */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                  Written Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share what helped most during the session..."
                  className="w-full px-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none resize-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-sm text-[#8F2618]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-sm font-semibold text-[#1F2227] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#8AD7A8] hover:bg-[#77CA97] disabled:opacity-50 border-[1.5px] border-[#47785B] shadow-[0_2px_0_#47785B] text-[#18241C] text-sm font-bold transition-colors cursor-pointer"
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
