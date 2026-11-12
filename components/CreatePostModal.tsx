'use client';

import React, { useState } from 'react';
import { PostCategory } from '@/types';
import { useApp } from '@/context/AppContext';
import { useCommunity } from '@/context/CommunityContext';
import { X, Plus, AlertCircle, MessageSquarePlus } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

const CATEGORIES: PostCategory[] = ['Discussions', 'Questions', 'Resources', 'Achievements'];

export default function CreatePostModal({ onClose, onCreated }: CreatePostModalProps) {
  const { skills } = useApp();
  const { createPost } = useCommunity();

  const [category, setCategory] = useState<PostCategory>('Discussions');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [relatedSkillId, setRelatedSkillId] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const addTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (!tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please enter both a headline and post body.');
      return;
    }

    const finalTags =
      tagInput.trim() && !tags.includes(tagInput.trim().replace(/^#/, ''))
        ? [...tags, tagInput.trim().replace(/^#/, '')]
        : tags;

    const matchedSkill = skills.find((s) => s.id === relatedSkillId);

    const res = createPost({
      title: title.trim(),
      content: content.trim(),
      category,
      tags: finalTags,
      relatedSkillId: matchedSkill?.id,
      relatedSkillTitle: matchedSkill?.title,
      resourceUrl: resourceUrl.trim() || undefined,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Could not publish community post.');
      return;
    }

    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[#37332E] bg-[#1B1A18] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <MessageSquarePlus className="w-5 h-5 text-[#FF9B45]" />
            <h2 className="text-xl font-bold text-[#F7F5F0]">New Community Post</h2>
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Category Pills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-[#FF9B45] text-[#171715] border-[#FF9B45]'
                      : 'bg-[#171715] text-[#AAA69F] border-[#37332E] hover:text-[#F7F5F0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
              Headline
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Looking for a React peer partner before Friday sprint"
              className="w-full px-4 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-[15px] text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
              Content
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share details, questions, study tips, or helpful guides..."
              className="w-full px-4 py-3 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
              Topics / Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g. react, exam-prep"
                className="flex-1 px-4 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3.5 py-2 rounded-xl bg-[#2B2824] border border-[#37332E] text-[#FF9B45] hover:bg-[#37332E] cursor-pointer"
                aria-label="Add tag"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#F7F5F0]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="text-[#AAA69F] hover:text-[#F07878]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Link Skill Listing (Optional)
              </label>
              <select
                value={relatedSkillId}
                onChange={(e) => setRelatedSkillId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
              >
                <option value="" className="bg-[#22211F]">None</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#22211F]">
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                Resource URL (Optional)
              </label>
              <input
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-sm text-[#F07878]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors cursor-pointer"
            >
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
