const ARABIC_CHARACTER_NAMES: Record<string, string> = {
  Alex: 'أحمد', Emma: 'ليلى', Sarah: 'سارة', Omar: 'عمر', Sophia: 'سلمى', Liam: 'علي',
  Jack: 'ياسين', Maya: 'مريم', 'Dr. Emily': 'د. إيناس', Noah: 'محمد', Mike: 'أمين',
  Zara: 'زهراء', Leo: 'لحسن', Chloe: 'خديجة', Lisa: 'ليان', Daniel: 'يوسف',
  Mia: 'ميا', Lina: 'لينا', Sara: 'سارة', Ethan: 'يحيى', Ava: 'آية', Ben: 'أمين',
  Nora: 'نور', Adam: 'آدم', Ivy: 'إيناس', Zoe: 'زينب', Ryan: 'ريان', Ella: 'ليلى',
  Finn: 'فارس', Hana: 'هناء', Peter: 'بلال', Mariam: 'مريم', Eli: 'إلياس', Grace: 'رحمة',
  Yusuf: 'يوسف', Layla: 'ليلى', Tom: 'طارق', Amir: 'أمير', Julia: 'جمانة', Dina: 'دينا',
  Max: 'مازن', Rami: 'رامي', Sophie: 'صوفيا', Nadia: 'نادية', Chris: 'كريم', Hadi: 'هادي',
  Emily: 'إميلي', Mona: 'منى', David: 'داود', Rosa: 'روزا', Michael: 'ميخائيل',
  Salim: 'سليم', Claire: 'كلارا', Amal: 'أمل', George: 'جورج', Yara: 'يارا', Henry: 'هيثم',
  Rita: 'ريتا', Sam: 'سامر', Hassan: 'حسن', Olivia: 'علا', Nabil: 'نبيل', Kate: 'كاتيا',
  Reem: 'ريم', Lucas: 'لوكاس', Tariq: 'طارق', Megan: 'ميغان', Farah: 'فرح', Noor: 'نور',
  Evan: 'إياد', Oliver: 'عمر', Huda: 'هدى', James: 'جاسم', Aisha: 'عائشة', Nadine: 'نادين',
  Theo: 'تيم', Rana: 'رنا', Miles: 'مالك', Samar: 'سمر', Elliot: 'إلياس', Amina: 'أمينة',
  Dalia: 'داليا', Hala: 'هالة', Oscar: 'أسامة', Maha: 'مها', Salma: 'سلمى', Noura: 'نورة',
  Ahmed: 'أحمد', Lahcen: 'لحسن', Mohamed: 'محمد', Ali: 'علي', Leila: 'ليلى',
  Youssef: 'يوسف', Ilyas: 'إلياس', Ines: 'إيناس', Rayan: 'ريان', Samir: 'سمير', Yasmin: 'ياسمين',
};

export const getArabicCharacterName = (englishName: string): string =>
  ARABIC_CHARACTER_NAMES[englishName] ?? englishName;
