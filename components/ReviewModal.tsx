'use client';

import React, { useState, useRef } from 'react';
import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import { Star, X, Sparkles, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  session: Session | null;
  onClose: () => void;
  onCompleted?: () => void;
}

export default function ReviewModal({ session, onClose, onCompleted }: ReviewModalProps) {
  const { completeSession } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    setError(null);
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await completeSession(
        session.id,
        rating,
        comment.trim() || 'Great session! Clear explanations and practical tips.'
      );
      if (res.success) {
        if (onCompleted) onCompleted();
        onClose();
      } else {
        setError(res.error || 'Unable to complete session. Please try again.');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Unable to complete session.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Complete Session & Release Credits
            </span>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{session.skillTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-2">How was your session with {session.teacherName}?</p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-200 hover:text-amber-400 focus:outline-hidden transition-colors"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-amber-700 mt-1">
              {rating === 5 && 'Outstanding! 🌟'}
              {rating === 4 && 'Very Good! 👍'}
              {rating === 3 && 'Average'}
              {rating <= 2 && 'Needs Improvement'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Peer Review
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you learn? How helpful was their guidance?"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-emerald-800 space-y-0.5">
            <p className="font-semibold flex items-center gap-1.5 text-emerald-900 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Credit Transfer Confirmation:
            </p>
            <p className="text-[11px] leading-relaxed">
              Confirming releases <strong>{session.credits} credits</strong> from escrow directly to{' '}
              <strong>{session.teacherName}</strong>.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-[11px]">{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Completing...
                </>
              ) : (
                `Confirm & Release ${session.credits} Cr`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
