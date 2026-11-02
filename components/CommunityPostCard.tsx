'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CommunityPost, Skill } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Send,
  Check,
} from 'lucide-react';

interface CommunityPostCardProps {
  post: CommunityPost;
  onViewAuthorProfile: (authorId: string) => void;
  onBookRelatedSkill?: (skillId: string) => void;
  availableSkills?: Skill[];
}

export default function CommunityPostCard({
  post,
  onViewAuthorProfile,
  onBookRelatedSkill,
  availableSkills = [],
}: CommunityPostCardProps) {
  const { user } = useAuth();
  const { likePost, commentPost, savePost, savedPostIds } = useCommunity();

  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const isLiked = user ? post.likedBy.includes(user.id) : false;
  const isSaved = savedPostIds.includes(post.id);

  const handleLike = () => {
    if (!user) return;
    likePost(post.id);
  };

  const handleSave = () => {
    if (!user) return;
    savePost(post.id);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!commentInput.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    const res = commentPost(post.id, commentInput.trim());
    if (res.success) {
      setCommentInput('');
    } else {
      setCommentError(res.error || 'Failed to post comment.');
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Discussions':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'Questions':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'Resources':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Achievements':
        return 'bg-purple-50 text-purple-700 border-purple-200/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Find related skill if available
  const relatedSkill = post.relatedSkillId
    ? availableSkills.find((s) => s.id === post.relatedSkillId)
    : null;

  return (
    <article className="card-subtle rounded-2xl p-5 space-y-4 border border-slate-200/80 bg-white hover:border-slate-300 transition-all">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onViewAuthorProfile(post.authorId)}
            className="shrink-0 relative group"
            title="View student profile"
          >
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 ring-2 ring-transparent group-hover:ring-emerald-500/30 transition-all"
            />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onViewAuthorProfile(post.authorId)}
                className="text-xs font-bold text-slate-900 hover:text-emerald-700 transition-colors truncate"
              >
                {post.authorName}
              </button>
              {post.isAuthorVerified ? (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-semibold"
                  title="Verified College Student"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Peer
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-medium"
                  title="Unverified Student"
                >
                  Student
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {post.authorMajor} • <time className="text-slate-400">{post.createdAt}</time>
            </p>
          </div>
        </div>

        {/* Category Pill */}
        <span
          className={`shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
            post.category
          )}`}
        >
          {post.category}
        </span>
      </div>

      {/* Post Title & Content */}
      <div className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
          {post.title}
        </h3>
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium text-slate-600 bg-slate-100/80 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Related Skill or Resource Attachment Card */}
      {(post.relatedSkillTitle || post.resourceUrl) && (
        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          {/* Related Skill Attachment */}
          {post.relatedSkillTitle && (
            <div className="flex-1 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                    Associated Skill
                  </span>
                  <p className="font-semibold text-slate-900 truncate text-xs">
                    {post.relatedSkillTitle}
                  </p>
                </div>
              </div>

              {post.relatedSkillId && (
                <div className="shrink-0 flex items-center gap-1.5">
                  <Link
                    href={`/skills/${post.relatedSkillId}`}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold transition-colors"
                  >
                    View Course
                  </Link>
                  {onBookRelatedSkill && relatedSkill && (
                    <button
                      onClick={() => onBookRelatedSkill(post.relatedSkillId!)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors shadow-2xs"
                    >
                      Book Swap
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* External Resource URL */}
          {post.resourceUrl && (
            <a
              href={post.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 flex items-center gap-2 text-xs transition-colors shrink-0 max-w-full sm:max-w-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-[11px] font-medium text-slate-600">
                {post.resourceUrl.replace(/^https?:\/\//, '')}
              </span>
            </a>
          )}
        </div>
      )}

      {/* Interaction Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs ${
              isLiked
                ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{post.likesCount}</span>
          </button>

          {/* Comment Toggle Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs ${
              showComments
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.comments.length}</span>
          </button>

          {/* Save Post */}
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title={isSaved ? 'Saved to bookmarks' : 'Save post'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-600 text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs transition-colors"
          title="Copy link"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Comments Thread */}
      {showComments && (
        <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
          {/* Comments List */}
          {post.comments.length > 0 ? (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {post.comments.map((comm) => (
                <div
                  key={comm.id}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{comm.authorName}</span>
                      {comm.isAuthorVerified && (
                        <span title="Verified Student">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <time className="text-[10px] text-slate-400">{comm.createdAt}</time>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{comm.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-1">No comments yet. Start the conversation!</p>
          )}

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="pt-1 flex items-center gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add your reply or swap notes..."
              className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <Send className="w-3 h-3" />
              Reply
            </button>
          </form>
          {commentError && (
            <p className="text-[11px] text-rose-600">{commentError}</p>
          )}
        </div>
      )}
    </article>
  );
}
