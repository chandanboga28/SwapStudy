'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Session } from '@/types';
import { validateGoogleMeetUrl, isSafeGoogleMeetUrl } from '@/lib/meeting-url';
import {
  Video,
  ExternalLink,
  Pencil,
  Plus,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';

interface SessionMeetingSectionProps {
  session: Session;
  isTeacher: boolean;
  onSaveMeetingUrl?: (
    sessionId: string,
    meetingUrl: string
  ) => Promise<{ success: boolean; meetingUrl?: string; error?: string }>;
  onSavedSuccess?: (message: string) => void;
}

export default function SessionMeetingSection({
  session,
  isTeacher,
  onSaveMeetingUrl,
  onSavedSuccess,
}: SessionMeetingSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState(session.meetingUrl || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!isEditing) {
      setDraftUrl(session.meetingUrl || '');
      setError(null);
    }
  }, [session.meetingUrl, isEditing]);

  // Never show meeting links for cancelled or declined sessions
  if (session.status === 'cancelled' || session.status === 'declined') {
    return null;
  }

  const validMeetingUrl = isSafeGoogleMeetUrl(session.meetingUrl) ? session.meetingUrl : null;

  // For pending sessions, explain when link becomes available without exposing link actions
  if (session.status === 'pending') {
    return (
      <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          {isTeacher
            ? 'Accept this request first to add a Google Meet link for your learner.'
            : 'Google Meet link will appear here once your instructor confirms the session.'}
        </span>
      </div>
    );
  }

  // For completed sessions, show read-only link reference only if one was recorded
  if (session.status === 'completed') {
    if (!validMeetingUrl) return null;
    return (
      <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Video className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] font-medium text-slate-600 shrink-0">Session Meet URL:</span>
          <span className="text-[11px] text-slate-500 truncate font-mono">{validMeetingUrl}</span>
        </div>
        <a
          href={validMeetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 shrink-0"
        >
          Open Link
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  const handleOpenEditor = () => {
    setDraftUrl(validMeetingUrl || '');
    setError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftUrl(validMeetingUrl || '');
    setError(null);
  };

  const handleCopy = async () => {
    if (!validMeetingUrl) return;
    try {
      await navigator.clipboard.writeText(validMeetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRef.current || isSaving || !onSaveMeetingUrl) return;

    const validation = validateGoogleMeetUrl(draftUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      setError(validation.error || 'Please enter a valid Google Meet link.');
      return;
    }

    setError(null);
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const res = await onSaveMeetingUrl(session.id, validation.normalizedUrl);
      if (res.success) {
        setIsEditing(false);
        setDraftUrl(res.meetingUrl || validation.normalizedUrl);
        if (onSavedSuccess) {
          onSavedSuccess(
            validMeetingUrl
              ? 'Google Meet link updated and shared with your learner.'
              : 'Google Meet link saved and shared with your learner.'
          );
        }
      } else {
        setError(res.error || 'Failed to save Google Meet link. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save Google Meet link.');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // CONFIRMED session view
  return (
    <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              validMeetingUrl
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-amber-50 text-amber-700 border border-amber-200/80'
            }`}
          >
            <Video className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">Google Meet Session Link</span>
              {validMeetingUrl ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  Ready to Join
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/70">
                  Pending Link
                </span>
              )}
            </div>

            {validMeetingUrl ? (
              <p className="text-[11px] text-slate-600 font-mono truncate mt-0.5" title={validMeetingUrl}>
                {validMeetingUrl}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {isTeacher
                  ? 'No Google Meet link added yet. Create a link on Google Meet and share it below.'
                  : 'No meeting link has been added yet. Your instructor will share the Google Meet URL here.'}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {validMeetingUrl && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                  title="Copy Google Meet URL"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Copy
                    </>
                  )}
                </button>

                <a
                  href={validMeetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  Join Meeting
                  <ExternalLink className="w-3 h-3 opacity-85" />
                </a>
              </>
            )}

            {isTeacher && onSaveMeetingUrl && (
              <button
                type="button"
                onClick={handleOpenEditor}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  validMeetingUrl
                    ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                }`}
              >
                {validMeetingUrl ? (
                  <>
                    <Pencil className="w-3 h-3" />
                    Update Link
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add Google Meet Link
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Teacher URL Add / Update Form */}
      {isTeacher && isEditing && (
        <form onSubmit={handleSubmit} className="pt-2.5 border-t border-slate-100 space-y-2.5">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              required
              disabled={isSaving}
              value={draftUrl}
              onChange={(e) => {
                setDraftUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://meet.google.com/abc-defg-hij"
              aria-label="Google Meet URL"
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-60"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={isSaving || !draftUrl.trim()}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Meet Link'
                )}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCancelEdit}
                className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>Only links starting with https://meet.google.com/ are accepted.</span>
            <a
              href="https://meet.google.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
            >
              Create a room on Google Meet
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </form>
      )}
    </div>
  );
}

