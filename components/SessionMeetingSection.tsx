'use client';

import React, { useState } from 'react';
import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import { validateGoogleMeetUrl, isSafeGoogleMeetUrl } from '@/lib/meeting-url';
import {
  Video,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface SessionMeetingSectionProps {
  session: Session;
  isTeacher: boolean;
  compact?: boolean;
}

export default function SessionMeetingSection({
  session,
  isTeacher,
  compact = false,
}: SessionMeetingSectionProps) {
  const { updateSessionMeetingUrl } = useApp();

  const savedMeetingUrl = session.meetingUrl ?? session.meetingLink ?? '';
  const hasSavedMeetingUrl = isSafeGoogleMeetUrl(savedMeetingUrl);

  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(savedMeetingUrl);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  if (session.status === 'cancelled' || session.status === 'declined') {
    return null;
  }

  const handleCopy = async () => {
    if (!hasSavedMeetingUrl) return;
    try {
      await navigator.clipboard.writeText(savedMeetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in restricted browser context
    }
  };

  const handleOpenEdit = () => {
    setUrlInput(savedMeetingUrl);
    setErrorMsg('');
    setSavedNotice(false);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const validation = validateGoogleMeetUrl(urlInput);
    if (!validation.valid || !validation.normalizedUrl) {
      setErrorMsg(validation.error || 'Please enter a valid Google Meet link.');
      return;
    }

    setErrorMsg('');
    setIsSaving(true);

    const res = await updateSessionMeetingUrl(session.id, validation.normalizedUrl);
    setIsSaving(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to save Google Meet URL.');
      return;
    }

    setUrlInput(res.meetingUrl || validation.normalizedUrl);
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Pending state
  if (session.status === 'pending') {
    return (
      <div
        className={`rounded-xl border border-[#4A4E57] bg-[#E6E3DA] ${
          compact ? 'px-3.5 py-2.5' : 'px-4 py-3'
        } flex items-center gap-2.5 text-xs text-[#464B55]`}
      >
        <Clock className="w-4 h-4 text-[#9E3922] shrink-0" />
        <span>
          {isTeacher
            ? 'Accept this request first to add a Google Meet room link.'
            : 'Google Meet link will appear once the teacher confirms this session.'}
        </span>
      </div>
    );
  }

  // Completed state
  if (session.status === 'completed') {
    if (!hasSavedMeetingUrl) return null;
    return (
      <div
        className={`rounded-xl border border-[#4A4E57] bg-[#EFECE4] ${
          compact ? 'px-3.5 py-2.5' : 'px-4 py-3'
        } flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-2 min-w-0 text-xs text-[#464B55]">
          <Video className="w-4 h-4 text-[#464B55] shrink-0" />
          <span className="truncate">{savedMeetingUrl}</span>
        </div>
        <span className="text-xs font-semibold text-[#195434] shrink-0">Meeting Completed</span>
      </div>
    );
  }

  // Confirmed state
  return (
    <div
      className={`rounded-xl border ${
        hasSavedMeetingUrl
          ? 'border-[#47785B] bg-[#F2FAF5]'
          : 'border-[#4A4E57] bg-[#E6E3DA]'
      } ${compact ? 'p-3.5' : 'p-4'} space-y-3`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              hasSavedMeetingUrl
                ? 'bg-[#DCF2E4] text-[#195434]'
                : 'bg-[#DCEB8E] text-[#1F2227]'
            }`}
          >
            <Video className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1F2227]">
              Google Meet Room
            </p>
            {savedNotice && (
              <p className="text-xs text-[#195434] font-medium">Meeting link saved</p>
            )}
          </div>
        </div>

        {hasSavedMeetingUrl && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8F6F0] hover:bg-[#E6E3DA] border border-[#4A4E57] text-xs font-semibold text-[#464B55] hover:text-[#1F2227] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#195434]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
            {isTeacher && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8F6F0] hover:bg-[#E6E3DA] border border-[#4A4E57] text-xs font-semibold text-[#9E3922] transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Saved Link Display + Join Button */}
      {hasSavedMeetingUrl && !isEditing && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-xs sm:text-sm text-[#464B55] font-mono truncate">
            {savedMeetingUrl}
          </p>
          <a
            href={savedMeetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#8AD7A8] hover:bg-[#77CA97] border-[1.5px] border-[#47785B] shadow-[0_2px_0_#47785B] text-[#18241C] text-xs sm:text-sm font-bold transition-colors shrink-0"
          >
            Join Meeting
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Teacher Add / Edit Form */}
      {isTeacher && (!hasSavedMeetingUrl || isEditing) && (
        <form onSubmit={handleSave} className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="https://meet.google.com/abc-defg-hij"
              disabled={isSaving}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none transition-colors"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] disabled:opacity-60 border-[1.5px] border-[#2A3F75] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : hasSavedMeetingUrl ? (
                  'Update Link'
                ) : (
                  'Save Link'
                )}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMsg('');
                    setUrlInput(savedMeetingUrl);
                  }}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-full bg-[#F8F6F0] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs font-semibold text-[#464B55] hover:text-[#1F2227] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-[#8F2618]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#464B55]">
            <span>Only https://meet.google.com/ room links are accepted.</span>
            <a
              href="https://meet.google.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#2F4D96] hover:text-[#9E3922] font-semibold shrink-0 ml-2"
            >
              Create Meet
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </form>
      )}

      {/* Learner Waiting Empty State */}
      {!isTeacher && !hasSavedMeetingUrl && (
        <p className="text-xs sm:text-sm text-[#464B55]">
          Waiting for {session.teacherName} to share the Google Meet link for this session.
        </p>
      )}
    </div>
  );
}
