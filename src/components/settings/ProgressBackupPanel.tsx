import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileJson,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import type { GameProgress } from '../../services/gameProgressService';
import { loadGameProgress } from '../../services/gameProgressService';
import type { UserProfile } from '../../types';
import {
  asProgressBackupError,
  clearPreImportSnapshot,
  createEncryptedProgressBackup,
  decryptProgressBackup,
  getPreImportSnapshot,
  inspectProgressBackup,
  isProgressBackupCryptoAvailable,
  summarizeProgress,
  type DecryptedProgressBackup,
  type PreImportSnapshot,
  type ProgressBackupMetadata,
} from '../../services/progressBackupService';
import {
  isNativeProgressFilePickerAvailable,
  isProgressFileCancellation,
  openProgressBackupFile,
  saveProgressBackupFile,
} from '../../services/progressFileService';

const MAX_BROWSER_FILE_BYTES = 4_000_000;

interface ImportSource {
  fileName: string;
  contents: string;
  metadata: ProgressBackupMetadata;
}

interface ProgressBackupPanelProps {
  userProfile: UserProfile;
  onRestoreProgress: (
    profile: UserProfile,
    gameProgress?: GameProgress,
    options?: { createPreImportSnapshot?: boolean; sourceCreatedAt?: string },
  ) => void;
}

interface Notice {
  tone: 'success' | 'error' | 'info';
  message: string;
}

const noticeClass = (tone: Notice['tone']): string => {
  if (tone === 'success') return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100';
  if (tone === 'error') return 'border-rose-400/35 bg-rose-500/10 text-rose-100';
  return 'border-sky-400/30 bg-sky-500/10 text-sky-100';
};

