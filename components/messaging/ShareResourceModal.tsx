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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#37332E] bg-[#1B1A18] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#65C995]" />
            <h2 className="text-lg font-bold text-[#F7F5F0]">Share Study Resource</h2>
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
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
              Resource Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DSA Cheat Sheet or Figma UI Kit"
              className="w-full px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
              URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
              Note (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this resource helps..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none resize-none"
            />
          </div>

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
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
