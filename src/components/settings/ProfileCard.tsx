import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpenCheck,
  CalendarDays,
  Camera,
  Check,
  Flame,
  GraduationCap,
  Heart,
  Pencil,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { getUserRank } from '../../services/storageService';

interface ProfileCardProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const MAX_AVATAR_BYTES = 200_000;

const makeAvatar = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const sourceX = (image.naturalWidth - side) / 2;
        const sourceY = (image.naturalHeight - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('تعذر تجهيز الصورة.');
        context.fillStyle = '#fff7df';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, sourceX, sourceY, side, side, 0, 0, 256, 256);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        if (dataUrl.length > MAX_AVATAR_BYTES) {
          reject(new Error('الصورة كبيرة جدًا. اختر صورة أصغر.'));
          return;
        }
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('تعذر قراءة الصورة. جرّب صورة أخرى.'));
    };
    image.src = objectUrl;
  });

const formatJoinDate = (value?: string): string => {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) return '—';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName ?? '');
  const [draftTagline, setDraftTagline] = useState(profile.profileTagline ?? '');
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile.displayName?.trim() || 'متعلّم EnglishTok';
  const tagline = profile.profileTagline?.trim() || 'رحلتي اليومية نحو الطلاقة';
  const rank = getUserRank(profile.xp);
  const level = Math.max(1, Math.floor(profile.xp / 100));
  const examAttempts = Object.values(profile.levelExamResults).reduce(
    (total, exam) => total + (exam.attempts ?? 0),
    0,
  );
  const stats = useMemo(() => [
    {
      key: 'attempts',
      label: 'محاولات التعلم',
      value: Object.keys(profile.quizScores).length + examAttempts,
      icon: Target,
      tone: 'red',
    },
    {
      key: 'lessons',
      label: 'دروس مكتملة',
      value: profile.completedLessonIds.length,
      icon: BookOpenCheck,
      tone: 'blue',
    },
    {
      key: 'saved',
      label: 'كلمات محفوظة',
      value: profile.savedWordIds.length,
      icon: Heart,
      tone: 'red',
    },
    {
      key: 'mastered',
      label: 'مفردات متقنة',
      value: profile.masteredWordIds.length,
      icon: Sparkles,
      tone: 'gold',
    },
    {
      key: 'streak',
      label: 'أيام الاستمرار',
      value: profile.streakDays,
      icon: Flame,
      tone: 'orange',
    },
    {
      key: 'exams',
      label: 'اختبارات المراحل',
      value: examAttempts,
      icon: Trophy,
      tone: 'gold',
    },
  ], [examAttempts, profile.completedLessonIds.length, profile.masteredWordIds.length, profile.quizScores, profile.savedWordIds.length, profile.streakDays]);

  const startEditing = () => {
    setDraftName(displayName);
    setDraftTagline(tagline);
    setAvatarMessage(null);
    setIsEditing(true);
  };

  const saveIdentity = () => {
    onUpdateProfile({
      displayName: draftName.trim().slice(0, 40) || 'متعلّم EnglishTok',
      profileTagline: draftTagline.trim().slice(0, 80) || 'رحلتي اليومية نحو الطلاقة',
      joinedAt: profile.joinedAt ?? new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleAvatarFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarMessage('اختر صورة JPG أو PNG أو WebP.');
      return;
    }
    try {
      const dataUrl = await makeAvatar(file);
      onUpdateProfile({ avatarDataUrl: dataUrl });
      setAvatarMessage('تم تحديث صورة الملف الشخصي.');
    } catch (error) {
      setAvatarMessage(error instanceof Error ? error.message : 'تعذر تحديث الصورة.');
    }
  };

  return (
    <section className="profile-card" aria-labelledby="profile-card-title">
      <div className="profile-card-heading">
        <div>
          <span className="profile-card-eyebrow">
            <UserRound aria-hidden="true" />
            بطاقتك الشخصية
          </span>
          <h3 id="profile-card-title">الملف الشخصي</h3>
        </div>
        <span className="profile-card-rank">{rank.titleAr}</span>
      </div>

      <div className="profile-identity">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt={`صورة ${displayName}`} />
            ) : (
              <GraduationCap aria-hidden="true" />
            )}
          </div>
          <button
            type="button"
            className="profile-avatar-edit"
            onClick={() => fileInputRef.current?.click()}
            aria-label="تغيير صورة الملف الشخصي"
            title="تغيير الصورة"
          >
            <Camera aria-hidden="true" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => void handleAvatarFile(event)}
          />
        </div>

        <div className="profile-identity-copy">
          <div className="profile-name-line">
            <h4>{displayName}</h4>
            <span className="profile-verified" title="ملف محلي">✓</span>
          </div>
          <p className="profile-tagline">{tagline}</p>
          <p className="profile-joined">
            <CalendarDays aria-hidden="true" />
            عضو منذ <bdi dir="ltr">{formatJoinDate(profile.joinedAt)}</bdi>
          </p>
        </div>

        <div className="profile-level-badge">
          <span>مستواي</span>
          <strong>{level}</strong>
          <small>{profile.xp} XP</small>
        </div>

        <button type="button" className="profile-edit-button" onClick={startEditing}>
          <Pencil aria-hidden="true" />
          تعديل
        </button>
      </div>

      <div className="profile-stats-grid" aria-label="إحصائيات الملف الشخصي">
        {stats.map(({ key, label, value, icon: Icon, tone }) => (
          <div className="profile-stat" key={key}>
            <span className={`profile-stat-icon is-${tone}`} aria-hidden="true">
              <Icon />
            </span>
            <span className="profile-stat-label">{label}</span>
            <strong className="profile-stat-value">{value}</strong>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="profile-editor">
          <div className="profile-editor-heading">
            <strong>تعديل بيانات الملف</strong>
            <button type="button" onClick={() => setIsEditing(false)} aria-label="إغلاق التعديل">
              <X aria-hidden="true" />
            </button>
          </div>
          <label>
            <span>الاسم</span>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={40}
              placeholder="اسمك"
            />
          </label>
          <label>
            <span>الوصف القصير</span>
            <input
              value={draftTagline}
              onChange={(event) => setDraftTagline(event.target.value)}
              maxLength={80}
              placeholder={profile.targetLanguage === 'fr' ? 'مثال: أتعلّم الفرنسية كل يوم' : 'مثال: أتعلّم الإنجليزية كل يوم'}
            />
          </label>
          <button type="button" className="profile-save-button" onClick={saveIdentity}>
            <Check aria-hidden="true" />
            حفظ البيانات
          </button>
        </div>
      )}

      {avatarMessage && <p className="profile-avatar-message" role="status">{avatarMessage}</p>}
    </section>
  );
};