const languageLabel = (language: UserProfile['targetLanguage']): string => {
  if (language === 'fr') return 'الفرنسية';
  if (language === 'en') return 'الإنجليزية';
  return 'بدون لغة محددة';
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const number = (value: number): string => value.toLocaleString('ar-EG');

export const ProgressBackupPanel: React.FC<ProgressBackupPanelProps> = ({
  userProfile,
  onRestoreProgress,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<Notice | null>(null);

  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [preview, setPreview] = useState<DecryptedProgressBackup | null>(null);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [importNotice, setImportNotice] = useState<Notice | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [preImportSnapshot, setPreImportSnapshot] = useState<PreImportSnapshot | null>(
    () => getPreImportSnapshot(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cryptoAvailable = isProgressBackupCryptoAvailable();
  const currentGameProgress = useMemo(() => loadGameProgress(), [userProfile]);
  const currentSummary = useMemo(
    () => summarizeProgress(userProfile, currentGameProgress),
    [currentGameProgress, userProfile],
  );
  const previewSummary = useMemo(
    () => (preview ? summarizeProgress(preview.profile, preview.gameProgress) : null),
    [preview],
  );

  const resetImportForm = () => {
    setImportSource(null);
    setImportPassword('');
    setPreview(null);
    setOverwriteConfirmed(false);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const prepareImport = (fileName: string, contents: string) => {
    const metadata = inspectProgressBackup(contents);
    setImportSource({ fileName, contents, metadata });
    setImportPassword('');
    setPreview(null);
    setOverwriteConfirmed(false);
    setImportError(null);
    setImportNotice(null);
  };

  const handleExport = async () => {
    setExportNotice(null);
    if (password.length < 8) {
      setExportNotice({
        tone: 'error',
        message: 'استخدم كلمة مرور مؤقتة من 8 أحرف على الأقل، ويُفضّل 12 حرفًا أو أكثر.',
      });
      return;
    }
    if (password !== confirmPassword) {
      setExportNotice({ tone: 'error', message: 'كلمتا المرور غير متطابقتين. أعد كتابة التأكيد.' });
      return;
    }

    setIsExporting(true);
    try {
      const backup = await createEncryptedProgressBackup(
        userProfile,
        currentGameProgress,
        password,
      );
      const destination = await saveProgressBackupFile(backup.fileName, backup.contents);
      setExportNotice({
        tone: 'success',
        message:
          destination === 'native'
            ? 'تم حفظ النسخة المشفرة في المكان الذي اخترته. احتفظ بكلمة المرور في مكان آمن؛ لا يمكن استعادة الملف دونها.'
            : 'تم تنزيل النسخة المشفرة. احتفظ بكلمة المرور في مكان آمن؛ لا يمكن استعادة الملف دونها.',
      });
      setPassword('');
      setConfirmPassword('');
      setShowExportPassword(false);
    } catch (error) {
      if (isProgressFileCancellation(error)) {
        setExportNotice({
          tone: 'info',
          message: 'لم يُحفظ الملف خارج التطبيق. تقدمك الحالي ما زال محفوظًا داخل التطبيق.',
        });
      } else {
        setExportNotice({ tone: 'error', message: asProgressBackupError(error).message });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleChooseImportFile = async () => {
    setImportError(null);
    setImportNotice(null);
    setPreview(null);
    setOverwriteConfirmed(false);
    if (isNativeProgressFilePickerAvailable()) {
      setIsReadingFile(true);
      try {
        const selected = await openProgressBackupFile();
        prepareImport(selected.fileName, selected.content);
      } catch (error) {
        if (isProgressFileCancellation(error)) {
          setImportNotice({ tone: 'info', message: 'لم يتم اختيار ملف. تقدمك الحالي دون تغيير.' });
        } else {
          setImportError(asProgressBackupError(error).message);
        }
      } finally {
        setIsReadingFile(false);
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleBrowserFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportError(null);
    setImportNotice(null);
    setPreview(null);
    setOverwriteConfirmed(false);
    if (file.size > MAX_BROWSER_FILE_BYTES) {
      setImportSource(null);
      setImportPassword('');
      setImportError('حجم الملف أكبر من الحد المسموح للنسخة الاحتياطية.');
      return;
    }
    setIsReadingFile(true);
    try {
      prepareImport(file.name, await file.text());
    } catch (error) {
      setImportError(asProgressBackupError(error).message);
      setImportSource(null);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleDecrypt = async () => {
    if (!importSource) {
      setImportError('اختر ملف نسخة احتياطية أولًا.');
      return;
    }
    setImportError(null);
    setImportNotice(null);
    setIsDecrypting(true);
    try {
      const decrypted = await decryptProgressBackup(importSource.contents, importPassword);
      setPreview(decrypted);
      setOverwriteConfirmed(false);
      setImportPassword('');
      setShowImportPassword(false);
    } catch (error) {
      setPreview(null);
      setImportError(asProgressBackupError(error).message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleApplyImport = () => {
    if (!preview || !overwriteConfirmed) return;
    setImportError(null);
    setIsApplying(true);
    try {
      onRestoreProgress(preview.profile, preview.gameProgress, {
        createPreImportSnapshot: true,
        sourceCreatedAt: preview.metadata.createdAt,
      });
      setPreImportSnapshot(getPreImportSnapshot());
      setPreview(null);
      setImportSource(null);
      setImportPassword('');
      setOverwriteConfirmed(false);
      setImportNotice({
        tone: 'success',
        message:
          'تمت استعادة التقدم المشفر. حُفظت نسخة أمان من تقدمك السابق داخل التطبيق ويمكنك التراجع عنها من هذه الصفحة.',
      });
    } catch (error) {
      setImportError(asProgressBackupError(error).message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRollback = () => {
    const snapshot = preImportSnapshot ?? getPreImportSnapshot();
    if (!snapshot) {
      setImportError('لا توجد نسخة أمان محلية قابلة للاستعادة.');
      return;
    }
    if (
      !window.confirm(
        'سيتم استبدال تقدمك الحالي بالنسخة التي حُفظت تلقائيًا قبل آخر استيراد. هل تريد المتابعة؟',
      )
    ) {
      return;
    }
    setImportError(null);
    setIsApplying(true);
    try {
      onRestoreProgress(snapshot.profile, snapshot.gameProgress);
      clearPreImportSnapshot();
      setPreImportSnapshot(null);
      setImportNotice({
        tone: 'success',
        message: 'تم التراجع عن آخر استيراد واستعادة التقدم السابق بنجاح.',
      });
    } catch (error) {
      setImportError(asProgressBackupError(error).message);
    } finally {
      setIsApplying(false);
    }
  };

  const closePreview = () => {
    if (isApplying) return;
    setPreview(null);
    setOverwriteConfirmed(false);
    setImportError(null);
  };

  const renderComparisonRow = (
    label: string,
    currentValue: string,
    incomingValue: string,
  ) => {
    const changed = currentValue !== incomingValue;
    return (
      <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl bg-slate-950/60 px-3 py-2">
        <span className="text-[11px] font-semibold text-slate-300">{label}</span>
        <span dir="ltr" className="font-mono text-xs font-bold text-slate-400">{currentValue}</span>
        <span className={`font-mono text-xs font-black ${changed ? 'text-sky-200' : 'text-emerald-200'}`}>
          {changed ? '→ ' : '= '}
          {incomingValue}
        </span>
      </div>
    );
  };

  return (
    <>
      <section
        className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-slate-900 to-sky-950/25 p-4 shadow-lg"
        aria-labelledby="progress-backup-title"
      >
        <h3 id="progress-backup-title" className="flex items-center gap-2 text-sm font-black text-white">
          <LockKeyhole className="h-4 w-4 text-sky-300" />
          حفظ واستعادة التقدم
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          تقدمك يُحفظ تلقائيًا داخل التطبيق بعد الدروس والاختبارات والألعاب. هذه الصفحة تنشئ نسخة
          إضافية مشفّرة تعمل دون إنترنت ويمكن نقلها إلى جهاز آخر. الملف لا يحتوي كلمة المرور.
        </p>

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-[11px] leading-relaxed text-emerald-100">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <span>
            التشفير يستخدم <bdi dir="ltr">AES-256-GCM</bdi> مع مفتاح مشتق من كلمة المرور عبر
            <bdi dir="ltr"> PBKDF2-SHA-256</bdi>. لا يوجد مفتاح ثابت داخل التطبيق، وأي تعديل على
            الملف يؤدي إلى رفض الاستعادة.
          </span>
        </div>

        {!cryptoAvailable && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            التشفير الآمن غير متاح في هذه النسخة من المتصفح أو WebView. حدّث التطبيق أو نظام الجهاز
            ثم أعد فتح الصفحة. لن نستخدم تشفيرًا بديلًا غير آمن.
          </p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 p-3">
            <h4 className="flex items-center gap-2 text-xs font-black text-white">
              <Download className="h-4 w-4 text-sky-300" />
              إنشاء نسخة مشفرة
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              تشمل النسخة المستوى الحالي، XP، السلسلة، الدروس المكتملة، المفردات، الإنجازات
              ونتائج الاختبارات.
            </p>
            <label htmlFor="encrypted-backup-password" className="mt-3 block text-[11px] font-bold text-slate-200">
              كلمة مرور النسخة
            </label>
            <div className="relative mt-1">
              <input
                id="encrypted-backup-password"
                type={showExportPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={1024}
                placeholder="8 أحرف على الأقل"
                className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 pl-10 text-sm font-semibold text-white outline-none focus:border-sky-400"
              />
              <button
                type="button"
                onClick={() => setShowExportPassword((value) => !value)}
                aria-label={showExportPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400 hover:text-sky-200"
              >
                {showExportPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <label htmlFor="encrypted-backup-password-confirm" className="mt-2 block text-[11px] font-bold text-slate-200">
              تأكيد كلمة المرور
            </label>
            <input
              id="encrypted-backup-password-confirm"
              type={showExportPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={1024}
              placeholder="أعد كتابة كلمة المرور"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-sky-400"
            />
            <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-amber-200/80">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              لن نستطيع استعادة كلمة المرور. احفظها في مكان آمن لأن الملف غير قابل للفتح بدونها.
            </p>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={!cryptoAvailable || isExporting}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-sky-300 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? 'جارٍ التشفير والحفظ…' : 'إنشاء وحفظ النسخة المشفرة'}
            </button>
            {exportNotice && (
              <p role={exportNotice.tone === 'error' ? 'alert' : 'status'} className={`mt-2 rounded-xl border p-2.5 text-[11px] leading-relaxed ${noticeClass(exportNotice.tone)}`}>
                {exportNotice.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 p-3">
            <h4 className="flex items-center gap-2 text-xs font-black text-white">
              <Upload className="h-4 w-4 text-emerald-300" />
              استعادة نسخة على هذا الجهاز
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              اختر الملف المشفر، ثم أدخل كلمة المرور. لن يتغير تقدمك حتى تراجع المعاينة وتوافق
              صراحة على الاستبدال.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(event) => void handleBrowserFile(event)}
            />
            <button
              type="button"
              onClick={() => void handleChooseImportFile()}
              disabled={isReadingFile || isDecrypting || isApplying}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-xs font-black text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isReadingFile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
              {isReadingFile ? 'جارٍ قراءة الملف…' : 'اختيار ملف النسخة الاحتياطية'}
            </button>

            {importSource && (
              <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3">
                <p className="truncate text-[11px] font-bold text-sky-100" dir="ltr" title={importSource.fileName}>
                  {importSource.fileName}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  أُنشئت في {formatDate(importSource.metadata.createdAt)} · تطبيق {importSource.metadata.appVersion}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  تم التحقق من التنسيق والإصدار. يلزم فك التشفير بكلمة المرور.
                </p>
                <label htmlFor="encrypted-backup-import-password" className="mt-2 block text-[11px] font-bold text-slate-200">
                  كلمة مرور النسخة
                </label>
                <div className="relative mt-1">
                  <input
                    id="encrypted-backup-import-password"
                    type={showImportPassword ? 'text' : 'password'}
                    value={importPassword}
                    onChange={(event) => setImportPassword(event.target.value)}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={1024}
                    placeholder="كلمة المرور المستخدمة عند التصدير"
                    className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 pl-10 text-sm font-semibold text-white outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImportPassword((value) => !value)}
                    aria-label={showImportPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400 hover:text-emerald-200"
                  >
                    {showImportPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDecrypt()}
                  disabled={!cryptoAvailable || !importPassword || isDecrypting || isApplying}
                  className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDecrypting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {isDecrypting ? 'جارٍ التحقق وفك التشفير…' : 'فك التشفير ومعاينة التقدم'}
                </button>
              </div>
            )}

            {importError && (
              <p role="alert" className="mt-2 rounded-xl border border-rose-400/35 bg-rose-500/10 p-2.5 text-[11px] leading-relaxed text-rose-100">
                {importError}
              </p>
            )}
            {importNotice && (
              <p role="status" className={`mt-2 rounded-xl border p-2.5 text-[11px] leading-relaxed ${noticeClass(importNotice.tone)}`}>
                {importNotice.message}
              </p>
            )}
          </div>
        </div>

        {preImportSnapshot && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-100">
              <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                نسخة أمان داخلية محفوظة قبل آخر استيراد بتاريخ {formatDate(preImportSnapshot.createdAt)}.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRollback}
              disabled={isApplying}
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 text-[11px] font-bold text-amber-100 hover:bg-amber-400/20 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              التراجع عن آخر استيراد
            </button>
          </div>
        )}
      </section>

      {preview && previewSummary && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="progress-preview-title"
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-sky-400/25 bg-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-700/80 bg-slate-950/70 p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-black text-white">
                  <ArrowLeftRight className="h-4 w-4 text-sky-300" />
                  معاينة التقدم قبل الاستبدال
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  هذه معاينة للبيانات التي ستُستعاد. تقدمك الحالي لن يتغير حتى تضغط زر التأكيد.
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                disabled={isApplying}
                aria-label="إغلاق المعاينة"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/80 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-300">
                <span>
                  مصدر النسخة: تطبيق <bdi dir="ltr">{preview.metadata.appVersion}</bdi>
                </span>
                <span>أُنشئت في {formatDate(preview.metadata.createdAt)}</span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/45 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">التقدم الحالي</p>
                  <p className="mt-1 truncate text-xs font-bold text-slate-200">{currentSummary.displayName}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {languageLabel(currentSummary.targetLanguage)} · المرحلة {number(currentSummary.currentStage)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300/80">التقدم المستعاد</p>
                  <p className="mt-1 truncate text-xs font-bold text-emerald-50">{previewSummary.displayName}</p>
                  <p className="mt-1 text-[10px] text-emerald-200/80">
                    {languageLabel(previewSummary.targetLanguage)} · المرحلة {number(previewSummary.currentStage)}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {renderComparisonRow('XP', number(currentSummary.xp), number(previewSummary.xp))}
                {renderComparisonRow('السلسلة اليومية', `${number(currentSummary.streakDays)} يوم`, `${number(previewSummary.streakDays)} يوم`)}
                {renderComparisonRow('دروس اللغة النشطة', number(currentSummary.activeCompletedLessons), number(previewSummary.activeCompletedLessons))}
                {renderComparisonRow('إجمالي الدروس في اللغات', number(currentSummary.totalCompletedLessons), number(previewSummary.totalCompletedLessons))}
                {renderComparisonRow('كلمات محفوظة', number(currentSummary.savedWords), number(previewSummary.savedWords))}
                {renderComparisonRow('نتائج اختبارات الدروس', number(currentSummary.quizResults), number(previewSummary.quizResults))}
                {renderComparisonRow('اختبارات مراحل ناجحة', number(currentSummary.passedExamStages), number(previewSummary.passedExamStages))}
                {renderComparisonRow('أفضل سلسلة ألعاب', number(currentSummary.gameBestStreak), number(previewSummary.gameBestStreak))}
                {renderComparisonRow('كلمات الألعاب المحلولة', number(currentSummary.gameSolved), number(previewSummary.gameSolved))}
                {renderComparisonRow('المرحلة الحالية', number(currentSummary.currentStage), number(previewSummary.currentStage))}
              </div>

              <div className="mt-3 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-100">
                <p className="flex items-start gap-2 font-bold">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  تحذير: الاستعادة ستستبدل تقدم هذا الجهاز الحالي.
                </p>
                <p className="mt-1 pr-6">
                  سيُحفظ تقدمك الحالي أولًا في نسخة أمان داخلية، لكن استبدال البيانات لا يمكن التراجع
                  عنه إلا من زر التراجع في هذه الصفحة. إن كانت النسخة المستعادة للغة أخرى فستتغير لغة
                  المسار أيضًا.
                </p>
              </div>

              <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-200">
                <input
                  type="checkbox"
                  checked={overwriteConfirmed}
                  onChange={(event) => setOverwriteConfirmed(event.target.checked)}
                  disabled={isApplying}
                  className="mt-0.5 h-4 w-4 accent-emerald-500"
                />
                <span>أفهم أن الاستعادة ستستبدل تقدمي الحالي، وأن كلمة المرور لا يمكن استعادتها من الملف.</span>
              </label>

              {importError && (
                <p role="alert" className="mt-3 rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100">
                  {importError}
                </p>
              )}

              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePreview}
                  disabled={isApplying}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-700 px-4 text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleApplyImport}
                  disabled={!overwriteConfirmed || isApplying}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isApplying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {isApplying ? 'جارٍ حفظ نسخة الأمان والاستعادة…' : 'تأكيد الاستبدال واستعادة التقدم'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
