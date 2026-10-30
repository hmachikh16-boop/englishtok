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
  ShieldCheck,
  Zap,
  Download,
  RefreshCw,
  LoaderCircle,
  CircleCheck,
  AlertCircle,
  AtSign,
  Phone,
  MessageCircle,
  ExternalLink,
  KeyRound,
  Upload,
  GraduationCap,
  Save,
} from 'lucide-react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { TargetLanguage, UserProfile, UserSettings } from '../../types';
import type { GameProgress } from '../../services/gameProgressService';
import { ProfileCard } from './ProfileCard';
import { ProgressBackupPanel } from './ProgressBackupPanel';
import { speechService } from '../../services/speechService';
import { checkForAppUpdate, type AppUpdateManifest } from '../../services/appUpdateService';
import { openAppUpdateDownload } from '../../services/appUpdateLauncher';
import { downloadAppUpdate, openDownloadsFolder } from '../../services/apkDownloadService';
import { IS_STORE_BUILD } from '../../config/storeBuild';
import { IS_GOLD_EDITION } from '../../config/edition';
import { getStoredGoldLicenseCode } from '../../services/goldLicense';
import {
  createProgressBackup,
  getLocalProgressBackup,
  getCloudProgressBackup,
  isValidProgressCode,
  parseProgressBackupFile,
  saveCloudProgressBackup,
  type ProgressBackup,
} from '../../services/storageService';
import {
  isProgressFileCancellation,
  saveProgressBackupFile,
} from '../../services/progressFileService';

