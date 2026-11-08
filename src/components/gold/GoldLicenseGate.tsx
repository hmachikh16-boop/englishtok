import React, { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { KeyRound, ShieldCheck, XCircle } from 'lucide-react';
import {
  clearStoredGoldLicenseCode,
  fetchGoldMode,
  getStoredGoldLicenseCode,
  readCachedGoldMode,
  storeGoldLicenseCode,
  verifyGoldLicense,
  writeCachedGoldMode,
} from '../../services/goldLicense';

interface GoldLicenseGateProps {
  children: React.ReactNode;
}

type GateStatus = 'checking' | 'licensed' | 'free' | 'locked';

export const GoldLicenseGate: React.FC<GoldLicenseGateProps> = ({ children }) => {
  const [code, setCode] = useState(getStoredGoldLicenseCode());
  const [status, setStatus] = useState<GateStatus>('checking');
  const [message, setMessage] = useState('جارٍ التحقق من كود Gold...');
  const [verifying, setVerifying] = useState(false);

  const verify = async (candidate: string): Promise<boolean> => {
    setVerifying(true);
    const result = await verifyGoldLicense(candidate);
    setVerifying(false);

    if (result.networkError) {
      const stored = getStoredGoldLicenseCode();
      if (stored && stored === candidate.trim().toUpperCase()) {
        setStatus('licensed');
        setMessage('تعذر الاتصال بلوحة التحكم. التطبيق يبقى مفعّلًا على هذا الجهاز.');
        return true;
      }
      setStatus('locked');
      setMessage('تعذر الاتصال بلوحة التحكم. تحقق من الإنترنت وأعد المحاولة.');
      return false;
    }

    if (result.valid) {
      storeGoldLicenseCode(candidate);
      setStatus('licensed');
      setMessage('تم التحقق — Gold مفعّل على هذا الجهاز.');
      return true;
    }

    if (result.status === 'device_mismatch') {
      clearStoredGoldLicenseCode();
      setStatus('locked');
      setMessage('هذا الكود مستخدم على جهاز آخر. تواصل مع الدعم.');
      return false;
    }

    clearStoredGoldLicenseCode();
    setStatus('locked');
    if (result.status === 'revoked') {
      setMessage('هذا الكود ملغى. تواصل مع الدعم أو استخدم كودًا آخر.');
    } else if (result.status === 'expired') {
      setMessage('هذا الكود منتهي الصلاحية. تواصل مع الدعم لتجديده.');
    } else {
      setMessage('كود Gold غير صالح أو غير موجود. أدخل كودًا مفعّلًا من لوحة التحكم.');
    }
    return false;
  };

  /**
   * The admin panel can switch the whole app between:
   *  - free mode  → open for everyone, no code required;
   *  - paid mode  → require an activated Gold code.
   * The last known mode is cached so a trial user is not locked out by a
   * brief network drop.
   */
  const resolveAccess = async (): Promise<void> => {
    const mode = await fetchGoldMode();

    if (!mode.networkError) {
      writeCachedGoldMode(mode.freeMode);
      if (mode.freeMode) {
        setStatus('free');
        setMessage('النسخة التجريبية المجانية مفعّلة — لا حاجة إلى كود.');
        return;
      }
    } else if (readCachedGoldMode() === true) {
      setStatus('free');
      setMessage('النسخة التجريبية المجانية مفعّلة — لا حاجة إلى كود.');
      return;
    }

    const stored = getStoredGoldLicenseCode();
    if (!stored) {
      setStatus('locked');
      setMessage('أدخل كود Gold مفعّلًا من لوحة التحكم لتشغيل Gold+.');
      return;
    }
    await verify(stored);
  };

  useEffect(() => {
    void resolveAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const recheck = () => {
      void resolveAccess();
    };

    const interval = window.setInterval(recheck, 30 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') recheck();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await verify(code);
  };

  const handleExit = () => {
    try {
      void CapacitorApp.exitApp();
    } catch {
      /* Browser preview has no native exit; keep the gate visible. */
    }
  };

  if (status === 'checking') {
    return (
      <div className="gold-license-screen flex min-h-screen items-center justify-center bg-[#fffaf0] px-6 text-center">
        <div className="max-w-sm">
          <div className="gold-license-mark mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f4b603] text-[#132230] shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-xl font-black text-[#132230]">Lin Go Gold</h1>
          <p className="mt-2 text-sm font-bold text-[#315a7c]">{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'licensed' || status === 'free') {
    return <>{children}</>;
  }

  return (
    <div className="gold-license-screen flex min-h-screen items-center justify-center bg-[#fffaf0] px-6">
      <div className="gold-license-card w-full max-w-md rounded-[2rem] border-2 border-[#f4b603] bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="gold-license-mark flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4b603] text-[#132230]">
            <KeyRound className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-lg font-black text-[#132230]">تفعيل Lin Go Gold</h1>
            <p className="text-xs font-bold text-[#315a7c]">يتطلب كودًا مفعّلًا من لوحة التحكم</p>
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-[#d9c58f] bg-[#fffaf0] px-4 py-3 text-sm font-bold leading-7 text-[#132230]">
          {message}
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-xs font-black text-[#132230]" htmlFor="gold-license-code">
            كود Gold
          </label>
          <input
            id="gold-license-code"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="LINGO-GOLD-XXXX-XXXX-XXXX"
            className="w-full rounded-2xl border-2 border-[#d9c58f] bg-[#fffaf0] px-4 py-3 text-center font-mono text-sm font-black tracking-[0.08em] text-[#132230] outline-none focus:border-[#f4b603]"
          />
          <button
            type="submit"
            disabled={verifying || !code.trim()}
            className="w-full rounded-2xl bg-[#f4b603] px-4 py-3 text-sm font-black text-[#132230] transition hover:bg-[#ffd34d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? 'جارٍ التحقق…' : 'تحقق وتفعيل'}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleExit}
            className="gold-license-secondary inline-flex items-center gap-2 rounded-xl border border-[#d9c58f] bg-[#fffaf0] px-3 py-2 text-xs font-black text-[#315a7c] transition hover:bg-[#f2e2b2]"
          >
            <XCircle className="h-4 w-4" />
            إغلاق التطبيق
          </button>
        </div>

        <p className="mt-4 text-[10px] font-bold leading-6 text-[#6d7d82]">
          التفعيل مرتبط بالكود (مدى الحياة أو حسب المدة) في لوحة التحكم. إذا تم إلغاء الكود أو انتهت صلاحيته، يتوقف Gold+ عن العمل.
        </p>
      </div>
    </div>
  );
};