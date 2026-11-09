'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import BookingModal from '@/components/BookingModal';
import {
  ArrowLeft,
  Star,
  Coins,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Calendar,
  ShieldCheck,
  Video,
  Trash2,
  AlertCircle,
  Check,
} from 'lucide-react';

function SkillDetailContent() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.id as string;

  const { skills, reviews, deleteSkill } = useApp();
  const { user } = useAuth();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const skill = skills.find((s) => s.id === skillId);

  if (!skill) {
    if (actionNotice?.type === 'success') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium max-w-sm flex items-center justify-center gap-2 shadow-sm">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice.message}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-bold text-slate-900 mb-1">Skill Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">
          The skill listing you are looking for may have been removed or does not exist.
        </p>
        <Link
          href="/skills"
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
        >
          Back to Skills Directory
        </Link>
      </div>
    );
  }

  const skillReviews = reviews.filter(
    (r) => r.skillTitle === skill.title || r.reviewerName !== skill.teacherName
  );

  const isOwnSkill = user?.id === skill.teacherId;
  const hasCredits = (user?.credits || 0) >= skill.hourlyCredits;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${skill.title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setActionNotice(null);
    try {
      const res = await deleteSkill(skill.id);
      if (res.success) {
        setActionNotice({
          type: 'success',
          message: `Skill listing "${skill.title}" was successfully deleted. Redirecting...`,
        });
        setTimeout(() => {
          router.push('/teach');
        }, 1200);
      } else {
        setActionNotice({
          type: 'error',
          message: res.error || 'Failed to delete skill listing.',
        });
      }
    } catch (err: unknown) {
      setActionNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred while deleting.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/skills"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Explore Skills
        </Link>

        {/* Action Notice */}
        {actionNotice && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in ${
              actionNotice.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {actionNotice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              {actionNotice.message}
            </span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-slate-600 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Card */}
        <div className="card-subtle rounded-xl p-6 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                {skill.category}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {skill.level}
              </span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-bold text-xs">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>{skill.hourlyCredits} Credits / Session</span>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {skill.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              {skill.description}
            </p>
          </div>

          {/* Teacher Profile Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={skill.teacherAvatar}
                alt={skill.teacherName}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">{skill.teacherName}</h3>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {skill.teacherRating}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {skill.teacherMajor} • {skill.teacherUniversity}
                </p>
              </div>
            </div>

            <div>
              {isOwnSkill ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
                    Your listing
                  </span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    {isDeleting ? (
                      <>
                        <span className="w-3 h-3 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Listing
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Request Session ({skill.hourlyCredits} Cr)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Split: Topics & Reviews vs Booking Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Syllabus */}
            <div className="card-subtle rounded-xl p-5 sm:p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                What We Will Cover in 1-on-1 Sessions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {skill.topics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            <div className="card-subtle rounded-xl p-5 space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Prerequisites & Preparation
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {skill.prerequisites && skill.prerequisites.length > 0
                  ? skill.prerequisites.join('. ')
                  : 'No specific prerequisites. Just bring your curiosity and current questions!'}
              </p>
            </div>

            {/* Reviews */}
            <div className="card-subtle rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Peer Reviews ({skill.reviewsCount})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Feedback from students who completed this skill swap
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {skill.teacherRating} / 5.0
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {skillReviews.slice(0, 3).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.reviewerAvatar}
                          alt={rev.reviewerName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-medium text-slate-800 text-[11px]">{rev.reviewerName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Booking Sidebar (1 col) */}
          <div className="space-y-4">
            <div className="card-subtle rounded-xl p-5 space-y-4 sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Session Specs
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  {skill.hourlyCredits} Credits
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Duration
                  </span>
                  <span className="font-semibold text-slate-900">{skill.sessionDurationMinutes || 60} Minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Video className="w-3.5 h-3.5" />
                    Format
                  </span>
                  <span className="font-semibold text-slate-900">1-on-1 Video Call</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    Your Balance
                  </span>
                  <span className="font-bold text-emerald-800">{user?.credits ?? 0} Credits</span>
                </div>
              </div>

              <div className="pt-2">
                {isOwnSkill ? (
                  <button
                    disabled
                    className="w-full py-2 px-3 rounded-lg bg-slate-100 text-slate-400 font-medium text-xs cursor-not-allowed"
                  >
                    You are the instructor
                  </button>
                ) : !hasCredits ? (
                  <div className="space-y-1.5">
                    <button
                      disabled
                      className="w-full py-2 px-3 rounded-lg bg-slate-200 text-slate-500 font-semibold text-xs cursor-not-allowed"
                    >
                      Insufficient Credits ({user?.credits || 0}/{skill.hourlyCredits})
                    </button>
                    <p className="text-[10px] text-slate-400 text-center">
                      Teach a skill to earn credits or switch student in demo banner.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Request Skill Swap Now
                  </button>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Escrow Guarantee
                </p>
                <p>Credits held in escrow until session completion is confirmed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          skill={skill}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function SkillDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SkillDetailContent />
    </Suspense>
  );
}
