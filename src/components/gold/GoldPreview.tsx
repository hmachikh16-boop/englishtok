import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Download,
  Flame,
  Gem,
  Gift,
  GraduationCap,
  Headphones,
  Heart,
  Home,
  KeyRound,
  Layers3,
  Lightbulb,
  MessageCircle,
  Mic,
  Play,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import '../../gold-preview.css';
import { GoldErrorBoundary } from './GoldErrorBoundary';

const GoldAppPreview = React.lazy(() =>
  import('./GoldAppPreview').then((module) => ({ default: module.GoldAppPreview })),
);

const DEMO_CODE = 'LINGO-GOLD-DEMO-2026';
const GOLD_VERSION = '1.1.3';
const GOLD_APK_URL = `/lin-go-gold-${GOLD_VERSION}.apk`;
const GOLD_GITHUB_APK_URL =
  `https://github.com/hmachikh16-boop/englishtok/releases/download/gold-v${GOLD_VERSION}/lin-go-gold-${GOLD_VERSION}.apk`;

const stages = [
  {
    stage: 1,
    cefr: 'A1',
    title: 'المبتدئ',
    subtitle: 'أصوات، مفردات، وجمل أولى',
    mission: 'قدّم نفسك في 60 ثانية',
    tone: 'one',
  },
  {
    stage: 2,
    cefr: 'A2–B1',
    title: 'المتوسط / الإعدادي',
    subtitle: 'مهام يومية وقواعد في سياق',
    mission: 'أدر حوارًا في مطعم ومطار',
    tone: 'two',
  },
  {
    stage: 3,
    cefr: 'B2',
    title: 'الثانوي',
    subtitle: 'نقاش، آراء، ومصطلحات',
    mission: 'ناقش رأيًا في مقابلة عمل',
    tone: 'three',
  },
  {
    stage: 4,
    cefr: 'C1–C2',
    title: 'المتقدم',
    subtitle: 'انغماس، فروق دقيقة، وخطابة',
    mission: 'قدّم عرضًا احترافيًا 5 دقائق',
    tone: 'four',
  },
] as const;

const features = [
  {
    icon: Trophy,
    title: 'لوحة Gold+ الذكية',
    body: 'جواهر وتيجان وقلوب لا نهائية ودوري خاص، مع مهاراتك الأربع في لوحة واحدة أوضح.',
  },
  {
    icon: Sparkles,
    title: 'تحدٍّ بصري داخل الدرس',
    body: 'بعد الاستماع والنطق، اختر الصورة الصحيحة واربح +10 XP إضافية في كل درس Gold.',
  },
  {
    icon: Mic,
    title: 'نطق موسّع بجملتين',
    body: 'جملتا نطق لكل درس، مع زر استماع بطيء قبل التسجيل لتحسين الوضوح والثقة.',
  },
  {
    icon: Heart,
    title: 'قلوب لا نهائية و+25% XP',
    body: 'لا تتوقف بسبب القلوب في Gold. كل إنجاز يمنحك مكافأة أكبر بنسبة 25%، مع احتفال خاص.',
  },
  {
    icon: Target,
    title: '4 مشاريع Gold',
    body: 'مشروع تطبيقي في كل مرحلة: تقديم النفس، يوم في المدينة، نقاش مهني، وخطاب إقناع.',
  },
  {
    icon: Gift,
    title: 'صندوق يومي ومكافآت',
    body: 'أكمل هدفك اليومي لتفتح صندوق Gold وتحصل على XP إضافية، مع تذكير لطيف كل يوم.',
  },
  {
    icon: Lightbulb,
    title: 'نصائح ومهارات',
    body: 'نصائح عملية للاستماع والنطق والمراجعة، ولوحة مهارات تُظهر تقدمك في كل اتجاه.',
  },
  {
    icon: ShieldCheck,
    title: 'نفس التطبيق والنسخ',
    body: 'Gold مستقل بجانب Free، ويحافظ على تقدمك ونسخك الاحتياطية المشفّرة دون إعادة تعلّم.',
  },
] as const;

const skills = [
  { label: 'الاستماع', value: 78 },
  { label: 'التحدث', value: 64 },
  { label: 'المفردات', value: 86 },
  { label: 'القواعد', value: 71 },
] as const;

const reviewWords = ['negotiate', 'although', 'schedule', 'recommend', 'on time'];

