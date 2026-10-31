import React, { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { KeyRound, ShieldCheck, XCircle } from 'lucide-react';
import {
  clearStoredGoldLicenseCode,
  getStoredGoldLicenseCode,
  storeGoldLicenseCode,
  verifyGoldLicense,
} from '../../services/goldLicense';

interface GoldLicenseGateProps {
  children: React.ReactNode;
}

export const GoldLicenseGate: React.FC<GoldLicenseGateProps> = ({ children }) => {
  const [code, setCode] = useState(getStoredGoldLicenseCode());
  const [status, setStatus] = useState<'checking' | 'licensed' | 'locked'>('checking');
  const [message, setMessage] = useState('جارٍ التحقق من كود Gold...');
  const [verifying, setVerifying] = useState(false);

  const verify = async (candidate: string): Promise<boolean> => {
    setVerifying(true);
    const result = await verifyGoldLicense(candidate);
    setVerifying(false);

    if (result.networkError) {
      setMessage('تعذر الاتصال بلوحة التحكم. سيتم إعادة المحاولة لاحقًا، والتطبيق يبقى مفعّلًا.');
      const stored = getStoredGoldLicenseCode();
      if (stored && stored === candidate.trim().toUpperCase()) {
        setStatus('licensed');
        return true;
      }
      return status === 'licensed';
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

  useEffect(() => {
    const stored = getStoredGoldLicenseCode();
    if (!stored) {
      setStatus('locked');
      setMessage('أدخل كود Gold مفعّلًا من لوحة التحكم لتشغيل Gold+.');
      return;
    }
    void verify(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== 'licensed') return;

    const recheck = () => {
      const stored = getStoredGoldLicenseCode();
      if (!stored) {
        setStatus('locked');
        setMessage('أدخل كود Gold مفعّلًا من لوحة التحكم لتشغيل Gold+.');
        return;
      }
      void verify(stored);
    };

    const interval = window.setInterval(recheck, 12 * 60 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') recheck();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf0] px-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f4b603] text-[#132230] shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-xl font-black text-[#132230]">Lin Go Gold</h1>
          <p className="mt-2 text-sm font-bold text-[#315a7c]">{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'licensed') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffaf0] px-6">
      <div className="w-full max-w-md rounded-[2rem] border-2 border-[#f4b603] bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4b603] text-[#132230]">
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
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9c58f] bg-[#fffaf0] px-3 py-2 text-xs font-black text-[#315a7c] transition hover:bg-[#f2e2b2]"
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