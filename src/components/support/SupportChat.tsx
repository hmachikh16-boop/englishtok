import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getStoredGoldLicenseCode } from '../../services/goldLicense';

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  message: string;
  at: string;
}

interface SupportChatProps {
  onClose?: () => void;
  compact?: boolean;
  userName?: string;
}

const CHAT_BASE = 'https://englishtok-eight.vercel.app/api/admin';

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
};

export const SupportChat: React.FC<SupportChatProps> = ({ onClose, compact = false, userName = '' }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatStatus, setChatStatus] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const threadRef = useRef<HTMLDivElement | null>(null);

  const identity = () => {
    const code = getStoredGoldLicenseCode();
    const device = Capacitor.getPlatform();
    return { code, device };
  };

  const loadChatMessages = async () => {
    try {
      const { code, device } = identity();
      const url = `${CHAT_BASE}?action=chat&code=${encodeURIComponent(code)}&device=${encodeURIComponent(device)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      if (Array.isArray(payload.messages)) {
        setChatMessages(payload.messages);
      }
    } catch {
      /* ignore network hiccups; next poll retries */
    }
  };

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    setChatSending(true);
    setChatStatus('');
    try {
      const { code, device } = identity();
      const response = await fetch(`${CHAT_BASE}?action=chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: text,
          userEmail: supportEmail.trim(),
          code,
          device,
          userName: userName.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الرسالة.');
      setChatInput('');
      await loadChatMessages();
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : 'تعذر إرسال الرسالة.');
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    void loadChatMessages();
    const interval = window.setInterval(() => void loadChatMessages(), 20000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl border border-[#d8c49a] bg-[#fbf0d7] shadow-2xl ${compact ? 'h-full' : 'h-[76vh]'}`}
      style={{ boxShadow: '0 24px 60px rgba(74,51,25,0.35), 0 2px 0 rgba(255,255,255,0.6) inset' }}
      dir="rtl"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b border-[#d8c49a] px-4 py-3"
        style={{ background: 'linear-gradient(150deg, #f4e8cc 0%, #e8d9b0 100%)' }}
      >
        <div
          className="grid h-10 w-10 flex-none place-items-center rounded-full text-base font-black text-[#fbf0d7]"
          style={{
            background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.35), transparent 46%), linear-gradient(150deg, #a56c18, #7d4c0d)',
            boxShadow: '0 2px 6px rgba(74,51,25,0.35)',
          }}
        >
          G
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-[#2c2114]">دردشة مع الدعم</h3>
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#5b4730]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#8d2f24]" />
            نرد عليك خلال 24 ساعة
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#d8c49a] bg-[#fbf0d7] text-[#5b4730] transition hover:bg-[#f4e8cc] active:scale-95"
            aria-label="إغلاق"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={threadRef} className="flex-1 overflow-y-auto px-3 py-3" style={{ background: 'linear-gradient(180deg, #fbf0d7, #f4e8cc)' }}>
        {chatMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 grid h-16 w-16 place-items-center rounded-full border border-[#d8c49a] bg-[#f4e8cc]">
              <MessageCircle className="h-8 w-8 text-[#a56c18]" />
            </div>
            <p className="text-sm font-black text-[#2c2114]">مرحبًا بك في الدعم</p>
            <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-[#5b4730]">
              اكتب رسالتك وسنرد عليك هنا مباشرة. يمكنك السؤال عن التفعيل، الصوت، أو التحديث.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {chatMessages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      isUser
                        ? 'rounded-tr-sm text-[#fbf0d7]'
                        : 'rounded-tl-sm border border-[#d8c49a] text-[#2c2114]'
                    }`}
                    style={
                      isUser
                        ? { background: 'linear-gradient(150deg, #8d2f24, #6f2118)', boxShadow: '0 2px 6px rgba(74,51,25,0.25)' }
                        : { background: '#fbf0d7' }
                    }
                  >
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <span className={`mt-1 block text-[9px] ${isUser ? 'text-[#f4e8cc]/80' : 'text-[#8a7350]'}`}>
                      {isUser ? 'أنت' : 'الإدارة'} · {formatTime(m.at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="border-t border-[#d8c49a] bg-[#f4e8cc] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="بريدك (اختياري)"
            className="hidden w-28 rounded-xl border border-[#d8c49a] bg-[#fbf0d7] px-2 py-2 text-[10px] text-[#2c2114] outline-none placeholder:text-[#a08a63] focus:border-[#a56c18] sm:block"
          />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleChatSend();
              }
            }}
            placeholder="اكتب رسالتك…"
            className="min-w-0 flex-1 rounded-xl border border-[#d8c49a] bg-[#fbf0d7] px-3 py-2.5 text-xs text-[#2c2114] outline-none placeholder:text-[#a08a63] focus:border-[#a56c18]"
          />
          <button
            type="button"
            onClick={() => void handleChatSend()}
            disabled={chatSending || !chatInput.trim()}
            className="grid h-10 w-10 flex-none place-items-center rounded-xl text-[#fbf0d7] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: 'linear-gradient(150deg, #a56c18, #7d4c0d)', boxShadow: '0 3px 8px rgba(74,51,25,0.28)' }}
            aria-label="إرسال"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {chatStatus && (
          <p className="mt-2 text-[11px] font-bold text-[#8d2f24]">{chatStatus}</p>
        )}
      </div>
    </div>
  );
};
