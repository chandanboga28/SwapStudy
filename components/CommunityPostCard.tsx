'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CommunityPost, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import {
  Heart,
  MessageSquare,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  Send,
  BookOpen,
  Clock,
} from 'lucide-react';

interface CommunityPostCardProps {
  post: CommunityPost;
  onViewProfile?: (student: User) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  Discussions: 'bg-[#FF9B45]/15 text-[#FF9B45] border-[#FF9B45]/30',
  Questions: 'bg-[#F5B66B]/15 text-[#F5B66B] border-[#F5B66B]/30',
  Resources: 'bg-[#65C995]/15 text-[#65C995] border-[#65C995]/30',
  Achievements: 'bg-[#F7F5F0]/10 text-[#F7F5F0] border-[#F7F5F0]/25',
};

export default function CommunityPostCard({ post, onViewProfile }: CommunityPostCardProps) {
  const { user, allUsers } = useAuth();
  const { likePost, commentPost, savePost, savedPostIds } = useCommunity();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');

  const isLiked = user ? post.likedBy.includes(user.id) : false;
  const isSaved = savedPostIds.includes(post.id) || (user ? post.savedBy.includes(user.id) : false);

  const authorUser =
    (user && user.id === post.authorId ? user : null) ||
    allUsers.find((u) => u.id === post.authorId);

  const handleAuthorClick = () => {
    if (authorUser && onViewProfile) {
      onViewProfile(authorUser);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const res = commentPost(post.id, commentText.trim());
    if (!res.success) {
      setCommentError(res.error || 'Could not post reply.');
      return;
    }

    setCommentError('');
    setCommentText('');
  };

  const categoryClass =
    CATEGORY_STYLES[post.category] || 'bg-[#2B2824] text-[#F5B66B] border-[#37332E]';

  const formattedDate = (() => {
    const parsed = new Date(post.createdAt);
    if (Number.isNaN(parsed.getTime())) return post.createdAt;
    return parsed.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  })();

  return (
    <article className="bg-[#22211F] border border-[#37332E] hover:border-[#4F4942] rounded-2xl p-6 space-y-4 transition-colors">
      {/* Author & Category Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleAuthorClick}
            disabled={!authorUser || !onViewProfile}
            className="shrink-0 disabled:cursor-default cursor-pointer"
          >
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-10 h-10 rounded-full object-cover border border-[#37332E] bg-[#171715]"
            />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAuthorClick}
                disabled={!authorUser || !onViewProfile}
                className="text-sm font-bold text-[#F7F5F0] hover:text-[#FF9B45] transition-colors truncate disabled:hover:text-[#F7F5F0] cursor-pointer disabled:cursor-default"
              >
                {post.authorName}
              </button>
              {post.isAuthorVerified && (
                <ShieldCheck className="w-4 h-4 text-[#65C995] shrink-0" />
              )}
            </div>
            <p className="text-xs text-[#AAA69F] flex items-center gap-1.5 truncate">
              <span>{post.authorMajor || 'Student'}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </span>
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryClass}`}>
          {post.category}
        </span>
      </div>

      {/* Body Content */}
      <div className="space-y-2.5">
        <h3 className="text-lg sm:text-xl font-bold text-[#F7F5F0] leading-snug">
          {post.title}
        </h3>
        <p className="text-sm sm:text-[15px] text-[#AAA69F] leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[#171715] border border-[#37332E] text-xs font-medium text-[#AAA69F]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Related Skill or Resource Link */}
      {(post.relatedSkillId || post.resourceUrl) && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {post.relatedSkillId && post.relatedSkillTitle && (
            <Link
              href={`/skills/${post.relatedSkillId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-xs font-bold text-[#FF9B45] transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Related Skill: {post.relatedSkillTitle}
            </Link>
          )}
          {post.resourceUrl && (
            <a
              href={post.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-xs font-bold text-[#65C995] transition-colors"
            >
              Open Shared Resource
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#37332E] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => likePost(post.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              isLiked
                ? 'bg-[#FF9B45]/15 border-[#FF9B45]/40 text-[#FF9B45]'
                : 'bg-[#171715] border-[#37332E] text-[#AAA69F] hover:text-[#F7F5F0]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#FF9B45]' : ''}`} />
            {post.likesCount}
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171715] border border-[#37332E] text-xs font-bold text-[#AAA69F] hover:text-[#F7F5F0] transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {post.comments.length}
          </button>
        </div>

        <button
          type="button"
          onClick={() => savePost(post.id)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
            isSaved
              ? 'bg-[#F5B66B]/15 border-[#F5B66B]/40 text-[#F5B66B]'
              : 'bg-[#171715] border-[#37332E] text-[#AAA69F] hover:text-[#F7F5F0]'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#F5B66B]' : ''}`} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="pt-4 border-t border-[#37332E] space-y-4">
          {post.comments.length > 0 && (
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-[#171715] border border-[#37332E] rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-6 h-6 rounded-full object-cover border border-[#37332E]"
                      />
                      <span className="text-xs font-bold text-[#F7F5F0]">
                        {comment.authorName}
                      </span>
                      {comment.isAuthorVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#65C995]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#AAA69F]">
                      {new Date(comment.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[#AAA69F] pl-8">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {user && (
            <form onSubmit={handleCommentSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a helpful reply..."
                  className="flex-1 px-4 py-2 rounded-full bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Reply
                </button>
              </div>
              {commentError && <p className="text-xs text-[#F07878]">{commentError}</p>}
            </form>
          )}
        </div>
      )}
    </article>
  );
}