const goldDashboardPoints = [
  { text: 'لوحة Gold+ تعرض الجواهر والتيجان والقلوب والدوري والمهارات', icon: Trophy },
  { text: 'تحدٍّ بصري ونطق بجملتين داخل نفس شاشة الدرس، بدون واجهة منفصلة', icon: Brain },
  { text: 'قلوب لا نهائية و+25% XP، مع صندوق يومي واحتفال إنجاز', icon: Gift },
  { text: 'تقدمك ونسخك الاحتياطية تبقى كما هي؛ Gold لا يغيّر هوية التطبيق', icon: ShieldCheck },
] as const;

const GoldPhone: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`gold-phone-wrap`}>
    <div className={`gold-phone ${compact ? 'is-compact' : ''}`}>
      <div className="gold-phone-status" dir="ltr">
        <span>9:41</span>
        <span>
          <span>▮▮▮</span>
          <span>◔</span>
          <span>▰</span>
        </span>
      </div>

      <div className="gold-phone-head" dir="ltr">
        <div className="gold-phone-brand">
          <span className="gold-brand-mark">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2.8} />
          </span>
          <span>
            Lin <b>Go</b>
          </span>
          <span className="gold-badge">
            <Crown className="h-2.5 w-2.5" strokeWidth={2.5} />
            GOLD
          </span>
        </div>
        <div className="gold-phone-avatar">أ</div>
      </div>

      <div className="gold-phone-scroll">
        <div className="gold-greeting">
          <div>
            <p>مساء الخير، أحمد</p>
            <h2>
              جلسة <span>Gold</span> اليوم
            </h2>
          </div>
          <span className="gold-greeting-chip">
            <Flame className="h-2.5 w-2.5" />
            12 يوم
          </span>
        </div>

        <div className="gold-plan-card">
          <div className="gold-plan-top">
            <span className="gold-plan-title">
              <Sparkles className="h-3.5 w-3.5" />
              خطة اليوم الذكية
            </span>
            <span className="gold-plan-time">18 MIN</span>
          </div>
          <div className="gold-plan-main">
            <div className="gold-plan-copy">
              <strong>مراجعة + مهمة تواصل</strong>
              <small>مبنية على آخر 3 جلسات · 3 مهام قصيرة</small>
            </div>
            <div className="gold-plan-ring" style={{ '--value': 72 } as React.CSSProperties}>
              <span>72%</span>
            </div>
          </div>
          <div className="gold-plan-tasks">
            <div className="gold-plan-task">
              <CheckCircle2 className="h-3 w-3" />
              مراجعة 8 كلمات ضعيفة
            </div>
            <div className="gold-plan-task">
              <Play className="h-3 w-3" />
              درس: التعامل مع الشكاوى
            </div>
            <div className="gold-plan-task">
              <Mic className="h-3 w-3" />
              تحدّي نطق 2 دقيقة
            </div>
          </div>
        </div>

        <div className="gold-section-head">
          <h3>مسارك الذهبي</h3>
          <span>المرحلة 2 من 4</span>
        </div>
        <div className="gold-stage-strip">
          {stages.map((stage, index) => {
            const progress = index === 0 ? '100%' : index === 1 ? '42%' : '0%';
            return (
              <div className={`gold-stage-row ${index === 1 ? 'is-current' : ''}`} key={stage.stage}>
                <span className="gold-stage-number">{index === 0 ? <Check className="h-3.5 w-3.5" /> : stage.stage}</span>
                <span className="gold-stage-copy">
                  <strong>
                    {stage.title} · {stage.cefr}
                  </strong>
                  <small>{stage.subtitle}</small>
                </span>
                <span className="gold-stage-progress">{progress}</span>
              </div>
            );
          })}
        </div>

        <div className="gold-section-head">
          <h3>مهاراتك</h3>
          <span>تحديث أسبوعي</span>
        </div>
        <div className="gold-skill-grid">
          {skills.map((skill) => (
            <div className="gold-skill" key={skill.label}>
              <div className="gold-skill-top">
                <span>{skill.label}</span>
                <b>{skill.value}%</b>
              </div>
              <div className="gold-skill-bar">
                <span style={{ width: `${skill.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="gold-section-head">
          <h3>مراجعة ذكية</h3>
          <span>8 كلمات مستحقة</span>
        </div>
        <div className="gold-review-card">
          <span className="gold-review-icon">
            <Brain className="h-4 w-4" />
          </span>
          <span className="gold-review-copy">
            <strong>تذكير قبل أن تنسى</strong>
            <small>اختارها Gold من أخطائك الأخيرة</small>
            <span className="gold-review-chips">
              {reviewWords.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </span>
          </span>
        </div>
      </div>

      <div className="gold-phone-nav">
        <span className="is-active">
          <Home />
          المسار
        </span>
        <span>
          <BookOpen />
          الكلمات
        </span>
        <span className="is-center">
          <span className="gold-nav-orb">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
        </span>
        <span>
          <BarChart3 />
          التقدم
        </span>
        <span>
          <Settings2 />
          الإعدادات
        </span>
      </div>
    </div>
  </div>
);

const CodePanel: React.FC<{
  activated: boolean;
  checking: boolean;
  code: string;
  error: string | null;
  onChange: (value: string) => void;
  onActivate: () => void;
  onPreview: () => void;
}> = ({ activated, checking, code, error, onChange, onActivate, onPreview }) => (
  <aside className="gold-activate-card" id="gold-activate">
    <span className="gold-eyebrow">
      <KeyRound className="h-3 w-3" />
      معاينة Gold+
    </span>
    <h3>لديك كود Gold؟</h3>
    <p>
      أدخل الكود الذي حصلت عليه من لوحة التحكم للتحقق منه. كود المعاينة التجريبي يفتح
      الواجهة التفاعلية فقط، بينما كود Gold المسجّل يتحقق من صلاحيته عبر الخادم.
    </p>
    <label className="gold-code-label" htmlFor="gold-code">
      كود Gold
    </label>
    <div className="gold-code-row">
      <input
        id="gold-code"
        className="gold-code-input"
        value={code}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        placeholder="LINGO-GOLD-XXXX-XXXX-XXXX"
        autoComplete="off"
        spellCheck={false}
      />
      <button type="button" className="gold-code-submit" onClick={onActivate} disabled={checking}>
        {checking ? 'جارٍ التحقق…' : 'تحقق'}
      </button>
    </div>
    <p className="gold-code-hint">كود المعاينة: {DEMO_CODE}</p>
    {error && <p className="gold-code-error">{error}</p>}
    {activated && (
      <p className="gold-code-success">
        <BadgeCheck className="mr-1 inline h-3 w-3" />
        تم التحقق — استكشف Gold+ 1.1 في المعاينة.
      </p>
    )}
    <a
      className="gold-preview-toggle"
      href={GOLD_APK_URL}
      download={`lin-go-gold-${GOLD_VERSION}.apk`}
      rel="noopener"
    >
      <Download className="h-3.5 w-3.5" />
      تحميل Gold+ {GOLD_VERSION} التجريبي
      <ChevronLeft className="h-3 w-3" />
    </a>
    <button type="button" className="gold-preview-toggle" onClick={onPreview}>
      <Smartphone className="h-3.5 w-3.5" />
      معاينة لوحة Gold+ داخل التطبيق
      <ChevronLeft className="h-3 w-3" />
    </button>
    <div className="gold-secure-note">
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>
        التفعيل الرسمي المرتبط بالجهاز ما زال قيد التجهيز. كود المعاينة لا يمنح ترخيصًا تجاريًا
        ولا يرتبط بحساب أو جهاز.
      </span>
    </div>
  </aside>
);

const getInitialView = (): 'landing' | 'dashboard' => {
  if (typeof window === 'undefined') return 'landing';
  return new URLSearchParams(window.location.search).get('app') === '1' ? 'dashboard' : 'landing';
};

export const GoldPreview: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const [checking, setChecking] = useState(false);
  const [view, setView] = useState<'landing' | 'dashboard'>(getInitialView);
  const dashboardTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('gold-preview-root');
    document.body.classList.add('gold-preview-body');
    return () => {
      document.documentElement.classList.remove('gold-preview-root');
      document.body.classList.remove('gold-preview-body');
    };
  }, []);

  const normalizedCode = useMemo(() => code.trim().toUpperCase(), [code]);

  const handleActivate = async () => {
    if (checking) return;
    if (normalizedCode === DEMO_CODE) {
      setError(null);
      setActivated(true);
      setView('dashboard');
      window.setTimeout(() => {
        dashboardTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }
    if (!normalizedCode) {
      setError('أدخل كود Gold أولًا.');
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin?action=check&code=${encodeURIComponent(normalizedCode)}`,
        { headers: { Accept: 'application/json' }, cache: 'no-store' },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        valid?: boolean;
        status?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || 'تعذر التحقق من الكود الآن.');
      }
      if (payload.valid) {
        setActivated(true);
        setView('dashboard');
        window.setTimeout(() => {
          dashboardTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
        return;
      }
      setError(
        payload.status === 'revoked'
          ? 'هذا الكود ملغى. تواصل مع الدعم أو استخدم كودًا آخر.'
          : payload.status === 'expired'
            ? 'هذا الكود منتهي الصلاحية. تواصل مع الدعم لتجديده.'
            : 'هذا الكود غير موجود. تحقق من كتابته أو تواصل مع الدعم.',
      );
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : 'تعذر التحقق من الكود الآن.');
    } finally {
      setChecking(false);
    }
  };

  const handlePreview = () => {
    setView('dashboard');
    window.setTimeout(() => {
      dashboardTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const scrollToActivate = () => {
    if (view !== 'landing') {
      setView('landing');
      window.setTimeout(() => {
        document.getElementById('gold-activate')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return;
    }
    document.getElementById('gold-activate')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="gold-preview-page" dir="rtl">
      <header className="gold-nav">
        <div className="gold-shell gold-nav-inner">
          <div className="gold-brand">
            <span className="gold-brand-mark">
              <BookOpen className="h-4 w-4" strokeWidth={2.8} />
            </span>
            <span>
              Lin <em>Go</em>
            </span>
            <span className="gold-badge">
              <Crown className="h-2.5 w-2.5" strokeWidth={2.5} />
              GOLD
            </span>
          </div>
          {view === 'landing' ? (
            <nav className="gold-nav-links" aria-label="أقسام المعاينة">
              <a href="#gold-method">المنهج</a>
              <a href="#gold-stages">المراحل</a>
              <a href="#gold-compare">Free مقابل Gold</a>
            </nav>
          ) : (
            <span className="gold-nav-preview-label">
              <Smartphone className="h-3.5 w-3.5" />
              معاينة داخل التطبيق
            </span>
          )}
          <button type="button" className="gold-nav-action" onClick={scrollToActivate}>
            <KeyRound className="h-3.5 w-3.5" />
            كود المعاينة
          </button>
        </div>
      </header>

      {view === 'landing' ? (
        <main>
          <section className="gold-shell gold-hero">
            <div>
              <span className="gold-eyebrow">
                <Crown className="h-3 w-3" />
                إصدار مميز من Lin Go
              </span>
              <h1>
                نفس واجهة Lin Go.
                <br />
                <span>وGold+ يرفع التجربة 70%.</span>
              </h1>
              <p className="gold-hero-copy">
                Gold+ 1.1 هو نفس تطبيق Lin Go ومساره ودروسه، مع طبقة ذهبية داخل الرحلة:
                تحدٍّ بصري، نطق بجملتين، قلوب لا نهائية، +25% XP، دوري ومهارات، صندوق يومي،
                وأربعة مشاريع تطبيقية — أكثر من 70% أنشطة إضافية.
              </p>
              <div className="gold-hero-actions">
                <a
                  className="gold-btn gold-btn-gold"
                  href={GOLD_APK_URL}
                  download={`lin-go-gold-${GOLD_VERSION}.apk`}
                  rel="noopener"
                >
                  <Download className="h-4 w-4" />
                  حمّل Gold+ {GOLD_VERSION}
                </a>
                <button type="button" className="gold-btn gold-btn-ghost" onClick={handlePreview}>
                  <Play className="h-4 w-4 fill-current" />
                  جرّب التطبيق
                </button>
              </div>
              <p className="gold-download-note">
                التحميل من الموقع الرسمي. إذا لم يبدأ،{' '}
                <a href={GOLD_GITHUB_APK_URL} target="_blank" rel="noopener noreferrer">
                  استخدم رابط GitHub الاحتياطي
                </a>
                .
              </p>
              <div className="gold-proof">
                <span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  نفس واجهة Lin Go
                </span>
                <span>
                  <Layers3 className="h-3.5 w-3.5 text-emerald-700" />
                  نفس المسار · أكثر من 400 درس
                </span>
                <span>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  Gold+ أكثر من 70% أنشطة إضافية
                </span>
              </div>
            </div>

            <div className="gold-hero-stage">
              <div className="gold-hero-halo" aria-hidden="true" />
              <div className="gold-float-card is-top">
                <span className="gold-float-icon">
                  <Heart className="h-4 w-4" />
                </span>
                <span>
                  قلوب لا نهائية
                  <br />
                  <span style={{ color: '#7b8b85', fontWeight: 700 }}>تدرّب دون توقف</span>
                </span>
              </div>
              <div className="gold-float-card is-bottom">
                <span className="gold-float-icon">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span>
                  Gold+ 70%
                  <br />
                  <span style={{ color: '#7b8b85', fontWeight: 700 }}>أنشطة وتجربة إضافية</span>
                </span>
              </div>
              <div className="gold-hero-phone">
                <img
                  src="/screenshots/download-gold.png"
                  width="390"
                  height="780"
                  alt="واجهة Lin Go Gold: نفس شريط Lin Go ومسار الدروس، مع منهج Gold"
                />
              </div>
            </div>
          </section>

          <section className="gold-shell gold-section" id="gold-method">
            <div className="gold-section-heading">
              <div>
                <span className="gold-eyebrow">
                  <Sparkles className="h-3 w-3" />
                  ماذا يضيف Gold؟
                </span>
                <h2 style={{ marginTop: 12 }}>
                  نفس الشاشات.
                  <br />
                  والتجربة هي الفرق.
                </h2>
              </div>
              <p>
                لا نعيد تصميم ما تعرفه. Gold+ يضيف إلى نفس المسار تدريبًا بصريًا، نطقًا أوسع،
                مكافآت وقلوبًا لا نهائية، دوري مهارات، وأربعة مشاريع تطبيقية — بينما تبقى واجهة
                Lin Go ونسخك الاحتياطية كما هي.
              </p>
            </div>
            <div className="gold-feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article className="gold-feature-card" key={feature.title}>
                    <span className="gold-feature-icon">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="gold-shell gold-section" id="gold-stages">
            <div className="gold-section-heading">
              <div>
                <span className="gold-eyebrow">
                  <GraduationCap className="h-3 w-3" />
                  المنهج الذهبي
                </span>
                <h2 style={{ marginTop: 12 }}>
                  أربع مراحل.
                  <br />
                  لكل مرحلة مهمة حقيقية.
                </h2>
              </div>
              <p>
                في Gold يظهر مشروع قصير في كل مرحلة، لتطبّق ما تعلمته داخل نفس شاشة الدرس.
                المشاريع إضافة تطبيقية إلى المسار، وليست بوابات إلزامية بعد.
              </p>
            </div>
            <div className="gold-stage-grid">
              {stages.map((stage) => (
                <article className={`gold-stage-card is-${stage.tone}`} key={stage.stage}>
                  <div className="gold-stage-kicker">
                    <span>STAGE {stage.stage}</span>
                    <b>{stage.stage}</b>
                  </div>
                  <span className="gold-stage-kicker" style={{ marginTop: 12, color: '#0f7a5c' }}>
                    {stage.cefr}
                  </span>
                  <h3>{stage.title}</h3>
                  <p>{stage.subtitle}</p>
                  <div className="gold-stage-mission">
                    <Target className="h-3.5 w-3.5" />
                    <span>مشروع المرحلة: {stage.mission}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="gold-shell gold-compare-wrap" id="gold-compare">
            <div>
              <div className="gold-section-heading">
                <div>
                  <span className="gold-eyebrow">
                    <BarChart3 className="h-3 w-3" />
                    الفرق واضح
                  </span>
                  <h2 style={{ marginTop: 12 }}>
                    ماذا يضيف Gold؟
                  </h2>
                </div>
              </div>
              <p className="mb-3 rounded-2xl border border-amber-300/50 bg-amber-300/15 px-3 py-2 text-[11px] font-bold leading-6 text-amber-950">
                <Crown className="mr-1 inline h-3.5 w-3.5" />
                Gold+ يضيف أكثر من 70% من الأنشطة والتجربة: تدريب بصري، نطق أوسع، مكافآت، دوري، وقلوب لا نهائية.
              </p>
              <div className="gold-compare">
                <div className="gold-compare-head">
                  <span>الميزة</span>
                  <b>Free</b>
                  <b>Gold</b>
                </div>
                {[
                  ['الواجهة', 'واجهة Lin Go', 'نفس واجهة Lin Go + Gold+'],
                  ['المسار', '4 مراحل · 400 درس', 'نفس المسار + 4 مشاريع'],
                  ['التدريب البصري', '—', 'تحدٍّ في كل درس +10 XP'],
                  ['النطق', 'جملة واحدة', 'جملتان + استماع بطيء'],
                  ['القلوب', '5 محاولات', '∞ بلا حدود'],
                  ['مكافأة XP', '1×', '+25% في Gold'],
                  ['الدوري', '—', 'دوري Gold+ ومهارات'],
                  ['المكافآت', '—', 'صندوق يومي واحتفال'],
                  ['المعلم الذكي', 'متاح', 'متاح + ردود أسرع'],
                  ['النسخ الاحتياطي', 'مشفّر', 'نفس النسخ دون تغيير'],
                  ['الشهادة', '—', 'قريبًا'],
                ].map(([feature, free, gold]) => (
                  <div className="gold-compare-row" key={feature}>
                    <span>{feature}</span>
                    <span>{free}</span>
                    <span>{gold}</span>
                  </div>
                ))}
              </div>
            </div>

            <CodePanel
              activated={activated}
              checking={checking}
              code={code}
              error={error}
              onChange={(value) => {
                setCode(value);
                setError(null);
              }}
              onActivate={handleActivate}
              onPreview={handlePreview}
            />
          </section>

          <div className="gold-shell">
            <footer className="gold-footer">
              <span>© 2026 Lin Go · Gold+ {GOLD_VERSION} التجريبية</span>
              <strong>Lin Go Gold · Learn with direction</strong>
            </footer>
          </div>
        </main>
      ) : (
        <main className="gold-shell gold-dashboard-view" ref={dashboardTop}>
          <div className="gold-dashboard-toolbar">
            <button type="button" className="gold-btn gold-btn-ghost" onClick={() => setView('landing')}>
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </button>
            <p>
              {activated ? (
                <>
                  <BadgeCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-700" />
                  تم التحقق — معاينة Gold جاهزة على هذا الجهاز
                </>
              ) : (
                'معاينة حقيقية لواجهة Lin Go — التفعيل متاح من الصفحة السابقة'
              )}
            </p>
          </div>

          <div className="gold-dashboard-layout">
            <div className="gold-dashboard-copy">
              <span className="gold-eyebrow">
                <Smartphone className="h-3 w-3" />
                داخل التطبيق
              </span>
              <h2 style={{ marginTop: 14 }}>نفس التطبيق. تجربة Gold+ كاملة.</h2>
              <p>
                هذه ليست واجهة Gold منفصلة. إنها شاشات Lin Go الحقيقية — الشريط العلوي، مسار
                المراحل، درس المحادثة، والمعلم الذكي — مع لوحة Gold+، تحدٍّ بصري، نطق أوسع،
                قلوب لا نهائية، دوري، ومكافآت داخل نفس المسار.
              </p>
              <div className="gold-dashboard-points">
                {goldDashboardPoints.map((point) => {
                  const Icon = point.icon;
                  return (
                    <div className="gold-dashboard-point" key={point.text}>
                      <span>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {point.text}
                    </div>
                  );
                })}
              </div>
              <div className="gold-hero-actions">
                <a
                  className="gold-btn gold-btn-primary"
                  href={GOLD_APK_URL}
                  download={`lin-go-gold-${GOLD_VERSION}.apk`}
                  rel="noopener"
                >
                  <Download className="h-4 w-4" />
                  حمّل Gold+ {GOLD_VERSION}
                </a>
                <button type="button" className="gold-btn gold-btn-ghost" onClick={scrollToActivate}>
                  <KeyRound className="h-4 w-4" />
                  كود المعاينة
                </button>
              </div>
            </div>
            <GoldErrorBoundary
              fallback={
                <div className="gold-app-preview-fallback" role="status" aria-live="polite">
                  تعذّر تشغيل المعاينة الآن. يمكنك تحميل Gold وتجربته على Android.
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="gold-app-preview-fallback" role="status" aria-live="polite">
                    جارٍ تحميل واجهة Lin Go…
                  </div>
                }
              >
                <GoldAppPreview />
              </Suspense>
            </GoldErrorBoundary>
          </div>
          <footer className="gold-footer">
            <span>معاينة تفاعلية — لا تغيّر تقدمك الحالي في Lin Go.</span>
            <strong>Same app · same path · 4 Gold projects</strong>
          </footer>
        </main>
      )}
    </div>
  );
};
