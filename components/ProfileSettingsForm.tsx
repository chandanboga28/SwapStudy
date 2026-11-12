'use client';

import React, { useRef, useState } from 'react';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Upload,
  Shuffle,
  Link2,
  RotateCcw,
} from 'lucide-react';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const AVATAR_STYLES = ['avataaars', 'notionists', 'lorelei', 'thumbs'] as const;

function buildPresetAvatar(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a supported image.'));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser canvas is unavailable.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface ProfileSettingsFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProfileSettingsForm({
  user,
  onSuccess,
  onCancel,
}: ProfileSettingsFormProps) {
  const { updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [avatar, setAvatar] = useState(user.avatar);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [avatarSeedCounter, setAvatarSeedCounter] = useState(1);

  const [name, setName] = useState(user.name);
  const [university] = useState(user.university);
  const [major, setMajor] = useState(user.major || '');
  const [graduationYear, setGraduationYear] = useState(user.graduationYear || '2027');
  const [bio, setBio] = useState(user.bio || '');
  const [skillsToTeach, setSkillsToTeach] = useState<string[]>(user.skillsToTeach || []);
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>(user.skillsToLearn || []);

  const [teachInput, setTeachInput] = useState('');
  const [learnInput, setLearnInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const addSkillTag = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const clean = input.trim();
    if (!clean) return;
    if (!list.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setList([...list, clean]);
    }
    setInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const finalTeach =
      teachInput.trim() && !skillsToTeach.includes(teachInput.trim())
        ? [...skillsToTeach, teachInput.trim()]
        : skillsToTeach;

    const finalLearn =
      learnInput.trim() && !skillsToLearn.includes(learnInput.trim())
        ? [...skillsToLearn, learnInput.trim()]
        : skillsToLearn;

    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await updateUser({
        name: name.trim(),
        avatar,
        major: major.trim(),
        graduationYear,
        bio: bio.trim(),
        skillsToTeach: finalTeach,
        skillsToLearn: finalLearn,
      });

      if (!res.success) {
        setSaveMessage({ type: 'error', text: res.error || 'Could not update profile.' });
        return;
      }

      setTeachInput('');
      setLearnInput('');
      setSkillsToTeach(finalTeach);
      setSkillsToLearn(finalLearn);
      setSaveMessage({ type: 'success', text: 'Profile and skill preferences saved.' });
      onSuccess?.();
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unexpected error while saving profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose a valid PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setAvatarError('Image must be 10 MB or smaller.');
      return;
    }

    setAvatarError(null);
    setIsProcessingAvatar(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setAvatar(dataUrl);
      setShowUrlInput(false);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleRandomAvatar = () => {
    const nextSeed = avatarSeedCounter + 1;
    setAvatarSeedCounter(nextSeed);
    const style = AVATAR_STYLES[nextSeed % AVATAR_STYLES.length];
    const seedBase = name.trim() || user.name || 'student';
    setAvatarError(null);
    setAvatar(buildPresetAvatar(style, `${seedBase}-${nextSeed}`));
  };

  const handleApplyUrl = () => {
    const clean = avatarUrlInput.trim();
    if (!/^https?:\/\/\S+/i.test(clean)) {
      setAvatarError('Enter a valid image URL starting with http:// or https://');
      return;
    }
    setAvatarError(null);
    setAvatar(clean);
    setShowUrlInput(false);
    setAvatarUrlInput('');
  };

  const handleResetAvatar = () => {
    const seedBase = name.trim() || user.name || 'student';
    setAvatarError(null);
    setAvatar(buildPresetAvatar('avataaars', seedBase));
  };

  const presetThumbs = AVATAR_STYLES.map((style) => ({
    style,
    url: buildPresetAvatar(style, name.trim() || user.name || 'student'),
  }));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Profile Picture Picker */}
      <div className="bg-[#EFECE4] border-[1.5px] border-[#4A4E57] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={name || user.name}
                className="w-20 h-20 rounded-2xl object-cover border-[1.5px] border-[#4A4E57] bg-[#FFFFFF]"
              />
              {isProcessingAvatar && (
                <div className="absolute inset-0 rounded-2xl bg-[#1F2227]/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[#FFFFFF] animate-spin" />
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
                Profile Picture
              </p>
              <p className="text-sm font-bold text-[#1F2227]">
                Upload a photo, paste an image link, or pick a student avatar
              </p>
              <p className="text-xs text-[#464B55]">
                Uploaded photos are automatically cropped to a crisp 256×256 square.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isProcessingAvatar}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] text-xs font-bold text-[#FFFFFF] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Photo
          </button>

          <button
            type="button"
            onClick={handleRandomAvatar}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DCEB8E] hover:bg-[#D0E279] border-[1.5px] border-[#4A4E57] text-xs font-bold text-[#1F2227] transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Generate Avatar
          </button>

          <button
            type="button"
            onClick={() => {
              setShowUrlInput((prev) => !prev);
              setAvatarError(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F8F6F0] hover:bg-[#E6E3DA] border-[1.5px] border-[#4A4E57] text-xs font-bold text-[#1F2227] transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            Image URL
          </button>

          <button
            type="button"
            onClick={handleResetAvatar}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs font-bold text-[#464B55] hover:text-[#1F2227] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Quick Style Swatches */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono font-bold uppercase text-[#464B55] mr-1">
            PRESETS:
          </span>
          {presetThumbs.map((preset) => (
            <button
              key={preset.style}
              type="button"
              onClick={() => {
                setAvatar(preset.url);
                setAvatarError(null);
              }}
              title={`Use ${preset.style} avatar`}
              className={`w-10 h-10 rounded-xl overflow-hidden border-[1.5px] bg-[#FFFFFF] transition-transform hover:scale-105 cursor-pointer ${
                avatar === preset.url
                  ? 'border-[#3B5CA8] ring-2 ring-[#3B5CA8]/30'
                  : 'border-[#4A4E57]'
              }`}
            >
              <img src={preset.url} alt={preset.style} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {showUrlInput && (
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="text"
              inputMode="url"
              value={avatarUrlInput}
              onChange={(e) => setAvatarUrlInput(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              className="flex-1 px-4 py-2 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-4 py-2 rounded-xl bg-[#F4DC82] hover:bg-[#EDD066] border-[1.5px] border-[#4A4E57] text-xs font-bold text-[#1F2227] cursor-pointer shrink-0"
            >
              Apply Link
            </button>
          </div>
        )}

        {avatarError && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-xs font-semibold text-[#8F2618]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{avatarError}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-[15px] text-[#1F2227] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
            University
          </label>
          <input
            type="text"
            value={university}
            disabled
            className="w-full px-4 py-2.5 rounded-xl bg-[#E6E3DA] border border-[#4A4E57] text-[15px] text-[#464B55] cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
            Major / Department
          </label>
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="B.Tech Computer Science"
            className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-[15px] text-[#1F2227] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
            Graduation Year
          </label>
          <select
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-[15px] text-[#1F2227] focus:outline-none"
          >
            {['2025', '2026', '2027', '2028', '2029', '2030'].map((yr) => (
              <option key={yr} value={yr} className="bg-[#F8F6F0]">
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
          Short Bio
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell peers about your academic interests, projects, and what you enjoy teaching..."
          className="w-full px-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Skills To Teach */}
        <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
            Skills You Teach
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={teachInput}
              onChange={(e) => setTeachInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkillTag(teachInput, setTeachInput, skillsToTeach, setSkillsToTeach);
                }
              }}
              placeholder="Add skill tag..."
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                addSkillTag(teachInput, setTeachInput, skillsToTeach, setSkillsToTeach)
              }
              className="px-3 py-2 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] font-bold cursor-pointer"
              aria-label="Add teaching skill"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillsToTeach.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFECE4] border border-[#4A4E57] text-xs font-semibold text-[#1F2227]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setSkillsToTeach(skillsToTeach.filter((t) => t !== tag))}
                  className="text-[#464B55] hover:text-[#8F2618]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Skills To Learn */}
        <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#195434]">
            Learning Wishlist
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={learnInput}
              onChange={(e) => setLearnInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkillTag(learnInput, setLearnInput, skillsToLearn, setSkillsToLearn);
                }
              }}
              placeholder="Add wishlist tag..."
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                addSkillTag(learnInput, setLearnInput, skillsToLearn, setSkillsToLearn)
              }
              className="px-3 py-2 rounded-xl bg-[#8AD7A8] hover:bg-[#77CA97] border-[1.5px] border-[#47785B] shadow-[0_2px_0_#47785B] text-[#18241C] font-bold cursor-pointer"
              aria-label="Add learning skill"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillsToLearn.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFECE4] border border-[#4A4E57] text-xs font-semibold text-[#1F2227]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setSkillsToLearn(skillsToLearn.filter((t) => t !== tag))}
                  className="text-[#464B55] hover:text-[#8F2618]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium ${
            saveMessage.type === 'error'
              ? 'bg-[#FCE7E3] border-[#B34B39] text-[#8F2618]'
              : 'bg-[#DCF2E4] border-[#47785B] text-[#195434]'
          }`}
        >
          {saveMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] text-[#1F2227] text-sm font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] disabled:opacity-50 border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

