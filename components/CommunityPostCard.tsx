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
  Discussions: 'bg-[#DCEB8E] text-[#1F2227] border-[#4A4E57]',
  Questions: 'bg-[#FBF0C9] text-[#5C4609] border-[#8C7228]',
  Resources: 'bg-[#DCF2E4] text-[#195434] border-[#47785B]',
  Achievements: 'bg-[#DCEB8E] text-[#1F2227] border-[#4A4E57]',
};

export default function CommunityPostCard({ post, onViewProfile }: CommunityPostCardProps) {
  const { user, allUsers } = useAuth();
  const { likePost, commentPost, savePost, savedPostIds, sameCollegeStudents, openAuthPrompt } = useCommunity();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');

  const isLiked = user ? post.likedBy.includes(user.id) : false;
  const isSaved = savedPostIds.includes(post.id) || (user ? post.savedBy.includes(user.id) : false);

  const authorUser =
    (user && user.id === post.authorId ? user : null) ||
    allUsers.find((u) => u.id === post.authorId) ||
    sameCollegeStudents.find((u) => u.id === post.authorId);

  const handleAuthorClick = () => {
    if (authorUser && onViewProfile) {
      onViewProfile(authorUser);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthPrompt('comment on posts');
      return;
    }
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
    CATEGORY_STYLES[post.category] || 'bg-[#E6E3DA] text-[#9E3922] border-[#4A4E57]';

  const formattedDate = (() => {
    const parsed = new Date(post.createdAt);
    if (Number.isNaN(parsed.getTime())) return post.createdAt;
    return parsed.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  })();

  return (
    <article className="bg-[#F8F6F0] border border-[#4A4E57] hover:border-[#2F4D96] rounded-2xl p-6 space-y-4 transition-colors">
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
              className="w-10 h-10 rounded-full object-cover border border-[#4A4E57] bg-[#EFECE4]"
            />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAuthorClick}
                disabled={!authorUser || !onViewProfile}
                className="text-sm font-bold text-[#1F2227] hover:text-[#2F4D96] transition-colors truncate disabled:hover:text-[#1F2227] cursor-pointer disabled:cursor-default"
              >
                {post.authorName}
              </button>
              {post.isAuthorVerified && (
                <ShieldCheck className="w-4 h-4 text-[#195434] shrink-0" />
              )}
            </div>
            <p className="text-xs text-[#464B55] flex items-center gap-1.5 truncate">
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
        <h3 className="text-lg sm:text-xl font-bold text-[#1F2227] leading-snug">
          {post.title}
        </h3>
        <p className="text-sm sm:text-[15px] text-[#464B55] leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[#EFECE4] border border-[#4A4E57] text-xs font-medium text-[#464B55]"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs font-bold text-[#2F4D96] transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs font-bold text-[#195434] transition-colors"
            >
              Open Shared Resource
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#CEC9BC] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => likePost(post.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              isLiked
                ? 'bg-[#FCE7E3] border-[#B34B39] text-[#8F2618]'
                : 'bg-[#EFECE4] border-[#4A4E57] text-[#464B55] hover:text-[#1F2227]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#9E3922] text-[#9E3922]' : ''}`} />
            {post.likesCount}
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EFECE4] border border-[#4A4E57] text-xs font-bold text-[#464B55] hover:text-[#1F2227] transition-colors cursor-pointer"
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
              ? 'bg-[#F4DC82] border-[#4A4E57] text-[#1F2227]'
              : 'bg-[#EFECE4] border-[#4A4E57] text-[#464B55] hover:text-[#1F2227]'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#8A6500] text-[#8A6500]' : ''}`} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="pt-4 border-t border-[#CEC9BC] space-y-4">
          {post.comments.length > 0 && (
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-6 h-6 rounded-full object-cover border border-[#4A4E57]"
                      />
                      <span className="text-xs font-bold text-[#1F2227]">
                        {comment.authorName}
                      </span>
                      {comment.isAuthorVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#195434]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#464B55]">
                      {(() => {
                        const parsed = new Date(comment.createdAt);
                        if (Number.isNaN(parsed.getTime())) return comment.createdAt;
                        return parsed.toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        });
                      })()}
                    </span>
                  </div>
                  <p className="text-sm text-[#464B55] pl-8">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCommentSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onFocus={() => {
                  if (!user) openAuthPrompt('comment on posts');
                }}
                readOnly={!user}
                placeholder={user ? 'Write a helpful reply...' : 'Sign in to write a helpful reply...'}
                className="flex-1 px-4 py-2 rounded-full bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Reply
              </button>
            </div>
            {commentError && <p className="text-xs text-[#8F2618]">{commentError}</p>}
          </form>
        </div>
      )}
    </article>
  );
}
