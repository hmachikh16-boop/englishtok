import type { CategoryInfo } from '../types';
import { BookOpen, Briefcase, Coffee, Hand, Lightbulb, Plane, ShoppingBag, Stethoscope } from 'lucide-react';

export const CATEGORIES: CategoryInfo[] = [
  {
    key: 'greetings',
    nameAr: 'التحيات والتعارف',
    nameEn: 'Greetings & Intro',
    icon: Hand,
    color: 'from-amber-500 to-orange-500',
    descriptionAr: 'تعلم كيف تبدأ محادثة طبيعية وتعرّف عن نفسك بطلاقة.',
  },
  {
    key: 'food',
    nameAr: 'المطاعم والمقاهي',
    nameEn: 'Food & Cafes',
    icon: Coffee,
    color: 'from-emerald-500 to-teal-500',
    descriptionAr: 'كل ما تحتاجه لطلب الطعام والشراب ودفع الفاتورة وتعديل الطلبات.',
  },
  {
    key: 'travel',
    nameAr: 'السفر والمطارات',
    nameEn: 'Travel & Airport',
    icon: Plane,
    color: 'from-sky-500 to-blue-600',
    descriptionAr: 'محادثات المطارات، الفنادق، سؤال المارة عن الاتجاهات والمواصلات.',
  },
  {
    key: 'work',
    nameAr: 'العمل والمقابلات',
    nameEn: 'Work & Career',
    icon: Briefcase,
    color: 'from-indigo-500 to-purple-600',
    descriptionAr: 'التواصل الاحترافي في المكتب، الاجتماعات، ومقابلات العمل.',
  },
  {
    key: 'shopping',
    nameAr: 'التسوق والأسعار',
    nameEn: 'Shopping & Clothes',
    icon: ShoppingBag,
    color: 'from-rose-500 to-pink-600',
    descriptionAr: 'السؤال عن المقاسات والأسعار والتخفيضات وطرق الدفع.',
  },
  {
    key: 'health',
    nameAr: 'الصحة والعيادات',
    nameEn: 'Health & Clinic',
    icon: Stethoscope,
    color: 'from-red-500 to-orange-500',
    descriptionAr: 'شرح الأعراض والأدوية والتواصل مع الصيدلي أو الطبيب.',
  },
  {
    key: 'idioms',
    nameAr: 'مصطلحات وتعبيرات أصلية',
    nameEn: 'Idioms & Slang',
    icon: Lightbulb,
    color: 'from-violet-500 to-fuchsia-600',
    descriptionAr: 'مصطلحات شائعة يتحدث بها الأمريكيون والبريطانيون في الحياة اليومية.',
  },
  {
    key: 'grammar',
    nameAr: 'قواعد في محادثة',
    nameEn: 'Grammar in Chat',
    icon: BookOpen,
    color: 'from-cyan-500 to-blue-500',
    descriptionAr: 'فهم الأزمنة والقواعد بسلاسة داخل سياق المحادثة ودون تعقيد.',
  },
];
