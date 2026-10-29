import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  GraduationCap,
  Languages,
  Lightbulb,
  Loader2,
  Mic,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { Lesson, Level, UserProfile } from '../../types';
import {
  AiTutorError,
  clearTutorHistory,
  createTutorMessage,
  createTutorReplyMessage,
  getTutorContext,
  getTutorStatus,
  loadTutorHistory,
  normalizeTutorLevel,
  saveTutorHistory,
  sendTutorMessage,
  type TutorMessage,
  type TutorMode,
} from '../../services/aiTutorService';
import {
  SpeechRecognitionError,
  isSpeechRecognitionSupported,
  startSpeechRecognition,
  type SpeechRecognitionSession,
} from '../../services/speechRecognition';
import { speakTutorText, stopTutorSpeech } from '../../services/tutorSpeech';

interface ChatTabProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onBack: () => void;
}

interface SuggestedPrompt {
  labelAr: string;
  text: string;
}

const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const suggestedPromptsFor = (language: 'en' | 'fr'): SuggestedPrompt[] =>
  language === 'fr'
    ? [
        {
          labelAr: 'عرّفني بنفسك',
          text: 'Bonjour ! Présentez-vous et posez-moi une question simple.',
        },
        {
          labelAr: 'تحدث عن يومي',
          text: 'Parlons de ma journée. Demandez-moi ce que j’ai fait aujourd’hui.',
        },
        {
          labelAr: 'صحح جملتي',
          text: 'Corrige cette phrase : Je aller au marché hier et acheter deux pomme.',
        },
        {
          labelAr: 'كلمات عن السفر',
          text: 'Apprends-moi trois mots français utiles pour voyager.',
        },
      ]
    : [
        {
          labelAr: 'عرّفني بنفسك',
          text: 'Hi! Please introduce yourself and ask me a simple question.',
        },
        {
          labelAr: 'تحدث عن يومي',
          text: 'Let’s talk about my day. Ask me what I did today.',
        },
        {
          labelAr: 'صحح جملتي',
          text: 'Please correct this sentence: I go to the market yesterday and buy two apple.',
        },
        {
          labelAr: 'كلمات عن السفر',
          text: 'Teach me three useful English words for travel.',
        },
      ];

const formatScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 55) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
};

const TypingDots: React.FC = () => (
  <span className="inline-flex items-center gap-1" aria-label="المعلم يكتب">
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2f8f7d] [animation-delay:-0.25s]" />
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2f8f7d] [animation-delay:-0.12s]" />
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2f8f7d]" />
  </span>
);

