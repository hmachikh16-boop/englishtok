import React, { useEffect, useState } from 'react';
import { 
  Volume2, 
  Languages, 
  Smartphone, 
  Code, 
  Trash2, 
  Check, 
  Copy, 
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Download,
  RefreshCw,
  LoaderCircle,
  CircleCheck,
  AlertCircle,
  AtSign,
  Phone,
  KeyRound,
  Upload,
  GraduationCap,
} from 'lucide-react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { UserProfile, UserSettings } from '../../types';
import { speechService } from '../../services/speechService';
import { checkForAppUpdate, type AppUpdateManifest } from '../../services/appUpdateService';
import { downloadAndInstallAppUpdate } from '../../services/apkInstaller';
import {
  createProgressBackup,
  getLocalProgressBackup,
  getCloudProgressBackup,
  isValidProgressCode,
  parseProgressBackupFile,
  saveCloudProgressBackup,
  type ProgressBackup,
} from '../../services/storageService';

interface SettingsTabProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onRetakePlacement: () => void;
  onResetProgress: () => void;
  onRestoreProgress: (profile: UserProfile) => void;
  onRefreshContent: () => Promise<boolean>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  userProfile,
  onUpdateProfile,
  onRetakePlacement,
  onResetProgress,
  onRestoreProgress,
  onRefreshContent,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'app' | 'capacitor' | 'content'>('app');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppUpdateManifest | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [progressCode, setProgressCode] = useState('');
  const [createdBackup, setCreatedBackup] = useState<ProgressBackup | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updateAllMessage, setUpdateAllMessage] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    void App.getInfo()
      .then((info) => setAppVersion(info.version))
      .catch(() => {
        /* الإصدار غير متاح خارج تطبيق Android */
      });
  }, []);

  const handleCreateProgressBackup = async () => {
    try {
      const backup = createProgressBackup(userProfile);
      setCreatedBackup(backup);
      setProgressCode(backup.code);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `englishtok-progress-${backup.code}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      try {
        await saveCloudProgressBackup(backup);
        setBackupMessage('تم حفظ التقدم في التخزين السحابي ويمكن استعادته على جهاز آخر بالرمز وحده خلال 90 يومًا. احتفظ بالملف أيضًا كنسخة إضافية.');
      } catch (error) {
        setBackupMessage(`تم إنشاء نسخة محلية وتنزيل ملفها، لكن لم تُرفع للسحابة؛ لن يعمل الرمز وحده على جهاز آخر. ${error instanceof Error ? error.message : ''}`);
      }
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'تعذر إنشاء النسخة الاحتياطية.');
    }
  };

  const handleCopyProgressCode = async () => {
    if (!createdBackup) return;
    try {
      await navigator.clipboard.writeText(createdBackup.code);
      setBackupMessage('تم نسخ الرمز.');
    } catch {
      setBackupMessage('تعذر النسخ تلقائيًا؛ حدّد الرمز وانسخه يدويًا.');
    }
  };

  const handleRestoreProgress = async () => {
    setBackupMessage(null);
    const normalizedCode = progressCode.trim().toUpperCase();
    if (!isValidProgressCode(normalizedCode)) {
      setBackupMessage('أدخل الرمز بصيغة 3 أحرف إنجليزية ثم 3 أرقام.');
      return;
    }

    try {
      let backup: ProgressBackup | null = null;
      let cloudError: unknown = null;
      try {
        backup = await getCloudProgressBackup(normalizedCode);
      } catch (error) {
        cloudError = error;
      }
      if (!backup) backup = getLocalProgressBackup(normalizedCode);
      if (!backup && backupFile) {
        backup = parseProgressBackupFile(await backupFile.text(), normalizedCode);
      }
      if (!backup) {
        setBackupMessage(cloudError
          ? `${cloudError instanceof Error ? cloudError.message : 'تعذر الاتصال بالتخزين السحابي.'} يمكنك اختيار ملف النسخة الاحتياطية بدلًا من ذلك.`
          : 'لم نعثر على نسخة بهذا الرمز. تأكد من إعداد التخزين السحابي للموقع أو اختر ملف النسخة الاحتياطية المرتبط بالرمز.');
        return;
      }

      const currentHasProgress = userProfile.xp > 120 || userProfile.completedLessonIds.length > 0 ||
        userProfile.masteredWordIds.length > 0 || userProfile.savedWordIds.length > 2 ||
        Object.keys(userProfile.quizScores).length > 0 || Object.keys(userProfile.levelExamResults).length > 0;
      const differs = JSON.stringify(userProfile) !== JSON.stringify(backup.profile);
      if (currentHasProgress && differs && !window.confirm('استعادة هذه النسخة ستستبدل تقدم هذا الجهاز الحالي. هل تريد المتابعة؟')) return;

      onRestoreProgress(backup.profile);
      setBackupMessage('تمت استعادة التقدم بنجاح على هذا الجهاز.');
      setBackupFile(null);
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'تعذرت قراءة النسخة الاحتياطية.');
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    speechService.playPop();
    onUpdateProfile({
      settings: {
        ...userProfile.settings,
        [key]: value,
      },
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  const capacitorCommands = [
    {
      id: 'cmd1',
      title: '1. بناء الويب ومزامنته مع Android',
      cmd: 'npm run android:sync',
    },
    {
      id: 'cmd2',
      title: '2. فتح مشروع Android في Android Studio',
      cmd: 'npm run android:open',
    },
  ];

  const handleCheckForUpdate = async () => {
    if (Capacitor.getPlatform() !== 'android') {
      setUpdateMessage('فحص تحديث APK متاح من داخل تطبيق Android المثبّت فقط.');
      return;
    }

    setIsCheckingUpdate(true);
    setUpdateMessage(null);
    setAvailableUpdate(null);
    try {
      const appInfo = await App.getInfo();
      const update = await checkForAppUpdate(appInfo.version);
      setAvailableUpdate(update);
      setUpdateMessage(
        update
          ? `يتوفر الإصدار ${update.version} (الإصدار الحالي ${appInfo.version}).`
          : `التطبيق محدّث إلى الإصدار ${appInfo.version}.`,
      );
    } catch (error) {
      console.error('Failed to check for EnglishTok updates:', error);
      setUpdateMessage(
        error instanceof Error ? error.message : 'تعذر التحقق من التحديث. حاول مرة أخرى لاحقًا.',
      );
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (!availableUpdate) return;
    setDownloadPercent(0);
    try {
      await downloadAndInstallAppUpdate(availableUpdate, setDownloadPercent);
      setUpdateMessage('اكتمل التنزيل؛ أكمل التثبيت من نافذة النظام.');
    } catch (error) {
      console.error('Failed to install the EnglishTok update:', error);
      setUpdateMessage(
        error instanceof Error ? error.message : 'تعذر تنزيل التحديث. حاول مرة أخرى.',
      );
    } finally {
      setDownloadPercent(null);
    }
  };

  const handleRefreshContent = async () => {
    setIsRefreshingContent(true);
    setContentMessage(null);
    try {
      const updated = await onRefreshContent();
      setContentMessage(
        updated
          ? 'تم جلب أحدث محتوى منشور. تقدمك ومفضلاتك محفوظان.'
          : 'لا يوجد إصدار محتوى منشور بعد؛ يستمر التطبيق باستخدام المحتوى المحلي.',
      );
    } catch (error) {
      console.error('Failed to refresh EnglishTok lesson content:', error);
      setContentMessage('تعذر تحديث المحتوى الآن؛ سيستمر التطبيق بالمحتوى المحفوظ محليًا.');
    } finally {
      setIsRefreshingContent(false);
    }
  };

  const handleUpdateEverything = async () => {
    setIsUpdatingAll(true);
    setUpdateAllMessage(null);
    setAvailableUpdate(null);
    const notes: string[] = [];

    // 1) أحدث الدروس من المستودع
    try {
      const updated = await onRefreshContent();
      notes.push(updated ? 'تم تحديث الدروس من المستودع.' : 'الدروس محدّثة مسبقًا.');
    } catch {
      notes.push('تعذر تحديث الدروس الآن؛ سيبقى المحتوى المحفوظ.');
    }

    // 2) إصدار التطبيق
    if (Capacitor.getPlatform() !== 'android') {
      notes.push('نسخة الويب تتحدّث تلقائيًا من الموقع.');
      setUpdateAllMessage(notes.join(' '));
      setIsUpdatingAll(false);
      return;
    }

    try {
      const appInfo = await App.getInfo();
      setAppVersion(appInfo.version);
      const update = await checkForAppUpdate(appInfo.version);
      setAvailableUpdate(update);
      notes.push(
        update
          ? `يتوفر إصدار جديد للتطبيق: ${update.version} (لديك ${appInfo.version}).`
          : `التطبيق محدّث إلى الإصدار ${appInfo.version}.`,
      );
    } catch (error) {
      console.error('Failed to check for EnglishTok updates:', error);
      notes.push(error instanceof Error ? error.message : 'تعذر التحقق من إصدار التطبيق.');
    } finally {
      setIsUpdatingAll(false);
    }

    setUpdateAllMessage(notes.join(' '));
  };

  return (
    <div className="journey-secondary w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 text-slate-100 flex flex-col gap-5">
      {/* Tab Header Sub-nav */}
      <div className="flex gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            setActiveSubTab('app');
            speechService.playPop();
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'app'
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          إعدادات التطبيق
        </button>
        <button
          onClick={() => {
            setActiveSubTab('capacitor');
            speechService.playPop();
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'capacitor'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>تصدير APK</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('content');
            speechService.playPop();
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'content'
              ? 'bg-slate-800 text-amber-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>إدارة المحتوى</span>
        </button>
      </div>

      {/* Subtab 1: App Settings */}
      {activeSubTab === 'app' && (
        <div className="flex flex-col gap-4">
          <section
            className="bg-gradient-to-br from-sky-950 via-slate-900 to-emerald-950/40 border border-sky-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-xl"
            aria-labelledby="updates-title"
          >
            <h3 id="updates-title" className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-sky-400" />
              تحديث التطبيق والدروس
            </h3>
            <p className="text-[11px] leading-6 text-slate-300">
              يجلب أحدث الدروس من المستودع ويتحقق من وجود إصدار جديد للتطبيق.
              {appVersion && (
                <span className="text-slate-400">
                  {' '}الإصدار الحالي: <span dir="ltr" className="font-mono">{appVersion}</span>.
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={handleUpdateEverything}
              disabled={isUpdatingAll}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-black text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isUpdatingAll ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isUpdatingAll ? 'جارٍ التحديث…' : 'تحديث الآن'}
            </button>
            {updateAllMessage && (
              <div
                role="status"
                className={`flex items-start gap-2 rounded-xl border p-3 text-[11px] leading-relaxed ${
                  availableUpdate
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                    : 'border-slate-700 bg-slate-950/70 text-slate-300'
                }`}
              >
                {availableUpdate ? (
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                )}
                <div className="min-w-0 flex-1">
                  <p>{updateAllMessage}</p>
                  {availableUpdate && (
                    <>
                      <p className="mt-2 whitespace-pre-wrap text-slate-300">
                        {availableUpdate.notes || 'لا توجد ملاحظات إصدار إضافية.'}
                      </p>
                      <p className="mt-2 text-slate-400">
                        بعد التنزيل يتحقق Android من التوقيع والتوافق ويطلب موافقتك قبل التثبيت.
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadUpdate}
                        className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                      >
                        <Download className="h-4 w-4" />
                        تنزيل إصدار {availableUpdate.version}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg" aria-labelledby="placement-settings-title">
            <h3 id="placement-settings-title" className="text-xs font-bold text-white flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-400" />تحديد المستوى التعليمي</h3>
            <p className="text-[11px] leading-6 text-slate-400">{userProfile.placementAssessment?.result
              ? `نقطة البداية المقترحة حاليًا: المستوى ${userProfile.placementAssessment.result.suggestedStage} في EnglishTok. إعادة الاختبار لا تحذف XP أو الدروس المكتملة.`
              : 'لم يُسجّل اختبار تحديد مستوى لهذا الملف بعد.'}</p>
            <button type="button" onClick={onRetakePlacement} className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">إعادة اختبار تحديد المستوى</button>
          </section>
          {/* Audio & Pronunciation settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>إعدادات الصوت والنطق التلقائي</span>
            </h3>

            {/* Speech language */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">لغة النطق</span>
                <span className="text-[11px] text-slate-500">تُقرأ النصوص الفرنسية بالصوت الفرنسي تلقائيًا</span>
              </div>
              <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => updateSetting('voiceLanguage', 'en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    userProfile.settings.voiceLanguage === 'en'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  إنجليزية
                </button>
                <button
                  onClick={() => updateSetting('voiceLanguage', 'fr')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    userProfile.settings.voiceLanguage === 'fr'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  فرنسية
                </button>
              </div>
            </div>

            {/* Default Speech Speed */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">سرعة النطق الافتراضية</span>
                <span className="text-[11px] text-slate-500">يمكنك تغييرها في أي وقت من إعدادات الصوت</span>
              </div>
              <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                {[1.0, 0.75, 0.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => updateSetting('playbackSpeed', speed)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono-num transition-all ${
                      userProfile.settings.playbackSpeed === speed
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Sound effects toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">المؤثرات الصوتية التفاعلية</span>
                <span className="text-[11px] text-slate-500">أصوات الإجابات الصحيحة والخاطئة والنقاط</span>
              </div>
              <button
                onClick={() => updateSetting('soundEffects', !userProfile.settings.soundEffects)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  userProfile.settings.soundEffects ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    userProfile.settings.soundEffects ? 'translate-x-0' : '-translate-x-6'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Subtitles & Display settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-emerald-400" />
              <span>إعدادات الترجمة والواجهة</span>
            </h3>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">عرض الترجمة</span>
                <span className="text-[11px] text-slate-500">اختر أسلوب عرض نصوص الحوارات التعليمية</span>
              </div>
              <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                {(['both', 'en', 'none'] as ('both' | 'en' | 'none')[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSetting('subtitlesMode', mode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      userProfile.settings.subtitlesMode === mode
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'both' ? 'عربي+EN' : mode === 'en' ? 'EN فقط' : 'مخفية'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">الوضع بدون إنترنت (Offline)</span>
                <span className="text-[11px] text-slate-500">كل محادثات ومفردات التطبيق تعمل محلياً بالكامل</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>جاهز ومفعل</span>
              </span>
            </div>
          </div>

          <section className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-slate-900 to-sky-950/25 p-4 shadow-lg" aria-labelledby="progress-backup-title">
            <h3 id="progress-backup-title" className="flex items-center gap-2 text-sm font-black text-white">
              <KeyRound className="h-4 w-4 text-sky-300" />
              حفظ واستعادة التقدم
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              ينشئ الرمز نسخة من تقدمك. عند إعداد التخزين السحابي للموقع يمكنك إدخاله وحده على جهاز آخر؛ وإلا يلزم نقل ملف JSON يدويًا. الرمز معرّف قصير وليس كلمة مرور أو وسيلة حماية.
            </p>
            <button type="button" onClick={handleCreateProgressBackup} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-sky-300 active:scale-[.98]">
              <Download className="h-4 w-4" />
              إنشاء نسخة ورمز جديد
            </button>
            {createdBackup && (
              <div className="mt-3 rounded-xl border border-sky-400/30 bg-slate-950/70 p-3">
                <p className="text-[11px] text-slate-400">رمز النسخة</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code dir="ltr" className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-lg font-black tracking-[.22em] text-sky-200">{createdBackup.code}</code>
                  <button type="button" onClick={() => void handleCopyProgressCode()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800">
                    <Copy className="h-3.5 w-3.5" /> نسخ الرمز
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">احفظ الرمز وملف <bdi dir="ltr">englishtok-progress-{createdBackup.code}.json</bdi> في مكان آمن.</p>
              </div>
            )}
            <div className="mt-4 border-t border-slate-700/70 pt-3">
              <label htmlFor="progress-backup-code" className="text-xs font-bold text-slate-200">استعادة نسخة محفوظة</label>
              <input id="progress-backup-code" value={progressCode} onChange={(event) => setProgressCode(event.target.value.toUpperCase().slice(0, 6))} placeholder="ABC123" autoCapitalize="characters" maxLength={6} dir="ltr" className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 font-mono text-base font-bold tracking-[.2em] text-white outline-none focus:border-sky-400 sm:max-w-xs" />
              <label htmlFor="progress-backup-file" className="mt-2 flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold text-sky-300 hover:text-sky-200">
                <Upload className="h-4 w-4" />
                {backupFile ? backupFile.name : 'اختر ملف النسخة الاحتياطية (مطلوب لجهاز آخر)'}
              </label>
              <input id="progress-backup-file" type="file" accept=".json,application/json" className="sr-only" onChange={(event) => setBackupFile(event.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => void handleRestoreProgress()} className="mt-2 min-h-10 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-500/25">
                تحقق واستعد التقدم
              </button>
            </div>
            {backupMessage && <p role="status" className="mt-3 rounded-xl bg-slate-950/70 p-3 text-xs leading-relaxed text-slate-200">{backupMessage}</p>}
          </section>

          {/* Danger zone / Reset */}
          <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h3 className="text-xs font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>إعادة تعيين التقدم</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              إذا كنت ترغب بالبدء من الصفر وتصفير نقاط الـ XP والكلمات المحفوظة.
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="self-start px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold active:scale-95 transition-transform"
              >
                إعادة ضبط بيانات التعلم
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onResetProgress();
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 active:scale-95 transition-transform"
                >
                  نعم، تأكيد التصفير
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>

          <section
            className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-slate-900 to-sky-950/30 p-4 shadow-lg"
            aria-labelledby="developer-heading"
          >
            <h3 id="developer-heading" className="text-xs font-bold text-white">
              عن المطوّر
            </h3>
            <p className="mt-2 text-sm font-bold text-sky-300">حمادوش الشيخ</p>
            <div className="mt-3 flex flex-col gap-2 text-xs text-slate-300 sm:flex-row sm:flex-wrap sm:gap-x-5">
              <a
                href="mailto:hmachikh16@gmail.com"
                className="inline-flex items-center gap-2 hover:text-sky-300"
                dir="ltr"
              >
                <AtSign className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                hmachikh16@gmail.com
              </a>
              <a
                href="tel:+213665003037"
                className="inline-flex items-center gap-2 hover:text-sky-300"
                dir="ltr"
              >
                <Phone className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                0665003037
              </a>
            </div>
          </section>
        </div>
      )}

      {/* Subtab 2: Capacitor APK Guide */}
      {activeSubTab === 'capacitor' && (
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Smartphone className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">
                دليل تحويل EnglishTok إلى تطبيق Android (APK)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              تمت إضافة منصة Capacitor Android إلى المشروع. يتطلب إنشاء APK محلي تثبيت Android Studio وAndroid SDK وJDK؛ أما الإصدارات المنشورة فتُبنى بتوقيع محمي في GitHub Actions بعد إعداد الأسرار.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/30 bg-slate-900 p-4 shadow-lg">
            <div className="flex items-center gap-2 text-sky-300">
              <RefreshCw className="h-4 w-4" />
              <h3 className="text-xs font-bold text-white">تحديث إصدار التطبيق</h3>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              يتحقق التطبيق من آخر إصدار منشور في مستودع GitHub الموثوق، ويعرض ملاحظات الإصدار ورقم الحزمة والبصمة المنشورة. يُنزّل التطبيق ملف APK بنفسه مع عرض التقدّم، ثم يتحقق من بصمة SHA-256 ويفتح مثبّت Android لمراجعة التوقيع وطلب موافقتك.
            </p>
            <button
              type="button"
              onClick={handleCheckForUpdate}
              disabled={isCheckingUpdate}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-black text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isCheckingUpdate ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isCheckingUpdate ? 'جارٍ التحقق…' : 'التحقق من التحديثات'}
            </button>
            {updateMessage && (
              <div
                role="status"
                className={`flex items-start gap-2 rounded-xl border p-3 text-[11px] leading-relaxed ${
                  availableUpdate
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                    : 'border-slate-700 bg-slate-950/70 text-slate-300'
                }`}
              >
                {availableUpdate ? (
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                )}
                <div className="min-w-0 flex-1">
                  <p>{updateMessage}</p>
                  {availableUpdate && (
                    <>
                      <p className="mt-2 whitespace-pre-wrap text-slate-300">
                        {availableUpdate.notes || 'لا توجد ملاحظات إصدار إضافية.'}
                      </p>
                      <p className="mt-2 break-all font-mono text-[10px] text-slate-500" dir="ltr">
                        SHA-256: {availableUpdate.sha256}
                      </p>
                      <p className="mt-2 text-slate-400">
                        يتطلب Android SDK API {availableUpdate.minimumAndroidSdk} أو أحدث.
                        لن يبدأ التثبيت دون موافقتك.
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadUpdate}
                        disabled={downloadPercent !== null}
                        className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
                      >
                        <Download className="h-4 w-4" />
                        {downloadPercent !== null
                          ? `جارٍ التنزيل… ${downloadPercent}%`
                          : 'تنزيل وتثبيت تحديث Android'}
                      </button>
                      {downloadPercent !== null && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-[width]"
                            style={{ width: `${downloadPercent}%` }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step by step terminal commands */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-300">
              خطوات البناء عبر سطر الأوامر (Terminal):
            </span>

            {capacitorCommands.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2 shadow-md"
              >
                <span className="text-xs font-bold text-white">
                  {item.title}
                </span>
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto">
                  <code dir="ltr" className="select-all">{item.cmd}</code>
                  <button
                    onClick={() => copyToClipboard(item.cmd, item.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
                    title="نسخ الأمر"
                  >
                    {copiedCmd === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Config file explanation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 text-xs">
            <span className="font-bold text-amber-400">ملف الإعداد المهيأ جاهزاً:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              تم تضمين ملف <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded">capacitor.config.json</code> مسبقاً في جذر المشروع باسم التطبيق <strong className="text-white">EnglishTok</strong> ومجلد التوزيع <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded">dist</code>.
            </p>
          </div>
        </div>
      )}

      {/* Subtab 3: Content Management Architecture */}
      {activeSubTab === 'content' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 shadow-lg">
            <div className="flex items-center gap-2 text-emerald-300">
              <RefreshCw className="h-4 w-4" />
              <h3 className="text-xs font-bold text-white">مزامنة محتوى الدروس</h3>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              يجلب التطبيق محتوى الدروس والحوارات والمفردات والاختبارات من إصدار المحتوى المنشور، ويحتفظ بنسخة محلية للعمل دون اتصال. لا يؤدي تحديث المحتوى إلى مسح تقدمك.
            </p>
            <button
              type="button"
              onClick={handleRefreshContent}
              disabled={isRefreshingContent}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isRefreshingContent ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRefreshingContent ? 'جارٍ تحديث المحتوى…' : 'تحديث المحتوى الآن'}
            </button>
            {contentMessage && (
              <p role="status" className="rounded-xl bg-slate-950/70 p-3 text-[11px] leading-relaxed text-slate-300">
                {contentMessage}
              </p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Code className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">
                بنية المحتوى التعليمي والدروس
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              تم فصل بيانات المحتوى التعليمي بالكامل عن مكونات العرض، بحيث يمكنك إضافة مئات الدروس الجديدة دون تعديل واجهة التطبيق.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white">
              الملف المسؤول عن إضافة المحتوى:
            </h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-sky-400" dir="ltr">
              /src/data/lessons.ts
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              لإضافة درس جديد، يكفي إضافة كائن داخل مصفوفة <code className="text-amber-300">INITIAL_LESSONS</code> يحتوي على:
            </p>
            <ul className="text-xs text-slate-300 flex flex-col gap-1.5 list-disc pr-5">
              <li><strong className="text-white">title & titleAr:</strong> عنوان الدرس بالإنجليزية والعربية.</li>
              <li><strong className="text-white">characterA & characterB:</strong> شخصيتا المحادثة مع ألوان اللباس ونوع الصوت والأنميشن.</li>
              <li><strong className="text-white">dialogue:</strong> أسطر المحادثة مع النصين والترجمة.</li>
              <li><strong className="text-white">vocabulary:</strong> قائمة المفردات الجديدة مع النطق الصوتي IPA والترجمة.</li>
              <li><strong className="text-white">quiz:</strong> أسئلة الاختبار السريع لتثبيت المعلومة واكتساب نقاط XP.</li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 text-xs">
            <span className="font-bold text-emerald-400">حفظ التقدم والتحديث:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
            يبقى تقدم المتعلم ومفضلاته في <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded">localStorage</code> مستقلًا عن ملف المحتوى. تُراجع البيانات المنشورة قبل اعتمادها، ويستخدم التطبيق آخر نسخة محفوظة إذا تعذر الاتصال.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
