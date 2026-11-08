import React, { useEffect, useState } from 'react';
import { MessageCircle, Send, AtSign } from 'lucide-react';
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
}

export const SupportChat: React.FC<SupportChatProps> = ({ onClose, compact = false }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatStatus, setChatStatus] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  const loadChatMessages = async () => {
    try {
      const code = getStoredGoldLicenseCode();
      const device = Capacitor.getPlatform();
      const url = `https://englishtok-eight.vercel.app/api/admin?action=chat&code=${encodeURIComponent(code)}&device=${encodeURIComponent(device)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      if (Array.isArray(payload.messages)) {
        setChatMessages(payload.messages);
      }
    } catch {
      /* ignore */
    }
  };

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatSending(true);
    setChatStatus('');
    try {
      const code = getStoredGoldLicenseCode();
      const device = Capacitor.getPlatform();
      const response = await fetch('https://englishtok-eight.vercel.app/api/admin?action=chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: text,
          email: supportEmail.trim(),
          code,
          device,
          userName: '',
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
    const interval = window.setInterval(() => void loadChatMessages(), 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[70vh]'} bg-slate-900 rounded-2xl border border-emerald-500/20 shadow-xl overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-900/60 to-slate-900 border-b border-emerald-500/20">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-lg">
          G
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-white">دردشة مع الدعم</h3>
          <p className="text-[10px] text-emerald-300/80">ردود خلال 24 ساعة · Polling كل 30s</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition"
            aria-label="إغلاق"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
        {chatMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 max-w-[220px]">
              لا توجد رسائل بعد. ابدأ المحادثة…
            </p>
          </div>
        )}
        {chatMessages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-500 text-slate-950 rounded-br-sm'
                  : 'bg-slate-800 text-white border border-slate-700 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.message}</p>
              <span className={`block mt-1 text-[9px] ${m.sender === 'user' ? 'text-slate-900/70' : 'text-slate-400'}`}>
                {m.sender === 'admin' ? 'الإدارة' : 'أنت'} · {new Date(m.at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="border-t border-emerald-500/20 bg-slate-900/80 p-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="بريدك (اختياري)"
            className="w-24 rounded-xl border border-emerald-500/30 bg-slate-950/60 px-2 py-2 text-[10px] text-white outline-none focus:border-emerald-400"
          />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleChatSend(); } }}
            placeholder="اكتب رسالتك…"
            className="flex-1 rounded-xl border border-emerald-500/30 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={() => void handleChatSend()}
            disabled={chatSending || !chatInput.trim()}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chatSending ? '…' : 'إرسال'}
          </button>
        </div>
        {chatStatus && (
          <p className="mt-2 text-xs font-bold text-emerald-300">{chatStatus}</p>
        )}
      </div>
    </div>
  );
};
