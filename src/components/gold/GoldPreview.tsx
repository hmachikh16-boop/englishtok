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
  Gamepad2,
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
  ShoppingBag,
  Smartphone,
  Sparkles,
  Target,
  Type,
  Trophy,
  Zap,
  Youtube,
} from 'lucide-react';
import '../../gold-preview.css';
import { GoldErrorBoundary } from './GoldErrorBoundary';

const GoldAppPreview = React.lazy(() =>
  import('./GoldAppPreview').then((module) => ({ default: module.GoldAppPreview })),
);

const GOLD_VERSION = '1.1.51';
const GOLD_APK_URL = `/lin-go-gold-${GOLD_VERSION}.apk`;

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
    icon: Gift,
    title: 'تجربة مجانية قبل التفعيل',
    body: 'زر واحد في لوحة الإدارة يفتح Gold+ للجميع بدون كود خلال فترة الإطلاق. عند إيقافه يعود طلب الكود المفعّل فورًا، دون فقدان تقدمك.',
  },
  {
    icon: Sparkles,
    title: 'واجهة نوافذ احترافية',
    body: 'الصفحة الرئيسية بنظام نوافذ: نافذة واحدة في كل مرة، لا تراكم. المسار مخفي خلف نافذته، والدروس في تبويب خاص.',
  },
  {
    icon: Type,
    title: 'الحروف الأبجدية',
    body: '26 حرفًا مع صوت + مثال + جملة + صورة، واختبار تفاعلي (8 أسئلة) لثبيت التعلم.',
  },
  {
    icon: ShoppingBag,
    title: 'متجر الألقاب',
    body: 'اكسب نقاطًا من الألعاب واشترِ 8 ألقاب (المبتدئ، المجتهد، البارع، المحترف، العبقري، الماستر، متعدد اللغات، أسطورة). 1 نقطة لكل 10 XP.',
  },
  {
    icon: Gamepad2,
    title: 'ألعاب أذكى',
    body: 'لعبة اليوم (موصى بها)، تجميع حسب المهارة (15 مجموعة)، صور حيوانات، XP ومستوى صعوبة.',
  },
  {
    icon: Headphones,
    title: 'صوت سحابي للقصص',
    body: 'القصص تُقرأ بصوت سحابي (server TTS) سلس مع prefetch، يعمل على كل الأجهزة.',
  },
  {
    icon: BookOpen,
    title: '~900 درس و 58 قصة',
    body: 'من A1 إلى C1، مع 50 درسًا جديدًا لكل مرحلة، محادثات كرتونية، و 58 قصة مصوّرة.',
  },
  {
    icon: Youtube,
    title: 'ريلز @lingogold حية',
    body: 'شورتات قناة @lingogold حية مع إحصاءات القناة (المشتركون/المشاهدات) في لوحة التحكم.',
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
      أدخل الكود الذي حصلت عليه من لوحة التحكم. يتحقق الخادم من صلاحيته قبل فتح
      التحميل والمعاينة التفاعلية.
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
    <p className="gold-code-hint">أدخل كود Gold مفعّلًا من لوحة التحكم.</p>
    {error && <p className="gold-code-error">{error}</p>}
    {activated && (
      <>
        <p className="gold-code-success">
          <BadgeCheck className="mr-1 inline h-3 w-3" />
          تم تفعيل Gold+ — التحميل جاهز.
        </p>
        <a
          className="gold-download-button"
          href={GOLD_APK_URL}
          download={`lin-go-gold-${GOLD_VERSION}.apk`}
          rel="noopener"
        >
          <span className="gold-download-button-icon" aria-hidden="true">
            <Download className="h-4 w-4" />
          </span>
          <span>
            <strong>تحميل <bdi>Gold+ {GOLD_VERSION}</bdi></strong>
            <small>APK موقّع • تحديث عبر مدير التنزيلات</small>
          </span>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </a>
      </>
    )}
    <button type="button" className="gold-preview-toggle" onClick={onPreview}>
      <Smartphone className="h-3.5 w-3.5" />
      معاينة لوحة Gold+ داخل التطبيق
      <ChevronLeft className="h-3 w-3" />
    </button>
    <div className="gold-secure-note">
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>
        التحميل متاح فقط بعد التحقق من كود Gold المفعّل. لا يبدأ أي تثبيت تلقائي،
        وتتم التحديثات عبر مدير التنزيلات.
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
            كود Gold
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
                <span>تجربة <bdi>Gold+</bdi> أذكى وأغنى.</span>
              </h1>
              <p className="gold-hero-copy">
                <bdi>Gold+ {GOLD_VERSION}</bdi> هو نفس تطبيق <bdi>Lin Go</bdi> ومساره ودروسه، مع طبقة ذهبية داخل الرحلة:
                ~900 درس، 58 قصة، نطق سحابي، متجر ألقاب، الحروف الأبجدية، ألعاب أذكى،
                وريلز @lingogold — تجربة أغنى وأذكى.
              </p>
              <div className="gold-hero-actions">
                <button type="button" className="gold-btn gold-btn-gold" onClick={scrollToActivate}>
                  <KeyRound className="h-4 w-4" />
                  أدخل كود Gold للتحميل
                </button>
                <button type="button" className="gold-btn gold-btn-ghost" onClick={handlePreview}>
                  <Play className="h-4 w-4 fill-current" />
                  جرّب التطبيق
                </button>
              </div>
              <p className="gold-download-note">
                التحميل متاح بعد التحقق من كود Gold المفعّل. التحديثات تُنزّل داخل التطبيق
                عبر مدير التنزيلات.
              </p>
              <div className="gold-proof">
                <span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  نفس واجهة Lin Go
                </span>
                <span>
                  <Layers3 className="h-3.5 w-3.5 text-emerald-700" />
                  نفس المسار · أكثر من 700 درس
                </span>
                <span>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  <bdi>Gold+</bdi> أكثر من 70% أنشطة إضافية
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
                  ['التفعيل', 'بدون كود', 'كود مفعّل — أو تجربة مجانية عند تفعيلها'],
                  ['الواجهة', 'Lin Go', 'نفس الواجهة + نوافذ احترافية'],
                  ['المسار', '4 مراحل · ~700 درس', '~700 درس + 58 قصة + 4 مشاريع'],
                  ['الحروف', '—', '26 حرفًا + اختبار تفاعلي'],
                  ['متجر الألقاب', '—', '8 ألقاب (نقاط من الألعاب)'],
                  ['النطق', 'جملة واحدة', 'سحابي للقصص + device voice'],
                  ['الألعاب', '17 لعبة', '17 لعبة + صور + XP + صعوبة'],
                  ['الريلز', '—', 'شورتات @lingogold حية'],
                  ['النسخ الاحتياطي', 'مشفّر', 'نفس النسخ دون تغيير'],
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
              <span>© 2026 Lin Go · Gold+ {GOLD_VERSION} — نسخة مستقلة</span>
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
              <h2 style={{ marginTop: 14 }}>نفس التطبيق. تجربة <bdi>Gold+</bdi> كاملة.</h2>
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
                {activated ? (
                  <a
                    className="gold-btn gold-btn-primary"
                    href={GOLD_APK_URL}
                    download={`lin-go-gold-${GOLD_VERSION}.apk`}
                    rel="noopener"
                  >
                    <Download className="h-4 w-4" />
                    حمّل <bdi>Gold+ {GOLD_VERSION}</bdi>
                  </a>
                ) : (
                  <button type="button" className="gold-btn gold-btn-primary" onClick={scrollToActivate}>
                    <KeyRound className="h-4 w-4" />
                    أدخل كود Gold للتحميل
                  </button>
                )}
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
