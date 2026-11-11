/**
 * The Stage-1 phonics wall, rebuilt for the app.
 *
 * Each group mirrors one chart of the primary-school syllabus: short and long
 * vowels, vowel teams, consonant digraphs, blends, r-controlled vowels,
 * diphthongs, silent letters, soft/hard C and G, and the schwa. Every sound
 * carries the Arabic hint the learner already knows from the poster plus a
 * handful of example words, so the same data drives the reading cards, the
 * "listen" buttons and the listening quiz.
 */

export interface PhonicsWord {
  word: string;
  ar: string;
  ipa?: string;
}

export interface PhonicsSound {
  id: string;
  /** Grapheme or IPA symbol shown on the card. */
  symbol: string;
  /** How the sound is described in Arabic. */
  hintAr: string;
  words: PhonicsWord[];
}

export interface PhonicsGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  noteAr: string;
  sounds: PhonicsSound[];
}

export const PHONICS_GROUPS: PhonicsGroup[] = [
  {
    id: 'short-vowels',
    titleAr: 'الحركات القصيرة',
    titleEn: 'Short Vowels',
    noteAr: 'صوت قصير وسريع: a في cat، e في bed، i في sit، o في dog، u في sun.',
    sounds: [
      { id: 'a-short', symbol: 'a', hintAr: 'صوت «أ» قصير', words: [
        { word: 'cat', ar: 'قطة', ipa: '/kæt/' },
        { word: 'hat', ar: 'قبعة', ipa: '/hæt/' },
        { word: 'map', ar: 'خريطة', ipa: '/mæp/' },
      ] },
      { id: 'e-short', symbol: 'e', hintAr: 'صوت «إ» قصير', words: [
        { word: 'bed', ar: 'سرير', ipa: '/bed/' },
        { word: 'pen', ar: 'قلم', ipa: '/pen/' },
        { word: 'red', ar: 'أحمر', ipa: '/red/' },
      ] },
      { id: 'i-short', symbol: 'i', hintAr: 'صوت «إي» قصير', words: [
        { word: 'sit', ar: 'يجلس', ipa: '/sɪt/' },
        { word: 'pig', ar: 'خنزير', ipa: '/pɪɡ/' },
        { word: 'fish', ar: 'سمكة', ipa: '/fɪʃ/' },
      ] },
      { id: 'o-short', symbol: 'o', hintAr: 'صوت «أو» قصير', words: [
        { word: 'dog', ar: 'كلب', ipa: '/dɒɡ/' },
        { word: 'box', ar: 'صندوق', ipa: '/bɒks/' },
        { word: 'hot', ar: 'حار', ipa: '/hɒt/' },
      ] },
      { id: 'u-short', symbol: 'u', hintAr: 'صوت «أَ» قصير', words: [
        { word: 'sun', ar: 'شمس', ipa: '/sʌn/' },
        { word: 'cup', ar: 'كوب', ipa: '/kʌp/' },
        { word: 'bus', ar: 'حافلة', ipa: '/bʌs/' },
      ] },
    ],
  },
  {
    id: 'long-vowels',
    titleAr: 'الحركات الطويلة',
    titleEn: 'Long Vowels',
    noteAr: 'الحركة تنطق باسمها، وغالبًا بسبب e صامتة في آخر الكلمة.',
    sounds: [
      { id: 'a-long', symbol: 'a_e', hintAr: 'صوت «إيه» طويل', words: [
        { word: 'cake', ar: 'كعكة', ipa: '/keɪk/' },
        { word: 'name', ar: 'اسم', ipa: '/neɪm/' },
        { word: 'game', ar: 'لعبة', ipa: '/ɡeɪm/' },
      ] },
      { id: 'e-long', symbol: 'e_e', hintAr: 'صوت «إي» طويل', words: [
        { word: 'tree', ar: 'شجرة', ipa: '/triː/' },
        { word: 'see', ar: 'يرى', ipa: '/siː/' },
        { word: 'green', ar: 'أخضر', ipa: '/ɡriːn/' },
      ] },
      { id: 'i-long', symbol: 'i_e', hintAr: 'صوت «آي» طويل', words: [
        { word: 'bike', ar: 'دراجة', ipa: '/baɪk/' },
        { word: 'kite', ar: 'طائرة ورقية', ipa: '/kaɪt/' },
        { word: 'five', ar: 'خمسة', ipa: '/faɪv/' },
      ] },
      { id: 'o-long', symbol: 'o_e', hintAr: 'صوت «أوو» طويل', words: [
        { word: 'home', ar: 'منزل', ipa: '/həʊm/' },
        { word: 'nose', ar: 'أنف', ipa: '/nəʊz/' },
        { word: 'bone', ar: 'عظمة', ipa: '/bəʊn/' },
      ] },
      { id: 'u-long', symbol: 'u_e', hintAr: 'صوت «يوو» طويل', words: [
        { word: 'blue', ar: 'أزرق', ipa: '/bluː/' },
        { word: 'cube', ar: 'مكعب', ipa: '/kjuːb/' },
        { word: 'June', ar: 'يونيو', ipa: '/dʒuːn/' },
      ] },
    ],
  },
  {
    id: 'vowel-teams',
    titleAr: 'الفرق الصوتية',
    titleEn: 'Vowel Teams',
    noteAr: 'حرفان متحركان يعملان كفريق واحد وينتجان صوتًا واحدًا.',
    sounds: [
      { id: 'ai', symbol: 'ai', hintAr: 'صوت «إي» مع فتح', words: [
        { word: 'rain', ar: 'مطر', ipa: '/reɪn/' },
        { word: 'train', ar: 'قطار', ipa: '/treɪn/' },
        { word: 'pain', ar: 'ألم', ipa: '/peɪn/' },
      ] },
      { id: 'ay', symbol: 'ay', hintAr: 'نفس صوت ai في نهاية الكلمة', words: [
        { word: 'day', ar: 'يوم', ipa: '/deɪ/' },
        { word: 'play', ar: 'يلعب', ipa: '/pleɪ/' },
        { word: 'say', ar: 'يقول', ipa: '/seɪ/' },
      ] },
      { id: 'ee', symbol: 'ee', hintAr: 'صوت «إي» طويل', words: [
        { word: 'tree', ar: 'شجرة', ipa: '/triː/' },
        { word: 'see', ar: 'يرى', ipa: '/siː/' },
        { word: 'feet', ar: 'أقدام', ipa: '/fiːt/' },
      ] },
      { id: 'ea', symbol: 'ea', hintAr: 'غالبًا صوت «إي» طويل', words: [
        { word: 'eat', ar: 'يأكل', ipa: '/iːt/' },
        { word: 'tea', ar: 'شاي', ipa: '/tiː/' },
        { word: 'read', ar: 'يقرأ', ipa: '/riːd/' },
      ] },
      { id: 'oa', symbol: 'oa', hintAr: 'صوت «أو» طويل', words: [
        { word: 'boat', ar: 'قارب', ipa: '/bəʊt/' },
        { word: 'coat', ar: 'معطف', ipa: '/kəʊt/' },
        { word: 'road', ar: 'طريق', ipa: '/rəʊd/' },
      ] },
      { id: 'ow', symbol: 'ow', hintAr: 'صوت «أو» أو «آو»', words: [
        { word: 'snow', ar: 'ثلج', ipa: '/snəʊ/' },
        { word: 'cow', ar: 'بقرة', ipa: '/kaʊ/' },
        { word: 'window', ar: 'نافذة', ipa: '/ˈwɪn.dəʊ/' },
      ] },
      { id: 'ie', symbol: 'ie', hintAr: 'صوت «آي» أو «إي»', words: [
        { word: 'pie', ar: 'فطيرة', ipa: '/paɪ/' },
        { word: 'tie', ar: 'ربطة عنق', ipa: '/taɪ/' },
        { word: 'field', ar: 'حقل', ipa: '/fiːld/' },
      ] },
      { id: 'igh', symbol: 'igh', hintAr: 'صوت «آي» طويل', words: [
        { word: 'night', ar: 'ليل', ipa: '/naɪt/' },
        { word: 'light', ar: 'ضوء', ipa: '/laɪt/' },
        { word: 'high', ar: 'عالٍ', ipa: '/haɪ/' },
      ] },
      { id: 'ue', symbol: 'ue', hintAr: 'صوت «يو»', words: [
        { word: 'blue', ar: 'أزرق', ipa: '/bluː/' },
        { word: 'glue', ar: 'غراء', ipa: '/ɡluː/' },
        { word: 'rescue', ar: 'ينقذ', ipa: '/ˈres.kjuː/' },
      ] },
      { id: 'oo', symbol: 'oo', hintAr: 'صوت «أوو» طويل', words: [
        { word: 'moon', ar: 'قمر', ipa: '/muːn/' },
        { word: 'food', ar: 'طعام', ipa: '/fuːd/' },
        { word: 'spoon', ar: 'ملعقة', ipa: '/spuːn/' },
      ] },
      { id: 'oi', symbol: 'oi', hintAr: 'صوت «أوي»', words: [
        { word: 'coin', ar: 'عملة', ipa: '/kɔɪn/' },
        { word: 'boil', ar: 'يغلي', ipa: '/bɔɪl/' },
        { word: 'soil', ar: 'تربة', ipa: '/sɔɪl/' },
      ] },
      { id: 'oy', symbol: 'oy', hintAr: 'نفس صوت oi في النهاية', words: [
        { word: 'boy', ar: 'ولد', ipa: '/bɔɪ/' },
        { word: 'toy', ar: 'لعبة', ipa: '/tɔɪ/' },
        { word: 'enjoy', ar: 'يستمتع', ipa: '/ɪnˈdʒɔɪ/' },
      ] },
      { id: 'ou', symbol: 'ou', hintAr: 'صوت «آو»', words: [
        { word: 'house', ar: 'منزل', ipa: '/haʊs/' },
        { word: 'mouse', ar: 'فأر', ipa: '/maʊs/' },
        { word: 'cloud', ar: 'سحابة', ipa: '/klaʊd/' },
      ] },
      { id: 'au', symbol: 'au', hintAr: 'صوت «أو» مفتوح', words: [
        { word: 'August', ar: 'أغسطس', ipa: '/ˈɔː.ɡəst/' },
        { word: 'autumn', ar: 'خريف', ipa: '/ˈɔː.təm/' },
        { word: 'sauce', ar: 'صلصة', ipa: '/sɔːs/' },
      ] },
    ],
  },
  {
    id: 'digraphs',
    titleAr: 'الأصوات المركبة',
    titleEn: 'Consonant Digraphs',
    noteAr: 'حرفان ساكنان يعطيان صوتًا واحدًا جديدًا.',
    sounds: [
      { id: 'sh', symbol: 'sh', hintAr: 'صوت «ش» هادئ', words: [
        { word: 'ship', ar: 'سفينة', ipa: '/ʃɪp/' },
        { word: 'sheep', ar: 'خروف', ipa: '/ʃiːp/' },
        { word: 'fish', ar: 'سمكة', ipa: '/fɪʃ/' },
      ] },
      { id: 'ch', symbol: 'ch', hintAr: 'صوت «تش»', words: [
        { word: 'chair', ar: 'كرسي', ipa: '/tʃeər/' },
        { word: 'cheese', ar: 'جبن', ipa: '/tʃiːz/' },
        { word: 'teacher', ar: 'معلم', ipa: '/ˈtiː.tʃər/' },
      ] },
      { id: 'th-soft', symbol: 'th', hintAr: '«ث» بدون اهتزاز', words: [
        { word: 'think', ar: 'يفكر', ipa: '/θɪŋk/' },
        { word: 'three', ar: 'ثلاثة', ipa: '/θriː/' },
        { word: 'mouth', ar: 'فم', ipa: '/maʊθ/' },
      ] },
      { id: 'th-hard', symbol: 'th', hintAr: '«ذ» مع اهتزاز', words: [
        { word: 'this', ar: 'هذا', ipa: '/ðɪs/' },
        { word: 'that', ar: 'ذلك', ipa: '/ðæt/' },
        { word: 'mother', ar: 'أم', ipa: '/ˈmʌð.ər/' },
      ] },
      { id: 'ph', symbol: 'ph', hintAr: 'تُنطق «ف»', words: [
        { word: 'phone', ar: 'هاتف', ipa: '/fəʊn/' },
        { word: 'photo', ar: 'صورة', ipa: '/ˈfəʊ.təʊ/' },
        { word: 'elephant', ar: 'فيل', ipa: '/ˈel.ɪ.fənt/' },
      ] },
      { id: 'wh', symbol: 'wh', hintAr: 'تُنطق «و» مع نفَس', words: [
        { word: 'white', ar: 'أبيض', ipa: '/waɪt/' },
        { word: 'what', ar: 'ماذا', ipa: '/wɒt/' },
        { word: 'wheel', ar: 'عجلة', ipa: '/wiːl/' },
      ] },
      { id: 'ck', symbol: 'ck', hintAr: 'صوت «ك» قصير', words: [
        { word: 'duck', ar: 'بطة', ipa: '/dʌk/' },
        { word: 'black', ar: 'أسود', ipa: '/blæk/' },
        { word: 'sock', ar: 'جورب', ipa: '/sɒk/' },
      ] },
      { id: 'ng', symbol: 'ng', hintAr: 'صوت أنفي «نغ»', words: [
        { word: 'sing', ar: 'يغني', ipa: '/sɪŋ/' },
        { word: 'ring', ar: 'خاتم', ipa: '/rɪŋ/' },
        { word: 'long', ar: 'طويل', ipa: '/lɒŋ/' },
      ] },
      { id: 'qu', symbol: 'qu', hintAr: 'تُنطق «كو»', words: [
        { word: 'queen', ar: 'ملكة', ipa: '/kwiːn/' },
        { word: 'quick', ar: 'سريع', ipa: '/kwɪk/' },
        { word: 'quiet', ar: 'هادئ', ipa: '/ˈkwaɪ.ət/' },
      ] },
      { id: 'tch', symbol: 'tch', hintAr: 'صوت «تش» بعد حركة قصيرة', words: [
        { word: 'watch', ar: 'يشاهد', ipa: '/wɒtʃ/' },
        { word: 'catch', ar: 'يمسك', ipa: '/kætʃ/' },
        { word: 'kitchen', ar: 'مطبخ', ipa: '/ˈkɪtʃ.ən/' },
      ] },
      { id: 'dge', symbol: 'dge', hintAr: 'صوت «ج»', words: [
        { word: 'bridge', ar: 'جسر', ipa: '/brɪdʒ/' },
        { word: 'judge', ar: 'قاضٍ', ipa: '/dʒʌdʒ/' },
        { word: 'fridge', ar: 'ثلاجة', ipa: '/frɪdʒ/' },
      ] },
    ],
  },
  {
    id: 'blends',
    titleAr: 'الحروف المتجاورة',
    titleEn: 'Consonant Blends',
    noteAr: 'تسمع كل حرف فيهما، لكنك تنطقهما بسرعة دون حركة بينهما.',
    sounds: [
      { id: 'bl', symbol: 'bl', hintAr: 'ب + ل', words: [
        { word: 'black', ar: 'أسود', ipa: '/blæk/' },
        { word: 'blue', ar: 'أزرق', ipa: '/bluː/' },
      ] },
      { id: 'cl', symbol: 'cl', hintAr: 'ك + ل', words: [
        { word: 'class', ar: 'صف', ipa: '/klɑːs/' },
        { word: 'clock', ar: 'ساعة', ipa: '/klɒk/' },
      ] },
      { id: 'fl', symbol: 'fl', hintAr: 'ف + ل', words: [
        { word: 'flower', ar: 'زهرة', ipa: '/ˈflaʊ.ər/' },
        { word: 'flag', ar: 'علم', ipa: '/flæɡ/' },
      ] },
      { id: 'gl', symbol: 'gl', hintAr: 'غ + ل', words: [
        { word: 'glass', ar: 'كأس', ipa: '/ɡlɑːs/' },
        { word: 'glue', ar: 'غراء', ipa: '/ɡluː/' },
      ] },
      { id: 'pl', symbol: 'pl', hintAr: 'ب + ل', words: [
        { word: 'play', ar: 'يلعب', ipa: '/pleɪ/' },
        { word: 'plane', ar: 'طائرة', ipa: '/pleɪn/' },
      ] },
      { id: 'br', symbol: 'br', hintAr: 'ب + ر', words: [
        { word: 'bread', ar: 'خبز', ipa: '/bred/' },
        { word: 'brown', ar: 'بني', ipa: '/braʊn/' },
      ] },
      { id: 'cr', symbol: 'cr', hintAr: 'ك + ر', words: [
        { word: 'crab', ar: 'سلطعون', ipa: '/kræb/' },
        { word: 'cry', ar: 'يبكي', ipa: '/kraɪ/' },
      ] },
      { id: 'dr', symbol: 'dr', hintAr: 'د + ر', words: [
        { word: 'dress', ar: 'فستان', ipa: '/dres/' },
        { word: 'drink', ar: 'يشرب', ipa: '/drɪŋk/' },
      ] },
      { id: 'fr', symbol: 'fr', hintAr: 'ف + ر', words: [
        { word: 'fruit', ar: 'فاكهة', ipa: '/fruːt/' },
        { word: 'friend', ar: 'صديق', ipa: '/frend/' },
      ] },
      { id: 'gr', symbol: 'gr', hintAr: 'غ + ر', words: [
        { word: 'green', ar: 'أخضر', ipa: '/ɡriːn/' },
        { word: 'grass', ar: 'عشب', ipa: '/ɡrɑːs/' },
      ] },
      { id: 'pr', symbol: 'pr', hintAr: 'ب + ر', words: [
        { word: 'prince', ar: 'أمير', ipa: '/prɪns/' },
        { word: 'pray', ar: 'يصلي', ipa: '/preɪ/' },
      ] },
      { id: 'tr', symbol: 'tr', hintAr: 'ت + ر', words: [
        { word: 'train', ar: 'قطار', ipa: '/treɪn/' },
        { word: 'tree', ar: 'شجرة', ipa: '/triː/' },
      ] },
      { id: 'sk', symbol: 'sk', hintAr: 'س + ك', words: [
        { word: 'sky', ar: 'سماء', ipa: '/skaɪ/' },
        { word: 'skip', ar: 'يقفز', ipa: '/skɪp/' },
      ] },
      { id: 'sl', symbol: 'sl', hintAr: 'س + ل', words: [
        { word: 'slide', ar: 'ينزلق', ipa: '/slaɪd/' },
        { word: 'slow', ar: 'بطيء', ipa: '/sləʊ/' },
      ] },
      { id: 'sm', symbol: 'sm', hintAr: 'س + م', words: [
        { word: 'smile', ar: 'يبتسم', ipa: '/smaɪl/' },
        { word: 'small', ar: 'صغير', ipa: '/smɔːl/' },
      ] },
      { id: 'sn', symbol: 'sn', hintAr: 'س + ن', words: [
        { word: 'snake', ar: 'ثعبان', ipa: '/sneɪk/' },
        { word: 'snow', ar: 'ثلج', ipa: '/snəʊ/' },
      ] },
      { id: 'sp', symbol: 'sp', hintAr: 'س + ب', words: [
        { word: 'spoon', ar: 'ملعقة', ipa: '/spuːn/' },
        { word: 'spider', ar: 'عنكبوت', ipa: '/ˈspaɪ.dər/' },
      ] },
      { id: 'st', symbol: 'st', hintAr: 'س + ت', words: [
        { word: 'star', ar: 'نجمة', ipa: '/stɑːr/' },
        { word: 'stop', ar: 'يتوقف', ipa: '/stɒp/' },
      ] },
      { id: 'sw', symbol: 'sw', hintAr: 'س + و', words: [
        { word: 'swim', ar: 'يسبح', ipa: '/swɪm/' },
        { word: 'sweet', ar: 'حلو', ipa: '/swiːt/' },
      ] },
    ],
  },
  {
    id: 'r-controlled',
    titleAr: 'الحركات مع R',
    titleEn: 'R-Controlled Vowels',
    noteAr: 'حرف r يغيّر صوت الحركة قبله، فيصيران صوتًا واحدًا.',
    sounds: [
      { id: 'ar', symbol: 'ar', hintAr: 'صوت «آر»', words: [
        { word: 'car', ar: 'سيارة', ipa: '/kɑːr/' },
        { word: 'star', ar: 'نجمة', ipa: '/stɑːr/' },
      ] },
      { id: 'or', symbol: 'or', hintAr: 'صوت «أور»', words: [
        { word: 'fork', ar: 'شوكة', ipa: '/fɔːk/' },
        { word: 'horse', ar: 'حصان', ipa: '/hɔːs/' },
      ] },
      { id: 'er', symbol: 'er', hintAr: 'صوت «إر» خفيف', words: [
        { word: 'her', ar: 'لها', ipa: '/hɜːr/' },
        { word: 'teacher', ar: 'معلم', ipa: '/ˈtiː.tʃər/' },
      ] },
      { id: 'ir', symbol: 'ir', hintAr: 'صوت «إر»', words: [
        { word: 'bird', ar: 'عصفور', ipa: '/bɜːd/' },
        { word: 'girl', ar: 'فتاة', ipa: '/ɡɜːl/' },
      ] },
      { id: 'ur', symbol: 'ur', hintAr: 'صوت «إر»', words: [
        { word: 'turn', ar: 'يستدير', ipa: '/tɜːn/' },
        { word: 'nurse', ar: 'ممرضة', ipa: '/nɜːs/' },
      ] },
    ],
  },
  {
    id: 'diphthongs',
    titleAr: 'الأصوات المزدوجة',
    titleEn: 'Diphthongs',
    noteAr: 'صوت يبدأ من حركة وينزلق إلى أخرى داخل المقطع نفسه.',
    sounds: [
      { id: 'ai-d', symbol: 'aɪ', hintAr: 'ينزلق من «آ» إلى «إي»', words: [
        { word: 'my', ar: 'لي', ipa: '/maɪ/' },
        { word: 'five', ar: 'خمسة', ipa: '/faɪv/' },
      ] },
      { id: 'au-d', symbol: 'aʊ', hintAr: 'ينزلق من «آ» إلى «أو»', words: [
        { word: 'now', ar: 'الآن', ipa: '/naʊ/' },
        { word: 'house', ar: 'منزل', ipa: '/haʊs/' },
      ] },
      { id: 'oi-d', symbol: 'ɔɪ', hintAr: 'ينزلق من «أو» إلى «إي»', words: [
        { word: 'boy', ar: 'ولد', ipa: '/bɔɪ/' },
        { word: 'coin', ar: 'عملة', ipa: '/kɔɪn/' },
      ] },
      { id: 'ei-d', symbol: 'eɪ', hintAr: 'ينزلق من «إيه» إلى «إي»', words: [
        { word: 'say', ar: 'يقول', ipa: '/seɪ/' },
        { word: 'day', ar: 'يوم', ipa: '/deɪ/' },
      ] },
      { id: 'ou-d', symbol: 'əʊ', hintAr: 'ينزلق من «أو» إلى «أو»', words: [
        { word: 'go', ar: 'يذهب', ipa: '/ɡəʊ/' },
        { word: 'home', ar: 'منزل', ipa: '/həʊm/' },
      ] },
    ],
  },
  {
    id: 'silent-letters',
    titleAr: 'الحروف الصامتة',
    titleEn: 'Silent Letters',
    noteAr: 'نكتبها ولا ننطقها — تعلّمها كصورة كاملة للكلمة.',
    sounds: [
      { id: 'kn', symbol: 'kn', hintAr: 'k صامتة', words: [
        { word: 'knee', ar: 'ركبة', ipa: '/niː/' },
        { word: 'know', ar: 'يعرف', ipa: '/nəʊ/' },
      ] },
      { id: 'wr', symbol: 'wr', hintAr: 'w صامتة', words: [
        { word: 'write', ar: 'يكتب', ipa: '/raɪt/' },
        { word: 'wrong', ar: 'خطأ', ipa: '/rɒŋ/' },
      ] },
      { id: 'mb', symbol: 'mb', hintAr: 'b صامتة في النهاية', words: [
        { word: 'thumb', ar: 'إبهام', ipa: '/θʌm/' },
        { word: 'comb', ar: 'مشط', ipa: '/kəʊm/' },
      ] },
      { id: 'gh', symbol: 'gh', hintAr: 'gh صامتة غالبًا', words: [
        { word: 'night', ar: 'ليل', ipa: '/naɪt/' },
        { word: 'light', ar: 'ضوء', ipa: '/laɪt/' },
      ] },
      { id: 'silent-h', symbol: 'h', hintAr: 'h صامتة في بعض الكلمات', words: [
        { word: 'hour', ar: 'ساعة', ipa: '/ˈaʊ.ər/' },
        { word: 'honest', ar: 'صادق', ipa: '/ˈɒn.ɪst/' },
      ] },
      { id: 'silent-l', symbol: 'l', hintAr: 'l صامتة قبل k أو m', words: [
        { word: 'walk', ar: 'يمشي', ipa: '/wɔːk/' },
        { word: 'calm', ar: 'هادئ', ipa: '/kɑːm/' },
      ] },
    ],
  },
  {
    id: 'c-g',
    titleAr: 'C و G: صلب ولين',
    titleEn: 'Soft & Hard C/G',
    noteAr: 'قبل e أو i أو y يصبح الصوت لينًا؛ قبل a/o/u يبقى صلبًا.',
    sounds: [
      { id: 'c-soft', symbol: 'c', hintAr: 'لين «س» قبل e/i/y', words: [
        { word: 'city', ar: 'مدينة', ipa: '/ˈsɪt.i/' },
        { word: 'ice', ar: 'جليد', ipa: '/aɪs/' },
      ] },
      { id: 'c-hard', symbol: 'c', hintAr: 'صلب «ك» قبل a/o/u', words: [
        { word: 'cat', ar: 'قطة', ipa: '/kæt/' },
        { word: 'cake', ar: 'كعكة', ipa: '/keɪk/' },
      ] },
      { id: 'g-soft', symbol: 'g', hintAr: 'لين «ج» قبل e/i/y', words: [
        { word: 'giant', ar: 'عملاق', ipa: '/ˈdʒaɪ.ənt/' },
        { word: 'gym', ar: 'صالة رياضية', ipa: '/dʒɪm/' },
      ] },
      { id: 'g-hard', symbol: 'g', hintAr: 'صلب «غ» قبل a/o/u', words: [
        { word: 'goat', ar: 'ماعز', ipa: '/ɡəʊt/' },
        { word: 'game', ar: 'لعبة', ipa: '/ɡeɪm/' },
      ] },
    ],
  },
  {
    id: 'schwa',
    titleAr: 'صوت Schwa',
    titleEn: 'The Schwa',
    noteAr: 'أخف صوت في الإنجليزية: مقطع صغير جدًا يشبه «ـَه».',
    sounds: [
      { id: 'schwa', symbol: 'ə', hintAr: 'صوت خفيف جدًا وغير مشدّد', words: [
        { word: 'about', ar: 'عن / حول', ipa: '/əˈbaʊt/' },
        { word: 'banana', ar: 'موز', ipa: '/bəˈnɑː.nə/' },
        { word: 'teacher', ar: 'معلم', ipa: '/ˈtiː.tʃər/' },
        { word: 'sofa', ar: 'أريكة', ipa: '/ˈsəʊ.fə/' },
      ] },
    ],
  },
];
