'use client';

import React, { useState } from 'react';
import { useMessaging } from '@/context/MessagingContext';
import { X, Link2, AlertCircle, Loader2 } from 'lucide-react';

interface ShareResourceModalProps {
  conversationId: string;
  onClose: () => void;
}

export default function ShareResourceModal({
  conversationId,
  onClose,
}: ShareResourceModalProps) {
  const { sendMessage } = useMessaging();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanTitle = title.trim();
    const cleanUrl = url.trim();
    if (!cleanTitle || !cleanUrl) {
      setErrorMsg('Please enter both a resource title and valid URL.');
      return;
    }

    try {
      const parsed = new URL(cleanUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setErrorMsg('URL must start with https:// or http://.');
        return;
      }
    } catch {
      setErrorMsg('Please enter a valid URL.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await sendMessage(
        conversationId,
        note.trim() || cleanTitle,
        'resource',
        {
          resourceTitle: cleanTitle,
          resourceUrl: cleanUrl,
        }
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Could not share resource.');
        return;
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2227]/45 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#CEC9BC] bg-[#E6E3DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#195434]" />
            <h2 className="text-lg font-bold text-[#1F2227]">Share Study Resource</h2>
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
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
              Resource Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DSA Cheat Sheet or Figma UI Kit"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
              URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
              Note (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this resource helps..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none resize-none"
            />
          </div>

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
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
