import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, UserPlus, Users, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getStoredGoldLicenseCode } from '../../services/goldLicense';

interface FriendRecord {
  code: string;
  name: string;
  status: 'accepted';
}

interface FriendRequest {
  id: string;
  fromCode: string;
  fromName: string;
  createdAtUtc: string;
}

interface FriendMessage {
  id: string;
  senderCode: string;
  senderName: string;
  message: string;
  at: string;
}

const CHAT_BASE = 'https://englishtok-eight.vercel.app/api/admin';

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
};

interface FriendsChatProps {
  onClose?: () => void;
  userName?: string;
}

export const FriendsChat: React.FC<FriendsChatProps> = ({ onClose, userName = '' }) => {
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activeFriend, setActiveFriend] = useState<FriendRecord | null>(null);
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [addCode, setAddCode] = useState('');
  const [adding, setAdding] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const identity = useCallback(() => {
    const code = getStoredGoldLicenseCode() || 'anon';
    const device = Capacitor.getPlatform();
    return { code, device };
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const { code, device } = identity();
      const url = `${CHAT_BASE}?action=friends_list&code=${encodeURIComponent(code)}&device=${encodeURIComponent(device)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      if (Array.isArray(payload.friends)) setFriends(payload.friends);
      if (Array.isArray(payload.requests)) setRequests(payload.requests);
    } catch {
      /* ignore */
    }
  }, [identity]);

  const loadMessages = useCallback(async (friendCode: string) => {
    try {
      const { code } = identity();
      const url = `${CHAT_BASE}?action=friends_chat&code=${encodeURIComponent(code)}&friendCode=${encodeURIComponent(friendCode)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      if (Array.isArray(payload.messages)) setMessages(payload.messages);
    } catch {
      /* ignore */
    }
  }, [identity]);

  useEffect(() => {
    void loadFriends();
    const interval = window.setInterval(() => void loadFriends(), 15000);
    return () => window.clearInterval(interval);
  }, [loadFriends]);

  useEffect(() => {
    if (!activeFriend) return;
    void loadMessages(activeFriend.code);
    const interval = window.setInterval(() => void loadMessages(activeFriend.code), 8000);
    return () => window.clearInterval(interval);
  }, [activeFriend, loadMessages]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const handleAddFriend = async () => {
    const target = addCode.trim();
    if (!target || adding) return;
    setAdding(true);
    setStatus('');
    try {
      const { code, device } = identity();
      const response = await fetch(`${CHAT_BASE}?action=friends_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code, device, userName, targetCode: target }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الطلب.');
      setAddCode('');
      setStatus('تم إرسال طلب الصداقة.');
      await loadFriends();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'تعذر إرسال الطلب.');
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { code, device } = identity();
      const response = await fetch(`${CHAT_BASE}?action=friends_accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code, device, requestId }),
      });
      if (!response.ok) throw new Error('تعذر قبول الطلب.');
      await loadFriends();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'تعذر قبول الطلب.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { code, device } = identity();
      const response = await fetch(`${CHAT_BASE}?action=friends_reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code, device, requestId }),
      });
      if (!response.ok) throw new Error('تعذر رفض الطلب.');
      await loadFriends();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'تعذر رفض الطلب.');
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !activeFriend) return;
    setSending(true);
    setStatus('');
    try {
      const { code, device } = identity();
      const response = await fetch(`${CHAT_BASE}?action=friends_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code, device, userName, friendCode: activeFriend.code, message: text }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الرسالة.');
      setInput('');
      await loadMessages(activeFriend.code);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'تعذر إرسال الرسالة.');
    } finally {
      setSending(false);
    }
  };

  const { code: myCode } = identity();

  return (
    <div className="friends-chat-modal" role="dialog" aria-modal="true" aria-labelledby="friends-chat-title">
      <div className="friends-chat-panel">
        <header className="friends-chat-header">
          <div className="friends-chat-title">
            <Users className="h-5 w-5" aria-hidden="true" />
            <h2 id="friends-chat-title">أصدقاء التعلّم</h2>
          </div>
          {onClose && (
            <button type="button" className="friends-chat-close" onClick={onClose} aria-label="إغلاق">
              <X className="h-4 w-4" />
            </button>
          )}
        </header>

        <div className="friends-chat-body">
          {!activeFriend ? (
            <>
              <div className="friends-add-row">
                <input
                  type="text"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value)}
                  placeholder="أدخل كود صديقك (Gold code)"
                  className="friends-add-input"
                  dir="ltr"
                />
                <button
                  type="button"
                  className="friends-add-btn"
                  onClick={handleAddFriend}
                  disabled={adding || !addCode.trim()}
                >
                  <UserPlus className="h-4 w-4" />
                  {adding ? '…' : 'إضافة'}
                </button>
              </div>
              {status && <p className="friends-status">{status}</p>}

              {requests.length > 0 && (
                <section className="friends-section">
                  <h3>طلبات صداقة ({requests.length})</h3>
                  <ul className="friends-list">
                    {requests.map((req) => (
                      <li key={req.id} className="friends-request-item">
                        <div>
                          <strong>{req.fromName || req.fromCode}</strong>
                          <small>{req.fromCode}</small>
                        </div>
                        <div className="friends-request-actions">
                          <button type="button" onClick={() => handleAccept(req.id)} className="friends-accept-btn">قبول</button>
                          <button type="button" onClick={() => handleReject(req.id)} className="friends-reject-btn">رفض</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="friends-section">
                <h3>أصدقائي ({friends.length})</h3>
                {friends.length === 0 ? (
                  <p className="friends-empty">لا أصدقاء بعد. أضف صديقاً بـ كوده للبدء.</p>
                ) : (
                  <ul className="friends-list">
                    {friends.map((f) => (
                      <li key={f.code}>
                        <button
                          type="button"
                          className="friends-item"
                          onClick={() => { setActiveFriend(f); setMessages([]); }}
                        >
                          <span className="friends-avatar">{(f.name || f.code).charAt(0).toUpperCase()}</span>
                          <div>
                            <strong>{f.name || f.code}</strong>
                            <small>{f.code}</small>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <p className="friends-my-code">كودك: <code dir="ltr">{myCode}</code></p>
            </>
          ) : (
            <>
              <button type="button" className="friends-back-btn" onClick={() => setActiveFriend(null)}>
                ← رجوع
              </button>
              <div className="friends-chat-thread" ref={threadRef}>
                {messages.length === 0 ? (
                  <p className="friends-empty">ابدأ المحادثة بالإنجليزية 🇬🇧</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderCode === myCode;
                    return (
                      <div key={m.id} className={`friends-bubble ${mine ? 'is-mine' : 'is-theirs'}`}>
                        <span className="friends-bubble-author">{mine ? 'أنت' : m.senderName}</span>
                        <p>{m.message}</p>
                        <time>{formatTime(m.at)}</time>
                      </div>
                    );
                  })
                )}
              </div>
              <form className="friends-chat-input-row" onSubmit={(e) => { e.preventDefault(); void handleSend(); }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب بالإنجليزية…"
                  className="friends-chat-input"
                  dir="ltr"
                />
                <button type="submit" className="friends-chat-send" disabled={sending || !input.trim()}>
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {status && <p className="friends-status">{status}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
