import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeProgressBackupPlugin {
  save(options: { fileName: string; content: string }): Promise<{ fileName?: string }>;
  open(): Promise<{ fileName?: string; content: string }>;
}

const NativeProgressBackup = registerPlugin<NativeProgressBackupPlugin>('ProgressBackup');

export class ProgressFileError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ProgressFileError';
    this.code = code;
  }
}

const nativeProgressFilePickerAvailable = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

const asProgressFileError = (error: unknown): ProgressFileError => {
  if (error instanceof ProgressFileError) return error;
  const value = error as { code?: unknown; message?: unknown } | undefined;
  const code = typeof value?.code === 'string' ? value.code : 'UNKNOWN';
  const message =
    typeof value?.message === 'string' && value.message
      ? value.message
      : 'تعذر إكمال عملية الملف.';
  return new ProgressFileError(code, message);
};

const downloadInBrowser = (fileName: string, content: string) => {
  if (typeof document === 'undefined') {
    throw new ProgressFileError('UNSUPPORTED', 'تنزيل الملف غير متاح في هذه البيئة.');
  }
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Saves a progress backup through the system document picker on Android, so
 * the learner chooses one destination without granting broad storage access.
 * Browsers keep using a normal download.
 */
export const saveProgressBackupFile = async (
  fileName: string,
  content: string,
): Promise<'native' | 'download'> => {
  if (nativeProgressFilePickerAvailable()) {
    try {
      await NativeProgressBackup.save({ fileName, content });
      return 'native';
    } catch (error) {
      throw asProgressFileError(error);
    }
  }
  downloadInBrowser(fileName, content);
  return 'download';
};

/**
 * Opens a backup through Android's document picker. This is the native
 * counterpart of the browser's <input type="file"> control.
 */
export const openProgressBackupFile = async (): Promise<{ fileName: string; content: string }> => {
  if (!nativeProgressFilePickerAvailable()) {
    throw new ProgressFileError('UNSUPPORTED', 'اختيار الملف الأصلي متاح داخل تطبيق Android فقط.');
  }
  try {
    const result = await NativeProgressBackup.open();
    return {
      fileName: result.fileName || 'englishtok-progress.json',
      content: typeof result.content === 'string' ? result.content : '',
    };
  } catch (error) {
    throw asProgressFileError(error);
  }
};

export const isProgressFileCancellation = (error: unknown): boolean => {
  if (error instanceof ProgressFileError) return error.code === 'CANCELLED';
  const code = (error as { code?: unknown } | undefined)?.code;
  return typeof code === 'string' && code === 'CANCELLED';
};

export const isNativeProgressFilePickerAvailable = nativeProgressFilePickerAvailable;
