import React, { useState } from 'react';
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
} from 'lucide-react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { UserProfile, UserSettings } from '../../types';
import { speechService } from '../../services/speechService';
import { checkForAppUpdate, type AppUpdateManifest } from '../../services/appUpdateService';

interface SettingsTabProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetProgress: () => void;
  onRefreshContent: () => Promise<boolean>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  userProfile,
  onUpdateProfile,
  onResetProgress,
  onRefreshContent,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'app' | 'capacitor' | 'content'>('app');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppUpdateManifest | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const [contentMessage, setContentMessage] = useState<string | null>(null);

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
    try {
      await Browser.open({ url: availableUpdate.apkUrl });
    } catch (error) {
      console.error('Failed to open the Android update download:', error);
      setUpdateMessage('تعذر فتح تنزيل التحديث. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
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
          {/* Audio & Pronunciation settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>إعدادات الصوت والنطق التلقائي</span>
            </h3>

            {/* Accent selection */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">لهجة الصوت</span>
                <span className="text-[11px] text-slate-500">اختر لكنة النطق المفضلة</span>
              </div>
              <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => updateSetting('voiceAccent', 'en-US')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    userProfile.settings.voiceAccent === 'en-US'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  أمريكية (US)
                </button>
                <button
                  onClick={() => updateSetting('voiceAccent', 'en-GB')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    userProfile.settings.voiceAccent === 'en-GB'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  بريطانية (UK)
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
              يتحقق التطبيق من آخر إصدار منشور في مستودع GitHub الموثوق، ويعرض ملاحظات الإصدار ورقم الحزمة والبصمة المنشورة. تنزيل APK يفتح صفحة التنزيل؛ ثم يراجع Android التوقيع والتوافق ويطلب موافقتك على التثبيت.
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
                        className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                      >
                        <Download className="h-4 w-4" />
                        تنزيل تحديث Android
                      </button>
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