export const ChatTab: React.FC<ChatTabProps> = ({ lessons, userProfile, onBack }) => {
  const language = userProfile.targetLanguage ?? 'en';
  const targetNameAr = language === 'fr' ? 'الفرنسية' : 'الإنجليزية';
  const suggestedPrompts = useMemo(() => suggestedPromptsFor(language), [language]);
  const initialContext = useMemo(
    () => getTutorContext(lessons, userProfile),
    // The context only needs to be recalculated when the learner's path changes.
    [lessons, userProfile],
  );
  const [level, setLevel] = useState<Level>(initialContext.level);
  const [stage] = useState<number>(initialContext.stage);
  const [messages, setMessages] = useState<TutorMessage[]>(() => loadTutorHistory(language));
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [showArabic, setShowArabic] = useState(true);
  const [practiceTarget, setPracticeTarget] = useState<string | null>(null);
  const [serviceState, setServiceState] = useState<'checking' | 'ready' | 'unconfigured'>('checking');
  const endRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionSession | null>(null);
  const lastRequestRef = useRef<{
    messages: TutorMessage[];
    mode: TutorMode;
    target?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    void getTutorStatus().then((status) => {
      if (mounted) setServiceState(status.configured ? 'ready' : 'unconfigured');
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    saveTutorHistory(messages, language);
  }, [messages, language]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isSending, error, practiceTarget]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    stopTutorSpeech();
  }, []);

  const speak = useCallback(
    (key: string, text: string) => {
      if (isListening) {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
      }
      if (speakingKey === key) {
        stopTutorSpeech();
        setSpeakingKey(null);
        return;
      }
      stopTutorSpeech();
      setSpeakingKey(key);
      void speakTutorText({
        text,
        language,
        rate: Math.max(0.7, Math.min(0.9, userProfile.settings.playbackSpeed || 0.85)),
        onEnd: () => setSpeakingKey((current) => (current === key ? null : current)),
        onError: () => {
          setSpeakingKey((current) => (current === key ? null : current));
          lastRequestRef.current = null;
          setError(language === 'fr'
            ? 'تعذر تشغيل الصوت الفرنسي. تأكد من اتصال الإنترنت أو ثبّت حزمة الصوت الفرنسي من إعدادات الهاتف.'
            : 'تعذر تشغيل الصوت على هذا الجهاز. تأكد من تثبيت الصوت الإنجليزي في إعدادات الهاتف.');
        },
      });
    },
    [isListening, language, speakingKey, userProfile.settings.playbackSpeed],
  );

  const requestTutorReply = useCallback(
    async (conversation: TutorMessage[], mode: TutorMode, target?: string) => {
      lastRequestRef.current = { messages: conversation, mode, target };
      setIsSending(true);
      setError(null);
      try {
        const reply = await sendTutorMessage({
          messages: conversation,
          level,
          stage,
          mode,
          target,
          language,
        });
        const assistantMessage = createTutorReplyMessage(reply);
        setMessages((current) => [...current, assistantMessage]);
        lastRequestRef.current = null;
      } catch (requestError) {
        if (requestError instanceof AiTutorError) {
          setError(requestError.message);
        } else {
          setError('تعذر الوصول إلى المعلم الذكي الآن. حاول مرة أخرى.');
        }
      } finally {
        setIsSending(false);
      }
    },
    [language, level, stage],
  );

  const submitText = useCallback(
    (rawText: string, mode: TutorMode = 'conversation', target?: string) => {
      const text = rawText.trim();
      if (!text || isSending) return;
      const userMessage = createTutorMessage('user', text);
      const conversation = [...messages, userMessage];
      setMessages(conversation);
      setInput('');
      setPracticeTarget(null);
      void requestTutorReply(conversation, mode, target);
    },
    [isSending, messages, requestTutorReply],
  );

  const startListening = useCallback(
    async (mode: TutorMode, target?: string) => {
      if (isListening) {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
        return;
      }
      if (!isSpeechRecognitionSupported()) {
        setError('التعرف على الصوت غير متاح على هذا الجهاز. يمكنك كتابة رسالتك بدلًا من ذلك.');
        return;
      }

      setError(null);
      stopTutorSpeech();
      setSpeakingKey(null);
      setIsListening(true);
      const session = startSpeechRecognition(language === 'fr' ? 'fr-FR' : 'en-US');
      recognitionRef.current = session;
      try {
        const transcript = await session.result;
        if (mode === 'pronunciation' && target) {
          submitText(transcript, 'pronunciation', target);
        } else {
          setInput((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript));
        }
      } catch (recognitionError) {
        if (recognitionError instanceof SpeechRecognitionError && recognitionError.code === 'aborted') {
          return;
        }
        setError(
          recognitionError instanceof Error
            ? recognitionError.message
            : 'تعذر التعرف على الصوت. حاول مرة أخرى.',
        );
      } finally {
        if (recognitionRef.current === session) recognitionRef.current = null;
        setIsListening(false);
      }
    },
    [isListening, language, submitText],
  );

  const handleRetry = () => {
    const lastRequest = lastRequestRef.current;
    if (!lastRequest || isSending) return;
    void requestTutorReply(lastRequest.messages, lastRequest.mode, lastRequest.target);
  };

  const handleClear = () => {
    if (messages.length === 0) return;
    if (!window.confirm('هل تريد مسح المحادثة والبدء من جديد؟')) return;
    stopTutorSpeech();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    clearTutorHistory(language);
    setMessages([]);
    setInput('');
    setError(null);
    setPracticeTarget(null);
    lastRequestRef.current = null;
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitText(input);
    }
  };

  return (
    <section className="ai-tutor flex h-full min-h-0 w-full flex-col" dir="rtl">
      <header className="ai-tutor-header shrink-0">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 px-3 py-3 sm:px-5">
          <button
            type="button"
            onClick={onBack}
            className="ai-tutor-icon-button shrink-0"
            aria-label="العودة إلى التطبيق"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="ai-tutor-avatar shrink-0">
              <img src="/images/game-emojis/1f43c.svg" alt="" aria-hidden="true" />
              <span className="ai-tutor-online" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-[15px] font-black text-[#173b32]">المعلم الذكي</h1>
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#d39b35]" aria-hidden="true" />
              </div>
              <p className="truncate text-[10px] font-semibold text-[#72847a]">
                محادثة {targetNameAr} · تصحيح وترجمة ونطق
              </p>
            </div>
          </div>

          <label className="ai-tutor-level-select shrink-0">
            <span className="sr-only">مستوى المحادثة</span>
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            <select
              value={level}
              onChange={(event) => setLevel(normalizeTutorLevel(event.target.value))}
              aria-label="مستوى المحادثة"
            >
              {LEVELS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </label>

          <button
            type="button"
            onClick={() => setShowArabic((current) => !current)}
            className={`ai-tutor-icon-button shrink-0 ${showArabic ? 'is-active' : ''}`}
            aria-label={showArabic ? 'إخفاء الترجمة العربية' : 'إظهار الترجمة العربية'}
            aria-pressed={showArabic}
            title={showArabic ? 'إخفاء الترجمة' : 'إظهار الترجمة'}
          >
            <Languages className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="ai-tutor-icon-button shrink-0"
            aria-label="مسح المحادثة"
            title="مسح المحادثة"
            disabled={messages.length === 0 || isSending}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="ai-tutor-level-line mx-auto flex w-full max-w-4xl items-center gap-2 px-4 pb-2 text-[10px] font-bold text-[#6d8277] sm:px-6">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#59b59d]" />
            المستوى {level}
          </span>
          <span className="text-[#b1c0b6]">•</span>
          <span>المرحلة {stage} من 4</span>
          {serviceState === 'unconfigured' && (
            <>
              <span className="text-[#b1c0b6]">•</span>
              <span className="text-amber-700">الخدمة تحتاج إعدادًا</span>
            </>
          )}
        </div>
      </header>

      <div className="ai-tutor-scroll flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-4 sm:px-5">
          {messages.length === 0 && (
            <div className="ai-tutor-welcome">
              <div className="ai-tutor-welcome-orb">
                <img src="/images/game-emojis/1f43c.svg" alt="" aria-hidden="true" />
                <span className="ai-tutor-welcome-sparkle" aria-hidden="true">✦</span>
              </div>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#2b8b78]">
                Lin Go AI Tutor
              </p>
              <h2 className="mt-1 text-xl font-black text-[#173b32]">هيا نتحدث {targetNameAr}</h2>
              <p className="mx-auto mt-2 max-w-[340px] text-[12px] font-semibold leading-6 text-[#61766b]">
                اكتب أو تحدث {language === 'fr' ? 'بالفرنسية' : 'بالإنجليزية'}. سأرد عليك حسب مستواك، أصحح الأخطاء بلطف،
                وأعرض الترجمة والكلمات الجديدة، ونساعدك على النطق.
              </p>
              {serviceState === 'unconfigured' && (
                <div className="ai-tutor-setup-note">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>
                    المعلم غير متاح الآن لأن خدمة الذكاء الاصطناعي تحتاج إعدادًا. يمكنك
                    استعراض الواجهة، وستعمل المحادثة بعد إعداد المفتاح على الخادم.
                  </p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    type="button"
                    className="ai-tutor-suggestion"
                    onClick={() => submitText(prompt.text)}
                    disabled={isSending}
                  >
                    <span>{prompt.labelAr}</span>
                    <span className="text-[#9aab9f]" aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isAssistant = message.role === 'assistant';
            const messageSpeechKey = `message-${message.id}`;
            return (
              <div
                key={message.id}
                className={`flex w-full items-start gap-2 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                dir="ltr"
              >
                {isAssistant && (
                  <div className="ai-tutor-mini-avatar shrink-0" aria-hidden="true">
                    <img src="/images/game-emojis/1f43c.svg" alt="" />
                  </div>
                )}

                <div className={`min-w-0 ${isAssistant ? 'max-w-[88%] sm:max-w-[78%]' : 'max-w-[84%] sm:max-w-[72%]'}`}>
                  <div className={isAssistant ? 'ai-tutor-bubble ai-tutor-bubble-assistant' : 'ai-tutor-bubble ai-tutor-bubble-user'}>
                    <div className="flex items-start gap-2">
                      <p
                        className="min-w-0 flex-1 whitespace-pre-wrap text-[13px] font-semibold leading-6 sm:text-sm"
                        dir={isAssistant ? 'ltr' : 'auto'}
                      >
                        {message.text}
                      </p>
                      {isAssistant && (
                        <button
                          type="button"
                          onClick={() => speak(messageSpeechKey, message.text)}
                          className={`ai-tutor-speak-button shrink-0 ${speakingKey === messageSpeechKey ? 'is-speaking' : ''}`}
                          aria-label={speakingKey === messageSpeechKey ? 'إيقاف النطق' : 'سماع الرد'}
                          title={speakingKey === messageSpeechKey ? 'إيقاف النطق' : 'سماع الرد'}
                        >
                          {speakingKey === messageSpeechKey ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {isAssistant && showArabic && message.translationAr && (
                      <div className="ai-tutor-translation" dir="rtl">
                        <span className="ai-tutor-translation-label">
                          <Languages className="h-3 w-3" aria-hidden="true" />
                          الترجمة
                        </span>
                        <p>{message.translationAr}</p>
                      </div>
                    )}

                    {isAssistant && message.corrections && message.corrections.length > 0 && (
                      <div className="ai-tutor-corrections" dir="rtl">
                        <div className="ai-tutor-section-title">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          تصحيح لطيف
                        </div>
                        <div className="space-y-2">
                          {message.corrections.map((correction, index) => (
                            <div key={`${message.id}-correction-${index}`} className="ai-tutor-correction">
                              <p className="text-[11px] font-bold text-rose-700 line-through decoration-rose-300" dir="ltr">
                                {correction.wrong}
                              </p>
                              <p className="text-[11px] font-black text-emerald-800" dir="ltr">
                                {correction.correct}
                              </p>
                              {correction.explanationAr && (
                                <p className="mt-1 text-[10px] font-semibold leading-5 text-[#6b7e72]">
                                  {correction.explanationAr}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isAssistant && message.vocabulary && message.vocabulary.length > 0 && (
                      <div className="ai-tutor-vocabulary" dir="rtl">
                        <div className="ai-tutor-section-title">
                          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                          كلمات مفيدة
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {message.vocabulary.map((vocabulary, index) => {
                            const vocabularyKey = `vocab-${message.id}-${index}`;
                            return (
                              <div key={vocabularyKey} className="ai-tutor-word">
                                <div className="flex min-w-0 items-center gap-1.5" dir="ltr">
                                  <span className="truncate text-[12px] font-black text-[#184c41]">
                                    {vocabulary.word}
                                  </span>
                                  {vocabulary.phonetic && (
                                    <span className="truncate text-[9px] font-semibold text-[#8a9b90]">
                                      {vocabulary.phonetic}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => speak(vocabularyKey, vocabulary.word)}
                                    className={`ai-tutor-word-speak shrink-0 ${speakingKey === vocabularyKey ? 'is-speaking' : ''}`}
                                    aria-label={`سماع نطق ${vocabulary.word}`}
                                  >
                                    {speakingKey === vocabularyKey ? (
                                      <VolumeX className="h-3 w-3" />
                                    ) : (
                                      <Volume2 className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                                <p className="mt-1 text-[10px] font-semibold leading-5 text-[#657a6d]">
                                  {vocabulary.meaningAr}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isAssistant && message.pronunciation && (
                      <div className="ai-tutor-pronunciation" dir="rtl">
                        <div className="flex items-center justify-between gap-2">
                          <div className="ai-tutor-section-title mb-0">
                            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                            تقييم النطق
                          </div>
                          <span className={`ai-tutor-score ${formatScoreColor(message.pronunciation.score)}`}>
                            {message.pronunciation.score}/100
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] font-bold leading-5 text-[#46685b]">
                          {message.pronunciation.feedbackAr}
                        </p>
                        {message.pronunciation.tipAr && (
                          <p className="mt-1.5 flex items-start gap-1.5 text-[10px] font-semibold leading-5 text-[#7a6b3f]">
                            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {message.pronunciation.tipAr}
                          </p>
                        )}
                        <p className="mt-1.5 text-[9px] font-medium text-[#91a398]">
                          تقييم تقريبي وفق ما فهمه الميكروفون من نطقك.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const target = message.pronunciation?.target || message.text;
                            setPracticeTarget(target);
                            void startListening('pronunciation', target);
                          }}
                          className="ai-tutor-practice-button mt-2"
                        >
                          <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                          جرّب مرة أخرى
                        </button>
                      </div>
                    )}

                    {isAssistant && !message.pronunciation && message.text && (
                      <div className="mt-2 flex flex-wrap items-center gap-2" dir="rtl">
                        <button
                          type="button"
                          onClick={() => {
                            setPracticeTarget(message.text);
                            void startListening('pronunciation', message.text);
                          }}
                          className="ai-tutor-practice-button"
                        >
                          <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                          تدرّب على النطق
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex w-full items-start gap-2" dir="ltr">
              <div className="ai-tutor-mini-avatar shrink-0" aria-hidden="true">
                <img src="/images/game-emojis/1f43c.svg" alt="" />
              </div>
              <div className="ai-tutor-bubble ai-tutor-bubble-assistant flex items-center gap-2 px-4 py-3">
                <TypingDots />
                <span className="text-[11px] font-semibold text-[#7b9185]">أفكر معك…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="ai-tutor-error" dir="rtl" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold leading-5">{error}</p>
                {lastRequestRef.current && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={isSending}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[10px] font-black text-rose-700 hover:bg-white"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    إعادة المحاولة
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 rounded-md p-1 text-rose-500 hover:bg-white/60"
                aria-label="إغلاق الخطأ"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="ai-tutor-composer shrink-0">
        {practiceTarget && (
          <div className="ai-tutor-practice-card" dir="rtl">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <Mic className="mt-0.5 h-4 w-4 shrink-0 text-[#2f8f7d]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wide text-[#2f8f7d]">
                  تدريب النطق
                </p>
                <p className="truncate text-[11px] font-bold text-[#294d42]" dir="ltr">
                  {practiceTarget}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => speak('practice-target', practiceTarget)}
              className="ai-tutor-speak-button shrink-0"
              aria-label="سماع الجملة"
              title="سماع الجملة"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPracticeTarget(null)}
              className="shrink-0 rounded-md p-1 text-[#91a398] hover:bg-[#edf5ee]"
              aria-label="إلغاء تدريب النطق"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mx-auto w-full max-w-4xl px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 sm:px-5">
          <div className={`ai-tutor-input-shell ${isListening ? 'is-listening' : ''}`}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 1500))}
              onKeyDown={handleInputKeyDown}
              placeholder={
                isListening
                  ? `أتحدث الآن… تحدث ${language === 'fr' ? 'بالفرنسية' : 'بالإنجليزية'}`
                  : practiceTarget
                    ? 'اكتب أو استخدم الميكروفون لتكرار الجملة…'
                    : `اكتب رسالتك ${language === 'fr' ? 'بالفرنسية' : 'بالإنجليزية'}…`
              }
              rows={1}
              dir="auto"
              className="ai-tutor-input"
              disabled={isSending}
              aria-label="رسالتك إلى المعلم الذكي"
            />
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => void startListening('conversation')}
                className={`ai-tutor-mic-button ${isListening ? 'is-listening' : ''}`}
                aria-label={isListening ? 'إيقاف الاستماع' : `التحدث ${language === 'fr' ? 'بالفرنسية' : 'بالإنجليزية'}`}
                title={isListening ? 'إيقاف الاستماع' : `التحدث ${language === 'fr' ? 'بالفرنسية' : 'بالإنجليزية'}`}
              >
                {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (practiceTarget) {
                    void startListening('pronunciation', practiceTarget);
                  } else {
                    submitText(input);
                  }
                }}
                disabled={isSending || (!input.trim() && !practiceTarget)}
                className="ai-tutor-send-button"
                aria-label={practiceTarget ? 'تسجيل النطق' : 'إرسال الرسالة'}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : practiceTarget ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4 -scale-x-100" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[9px] font-semibold text-[#90a196]" dir="rtl">
            <span>المعلم الذكي قد يخطئ؛ راجع التصحيحات دائمًا.</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-[#7ab7a5]" />
              محادثة آمنة للتعلم
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