interface SettingsTabProps {
  userProfile: UserProfile;
  hasLessons: boolean;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onRetakePlacement: () => void;
  onChangeTargetLanguage: (language: TargetLanguage) => void;
  onResetProgress: () => void;
  onRestoreProgress: (
    profile: UserProfile,
    gameProgress?: GameProgress,
    options?: { createPreImportSnapshot?: boolean; sourceCreatedAt?: string },
  ) => void;
  onRefreshContent: () => Promise<boolean>;
  /** The website Gold preview opts into the Gold settings presentation. */
  goldEdition?: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  userProfile,
  hasLessons,
  onUpdateProfile,
  onRetakePlacement,
  onChangeTargetLanguage,
  onResetProgress,
  onRestoreProgress,
  onRefreshContent,
  goldEdition = IS_GOLD_EDITION,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'app' | 'capacitor' | 'content'>('app');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportStatus, setSupportStatus] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppUpdateManifest | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateDownloadMode, setUpdateDownloadMode] = useState<'app' | 'browser' | null>(null);
  const [isOpeningUpdate, setIsOpeningUpdate] = useState(false);
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [progressCode, setProgressCode] = useState('');
  const [createdBackup, setCreatedBackup] = useState<ProgressBackup | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updateAllMessage, setUpdateAllMessage] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const isFrenchCourse = userProfile.targetLanguage === 'fr';
  const courseCode = isFrenchCourse ? 'FR' : 'EN';

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    void App.getInfo()
      .then((info) => setAppVersion(info.version))
      .catch(() => {
        /* الإصدار غير متاح خارج تطبيق Android */
      });
  }, []);

  const saveBackupFile = async (backup: ProgressBackup): Promise<string> => {
    try {
      const destination = await saveProgressBackupFile(
        `lin-go-legacy-progress-${backup.code}.json`,
        JSON.stringify(backup, null, 2),
      );
      return destination === 'native'
        ? 'تم حفظ ملف النسخة في المكان الذي اخترته.'
        : 'تم تنزيل ملف النسخة الاحتياطية.';
    } catch (error) {
      if (isProgressFileCancellation(error)) {
        return 'لم تحفظ نسخة خارجية؛ التقدم ما زال محفوظًا داخل التطبيق.';
      }
      return `تعذر حفظ ملف النسخة الخارجية: ${error instanceof Error ? error.message : 'خطأ غير معروف.'}`;
    }
  };

  const handleCreateProgressBackup = async () => {
    try {
      const backup = createProgressBackup(userProfile);
      setCreatedBackup(backup);
      setProgressCode(backup.code);

      // Ask for the destination first, while the button tap is still a fresh
      // user gesture. Android's document picker then grants access to exactly
      // the chosen file, with no broad storage permission.
      const fileMessage = await saveBackupFile(backup);
      try {
        await saveCloudProgressBackup(backup);
        setBackupMessage(`${fileMessage} تم حفظ التقدم في التخزين السحابي أيضًا ويمكن استعادته بالرمز وحده خلال 90 يومًا.`);
      } catch (error) {
        setBackupMessage(`${fileMessage} لم تُرفع النسخة للسحابة؛ لن يعمل الرمز وحده على جهاز آخر. ${error instanceof Error ? error.message : ''}`);
      }
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'تعذر إنشاء النسخة الاحتياطية.');
    }
  };

  const handleSaveCreatedBackupFile = async () => {
    if (!createdBackup) return;
    setBackupMessage(await saveBackupFile(createdBackup));
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
      setBackupMessage('أدخل الرمز بصيغة 3 أحرف لاتينية ثم 3 أرقام.');
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

      onRestoreProgress(backup.profile, undefined, {
        createPreImportSnapshot: true,
        sourceCreatedAt: backup.createdAt,
      });
      setBackupMessage('تمت استعادة التقدم بنجاح على هذا الجهاز.');
      setBackupFile(null);
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'تعذرت قراءة النسخة الاحتياطية.');
    }
  };

  const changeLearningLanguage = (language: TargetLanguage) => {
    if (userProfile.targetLanguage === language) return;
    if (!window.confirm(
      `هل تريد الانتقال إلى تعلّم ${language === 'fr' ? 'الفرنسية' : 'الإنجليزية'}؟ سيُحفظ تقدم اللغة الحالية كما هو، ويُفتح مسار اللغة الأخرى من حيث توقفت.`,
    )) return;
    speechService.playPop();
    onChangeTargetLanguage(language);
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
      console.error('Failed to check for Lin Go updates:', error);
      setUpdateMessage(
        error instanceof Error ? error.message : 'تعذر التحقق من التحديث. حاول مرة أخرى لاحقًا.',
      );
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadUpdateInApp = async () => {
    if (!availableUpdate) return;
    setIsOpeningUpdate(true);
    setUpdateMessage(null);
    setUpdateDownloadMode(null);
    try {
      const result = await downloadAppUpdate(availableUpdate);
      setUpdateDownloadMode(result.mode);
      setUpdateMessage(
        result.mode === 'app'
          ? `بدأ تنزيل ${availableUpdate.version} داخل التطبيق. ستجده في مجلد التنزيلات بعد اكتماله، مع إشعار من النظام.`
          : 'فُتح المتصفح لتنزيل الحزمة الرسمية. بعد اكتمال التنزيل، اضغط على الملف لتثبيت التحديث.',
      );
    } catch (error) {
      console.error('Failed to download the Lin Go update:', error);
      setUpdateMessage(
        error instanceof Error ? error.message : 'تعذر بدء التنزيل. حاول مرة أخرى.',
      );
    } finally {
      setIsOpeningUpdate(false);
    }
  };

  const handleOpenUpdateInBrowser = async () => {
    if (!availableUpdate) return;
    if (goldEdition) {
      setUpdateMessage('تحديث Gold+ يتم داخل التطبيق نفسه عبر مدير التنزيلات، دون فتح المتصفح.');
      return;
    }
    setIsOpeningUpdate(true);
    setUpdateMessage(null);
    setUpdateDownloadMode(null);
    try {
      await openAppUpdateDownload(availableUpdate);
      setUpdateDownloadMode('browser');
      setUpdateMessage(
        'فُتح المتصفح لتنزيل الحزمة الرسمية. بعد اكتمال التنزيل، اضغط على الملف لتثبيت التحديث.',
      );
    } catch (error) {
      console.error('Failed to open the Lin Go update download:', error);
      setUpdateMessage(
        error instanceof Error ? error.message : 'تعذر فتح رابط التحديث. حاول مرة أخرى.',
      );
    } finally {
      setIsOpeningUpdate(false);
    }
  };

  const handleOpenDownloads = async () => {
    const opened = await openDownloadsFolder();
    if (!opened) {
      setUpdateMessage('تعذر فتح التنزيلات. افتح تطبيق التنزيلات من جهازك.');
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
      console.error('Failed to refresh Lin Go lesson content:', error);
      setContentMessage('تعذر تحديث المحتوى الآن؛ سيستمر التطبيق بالمحتوى المحفوظ محليًا.');
    } finally {
      setIsRefreshingContent(false);
    }
  };

  const handleSupportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supportMessage.trim()) {
      setSupportStatus('اكتب تفاصيل المشكلة أولًا.');
      return;
    }
    setSupportSending(true);
    setSupportStatus('');
    try {
      const response = await fetch('/api/admin?action=support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: supportMessage.trim(),
          email: supportEmail.trim(),
          code: getStoredGoldLicenseCode(),
          device: `${Capacitor.getPlatform()} ${userProfile.targetLanguage ?? ''}`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'تعذر إرسال الشكوى.');
      }
      setSupportMessage('');
      setSupportStatus('تم إرسال الشكوى إلى لوحة التحكم. سنراجعها قريبًا.');
    } catch (error) {
      setSupportStatus(error instanceof Error ? error.message : 'تعذر إرسال الشكوى.');
    } finally {
      setSupportSending(false);
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
      console.error('Failed to check for Lin Go updates:', error);
      notes.push(error instanceof Error ? error.message : 'تعذر التحقق من إصدار التطبيق.');
    } finally {
      setIsUpdatingAll(false);
    }

    setUpdateAllMessage(notes.join(' '));
  };

  return (
    <div className="journey-secondary w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 text-slate-100 flex flex-col gap-5">
      {/* Tab Header Sub-nav */}
      {!IS_STORE_BUILD && !goldEdition && (
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
      )}

      {/* Subtab 1: App Settings */}
      {activeSubTab === 'app' && (
        <div className="flex flex-col gap-4">
          <ProfileCard profile={userProfile} onUpdateProfile={onUpdateProfile} />
          {!IS_STORE_BUILD && (
          <section
            className="bg-gradient-to-br from-sky-950 via-slate-900 to-emerald-950/40 border border-sky-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-xl"
            aria-labelledby="updates-title"
          >
            <h3 id="updates-title" className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-sky-400" />
              {goldEdition ? 'تحديث Gold داخل التطبيق' : 'تحديث التطبيق والدروس'}
            </h3>
            <p className="text-[11px] leading-6 text-slate-300">
              {goldEdition
                ? 'يتحقق Gold من إصدار Gold المنشور، ثم ينزّل الحزمة داخل التطبيق عبر مدير التنزيلات. لا يُفتح المتصفح، والتثبيت يبقى بيدك من إشعار النظام.'
                : 'يجلب أحدث الدروس من المستودع ويتحقق من وجود إصدار جديد للتطبيق.'}
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
                        التنزيل داخل التطبيق يستخدم مدير التنزيلات في Android، فيظهر التقدم في
                        الإشعارات ويُحفظ الملف في مجلد التنزيلات. بعد اكتماله اضغط على الملف
                        لتثبيت التحديث. لا يثبّت التطبيق الحزم تلقائيًا.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadUpdateInApp}
                          disabled={isOpeningUpdate}
                          className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
                        >
                          <Download className="h-4 w-4" />
                          {isOpeningUpdate
                            ? 'جارٍ بدء التنزيل…'
                            : `تنزيل تحديث ${availableUpdate.version} داخل التطبيق`}
                        </button>
                        {!goldEdition && (
                          <button
                            type="button"
                            onClick={handleOpenUpdateInBrowser}
                            disabled={isOpeningUpdate}
                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-2 font-bold text-slate-100 transition-colors hover:border-sky-400 hover:text-sky-200 disabled:cursor-wait disabled:opacity-70"
                          >
                            <Download className="h-4 w-4" />
                            فتح في المتصفح
                          </button>
                        )}
                        {updateDownloadMode === 'app' && (
                          <button
                            type="button"
                            onClick={handleOpenDownloads}
                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 px-4 py-2 font-bold text-emerald-200 transition-colors hover:bg-emerald-500/10"
                          >
                            فتح التنزيلات
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
          )}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg" aria-labelledby="learning-language-title">
            <h3 id="learning-language-title" className="text-xs font-bold text-white flex items-center gap-2"><Languages className="h-4 w-4 text-sky-400" />لغة التعلّم</h3>
            <p className="text-[11px] leading-6 text-slate-400">
              تختار لغة الدروس والحوارات والتمارين والصوت. يحتفظ التطبيق بتقدم كل لغة على حدة، لذلك يمكنك التبديل دون فقدان XP أو الدروس المكتملة.
            </p>
            <div className="flex gap-2">
              {([
                { value: 'en' as const, label: 'الإنجليزية', flag: '🇬🇧' },
                { value: 'fr' as const, label: 'الفرنسية', flag: '🇫🇷' },
              ]).map((language) => (
                <button
                  key={language.value}
                  type="button"
                  onClick={() => changeLearningLanguage(language.value)}
                  aria-pressed={userProfile.targetLanguage === language.value}
                  className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    userProfile.targetLanguage === language.value
                      ? 'border-sky-400 bg-sky-400/15 text-sky-100'
                      : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span aria-hidden="true">{language.flag}</span>
                  {language.label}
                  {userProfile.targetLanguage === language.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
            <p className="text-[10px] leading-5 text-slate-500">
              تغيير اللغة لا يحذف تقدمك. إذا كانت اللغة الجديدة بلا نقطة بداية بعد، سيُفتح اختبار تحديد المستوى قبل دروسها.
            </p>
          </section>
          {hasLessons && <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg" aria-labelledby="placement-settings-title">
            <h3 id="placement-settings-title" className="text-xs font-bold text-white flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-400" />تحديد المستوى التعليمي</h3>
            <p className="text-[11px] leading-6 text-slate-400">{userProfile.placementAssessment?.result
              ? userProfile.placementAssessment.result.method === 'first_stage'
                ? 'اخترت البدء من المرحلة الأولى. يمكنك تحديد مستواك بالاختبار أو تغيير نقطة البداية في أي وقت. لن يُحذف XP أو الدروس المكتملة.'
                : `نقطة البداية المقترحة حاليًا: المستوى ${userProfile.placementAssessment.result.suggestedStage} في Lin Go. يمكنك إعادة الاختبار أو البدء من المرحلة الأولى. لن يُحذف XP أو الدروس المكتملة.`
              : 'لم تُسجّل نقطة بداية لهذا الملف بعد. يمكنك البدء من المرحلة الأولى أو تحديد مستواك بالاختبار.'}</p>
            <button type="button" onClick={onRetakePlacement} className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">تغيير نقطة البداية أو إعادة الاختبار</button>
          </section>}
          {/* Audio & Pronunciation settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>إعدادات الصوت والنطق التلقائي</span>
            </h3>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">لغة النطق</span>
                <span className="text-[11px] text-slate-500">تتبع لغة التعلّم تلقائيًا: صوت إنجليزي أو فرنسي واضح.</span>
              </div>
              <span className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-sky-200">
                {userProfile.targetLanguage === 'fr' ? '🇫🇷 فرنسية' : '🇬🇧 إنجليزية'}
              </span>
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
                    {mode === 'both' ? `عربي+${courseCode}` : mode === 'en' ? `${courseCode} فقط` : 'مخفية'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">الوضع بدون إنترنت (Offline)</span>
                <span className="text-[11px] text-slate-500">
                  {isFrenchCourse
                    ? 'الدروس والمفردات محفوظة محليًا، وصوت الدروس يحتاج حزمة صوت فرنسية أو اتصالًا بالإنترنت'
                    : 'كل محادثات ومفردات التطبيق تعمل محلياً بالكامل'}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1 ${isFrenchCourse ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isFrenchCourse ? 'الصوت يحتاج اتصالًا' : 'جاهز ومفعل'}</span>
              </span>
            </div>
          </div>

          <ProgressBackupPanel userProfile={userProfile} onRestoreProgress={onRestoreProgress} />

          <details className="rounded-2xl border border-slate-700/80 bg-slate-900/50 p-3">
            <summary className="cursor-pointer select-none text-xs font-bold text-slate-300">
              نسخ قديمة بالرمز (غير مشفرة) — للتوافق فقط
            </summary>
            <section className="mt-3 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-amber-950/10 p-4 shadow-lg" aria-labelledby="legacy-progress-backup-title">
            <h3 id="legacy-progress-backup-title" className="flex items-center gap-2 text-sm font-black text-white">
              <KeyRound className="h-4 w-4 text-amber-300" />
              نسخة قديمة بالرمز أو السحابة
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              هذا القسم للتوافق مع النسخ التي أنشأتها إصدارات سابقة فقط. الملفات هنا غير مشفرة
              ولا تستخدم كلمة مرور، لذلك لا ننصح باستخدامها للبيانات الجديدة. استخدم النسخة المشفرة
              في الأعلى.
            </p>
            <button type="button" onClick={handleCreateProgressBackup} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-sky-300 active:scale-[.98]">
              <Download className="h-4 w-4" />
              إنشاء نسخة قديمة وحفظ ملف
            </button>
            <p className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-emerald-200/80">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              لا تمنح هذه العملية التطبيق وصولًا دائمًا لكل الملفات؛ أنت تختار ملفًا واحدًا فقط.
            </p>
            {createdBackup && (
              <div className="mt-3 rounded-xl border border-sky-400/30 bg-slate-950/70 p-3">
                <p className="text-[11px] text-slate-400">رمز النسخة</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code dir="ltr" className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-lg font-black tracking-[.22em] text-sky-200">{createdBackup.code}</code>
                  <button type="button" onClick={() => void handleCopyProgressCode()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800">
                    <Copy className="h-3.5 w-3.5" /> نسخ الرمز
                  </button>
                  <button type="button" onClick={() => void handleSaveCreatedBackupFile()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 text-xs font-bold text-sky-200 hover:bg-sky-500/20">
                    <Save className="h-3.5 w-3.5" /> حفظ الملف
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">احفظ الرمز وملف <bdi dir="ltr">lin-go-legacy-progress-{createdBackup.code}.json</bdi> في مكان آمن.</p>
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
                استعادة النسخة القديمة
              </button>
            </div>
            {backupMessage && <p role="status" className="mt-3 rounded-xl bg-slate-950/70 p-3 text-xs leading-relaxed text-slate-200">{backupMessage}</p>}
            </section>
          </details>

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

          {goldEdition && (
            <section
              className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/30 p-4 shadow-lg"
              aria-labelledby="gold-support-heading"
            >
              <div className="flex items-center gap-2 text-emerald-300">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <h3 id="gold-support-heading" className="text-xs font-bold text-white">
                  دعم Gold+
                </h3>
              </div>
              <p className="mt-2 text-xs leading-6 text-slate-300">
                تواصل معنا لأي مشكلة في التفعيل أو التحديث أو الصوت. كودك وحالة تفعيلك محفوظان على هذا الجهاز.
              </p>
              <div className="mt-3 flex flex-col gap-2 text-xs text-slate-300 sm:flex-row sm:flex-wrap sm:gap-x-5">
                <a
                  href="mailto:hmachikh16@gmail.com?subject=Gold%20Support"
                  className="inline-flex items-center gap-2 hover:text-emerald-300"
                  dir="ltr"
                >
                  <AtSign className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  hmachikh16@gmail.com
                </a>
                <a
                  href="https://wa.me/213665003037"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-emerald-300"
                  dir="ltr"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  WhatsApp
                </a>
                <a
                  href="https://www.facebook.com/hma.chikh14/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-emerald-300"
                >
                  <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M14 8h3V4h-3c-2.76 0-5 2.24-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.55.45-1 1-1Z"
                    />
                  </svg>
                  فيسبوك
                </a>
                <a
                  href="https://englishtok-eight.vercel.app/control"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-emerald-300"
                  dir="ltr"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  لوحة التحكم (للإدارة)
                </a>
              </div>

              <form className="mt-4 space-y-3" onSubmit={handleSupportSubmit}>
                <label className="block text-xs font-bold text-white" htmlFor="gold-support-email">
                  بريدك (اختياري)
                </label>
                <input
                  id="gold-support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(event) => setSupportEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-emerald-500/30 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                />
                <label className="block text-xs font-bold text-white" htmlFor="gold-support-message">
                  تفاصيل المشكلة
                </label>
                <textarea
                  id="gold-support-message"
                  value={supportMessage}
                  onChange={(event) => setSupportMessage(event.target.value)}
                  rows={4}
                  placeholder="اشرح المشكلة (الصوت، التفعيل، التحديث، ...)"
                  className="w-full resize-none rounded-xl border border-emerald-500/30 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={supportSending}
                  className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {supportSending ? 'جارٍ الإرسال…' : 'إرسال الشكوى'}
                </button>
                {supportStatus && (
                  <p className="text-xs font-bold text-emerald-300">{supportStatus}</p>
                )}
              </form>
            </section>
          )}

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
            <a
              href="https://www.facebook.com/hma.chikh14/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold text-sky-100 transition-colors hover:bg-sky-500/20"
            >
              <svg className="h-3.5 w-3.5 text-sky-300" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M14 8h3V4h-3c-2.76 0-5 2.24-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.55.45-1 1-1Z"
                />
              </svg>
              تواصل عبر فيسبوك
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
            </a>
          </section>

          <section
            className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/30 p-4 shadow-lg"
            aria-labelledby="app-rights-heading"
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <h3 id="app-rights-heading" className="text-xs font-bold text-white">
                حقوق التطبيق
              </h3>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              © 2026 Lin Go — جميع الحقوق محفوظة. التطبيق ودروسه وبطاقاته وتصميمه مملوكة
              للمطوّر، ولا يجوز نسخها أو تعديلها أو إعادة توزيعها دون إذن كتابي.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/legal/privacy.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-100 transition-colors hover:bg-emerald-500/20"
              >
                سياسة الخصوصية
              </a>
              <a
                href="/legal/terms.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-100 transition-colors hover:bg-emerald-500/20"
              >
                شروط الاستخدام
              </a>
              <a
                href="/legal/license.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-100 transition-colors hover:bg-emerald-500/20"
              >
                حقوق الملكية
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
                دليل تحويل Lin Go إلى تطبيق Android (APK)
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
              يتحقق التطبيق من آخر إصدار منشور في مستودع GitHub الموثوق، ويعرض ملاحظات الإصدار
              وبصمة SHA-256 المنشورة. يفتح زر التحديث المتصفح لتنزيل حزمة APK الرسمية، ثم
              يؤكد المستخدم التثبيت في Android. لا ينزّل Lin Go الحزمة داخليًا ولا يثبّتها
              بنفسه، ولا يطلب صلاحية تثبيت التطبيقات.
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
                        التنزيل داخل التطبيق يظهر في إشعارات النظام ويُحفظ في مجلد التنزيلات؛
                        بعد اكتماله اضغط على الملف لتثبيته.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadUpdateInApp}
                          disabled={isOpeningUpdate}
                          className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
                        >
                          <Download className="h-4 w-4" />
                          {isOpeningUpdate ? 'جارٍ بدء التنزيل…' : 'تنزيل تحديث Android داخل التطبيق'}
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenUpdateInBrowser}
                          disabled={isOpeningUpdate}
                          className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-2 font-bold text-slate-100 transition-colors hover:border-sky-400 hover:text-sky-200 disabled:cursor-wait disabled:opacity-70"
                        >
                          فتح في المتصفح
                        </button>
                        {updateDownloadMode === 'app' && (
                          <button
                            type="button"
                            onClick={handleOpenDownloads}
                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 px-4 py-2 font-bold text-emerald-200 transition-colors hover:bg-emerald-500/10"
                          >
                            فتح التنزيلات
                          </button>
                        )}
                      </div>
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
              تم تضمين ملف <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded">capacitor.config.json</code> مسبقاً في جذر المشروع باسم التطبيق <strong className="text-white">Lin Go</strong> ومجلد التوزيع <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded">dist</code>.
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
              <li><strong className="text-white">title & titleAr:</strong> عنوان الدرس بلغة التعلّم والعربية.</li>
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
