'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import BookingModal from '@/components/BookingModal';
import {
  ArrowLeft,
  Star,
  Clock,
  Coins,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { skills, reviews, deleteSkill, isLoading } = useApp();
  const { user } = useAuth();

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const skill = useMemo(
    () => skills.find((s) => s.id === params?.id),
    [skills, params?.id]
  );

  const skillReviews = useMemo(() => {
    if (!skill) return [];
    return reviews.filter(
      (r) =>
        r.skillId === skill.id ||
        (r.teacherId === skill.teacherId && r.skillTitle === skill.title)
    );
  }, [reviews, skill]);

  const isOwner = Boolean(user && skill && user.id === skill.teacherId);

  const handleDelete = async () => {
    if (!skill || isDeleting) return;
    setDeleteError('');
    setIsDeleting(true);
    try {
      const res = await deleteSkill(skill.id);
      if (!res.success) {
        setDeleteError(res.error || 'Could not remove skill listing.');
        return;
      }
      router.push('/teach');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-48 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
        <div className="h-72 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="max-w-3xl mx-auto w-full px-4 py-16 text-center space-y-5">
        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-10 space-y-4">
          <BookOpen className="w-10 h-10 text-[#FF9B45] mx-auto" />
          <h1 className="text-2xl font-extrabold text-[#F7F5F0]">Skill Listing Not Found</h1>
          <p className="text-sm text-[#AAA69F]">
            This skill listing may have been removed or is no longer active.
          </p>
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      {/* Breadcrumb */}
      <Link
        href="/skills"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#AAA69F] hover:text-[#F7F5F0] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore Skills
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Main Content (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview Header Card */}
          <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-[#2B2824] border border-[#37332E] text-xs font-bold text-[#F5B66B]">
                {skill.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#171715] border border-[#37332E] text-xs font-semibold text-[#AAA69F]">
                {skill.level}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#171715] border border-[#37332E] text-xs font-semibold text-[#AAA69F]">
                <Clock className="w-3.5 h-3.5 text-[#FF9B45]" />
                {skill.sessionDurationMinutes} minutes
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F7F5F0] tracking-tight leading-tight">
              {skill.title}
            </h1>

            <p className="text-base text-[#AAA69F] leading-relaxed whitespace-pre-line">
              {skill.description}
            </p>

            {/* Mentor Strip */}
            <div className="pt-5 border-t border-[#37332E] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={skill.teacherAvatar}
                  alt={skill.teacherName}
                  className="w-12 h-12 rounded-full object-cover border border-[#37332E] bg-[#171715]"
                />
                <div>
                  <p className="text-base font-bold text-[#F7F5F0]">{skill.teacherName}</p>
                  <p className="text-xs sm:text-sm text-[#AAA69F] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#FF9B45]" />
                    {skill.teacherMajor || 'Student Mentor'} · {skill.teacherUniversity}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#2B2824] border border-[#37332E] px-3.5 py-2 rounded-xl">
                <Star className="w-4 h-4 text-[#FF9B45] fill-[#FF9B45]" />
                <span className="text-sm font-extrabold text-[#F7F5F0]">
                  {skill.teacherRating > 0 ? skill.teacherRating.toFixed(1) : 'New'}
                </span>
                <span className="text-xs text-[#AAA69F]">
                  ({skill.reviewsCount} {skill.reviewsCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
          </div>

          {/* Topics Covered */}
          {skill.topics && skill.topics.length > 0 && (
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-[#F7F5F0]">What You Will Cover</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skill.topics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#2B2824] border border-[#37332E] text-sm font-medium text-[#F7F5F0]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#65C995] shrink-0" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {skill.prerequisites && skill.prerequisites.length > 0 && (
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-3">
              <h2 className="text-xl font-bold text-[#F7F5F0]">Helpful Prerequisites</h2>
              <ul className="space-y-2 text-sm text-[#AAA69F] list-disc pl-5">
                {skill.prerequisites.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Student Reviews */}
          <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#F7F5F0]">
                Peer Reviews ({skillReviews.length})
              </h2>
            </div>

            {skillReviews.length > 0 ? (
              <div className="space-y-4">
                {skillReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.reviewerAvatar}
                          alt={rev.reviewerName}
                          className="w-8 h-8 rounded-full object-cover border border-[#37332E] bg-[#171715]"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#F7F5F0]">{rev.reviewerName}</p>
                          <p className="text-xs text-[#AAA69F]">{rev.date}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171715] border border-[#37332E] text-xs font-bold text-[#FF9B45]">
                        <Star className="w-3.5 h-3.5 fill-[#FF9B45]" />
                        {rev.rating}.0
                      </div>
                    </div>
                    <p className="text-sm text-[#AAA69F] leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#AAA69F]">
                No written reviews yet for this listing. Complete a session to leave the first rating.
              </p>
            )}
          </div>
        </div>

        {/* Right Sticky Booking Sidebar (4 Cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
          <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#37332E]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
                  Session Rate
                </p>
                <p className="text-3xl font-extrabold text-[#F7F5F0] mt-1 flex items-center gap-2">
                  <Coins className="w-6 h-6 text-[#FF9B45]" />
                  {skill.hourlyCredits}{' '}
                  <span className="text-base font-semibold text-[#AAA69F]">
                    {skill.hourlyCredits === 1 ? 'Credit' : 'Credits'}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[#AAA69F]">
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span className="font-semibold text-[#F7F5F0]">
                  {skill.sessionDurationMinutes} minutes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Format</span>
                <span className="font-semibold text-[#F7F5F0]">1-on-1 Google Meet</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Level</span>
                <span className="font-semibold text-[#F7F5F0]">{skill.level}</span>
              </div>
            </div>

            <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#AAA69F] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#65C995] shrink-0 mt-0.5" />
              <span>
                Credits are held safely in escrow and refunded automatically if the session is cancelled or declined.
              </span>
            </div>

            {isOwner ? (
              <div className="space-y-3 pt-1">
                <div className="px-4 py-2.5 rounded-xl bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#F5B66B] text-center">
                  This is your published listing
                </div>
                {deleteError && (
                  <div className="flex items-start gap-2 text-xs text-[#F07878]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#2B2824] hover:bg-[#F07878]/15 border border-[#37332E] hover:border-[#F07878]/40 text-sm font-bold text-[#F07878] transition-colors cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove Listing
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-base font-bold transition-colors cursor-pointer"
              >
                Request This Session
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal skill={skill} onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  );
}
