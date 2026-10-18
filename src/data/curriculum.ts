import type {
  Character,
  CategoryKey,
  DialogueLine,
  Lesson,
  Level,
  SceneType,
  VocabularyWord,
} from '../types';
import { INITIAL_LESSONS } from './lessons';
import { getArabicCharacterName } from './characterNames';
import { ADDITIONAL_LESSON_SPECS } from './additionalCurriculum';

type LessonSeed = {
  id: string;
  title: string;
  titleAr: string;
  descriptionAr: string;
  category: CategoryKey;
  scene: SceneType;
  stage: number;
  level: Level;
  people: [string, string];
  lines: [string, string][];
  words: [string, string, string, string, string][];
  learningNoteAr?: string;
};

const seeds: LessonSeed[] = [
  {
    id: 'path-l1-01', title: 'Meet the English Sounds', titleAr: 'أصوات الحروف في كلمات قصيرة',
    descriptionAr: 'لاحظ أصوات الحروف في كلمات مألوفة، ثم جرّب تهجئة اسمك ببطء.',
    category: 'grammar', scene: 'classroom', stage: 1, level: 'A1', people: ['Mia', 'Omar'],
    lines: [
      ['Listen: apple begins with the short a sound.', 'استمع: تبدأ كلمة تفاحة بصوت a القصير.'],
      ['A, apple. B, book. C, cat.', 'A مثل تفاحة، وB مثل كتاب، وC مثل قطة.'],
      ['My name is Omar. O, m, a, r.', 'اسمي عمر. تهجئته: O ثم m ثم a ثم r.'],
    ],
    words: [
      ['apple', '/ˈæpəl/', 'تفاحة', 'I eat an apple.', 'أكل تفاحة.'],
      ['book', '/bʊk/', 'كتاب', 'This is my book.', 'هذا كتابي.'],
      ['spell', '/spɛl/', 'يتهجّى', 'Can you spell your name?', 'هل يمكنك تهجئة اسمك؟'],
    ],
  },
  {
    id: 'path-l1-02', title: 'A Friendly Hello', titleAr: 'التحية والوداع ببساطة',
    descriptionAr: 'تدرّب على التحية المناسبة صباحًا، والسؤال عن الحال، والوداع.',
    category: 'greetings', scene: 'classroom', stage: 1, level: 'A1', people: ['Lina', 'Noah'],
    lines: [
      ['Good morning, Lina!', 'صباح الخير يا لينا!'],
      ['Good morning, Noah. How are you?', 'صباح الخير يا نوح. كيف حالك؟'],
      ['I am fine, thank you. See you later!', 'أنا بخير، شكرًا لك. أراك لاحقًا!'],
      ['See you!', 'إلى اللقاء!'],
    ],
    words: [
      ['good morning', '/ɡʊd ˈmɔːrnɪŋ/', 'صباح الخير', 'Good morning, everyone.', 'صباح الخير جميعًا.'],
      ['fine', '/faɪn/', 'بخير', 'I am fine today.', 'أنا بخير اليوم.'],
      ['later', '/ˈleɪtər/', 'لاحقًا', 'See you later.', 'أراك لاحقًا.'],
    ],
  },
  {
    id: 'path-l1-03', title: 'Names and Introductions', titleAr: 'الأسماء والتعارف الأول',
    descriptionAr: 'قدّم نفسك واسأل عن اسم شخص جديد مع استخدام please وthank you.',
    category: 'greetings', scene: 'park', stage: 1, level: 'A1', people: ['Sara', 'Leo'],
    lines: [
      ['Hello! My name is Sara. What is your name?', 'مرحبًا! اسمي سارة. ما اسمك؟'],
      ['I am Leo. Nice to meet you, Sara.', 'أنا ليو. سعيد بلقائك يا سارة.'],
      ['Nice to meet you too. Are you new here?', 'وأنا أيضًا سعيدة بلقائك. هل أنت جديد هنا؟'],
      ['Yes, I am. Thank you for saying hello.', 'نعم، أنا جديد. شكرًا لأنك ألقيت التحية.'],
    ],
    words: [
      ['name', '/neɪm/', 'اسم', 'My name is Sara.', 'اسمي سارة.'],
      ['meet', '/miːt/', 'يلتقي', 'It is nice to meet you.', 'سعيد بلقائك.'],
      ['new', '/nuː/', 'جديد', 'I am new at this school.', 'أنا جديد في هذه المدرسة.'],
    ],
  },
  {
    id: 'path-l1-04', title: 'I, You, and We', titleAr: 'الضمائر مع فعل be',
    descriptionAr: 'اربط الضمائر I وyou وwe بالفعل be في جمل تعريف قصيرة.',
    category: 'grammar', scene: 'classroom', stage: 1, level: 'A1', people: ['Ethan', 'Ava'],
    lines: [
      ['I am Ethan. You are Ava.', 'أنا إيثان. وأنتِ آفا.'],
      ['We are classmates, and we are in room two.', 'نحن زميلان في الصف، ونحن في الغرفة الثانية.'],
      ['Are you ready for class?', 'هل أنت مستعدة للحصة؟'],
      ['Yes, I am. We are ready!', 'نعم، أنا مستعدة. نحن جاهزان!'],
    ],
    words: [
      ['I', '/aɪ/', 'أنا', 'I am ready.', 'أنا مستعد.'],
      ['you', '/juː/', 'أنتَ / أنتِ', 'You are kind.', 'أنت لطيف.'],
      ['we', '/wiː/', 'نحن', 'We are friends.', 'نحن أصدقاء.'],
    ],
  },
  {
    id: 'path-l1-05', title: 'Numbers Around Us', titleAr: 'الأرقام والأشياء حولنا',
    descriptionAr: 'عدّ أشياء بسيطة واسأل عن عددها باستخدام how many.',
    category: 'grammar', scene: 'classroom', stage: 1, level: 'A1', people: ['Ben', 'Maya'],
    lines: [
      ['How many pencils are on the desk?', 'كم قلم رصاص على المكتب؟'],
      ['There are three pencils and two pens.', 'هناك ثلاثة أقلام رصاص وقلمان.'],
      ['Great. I have one notebook.', 'رائع. لدي دفتر واحد.'],
      ['Now we have six things to count.', 'أصبح لدينا الآن ستة أشياء لنعدّها.'],
    ],
    words: [
      ['one', '/wʌn/', 'واحد', 'I have one notebook.', 'لدي دفتر واحد.'],
      ['three', '/θriː/', 'ثلاثة', 'There are three pencils.', 'هناك ثلاثة أقلام رصاص.'],
      ['how many', '/haʊ ˈmɛni/', 'كم عدد', 'How many books do you have?', 'كم كتابًا لديك؟'],
    ],
  },
  {
    id: 'path-l1-06', title: 'Things in the Classroom', titleAr: 'أدوات الصف وأوامر بسيطة',
    descriptionAr: 'تعرّف إلى أدوات الصف واستعمل this وthat للإشارة إليها.',
    category: 'grammar', scene: 'classroom', stage: 1, level: 'A1', people: ['Nora', 'Adam'],
    lines: [
      ['What is this? Is it a ruler?', 'ما هذا؟ هل هو مسطرة؟'],
      ['Yes, this is a ruler. That is my notebook.', 'نعم، هذه مسطرة. وذلك دفتري.'],
      ['Please open your book to page five.', 'من فضلك افتح كتابك على الصفحة الخامسة.'],
      ['Here it is. Thank you, teacher.', 'تفضل، ها هو. شكرًا يا معلمة.'],
    ],
    words: [
      ['ruler', '/ˈruːlər/', 'مسطرة', 'The ruler is on the desk.', 'المسطرة على المكتب.'],
      ['page', '/peɪdʒ/', 'صفحة', 'Open to page five.', 'افتح على الصفحة الخامسة.'],
      ['this', '/ðɪs/', 'هذا / هذه', 'This is my book.', 'هذا كتابي.'],
    ],
  },
  {
    id: 'path-l1-07', title: 'Colors and Clothes', titleAr: 'الألوان ووصف الملابس',
    descriptionAr: 'استخدم الألوان لوصف ملابس بسيطة، وراجع this is وthat is.',
    category: 'shopping', scene: 'shop', stage: 1, level: 'A1', people: ['Ivy', 'Jack'],
    lines: [
      ['I like your blue shirt, Jack.', 'أعجبني قميصك الأزرق يا جاك.'],
      ['Thank you. Is your bag green?', 'شكرًا لك. هل حقيبتك خضراء؟'],
      ['No, it is red. That black hat is mine.', 'لا، إنها حمراء. تلك القبعة السوداء لي.'],
      ['The colors are easy to remember.', 'الألوان سهلة التذكر.'],
    ],
    words: [
      ['blue', '/bluː/', 'أزرق', 'My shirt is blue.', 'قميصي أزرق.'],
      ['green', '/ɡriːn/', 'أخضر', 'The green bag is mine.', 'الحقيبة الخضراء لي.'],
      ['black', '/blæk/', 'أسود', 'He has a black hat.', 'لديه قبعة سوداء.'],
    ],
  },
  {
    id: 'path-l1-08', title: 'Simple Daily Actions', titleAr: 'أفعال يومية وجمل قصيرة',
    descriptionAr: 'صف روتينًا صباحيًا بكلمات شائعة وجمل في المضارع البسيط.',
    category: 'greetings', scene: 'park', stage: 1, level: 'A1', people: ['Zoe', 'Ryan'],
    lines: [
      ['I wake up at seven.', 'أستيقظ عند الساعة السابعة.'],
      ['I wash my face and eat breakfast.', 'أغسل وجهي وأتناول الفطور.'],
      ['Do you walk to school?', 'هل تمشي إلى المدرسة؟'],
      ['Yes, I walk with my sister.', 'نعم، أمشي مع أختي.'],
    ],
    words: [
      ['wake up', '/weɪk ʌp/', 'يستيقظ', 'I wake up early.', 'أستيقظ مبكرًا.'],
      ['breakfast', '/ˈbrɛkfəst/', 'فطور', 'We eat breakfast at home.', 'نتناول الفطور في المنزل.'],
      ['walk', '/wɔːk/', 'يمشي', 'I walk to school.', 'أمشي إلى المدرسة.'],
    ],
  },
  {
    id: 'path-l1-09', title: 'Likes and Favorites', titleAr: 'ما تحبه وما تفضّله',
    descriptionAr: 'تحدث عن الأشياء التي تحبها مستخدمًا like وmy favorite.',
    category: 'greetings', scene: 'park', stage: 1, level: 'A1', people: ['Ella', 'Finn'],
    lines: [
      ['What do you like to do after school?', 'ماذا تحب أن تفعل بعد المدرسة؟'],
      ['I like to draw. My favorite color is purple.', 'أحب الرسم. ولوني المفضل هو البنفسجي.'],
      ['I like music, but I do not draw.', 'أحب الموسيقى، لكنني لا أرسم.'],
      ['That is okay. We like different things.', 'لا بأس. نحن نحب أشياء مختلفة.'],
    ],
    words: [
      ['like', '/laɪk/', 'يحب', 'I like drawing.', 'أحب الرسم.'],
      ['favorite', '/ˈfeɪvərɪt/', 'مفضّل', 'Blue is my favorite color.', 'الأزرق لوني المفضل.'],
      ['different', '/ˈdɪfərənt/', 'مختلف', 'We have different hobbies.', 'لدينا هوايات مختلفة.'],
    ],
  },
  {
    id: 'path-l2-01', title: 'Meet My Family', titleAr: 'التعريف بأفراد الأسرة',
    descriptionAr: 'قدّم أفراد الأسرة باستخدام my وhis وher في سياق عائلي.',
    category: 'greetings', scene: 'park', stage: 2, level: 'A1', people: ['Hana', 'Peter'],
    lines: [
      ['This is my brother, Sami, and this is my sister, Noor.', 'هذا أخي سامي، وهذه أختي نور.'],
      ['Who is the woman beside them?', 'من المرأة التي تقف بجانبهما؟'],
      ['She is my mother. Her name is Salma.', 'إنها أمي. اسمها سلمى.'],
      ['And the man is your father?', 'والرجل هو والدك؟'],
      ['Yes. His name is Khalid.', 'نعم. اسمه خالد.'],
    ],
    words: [
      ['brother', '/ˈbrʌðər/', 'أخ', 'My brother is ten.', 'أخي عمره عشر سنوات.'],
      ['sister', '/ˈsɪstər/', 'أخت', 'Her sister is a doctor.', 'أختها طبيبة.'],
      ['beside', '/bɪˈsaɪd/', 'بجانب', 'Sit beside your mother.', 'اجلس بجانب أمك.'],
    ],
  },
  {
    id: 'path-l2-02', title: 'Rooms at Home', titleAr: 'غرف المنزل والأثاث',
    descriptionAr: 'صف مكان الأشياء في المنزل باستخدام there is وthere are.',
    category: 'greetings', scene: 'classroom', stage: 2, level: 'A1', people: ['Mariam', 'Eli'],
    lines: [
      ['There is a sofa in the living room.', 'توجد أريكة في غرفة المعيشة.'],
      ['Is there a table beside it?', 'هل توجد طاولة بجانبها؟'],
      ['Yes, and there are two chairs near the window.', 'نعم، وهناك كرسيان قرب النافذة.'],
      ['The kitchen is across the hall.', 'المطبخ في الجهة المقابلة من الممر.'],
    ],
    words: [
      ['living room', '/ˈlɪvɪŋ ruːm/', 'غرفة المعيشة', 'We watch TV in the living room.', 'نشاهد التلفاز في غرفة المعيشة.'],
      ['sofa', '/ˈsoʊfə/', 'أريكة', 'The sofa is comfortable.', 'الأريكة مريحة.'],
      ['across', '/əˈkrɔːs/', 'في الجهة المقابلة', 'The kitchen is across the hall.', 'المطبخ في الجهة المقابلة من الممر.'],
    ],
  },
  {
    id: 'path-l2-03', title: 'Breakfast Choices', titleAr: 'اختيارات الفطور والطعام',
    descriptionAr: 'تحدث عن طعام تحبه واطلب كمية بسيطة بأدب.',
    category: 'food', scene: 'cafe', stage: 2, level: 'A1', people: ['Grace', 'Yusuf'],
    lines: [
      ['Would you like eggs or cereal for breakfast?', 'هل ترغب بالبيض أم بحبوب الإفطار؟'],
      ['I would like eggs and some toast, please.', 'أريد بعض البيض وقطعة خبز محمص، من فضلك.'],
      ['Do you want any fruit?', 'هل تريد بعض الفاكهة؟'],
      ['Yes, an orange would be great.', 'نعم، برتقالة ستكون رائعة.'],
    ],
    words: [
      ['cereal', '/ˈsɪriəl/', 'حبوب الإفطار', 'I eat cereal with milk.', 'آكل حبوب الإفطار مع الحليب.'],
      ['toast', '/toʊst/', 'خبز محمّص', 'Would you like some toast?', 'هل تريد بعض الخبز المحمص؟'],
      ['fruit', '/fruːt/', 'فاكهة', 'An orange is my favorite fruit.', 'البرتقالة فاكهتي المفضلة.'],
    ],
  },
  {
    id: 'path-l2-04', title: 'Days and the Clock', titleAr: 'أيام الأسبوع وقراءة الوقت',
    descriptionAr: 'اسأل عن موعد بسيط وميّز بين اليوم والساعة.',
    category: 'grammar', scene: 'classroom', stage: 2, level: 'A1', people: ['Layla', 'Tom'],
    lines: [
      ['What day is the music class?', 'في أي يوم حصة الموسيقى؟'],
      ['It is on Thursday at half past three.', 'إنها يوم الخميس في الثالثة والنصف.'],
      ['Is that after lunch?', 'هل يكون ذلك بعد الغداء؟'],
      ['Yes. We have lunch at one o’clock.', 'نعم. نتناول الغداء عند الساعة الواحدة.'],
    ],
    words: [
      ['Thursday', '/ˈθɜːrzdeɪ/', 'الخميس', 'We meet on Thursday.', 'نلتقي يوم الخميس.'],
      ['half past', '/hæf pæst/', 'والنصف', 'It is half past three.', 'الساعة الثالثة والنصف.'],
      ['o’clock', '/əˈklɑːk/', 'تمامًا', 'The class starts at four o’clock.', 'تبدأ الحصة عند الرابعة تمامًا.'],
    ],
  },
  {
    id: 'path-l2-05', title: 'Counting and Prices', titleAr: 'الأعداد والأسعار البسيطة',
    descriptionAr: 'اقرأ أسعارًا سهلة واسأل عن ثمن أكثر من غرض.',
    category: 'shopping', scene: 'shop', stage: 2, level: 'A1', people: ['Amir', 'Julia'],
    lines: [
      ['How much are these bananas?', 'بكم ثمن هذا الموز؟'],
      ['They are two dollars a kilo.', 'ثمنها دولاران للكيلوغرام.'],
      ['I will take one kilo and three apples.', 'سآخذ كيلوغرامًا واحدًا وثلاث تفاحات.'],
      ['That is five dollars in total.', 'المجموع خمسة دولارات.'],
    ],
    words: [
      ['how much', '/haʊ mʌtʃ/', 'كم الثمن', 'How much is this bag?', 'كم ثمن هذه الحقيبة؟'],
      ['kilo', '/ˈkiːloʊ/', 'كيلوغرام', 'A kilo of rice, please.', 'كيلوغرام من الأرز، من فضلك.'],
      ['in total', '/ɪn ˈtoʊtəl/', 'في المجموع', 'It costs ten dollars in total.', 'يكلف عشرة دولارات في المجموع.'],
    ],
  },
  {
    id: 'path-l2-06', title: 'Places in Town', titleAr: 'أماكن مألوفة في المدينة',
    descriptionAr: 'تعرّف إلى أماكن عامة وقل أين تذهب في عطلة نهاية الأسبوع.',
    category: 'travel', scene: 'street', stage: 2, level: 'A1', people: ['Dina', 'Max'],
    lines: [
      ['Where is the library?', 'أين تقع المكتبة؟'],
      ['It is next to the post office.', 'إنها بجانب مكتب البريد.'],
      ['I need to return a book before I go to the park.', 'أحتاج إلى إعادة كتاب قبل أن أذهب إلى الحديقة.'],
      ['The park is behind the library.', 'الحديقة خلف المكتبة.'],
    ],
    words: [
      ['library', '/ˈlaɪbrəri/', 'مكتبة', 'I borrow books from the library.', 'أستعير الكتب من المكتبة.'],
      ['post office', '/ˈpoʊst ˌɔːfɪs/', 'مكتب البريد', 'The post office closes at five.', 'يغلق مكتب البريد عند الخامسة.'],
      ['behind', '/bɪˈhaɪnd/', 'خلف', 'The park is behind the school.', 'الحديقة خلف المدرسة.'],
    ],
  },
  {
    id: 'path-l2-07', title: 'Weather Today', titleAr: 'الطقس وخطط اليوم',
    descriptionAr: 'صف الطقس واربطه باختيار الملابس أو تغيير خطة بسيطة.',
    category: 'greetings', scene: 'park', stage: 2, level: 'A1', people: ['Rami', 'Sophie'],
    lines: [
      ['It is cloudy today. Do you think it will rain?', 'الجو غائم اليوم. هل تعتقد أنها ستمطر؟'],
      ['Maybe. Take your umbrella with you.', 'ربما. خذ مظلتك معك.'],
      ['Good idea. It is cold, so I will wear my coat.', 'فكرة جيدة. الجو بارد، لذا سأرتدي معطفي.'],
      ['We can play inside if it rains.', 'يمكننا اللعب في الداخل إذا أمطرت.'],
    ],
    words: [
      ['cloudy', '/ˈklaʊdi/', 'غائم', 'It is cloudy this morning.', 'الجو غائم هذا الصباح.'],
      ['umbrella', '/ʌmˈbrɛlə/', 'مظلة', 'Take an umbrella in the rain.', 'خذ مظلة عند هطول المطر.'],
      ['coat', '/koʊt/', 'معطف', 'My coat is warm.', 'معطفي دافئ.'],
    ],
  },
  {
    id: 'path-l2-08', title: 'Simple Questions', titleAr: 'أسئلة يومية قصيرة',
    descriptionAr: 'كوّن أسئلة باستخدام do وdoes وراجع إجابات نعم ولا.',
    category: 'grammar', scene: 'classroom', stage: 2, level: 'A1', people: ['Nadia', 'Chris'],
    lines: [
      ['Do you play tennis after school?', 'هل تلعب التنس بعد المدرسة؟'],
      ['No, I do not. I play basketball on Fridays.', 'لا، لا ألعبه. ألعب كرة السلة أيام الجمعة.'],
      ['Does your brother play too?', 'هل يلعب أخوك أيضًا؟'],
      ['Yes, he does, but he prefers football.', 'نعم، يلعب، لكنه يفضّل كرة القدم.'],
    ],
    words: [
      ['after school', '/ˈæftər skuːl/', 'بعد المدرسة', 'We study after school.', 'ندرس بعد المدرسة.'],
      ['Friday', '/ˈfraɪdeɪ/', 'الجمعة', 'The game is on Friday.', 'المباراة يوم الجمعة.'],
      ['prefer', '/prɪˈfɜːr/', 'يفضّل', 'I prefer tea to coffee.', 'أفضّل الشاي على القهوة.'],
    ],
  },
  {
    id: 'path-l2-09', title: 'Finding a Street', titleAr: 'السؤال عن شارع قريب',
    descriptionAr: 'افهم توجيهات قصيرة باستخدام go straight وturn left.',
    category: 'travel', scene: 'street', stage: 2, level: 'A1', people: ['Hadi', 'Emily'],
    lines: [
      ['Excuse me, how do I get to King Street?', 'عذرًا، كيف أصل إلى شارع كينغ؟'],
      ['Go straight for two blocks, then turn left.', 'تابع مستقيمًا لمسارين، ثم انعطف يسارًا.'],
      ['Is the bus stop on that street?', 'هل موقف الحافلة في ذلك الشارع؟'],
      ['Yes, it is opposite the small bank.', 'نعم، إنه مقابل المصرف الصغير.'],
    ],
    words: [
      ['go straight', '/ɡoʊ streɪt/', 'تابع مستقيمًا', 'Go straight to the traffic lights.', 'تابع مستقيمًا حتى إشارة المرور.'],
      ['turn left', '/tɜːrn lɛft/', 'انعطف يسارًا', 'Turn left at the corner.', 'انعطف يسارًا عند الزاوية.'],
      ['opposite', '/ˈɑːpəzɪt/', 'مقابل', 'The café is opposite the bank.', 'المقهى مقابل المصرف.'],
    ],
  },
  {
    id: 'path-l2-10', title: 'A Grocery List', titleAr: 'قائمة مشتريات من البقالة',
    descriptionAr: 'اطلب حاجات منزلية بكمية مناسبة وراجع some وany.',
    category: 'food', scene: 'shop', stage: 2, level: 'A1', people: ['Mona', 'David'],
    lines: [
      ['We need some rice, tomatoes, and milk.', 'نحتاج إلى بعض الأرز والطماطم والحليب.'],
      ['Do we have any bread at home?', 'هل لدينا أي خبز في المنزل؟'],
      ['No, please buy two loaves and a bottle of milk.', 'لا، من فضلك اشترِ رغيفين وزجاجة حليب.'],
      ['I will get everything on the list.', 'سأشتري كل شيء في القائمة.'],
    ],
    words: [
      ['rice', '/raɪs/', 'أرز', 'We cook rice for dinner.', 'نطبخ الأرز للعشاء.'],
      ['loaf', '/loʊf/', 'رغيف', 'Please buy one loaf of bread.', 'من فضلك اشترِ رغيف خبز واحدًا.'],
      ['list', '/lɪst/', 'قائمة', 'The shopping list is on the table.', 'قائمة المشتريات على الطاولة.'],
    ],
  },
  {
    id: 'path-l3-01', title: 'A Weekday Routine', titleAr: 'روتين يوم عمل مزدحم',
    descriptionAr: 'رتّب أنشطة اليوم باستخدام usually وbefore وafter.',
    category: 'work', scene: 'office', stage: 3, level: 'A2', people: ['Rosa', 'Michael'],
    lines: [
      ['I usually check my schedule before breakfast.', 'عادةً أراجع جدولي قبل الفطور.'],
      ['Do you take the train to work?', 'هل تستقل القطار إلى العمل؟'],
      ['Yes. After I arrive, I answer urgent messages first.', 'نعم. بعد وصولي، أجيب عن الرسائل العاجلة أولًا.'],
      ['That sounds organized. I prepare my lunch the night before.', 'يبدو ذلك منظمًا. أجهز غدائي في الليلة السابقة.'],
    ],
    words: [
      ['usually', '/ˈjuːʒuəli/', 'عادةً', 'I usually walk to work.', 'عادةً أمشي إلى العمل.'],
      ['schedule', '/ˈskɛdʒuːl/', 'جدول', 'My schedule is busy today.', 'جدولي مزدحم اليوم.'],
      ['urgent', '/ˈɜːrdʒənt/', 'عاجل', 'Please answer the urgent email.', 'من فضلك أجب عن البريد العاجل.'],
    ],
  },
  {
    id: 'path-l3-02', title: 'Asking for Directions', titleAr: 'فهم الاتجاهات في حي جديد',
    descriptionAr: 'اجمع أكثر من توجيه لتصل إلى محطة القطار بأمان.',
    category: 'travel', scene: 'street', stage: 3, level: 'A2', people: ['Salim', 'Claire'],
    lines: [
      ['Could you tell me the quickest way to the station?', 'هل يمكنك إخباري بأسرع طريق إلى المحطة؟'],
      ['Cross the bridge and keep walking until you see a pharmacy.', 'اعبر الجسر وتابع المشي حتى ترى صيدلية.'],
      ['Should I turn right there?', 'هل ينبغي أن أنعطف يمينًا هناك؟'],
      ['Exactly. The entrance is between the pharmacy and the bakery.', 'بالضبط. المدخل بين الصيدلية والمخبز.'],
    ],
    words: [
      ['quickest', '/ˈkwɪkɪst/', 'الأسرع', 'This is the quickest route.', 'هذا أسرع طريق.'],
      ['cross', '/krɔːs/', 'يعبر', 'Cross the road carefully.', 'اعبر الطريق بحذر.'],
      ['entrance', '/ˈɛntrəns/', 'مدخل', 'The entrance is on your left.', 'المدخل على يسارك.'],
    ],
  },
  {
    id: 'path-l3-03', title: 'Describing a Person', titleAr: 'وصف المظهر والشخصية',
    descriptionAr: 'ميّز بين وصف الشكل ووصف الشخصية باستخدام صفات شائعة.',
    category: 'greetings', scene: 'park', stage: 3, level: 'A2', people: ['Amal', 'George'],
    lines: [
      ['What is your new coach like?', 'كيف هي شخصية مدربك الجديد؟'],
      ['He is patient and cheerful, and he explains things clearly.', 'إنه صبور ومبتهج، ويشرح الأمور بوضوح.'],
      ['What does he look like?', 'كيف يبدو شكله؟'],
      ['He is tall, with curly hair and glasses.', 'إنه طويل، وله شعر مجعد ويرتدي نظارة.'],
    ],
    words: [
      ['patient', '/ˈpeɪʃənt/', 'صبور', 'A patient teacher listens carefully.', 'المعلم الصبور يستمع بانتباه.'],
      ['cheerful', '/ˈtʃɪrfəl/', 'مبتهج', 'She is cheerful in the morning.', 'هي مبتهجة في الصباح.'],
      ['curly', '/ˈkɜːrli/', 'مجعد', 'He has curly hair.', 'لديه شعر مجعد.'],
    ],
  },
  {
    id: 'path-l3-04', title: 'Talking About Yesterday', titleAr: 'حكاية نشاط قمت به أمس',
    descriptionAr: 'استخدم الماضي البسيط لوصف زيارة قصيرة وما أعجبك فيها.',
    category: 'greetings', scene: 'park', stage: 3, level: 'A2', people: ['Yara', 'Henry'],
    lines: [
      ['What did you do yesterday afternoon?', 'ماذا فعلت بعد ظهر أمس؟'],
      ['I visited the science museum with my cousin.', 'زرت متحف العلوم مع ابن عمي.'],
      ['Did you see the space exhibition?', 'هل شاهدت معرض الفضاء؟'],
      ['Yes, we learned how astronauts train for long missions.', 'نعم، تعلمنا كيف يتدرب رواد الفضاء للبعثات الطويلة.'],
    ],
    words: [
      ['visited', '/ˈvɪzɪtɪd/', 'زار', 'We visited the museum yesterday.', 'زرنا المتحف أمس.'],
      ['exhibition', '/ˌɛksɪˈbɪʃən/', 'معرض', 'The art exhibition opens today.', 'يفتتح معرض الفن اليوم.'],
      ['mission', '/ˈmɪʃən/', 'مهمة', 'The team completed its mission.', 'أكمل الفريق مهمته.'],
    ],
  },
  {
    id: 'path-l3-05', title: 'A Change of Plans', titleAr: 'تغيير خطة بسبب الطقس',
    descriptionAr: 'اشرح ما حدث في الماضي، ثم اقترح بديلًا باستخدام because.',
    category: 'greetings', scene: 'park', stage: 3, level: 'A2', people: ['Rita', 'Sam'],
    lines: [
      ['We planned to have a picnic, but it started raining.', 'خططنا لإقامة نزهة، لكن المطر بدأ يهطل.'],
      ['Did you cancel the whole plan?', 'هل ألغيت الخطة كلها؟'],
      ['No. We moved lunch indoors because the weather changed.', 'لا. نقلنا الغداء إلى الداخل لأن الطقس تغير.'],
      ['That was sensible. We can go to the lake next Sunday.', 'كان ذلك تصرفًا حكيمًا. يمكننا الذهاب إلى البحيرة الأحد القادم.'],
    ],
    words: [
      ['planned', '/plænd/', 'خطط', 'We planned a picnic for Saturday.', 'خططنا لنزهة يوم السبت.'],
      ['cancel', '/ˈkænsəl/', 'يلغي', 'They did not cancel the trip.', 'لم يلغوا الرحلة.'],
      ['indoors', '/ˌɪnˈdɔːrz/', 'في الداخل', 'Let us eat indoors today.', 'لنتناول الطعام في الداخل اليوم.'],
    ],
  },
  {
    id: 'path-l3-06', title: 'Plans for the Weekend', titleAr: 'خطط قريبة لعطلة الأسبوع',
    descriptionAr: 'تحدث عن خطط المستقبل القريب باستخدام be going to.',
    category: 'greetings', scene: 'park', stage: 3, level: 'A2', people: ['Hassan', 'Olivia'],
    lines: [
      ['What are you going to do this weekend?', 'ماذا ستفعل في عطلة نهاية الأسبوع؟'],
      ['I am going to visit my aunt and help in her garden.', 'سأزور عمتي وأساعدها في حديقتها.'],
      ['Are you going to take the early bus?', 'هل ستستقل الحافلة المبكرة؟'],
      ['No, we are going to drive after lunch.', 'لا، سنذهب بالسيارة بعد الغداء.'],
    ],
    words: [
      ['weekend', '/ˈwiːkɛnd/', 'عطلة نهاية الأسبوع', 'We relax on the weekend.', 'نستريح في عطلة نهاية الأسبوع.'],
      ['garden', '/ˈɡɑːrdən/', 'حديقة', 'My aunt grows herbs in her garden.', 'تزرع عمتي الأعشاب في حديقتها.'],
      ['early', '/ˈɜːrli/', 'مبكر', 'The early bus is less crowded.', 'الحافلة المبكرة أقل ازدحامًا.'],
    ],
  },
  {
    id: 'path-l3-07', title: 'Getting Around by Bus', titleAr: 'التنقل بالحافلة وشراء التذكرة',
    descriptionAr: 'اسأل عن خط الحافلة وموعد النزول في محطة مناسبة.',
    category: 'travel', scene: 'street', stage: 3, level: 'A2', people: ['Nabil', 'Kate'],
    lines: [
      ['Does this bus go to the city museum?', 'هل تذهب هذه الحافلة إلى متحف المدينة؟'],
      ['Yes, but you need to change at Central Square.', 'نعم، لكن عليك تبديل الحافلة في الساحة المركزية.'],
      ['How many stops is it from here?', 'كم محطة تبعد من هنا؟'],
      ['Four stops. Press the button when you see the market.', 'أربع محطات. اضغط الزر عندما ترى السوق.'],
    ],
    words: [
      ['change', '/tʃeɪndʒ/', 'يبدّل / يغيّر', 'Change buses at the next stop.', 'بدّل الحافلة عند المحطة التالية.'],
      ['stop', '/stɑːp/', 'محطة', 'Our stop is near the market.', 'محطتنا قرب السوق.'],
      ['press', '/prɛs/', 'يضغط', 'Press the button before your stop.', 'اضغط الزر قبل محطتك.'],
    ],
  },
  {
    id: 'path-l3-08', title: 'Hobbies and Comparisons', titleAr: 'الهوايات والمقارنة بين الأنشطة',
    descriptionAr: 'قارن بين هوايتين ووضح أيهما تفضّل والسبب.',
    category: 'greetings', scene: 'park', stage: 3, level: 'A2', people: ['Reem', 'Lucas'],
    lines: [
      ['Is cycling more relaxing than running?', 'هل ركوب الدراجة أكثر استرخاءً من الجري؟'],
      ['For me, cycling is easier, but running is cheaper.', 'بالنسبة لي، ركوب الدراجة أسهل، لكن الجري أقل تكلفة.'],
      ['I prefer running because I can do it anywhere.', 'أفضل الجري لأنني أستطيع ممارسته في أي مكان.'],
      ['That makes sense. I will try it with you tomorrow.', 'هذا منطقي. سأجربه معك غدًا.'],
    ],
    words: [
      ['cycling', '/ˈsaɪklɪŋ/', 'ركوب الدراجة', 'Cycling is good exercise.', 'ركوب الدراجة تمرين جيد.'],
      ['cheaper', '/ˈtʃiːpər/', 'أقل تكلفة', 'The local pool is cheaper.', 'المسبح المحلي أقل تكلفة.'],
      ['prefer', '/prɪˈfɜːr/', 'يفضّل', 'I prefer walking in the evening.', 'أفضل المشي مساءً.'],
    ],
  },
  {
    id: 'path-l4-01', title: 'A Delayed Flight', titleAr: 'التعامل مع تأخر رحلة جوية',
    descriptionAr: 'اطلب توضيحًا عن سبب التأخير وخيارات تغيير الحجز.',
    category: 'travel', scene: 'airport', stage: 4, level: 'B1', people: ['Tariq', 'Megan'],
    lines: [
      ['The screen says our flight has been delayed by two hours.', 'تظهر الشاشة أن رحلتنا تأخرت ساعتين.'],
      ['I am sorry about that. We are waiting for the incoming aircraft.', 'أعتذر عن ذلك. نحن ننتظر وصول الطائرة القادمة.'],
      ['Could you tell us whether our connection is still possible?', 'هل يمكنك إخبارنا إن كان بإمكاننا اللحاق برحلة المتابعة؟'],
      ['I will check. If you miss it, we can rebook you at no extra charge.', 'سأتحقق. إذا فاتتكم، يمكننا إعادة الحجز دون رسوم إضافية.'],
      ['Thank you. Please let us know as soon as you have an update.', 'شكرًا لك. يرجى إبلاغنا فور توفر أي مستجدات.'],
    ],
    words: [
      ['delayed', '/dɪˈleɪd/', 'متأخر', 'The train was delayed by an hour.', 'تأخر القطار ساعة.'],
      ['connection', '/kəˈnɛkʃən/', 'رحلة متابعة', 'We have a short connection in Rome.', 'لدينا رحلة متابعة بفترة انتظار قصيرة في روما.'],
      ['rebook', '/ˌriːˈbʊk/', 'يعيد الحجز', 'The airline can rebook our seats.', 'يمكن لشركة الطيران إعادة حجز مقاعدنا.'],
    ],
  },
  {
    id: 'path-l4-02', title: 'Contributing in a Meeting', titleAr: 'المشاركة بوضوح في اجتماع عمل',
    descriptionAr: 'اقترح فكرة واطلب توضيح نقطة قبل الاتفاق على الخطوة التالية.',
    category: 'work', scene: 'office', stage: 4, level: 'B1', people: ['Farah', 'Daniel'],
    lines: [
      ['Before we move on, I would like to suggest a shorter customer survey.', 'قبل أن ننتقل، أود اقتراح استبيان أقصر للعملاء.'],
      ['That could improve the response rate, although we should keep the key questions.', 'قد يحسن ذلك معدل الاستجابة، مع أننا ينبغي أن نبقي الأسئلة الأساسية.'],
      ['Agreed. Could you clarify which questions are essential?', 'متفق. هل يمكنك توضيح الأسئلة الضرورية؟'],
      ['The questions about delivery time and product quality are the most useful.', 'الأسئلة المتعلقة بموعد التوصيل وجودة المنتج هي الأكثر فائدة.'],
      ['I will draft a revised version and share it by Thursday.', 'سأعد نسخة منقحة وأشاركها يوم الخميس.'],
    ],
    words: [
      ['suggest', '/səˈdʒɛst/', 'يقترح', 'I suggest starting with the main issue.', 'أقترح أن نبدأ بالمشكلة الأساسية.'],
      ['response rate', '/rɪˈspɑːns reɪt/', 'معدل الاستجابة', 'The response rate increased this month.', 'ارتفع معدل الاستجابة هذا الشهر.'],
      ['clarify', '/ˈklærəfaɪ/', 'يوضّح', 'Could you clarify the deadline?', 'هل يمكنك توضيح الموعد النهائي؟'],
    ],
  },
  {
    id: 'path-l4-03', title: 'Preparing a Class Presentation', titleAr: 'الاستعداد لعرض دراسي جماعي',
    descriptionAr: 'قسّموا الأدوار واتفقوا على مقدمة وأمثلة وخاتمة واضحة.',
    category: 'grammar', scene: 'classroom', stage: 4, level: 'B1', people: ['Noor', 'Evan'],
    lines: [
      ['Our presentation needs a clearer opening to hold the audience’s attention.', 'يحتاج عرضنا إلى افتتاحية أوضح لجذب انتباه الجمهور.'],
      ['We could begin with a short example from our survey.', 'يمكننا أن نبدأ بمثال قصير من استبياننا.'],
      ['Good idea. I will explain the results, and you can introduce the topic.', 'فكرة جيدة. سأشرح النتائج، ويمكنك تقديم الموضوع.'],
      ['Then we should leave time for questions at the end.', 'ثم ينبغي أن نترك وقتًا للأسئلة في النهاية.'],
      ['Let us rehearse once tomorrow and adjust the timing.', 'لنتدرب مرة غدًا ونعدّل التوقيت.'],
    ],
    words: [
      ['audience', '/ˈɔːdiəns/', 'جمهور', 'The audience asked thoughtful questions.', 'طرح الجمهور أسئلة مدروسة.'],
      ['results', '/rɪˈzʌlts/', 'نتائج', 'The results support our idea.', 'تدعم النتائج فكرتنا.'],
      ['rehearse', '/rɪˈhɜːrs/', 'يتدرّب على العرض', 'We rehearse before the presentation.', 'نتدرب قبل العرض.'],
    ],
  },
  {
    id: 'path-l4-04', title: 'Sharing an Opinion', titleAr: 'التعبير عن رأي مع تقديم سبب',
    descriptionAr: 'قدّم رأيًا متوازنًا وادعمه بمثال دون تحويل الحوار إلى جدال.',
    category: 'greetings', scene: 'park', stage: 4, level: 'B1', people: ['Mariam', 'Oliver'],
    lines: [
      ['What did you think of the documentary?', 'ما رأيك في الفيلم الوثائقي؟'],
      ['I found it convincing, especially the interviews with local residents.', 'وجدته مقنعًا، وخصوصًا المقابلات مع السكان المحليين.'],
      ['I agree about the interviews, but the ending felt a little rushed.', 'أتفق بشأن المقابلات، لكن النهاية بدت متسرعة قليلًا.'],
      ['That is fair. Perhaps they needed more time to explain the solution.', 'هذا رأي وجيه. ربما احتاجوا إلى وقت أطول لشرح الحل.'],
    ],
    words: [
      ['documentary', '/ˌdɑːkjəˈmɛntəri/', 'فيلم وثائقي', 'We watched a documentary about oceans.', 'شاهدنا فيلمًا وثائقيًا عن المحيطات.'],
      ['convincing', '/kənˈvɪnsɪŋ/', 'مقنع', 'She gave a convincing explanation.', 'قدمت تفسيرًا مقنعًا.'],
      ['rushed', '/rʌʃt/', 'متسرّع', 'The final scene felt rushed.', 'بدت اللقطة الأخيرة متسرعة.'],
    ],
  },
  {
    id: 'path-l4-05', title: 'Rescheduling an Appointment', titleAr: 'تغيير موعد بطريقة مهذبة',
    descriptionAr: 'اشرح تعارضًا في الجدول واقترح وقتًا بديلًا بعبارات لبقة.',
    category: 'health', scene: 'clinic', stage: 4, level: 'B1', people: ['Huda', 'James'],
    lines: [
      ['I am afraid I cannot make the appointment on Wednesday afternoon.', 'أخشى أنني لن أتمكن من الحضور إلى الموعد عصر الأربعاء.'],
      ['No problem. Would Thursday morning work instead?', 'لا مشكلة. هل يناسبك صباح الخميس بدلًا من ذلك؟'],
      ['Could we make it a little later, around eleven?', 'هل يمكن أن نجعله متأخرًا قليلًا، نحو الساعة الحادية عشرة؟'],
      ['Certainly. I have moved your appointment to eleven fifteen.', 'بالتأكيد. نقلت موعدك إلى الحادية عشرة والربع.'],
    ],
    words: [
      ['make an appointment', '/meɪk ən əˈpɔɪntmənt/', 'يحجز موعدًا', 'I need to make an appointment.', 'أحتاج إلى حجز موعد.'],
      ['instead', '/ɪnˈstɛd/', 'بدلًا من ذلك', 'Let us meet on Friday instead.', 'لنلتقِ يوم الجمعة بدلًا من ذلك.'],
      ['certainly', '/ˈsɜːrtənli/', 'بالتأكيد', 'Certainly, I can help you.', 'بالتأكيد، يمكنني مساعدتك.'],
    ],
  },
  {
    id: 'path-l4-06', title: 'Solving a Restaurant Mix-up', titleAr: 'حل مشكلة في طلب مطعم بهدوء',
    descriptionAr: 'اشرح أن الطلب مختلف واطلب تصحيحه بوضوح واحترام.',
    category: 'food', scene: 'cafe', stage: 4, level: 'B1', people: ['Aisha', 'Ben'],
    lines: [
      ['Excuse me, I think there has been a mix-up with our order.', 'عذرًا، أظن أن هناك التباسًا في طلبنا.'],
      ['I am sorry. What seems to be wrong?', 'أعتذر. ما المشكلة؟'],
      ['We ordered the vegetable soup, but this is the chicken soup.', 'طلبنا حساء الخضار، لكن هذا حساء الدجاج.'],
      ['You are right. I will replace it and bring the correct dish shortly.', 'أنت محق. سأستبدله وأحضر الطبق الصحيح بعد قليل.'],
      ['Thank you for sorting that out.', 'شكرًا لك على معالجة الأمر.'],
    ],
    words: [
      ['mix-up', '/ˈmɪks ʌp/', 'التباس', 'There was a mix-up with the booking.', 'حدث التباس في الحجز.'],
      ['replace', '/rɪˈpleɪs/', 'يستبدل', 'Could you replace this cup?', 'هل يمكنك استبدال هذا الكوب؟'],
      ['sort out', '/sɔːrt aʊt/', 'يعالج / يحل', 'We can sort out the problem together.', 'يمكننا حل المشكلة معًا.'],
    ],
  },
  {
    id: 'path-l5-01', title: 'Making Natural Small Talk', titleAr: 'بدء حديث عابر بطريقة طبيعية',
    descriptionAr: 'ابدأ حديثًا خفيفًا في مناسبة، ثم انتقل إلى سؤال مفتوح ومتابعة مناسبة.',
    category: 'greetings', scene: 'park', stage: 5, level: 'B2', people: ['Nadine', 'Theo'],
    lines: [
      ['Have you been to one of these community events before?', 'هل سبق أن حضرت فعالية مجتمعية كهذه؟'],
      ['A couple of times. I usually come for the local food stalls.', 'مرتين تقريبًا. أحضر عادةً من أجل أكشاك الطعام المحلي.'],
      ['They are excellent. Is there anything else you would recommend?', 'إنها ممتازة. هل هناك شيء آخر تنصح به؟'],
      ['The short film screening starts in a few minutes, and it is surprisingly good.', 'يبدأ عرض الفيلم القصير بعد دقائق، وهو جيد على نحو مفاجئ.'],
      ['That sounds worth checking out. Thanks for the tip.', 'يبدو أنه يستحق المشاهدة. شكرًا على النصيحة.'],
    ],
    words: [
      ['a couple of', '/ə ˈkʌpəl əv/', 'اثنان تقريبًا / بضعة', 'I have visited a couple of times.', 'زرت المكان بضع مرات.'],
      ['screening', '/ˈskriːnɪŋ/', 'عرض فيلم', 'The screening begins at six.', 'يبدأ عرض الفيلم في السادسة.'],
      ['worth checking out', '/wɜːrθ ˈtʃɛkɪŋ aʊt/', 'يستحق الاطلاع', 'The new exhibition is worth checking out.', 'المعرض الجديد يستحق الاطلاع.'],
    ],
  },
  {
    id: 'path-l5-02', title: 'Disagreeing with Tact', titleAr: 'الاختلاف في الرأي بلباقة',
    descriptionAr: 'اعترف بجزء من رأي الطرف الآخر ثم اشرح تحفظك واقترح حلًا وسطًا.',
    category: 'work', scene: 'office', stage: 5, level: 'B2', people: ['Rana', 'Miles'],
    lines: [
      ['I see why you favor launching the feature this month.', 'أفهم سبب تفضيلك إطلاق الميزة هذا الشهر.'],
      ['The early feedback has been encouraging, after all.', 'فالتعليقات الأولية كانت مشجعة بالفعل.'],
      ['I agree the idea is promising; my concern is that support is not ready.', 'أتفق أن الفكرة واعدة؛ لكن قلقي هو أن فريق الدعم غير مستعد.'],
      ['That is a fair point. What if we invite a smaller pilot group first?', 'هذه ملاحظة وجيهة. ما رأيك أن ندعو مجموعة تجريبية أصغر أولًا؟'],
      ['That would let us learn quickly without overpromising.', 'سيسمح لنا ذلك بالتعلم بسرعة دون تقديم وعود أكبر مما نستطيع.'],
    ],
    words: [
      ['favor', '/ˈfeɪvər/', 'يؤيد / يفضّل', 'Most colleagues favor the revised plan.', 'يؤيد معظم الزملاء الخطة المنقحة.'],
      ['promising', '/ˈprɑːmɪsɪŋ/', 'واعد', 'The early results look promising.', 'تبدو النتائج المبكرة واعدة.'],
      ['pilot group', '/ˈpaɪlət ɡruːp/', 'مجموعة تجريبية', 'A pilot group will test the new service.', 'ستختبر مجموعة تجريبية الخدمة الجديدة.'],
    ],
  },
  {
    id: 'path-l5-03', title: 'Giving Useful Advice', titleAr: 'تقديم نصيحة عملية مع التحفظ',
    descriptionAr: 'قدّم اقتراحًا قابلًا للتنفيذ باستخدام might وif I were you.',
    category: 'work', scene: 'office', stage: 5, level: 'B2', people: ['Samar', 'Elliot'],
    lines: [
      ['I keep losing track of the tasks that arrive during meetings.', 'أفقد باستمرار تتبّع المهام التي تظهر أثناء الاجتماعات.'],
      ['If I were you, I would note the owner and deadline as soon as each task comes up.', 'لو كنت مكانك، لدوّنت المسؤول والموعد النهائي بمجرد ظهور كل مهمة.'],
      ['I might also block ten minutes after each meeting to update the list.', 'وقد أخصص أيضًا عشر دقائق بعد كل اجتماع لتحديث القائمة.'],
      ['That sounds manageable. I will try it for a week and see whether it helps.', 'يبدو ذلك ممكنًا. سأجربه أسبوعًا لأرى إن كان مفيدًا.'],
    ],
    words: [
      ['lose track of', '/luːz træk əv/', 'يفقد تتبّع', 'I lose track of time when I read.', 'أفقد الإحساس بالوقت عندما أقرأ.'],
      ['deadline', '/ˈdɛdlaɪn/', 'موعد نهائي', 'The deadline is next Tuesday.', 'الموعد النهائي الثلاثاء القادم.'],
      ['manageable', '/ˈmænɪdʒəbəl/', 'يمكن التعامل معه', 'The workload feels manageable now.', 'يبدو عبء العمل ممكنًا الآن.'],
    ],
  },
  {
    id: 'path-l5-04', title: 'Choosing Precise Words', titleAr: 'اختيار مفردات أدق لوصف الفكرة',
    descriptionAr: 'قارن بين كلمات متقاربة، واختر الوصف الأدق لموقف محدد.',
    category: 'grammar', scene: 'classroom', stage: 5, level: 'B2', people: ['Amina', 'Jack'],
    lines: [
      ['The report says the figures are “stable,” not “unchanged.”', 'يقول التقرير إن الأرقام «مستقرة»، لا إنها «لم تتغير».'],
      ['So they moved slightly, but not enough to suggest a clear trend.', 'أي أنها تحركت قليلًا، لكن ليس بما يكفي للإشارة إلى اتجاه واضح.'],
      ['Exactly. “Stable” is more accurate because it allows for small variations.', 'بالضبط. كلمة «مستقرة» أدق لأنها تسمح بوجود اختلافات طفيفة.'],
      ['I will revise the summary so the wording matches the evidence.', 'سأراجع الملخص حتى تتوافق صياغته مع الأدلة.'],
    ],
    words: [
      ['stable', '/ˈsteɪbəl/', 'مستقر', 'Prices remained stable this quarter.', 'ظلت الأسعار مستقرة هذا الربع.'],
      ['unchanged', '/ʌnˈtʃeɪndʒd/', 'دون تغيير', 'The schedule is unchanged.', 'الجدول لم يتغير.'],
      ['variation', '/ˌvɛriˈeɪʃən/', 'اختلاف / تباين', 'Small variations are expected.', 'من المتوقع حدوث اختلافات طفيفة.'],
    ],
  },
  {
    id: 'path-l5-05', title: 'Coordinating Remote Work', titleAr: 'تنسيق العمل عن بُعد بوضوح',
    descriptionAr: 'وضّح نقطة التعطّل واتفق على تحديثات مكتوبة وتوقيت واقعي.',
    category: 'work', scene: 'office', stage: 5, level: 'B2', people: ['Dalia', 'Ryan'],
    lines: [
      ['The design is ready, but we are waiting on the final product copy.', 'التصميم جاهز، لكننا ننتظر النص النهائي للمنتج.'],
      ['I thought it had been approved yesterday. Did the review raise an issue?', 'ظننت أنه اعتُمد أمس. هل أثارت المراجعة مشكلة؟'],
      ['Only a wording change. I will post the revised draft before noon.', 'مجرد تعديل في الصياغة. سأنشر المسودة المنقحة قبل الظهر.'],
      ['Great. I will leave comments in the shared document rather than starting another thread.', 'رائع. سأترك التعليقات في المستند المشترك بدل بدء سلسلة رسائل جديدة.'],
      ['That should keep the decisions in one place.', 'من المفترض أن يبقي ذلك القرارات في مكان واحد.'],
    ],
    words: [
      ['waiting on', '/ˈweɪtɪŋ ɑːn/', 'ينتظر', 'We are waiting on the final figures.', 'ننتظر الأرقام النهائية.'],
      ['draft', '/dræft/', 'مسودة', 'Please review the first draft.', 'يرجى مراجعة المسودة الأولى.'],
      ['thread', '/θrɛd/', 'سلسلة رسائل', 'Keep the discussion in one thread.', 'أبقِ النقاش في سلسلة رسائل واحدة.'],
    ],
  },
  {
    id: 'path-l5-06', title: 'Planning a Volunteer Day', titleAr: 'تنظيم يوم تطوعي في المجتمع',
    descriptionAr: 'وزّع المهام على المتطوعين وتوقّع احتياجات اليوم بطريقة تعاونية.',
    category: 'greetings', scene: 'park', stage: 5, level: 'B2', people: ['Hala', 'Oscar'],
    lines: [
      ['We have twelve volunteers, but only six pairs of gloves.', 'لدينا اثنا عشر متطوعًا، لكن لدينا ستة أزواج فقط من القفازات.'],
      ['Could we split the morning into two shifts and share the equipment?', 'هل يمكننا تقسيم الصباح إلى فترتين وتشارك المعدات؟'],
      ['That would work. I will also ask the community center whether they have spare bags.', 'هذا مناسب. سأستفسر أيضًا من المركز المجتمعي عما إذا كانت لديه أكياس إضافية.'],
      ['Good thinking. Let us post the schedule tonight so everyone knows when to arrive.', 'فكرة جيدة. لننشر الجدول الليلة حتى يعرف الجميع موعد الوصول.'],
    ],
    words: [
      ['volunteer', '/ˌvɑːlənˈtɪr/', 'متطوع', 'Every volunteer received a task.', 'تلقى كل متطوع مهمة.'],
      ['shift', '/ʃɪft/', 'فترة عمل', 'She works the morning shift.', 'تعمل في الفترة الصباحية.'],
      ['spare', '/spɛr/', 'إضافي / احتياطي', 'Do we have spare gloves?', 'هل لدينا قفازات احتياطية؟'],
    ],
  },
  {
    id: 'path-l5-07', title: 'Explaining a Change of Plan', titleAr: 'شرح تغيير الخطة وتوقعاته',
    descriptionAr: 'فسّر سبب التغيير وبيّن أثره المتوقع من دون تهويل.',
    category: 'work', scene: 'office', stage: 5, level: 'B2', people: ['Maha', 'Ethan'],
    lines: [
      ['We planned to publish the guide on Monday, but one illustration is still being checked.', 'خططنا لنشر الدليل يوم الاثنين، لكن لا يزال أحد الرسوم التوضيحية قيد المراجعة.'],
      ['Will that affect the whole release?', 'هل سيؤثر ذلك في الإصدار كله؟'],
      ['Probably not. We can publish the text first and add the image in the next update.', 'على الأرجح لا. يمكننا نشر النص أولًا وإضافة الصورة في التحديث التالي.'],
      ['As long as readers know the image is coming, that seems reasonable.', 'ما دام القراء يعرفون أن الصورة ستضاف لاحقًا، فهذا يبدو معقولًا.'],
      ['I will adjust the announcement to set that expectation clearly.', 'سأعدّل الإعلان لتوضيح هذا التوقع.'],
    ],
    words: [
      ['illustration', '/ˌɪləˈstreɪʃən/', 'رسم توضيحي', 'The illustration explains the process.', 'يوضح الرسم التوضيحي العملية.'],
      ['release', '/rɪˈliːs/', 'إصدار', 'The release is planned for June.', 'الإصدار مخطط له في يونيو.'],
      ['reasonable', '/ˈriːzənəbəl/', 'معقول', 'That is a reasonable suggestion.', 'هذا اقتراح معقول.'],
    ],
  },
  {
    id: 'path-l5-08', title: 'Clearing Up a Misunderstanding', titleAr: 'توضيح سوء فهم دون لوم',
    descriptionAr: 'تحقق مما فهمه الطرف الآخر، ثم أعد صياغة الاتفاق لتجنب اللوم.',
    category: 'work', scene: 'office', stage: 5, level: 'B2', people: ['Salma', 'Peter'],
    lines: [
      ['I may not have explained the handover clearly yesterday.', 'ربما لم أشرح عملية التسليم بوضوح أمس.'],
      ['I understood that the support team would contact the clients.', 'فهمت أن فريق الدعم سيتواصل مع العملاء.'],
      ['I meant that they would prepare the notes, while our team would make the calls.', 'قصدت أنهم سيجهزون الملاحظات، بينما سيتولى فريقنا إجراء الاتصالات.'],
      ['Thanks for clarifying. Let us write down who owns each step.', 'شكرًا على التوضيح. لندون المسؤول عن كل خطوة.'],
      ['Agreed. That should prevent the same confusion next time.', 'متفق. من المفترض أن يمنع ذلك الالتباس نفسه في المرة القادمة.'],
    ],
    words: [
      ['handover', '/ˈhændˌoʊvər/', 'تسليم المهام', 'The handover takes place on Friday.', 'يتم تسليم المهام يوم الجمعة.'],
      ['clarify', '/ˈklærəfaɪ/', 'يوضّح', 'Could you clarify your request?', 'هل يمكنك توضيح طلبك؟'],
      ['own a task', '/oʊn ə tæsk/', 'يتولى مسؤولية مهمة', 'Who owns this task?', 'من المسؤول عن هذه المهمة؟'],
    ],
  },
  {
    id: 'path-l5-09', title: 'Retelling a Short Story', titleAr: 'إعادة سرد موقف بترتيب واضح',
    descriptionAr: 'اربط بداية الموقف ونتيجته مستخدمًا at first وeventually وas a result.',
    category: 'greetings', scene: 'park', stage: 5, level: 'B2', people: ['Noura', 'Alex'],
    lines: [
      ['At first, our hiking trail seemed easy, so we did not check the weather.', 'في البداية بدا مسار المشي سهلًا، لذلك لم نتحقق من الطقس.'],
      ['Then the rain started, and the path became slippery.', 'ثم بدأ المطر وأصبح الطريق زلقًا.'],
      ['We turned back and waited at a small shelter until the storm passed.', 'عدنا وانتظرنا في مأوى صغير حتى مرت العاصفة.'],
      ['Eventually, we reached the village safely; as a result, we planned better for the next trip.', 'وصلنا في النهاية إلى القرية بأمان؛ ونتيجة لذلك، خططنا بشكل أفضل للرحلة التالية.'],
    ],
    words: [
      ['at first', '/æt fɜːrst/', 'في البداية', 'At first, the task looked difficult.', 'في البداية بدت المهمة صعبة.'],
      ['eventually', '/ɪˈvɛntʃuəli/', 'في النهاية', 'Eventually, they found the right road.', 'وجدوا الطريق الصحيح في النهاية.'],
      ['as a result', '/æz ə rɪˈzʌlt/', 'ونتيجة لذلك', 'It snowed; as a result, school closed.', 'تساقط الثلج؛ ونتيجة لذلك أُغلقت المدرسة.'],
    ],
  },
];

const continuationStageForUnit = (unit: number) =>
  unit <= 6 ? 3 : unit === 7 ? 4 : unit === 8 ? 5 : unit === 9 ? 6 : 7;
const continuationStageSequence = new Map<number, number>();
const additionalSeeds: LessonSeed[] = ADDITIONAL_LESSON_SPECS.map((spec) => {
  const curriculumStage = continuationStageForUnit(spec.stage);
  const sequence = (continuationStageSequence.get(curriculumStage) ?? 0) + 1;
  continuationStageSequence.set(curriculumStage, sequence);
  const id = `path-l${curriculumStage}-extra-${String(sequence).padStart(2, '0')}`;
  return {
    id,
    title: spec.title,
    titleAr: spec.titleAr,
    descriptionAr: spec.descriptionAr,
    category: spec.category,
    scene: spec.scene,
    stage: curriculumStage,
    level: curriculumStage === 3 ? 'A2' : curriculumStage === 4 ? 'B1' : curriculumStage <= 6 ? 'B2' : 'C1',
    people: ['Mia', 'Omar'],
    lines: [
      [spec.exampleEn, spec.exampleAr],
      [`The key expression is “${spec.focus}.”`, `التعبير الأساسي هو «${spec.focus}»، ومعناه ${spec.translationAr}.`],
      [`Try using “${spec.focus}” in another sentence.`, `جرّب استخدام «${spec.focus}» في جملة أخرى.`],
      [`You can use it in this situation.`, `يمكنك استخدامه في هذا الموقف: ${spec.descriptionAr}`],
    ],
    words: [[spec.focus, spec.phonetic, spec.translationAr, spec.exampleEn, spec.exampleAr]],
    learningNoteAr: spec.noteAr,
  };
});
seeds.push(...additionalSeeds);

const stageByLegacyLesson: Record<string, number> = {
  'lesson-cafe-01': 1,
  'lesson-shopping-04': 3,
  'lesson-grammar-07': 3,
  'lesson-airport-02': 4,
  'lesson-office-03': 4,
  'lesson-doctor-05': 4,
  'lesson-hotel-08': 4,
  'lesson-idioms-06': 5,
};

const stageOrder: Record<number, string[]> = {
  1: [...seeds.filter((seed) => seed.stage === 1).map((seed) => seed.id), 'lesson-cafe-01'],
  2: seeds.filter((seed) => seed.stage === 2).map((seed) => seed.id),
  3: [
    'path-l3-01', 'path-l3-02', 'path-l3-03', 'path-l3-04', 'lesson-shopping-04',
    'path-l3-06', 'path-l3-07', 'path-l3-08', 'lesson-grammar-07', 'path-l3-05',
    ...additionalSeeds.filter((seed) => seed.stage === 3).map((seed) => seed.id),
  ],
  4: [
    ...seeds.filter((seed) => seed.stage === 4 && !seed.id.includes('-extra-')).map((seed) => seed.id),
    'lesson-airport-02', 'lesson-office-03', 'lesson-doctor-05', 'lesson-hotel-08',
    ...additionalSeeds.filter((seed) => seed.stage === 4).map((seed) => seed.id),
  ],
  5: [
    ...seeds.filter((seed) => seed.stage === 5 && !seed.id.includes('-extra-')).map((seed) => seed.id),
    'lesson-idioms-06',
    ...additionalSeeds.filter((seed) => seed.stage === 5).map((seed) => seed.id),
  ],
  6: additionalSeeds.filter((seed) => seed.stage === 6).map((seed) => seed.id),
  7: additionalSeeds.filter((seed) => seed.stage === 7).map((seed) => seed.id),
};

const speakers = (id: string, people: [string, string], stage: number): [Character, Character] => {
  const palettes = [
    ['#0f766e', '#f43f5e'], ['#2563eb', '#ea580c'], ['#7c3aed', '#0891b2'],
    ['#4f46e5', '#059669'], ['#be123c', '#0369a1'],
    ['#0f766e', '#f43f5e'], ['#2563eb', '#ea580c'], ['#7c3aed', '#0891b2'],
    ['#4f46e5', '#059669'], ['#be123c', '#0369a1'],
  ];
  const [shirtA, shirtB] = palettes[(stage - 1) % palettes.length];
  return [
    {
      id: `${id}-a`, name: people[0], nameAr: getArabicCharacterName(people[0]), roleAr: 'المتحدث الأول',
      avatar: '🧑', voiceGender: 'female', voicePitch: 1.08, shirtColor: shirtA,
      skinTone: '#fcd7b6', hairColor: '#3b2418', hairStyle: 'ponytail',
    },
    {
      id: `${id}-b`, name: people[1], nameAr: getArabicCharacterName(people[1]), roleAr: 'المتحدث الثاني',
      avatar: '🧑‍🏫', voiceGender: 'male', voicePitch: 0.92, shirtColor: shirtB,
      skinTone: '#f3c99f', hairColor: '#33251d', hairStyle: 'short',
    },
  ];
};

const learningNotes: Record<string, string> = {
  'path-l1-01': 'استمع إلى صوت الحركة في الكلمة كاملة، ولا تعتمد على اسم الحرف وحده؛ فصوت a في apple قصير.',
  'path-l1-02': 'تُستخدم Good morning صباحًا، أما See you later فهي طريقة ودية غير رسمية للوداع.',
  'path-l1-03': 'للسؤال عن الاسم قل What is your name?، وللتعريف بنفسك قل My name is…',
  'path-l1-04': 'مع I نستخدم am، ومع you وwe نستخدم are: I am ready / We are ready.',
  'path-l1-05': 'بعد الأعداد الأكبر من واحد نستخدم غالبًا جمع الاسم: one pencil, three pencils.',
  'path-l1-06': 'نستخدم this لشيء قريب وthat لشيء أبعد؛ وتأتي صيغة الأمر مباشرة بالفعل مثل Open your book.',
  'path-l1-07': 'تسبق الصفة الاسم غالبًا في الإنجليزية: a blue shirt، ويظل الاسم مفردًا بعد اللون.',
  'path-l1-08': 'في المضارع البسيط نقول I walk، وعند السؤال نستخدم Do you…? ثم الفعل بصيغته الأساسية.',
  'path-l1-09': 'بعد like يمكن استخدام اسم أو فعل ينتهي بـ-ing: I like music / I like drawing.',
  'path-l2-01': 'تسبق my وhis وher الاسم للدلالة على الملكية: my brother وher name.',
  'path-l2-02': 'نقول There is مع المفرد وThere are مع الجمع، وتساعد حروف المكان على تحديد موضع الأثاث.',
  'path-l2-03': 'Would you like…? عرض مهذب، ويمكن الرد بـI would like… عند طلب الطعام.',
  'path-l2-04': 'نستخدم on مع أيام الأسبوع وat مع الساعة: on Thursday, at half past three.',
  'path-l2-05': 'السؤال How much يسأل عن السعر؛ وتُذكر وحدة القياس مع السعر مثل dollars a kilo.',
  'path-l2-06': 'next to تعني بجانب، وbehind تعني خلف؛ افهم العلاقة بين المكانين في الجملة.',
  'path-l2-07': 'يُستخدم will كثيرًا للتوقع أو القرار السريع: I think it will rain.',
  'path-l2-08': 'نبدأ سؤال المضارع بـDo مع I/you/we/they وبـDoes مع he/she؛ وبعد does يعود الفعل إلى أصله.',
  'path-l2-09': 'تأتي تعليمات الاتجاه بصيغة الأمر: Go straight, turn left. وكلمة opposite تعني مقابل.',
  'path-l2-10': 'تُستخدم some غالبًا في الجمل المثبتة وany في الأسئلة والنفي، مع مراعاة الأسماء المعدودة وغير المعدودة.',
  'path-l3-01': 'تأتي usually قبل الفعل الأساسي غالبًا: I usually check. وbefore/after تربطان ترتيب الأنشطة.',
  'path-l3-02': 'until تعني «حتى»، وتربط الحركة بنقطة الوصول؛ راقب تسلسل أفعال الاتجاه في الحوار.',
  'path-l3-03': 'What is he like? تسأل عن الشخصية، أما What does he look like? فتسأل عن المظهر.',
  'path-l3-04': 'في الماضي البسيط نستخدم did في السؤال ثم الفعل الأساسي: Did you see…? وليس Did you saw…?',
  'path-l3-05': 'نستخدم because لذكر السبب، ويأتي بعدها فاعل وفعل: We stayed inside because it rained.',
  'path-l3-06': 'تتكون be going to من am/is/are + going to + الفعل الأساسي للتعبير عن خطة.',
  'path-l3-07': 'change buses تعني تبديل الحافلات، وHow many stops يسأل عن عدد المحطات المعدودة.',
  'path-l3-08': 'في المقارنة ذات المقاطع القصيرة نضيف -er عادةً: easier / cheaper، ثم نستخدم than عند ذكر الطرف الآخر.',
  'path-l4-01': 'Could you tell me whether…? طلب مهذب غير مباشر؛ وبعد whether تأتي صيغة جملة لا ترتيب سؤال مباشر.',
  'path-l4-02': 'تلطّف الاقتراح بعبارات مثل I would like to suggest، واطلب التوضيح بـCould you clarify…?',
  'path-l4-03': 'رتّب العرض بمقدمة ونقاط رئيسية وخاتمة، ثم استخدم rehearsal للتحقق من الوقت والانتقال بين المتحدثين.',
  'path-l4-04': 'ادعم الرأي بسبب أو مثال، واستخدم I agree, but… لإظهار اتفاق جزئي دون رفض فظ.',
  'path-l4-05': 'Could we…? وWould … work? صيغتان مهذبتان لاقتراح موعد بديل.',
  'path-l4-06': 'ابدأ الشكوى بوصف محايد للمشكلة، ثم اذكر الطلب بوضوح بدل اتهام الشخص.',
  'path-l5-01': 'الأسئلة المفتوحة مثل Is there anything else…? تشجع الطرف الآخر على متابعة الحديث.',
  'path-l5-02': 'ابدأ بإقرار نقطة صحيحة، ثم عبّر عن التحفظ واقترح حلًا؛ هذا يجعل الاختلاف تعاونيًا.',
  'path-l5-03': 'If I were you تستخدم لتقديم نصيحة افتراضية؛ ويمكن أن تكون النصيحة اقتراحًا لا أمرًا.',
  'path-l5-04': 'stable تعني أن الشيء بقي ضمن نطاق متقارب، ولا تعني بالضرورة أنه لم يتغير إطلاقًا.',
  'path-l5-05': 'استخدم but وwhile للمقارنة بين حالتين، وبدّل عبارة عامة مثل thing بتسمية دقيقة عند توفرها.',
  'path-l5-06': 'Could we…? تعرض اقتراحًا للتفاوض، بينما ستوضح تفاصيل مثل الزمن والموارد ما إذا كان قابلًا للتطبيق.',
  'path-l5-07': 'استخدم probably للتوقع غير المؤكد، وas long as لذكر الشرط الذي يجعل الاتفاق مقبولًا.',
  'path-l5-08': 'قدّم التوضيح بصيغة I may not have… لتتحمل مسؤولية الالتباس، ثم أعد صياغة الاتفاق والخطوات.',
  'path-l5-09': 'اربط السرد زمنيًا بـAt first وThen وEventually، واستخدم as a result لتوضيح النتيجة.',
};

const legacyLearningNotes: Record<string, string> = {
  'lesson-cafe-01': 'Can I get…? طلب شائع مهذب. أضف please، ثم حدّد الحجم أو الخيارات قبل أن تنهي الطلب.',
  'lesson-airport-02': 'عند إجراءات السفر جهّز جواز السفر وبطاقة الصعود، واتبع تعليمات الوزن والبوابة.',
  'lesson-office-03': 'استخدم عبارات التعارف المهنية القصيرة، ثم اسأل سؤالًا مفتوحًا عن دور زميلك.',
  'lesson-shopping-04': 'Could I try it on? للسؤال عن تجربة الملابس؛ وWhat size…? للسؤال عن المقاس.',
  'lesson-doctor-05': 'ابدأ وصف العرض بوقت ظهوره ومدته، واستخدم have had عند السؤال عن عرض بدأ في الماضي.',
  'lesson-idioms-06': 'تُفهم التعبيرات الاصطلاحية من السياق ولا تُترجم كلمة بكلمة؛ لاحظ نبرة المتحدث والموقف.',
  'lesson-grammar-07': 'مع الأفعال المنتظمة نضيف -ed للماضي غالبًا، لكن الأفعال الشائعة مثل go تصبح went.',
  'lesson-hotel-08': 'reservation تعني حجزًا مسبقًا؛ وعند السؤال عن الخدمات استخدم Could I…? أو Is … included?',
};

const buildVocabulary = (seed: LessonSeed): VocabularyWord[] =>
  seed.words.map(([word, phonetic, translationAr, exampleSentence, exampleSentenceAr], index) => ({
    id: `${seed.id}-v${index + 1}`,
    word,
    phonetic,
    partOfSpeech: 'كلمة أو تعبير',
    translationAr,
    exampleSentence,
    exampleSentenceAr,
  }));

const buildDialogue = (seed: LessonSeed, people: [Character, Character]): DialogueLine[] =>
  seed.lines.map(([textEn, textAr], index) => ({
    id: `${seed.id}-s${String(index + 1).padStart(2, '0')}`,
    speakerId: people[index % 2].id,
    textEn,
    textAr,
    durationSec: Math.max(2.5, textEn.split(/\s+/).length * 0.34),
    emotion: index % 2 === 0 ? 'explaining' : 'curious',
    highlightWords: seed.words.map(([word]) => word).filter((word) => textEn.toLowerCase().includes(word.toLowerCase().split(' ')[0])).slice(0, 2),
  }));

const generatedLessons: Lesson[] = seeds.map((seed) => {
  const people = speakers(seed.id, seed.people, seed.stage);
  const vocabulary = buildVocabulary(seed);
  return {
    id: seed.id,
    slug: seed.id,
    title: seed.title,
    titleAr: seed.titleAr,
    descriptionAr: seed.descriptionAr,
  learningNoteAr: seed.learningNoteAr ?? learningNotes[seed.id],
    category: seed.category,
    level: seed.level,
    curriculumStage: seed.stage,
    sceneType: seed.scene,
    characterA: people[0],
    characterB: people[1],
    dialogue: buildDialogue(seed, people),
    vocabulary,
    quiz: [],
    likesCount: 0,
    sharesCount: 0,
    savedCount: 0,
  };
});

const generatedById = new Map(generatedLessons.map((lesson) => [lesson.id, lesson]));
const legacyById = new Map(
  INITIAL_LESSONS.map((lesson) => [
    lesson.id,
    { ...lesson, curriculumStage: stageByLegacyLesson[lesson.id] },
  ])
);
const lessonById = new Map([...legacyById, ...generatedById]);

const allVocabulary = [...INITIAL_LESSONS.flatMap((lesson) => lesson.vocabulary), ...generatedLessons.flatMap((lesson) => lesson.vocabulary)];

const createLessonQuiz = (lesson: Lesson, seed?: LessonSeed) => {
  const vocabulary = lesson.vocabulary;
  const target = vocabulary[0];
  const distractors = allVocabulary
    .filter((word) => word.id !== target.id && word.translationAr !== target.translationAr)
    .map((word) => word.translationAr);
  const uniqueDistractors = [...new Set(distractors)].slice(0, 3);
  const meaningOptions = [target.translationAr, ...uniqueDistractors].sort((a, b) => a.localeCompare(b, 'ar'));
  const example = target.exampleSentence;
  const escapedWord = target.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blankSentence = new RegExp(escapedWord, 'i').test(example)
    ? example.replace(new RegExp(escapedWord, 'i'), '_____')
    : lesson.dialogue[0]?.textEn ?? example;
  const sentence = lesson.dialogue[0]?.textEn ?? example;
  const tokens = sentence.match(/[\w’'-]+[.,!?;:]?/g) ?? sentence.split(' ');
  const wrongOrders = [
    [...tokens].reverse().join(' '),
    [...tokens.slice(1), tokens[0]].join(' '),
    [...tokens.slice(0, -1)].reverse().concat(tokens[tokens.length - 1]).join(' '),
  ];
  const sentenceOptions = [...new Set([sentence, ...wrongOrders])];

  return [
    {
      id: `${lesson.id}-quiz-meaning`,
      type: 'multiple_choice' as const,
      questionAr: `ما معنى "${target.word}" في هذا الدرس؟`,
      questionEn: target.exampleSentence,
      options: meaningOptions,
      correctAnswer: target.translationAr,
      explanationAr: `تعني "${target.word}" ${target.translationAr}.`,
    },
    {
      id: `${lesson.id}-quiz-gap`,
      type: 'fill_blank' as const,
      questionAr: 'أكمل المثال بالكلمة المناسبة:',
      questionEn: blankSentence,
      options: [target.word, ...vocabulary.slice(1).map((word) => word.word), 'yesterday'],
      correctAnswer: target.word,
      explanationAr: `الكلمة المناسبة هي "${target.word}" ومعناها ${target.translationAr}.`,
    },
    {
      id: `${lesson.id}-quiz-order`,
      type: 'arrange_sentence' as const,
      questionAr: 'اختر ترتيب الكلمات الذي يكوّن الجملة الواردة في الحوار:',
      questionEn: sentence,
      options: sentenceOptions,
      correctAnswer: sentence,
      explanationAr: 'راجع ترتيب الفاعل والفعل والكلمات المكمّلة للجملة في الحوار.',
    },
  ];
};

const generatedWithQuizzes = generatedLessons.map((lesson) => ({
  ...lesson,
  quiz: createLessonQuiz(lesson, seeds.find((seed) => seed.id === lesson.id)),
}));

const legacyWithStages = INITIAL_LESSONS.map((lesson) => ({
  ...lesson,
  curriculumStage: stageByLegacyLesson[lesson.id],
  learningNoteAr: legacyLearningNotes[lesson.id],
}));

const completeLessonById = new Map([...legacyWithStages, ...generatedWithQuizzes].map((lesson) => [lesson.id, lesson]));

for (const lesson of legacyWithStages) {
  if (!lesson.quiz.length) lesson.quiz = createLessonQuiz(lesson);
}

export const CURRICULUM_CONFIG = {
  passingScorePercent: 80,
  expectedLessonCount: 150,
} as const;

export const CURRICULUM_LEVELS = [
  { stage: 1, titleAr: 'المبتدئ جدًا', subtitleAr: 'الحروف والأصوات والتحيات والجمل الأولى', color: 'sky' },
  { stage: 2, titleAr: 'المبتدئ', subtitleAr: 'الأسرة والمنزل والطعام والوقت والأماكن', color: 'emerald' },
  { stage: 3, titleAr: 'ما قبل المتوسط', subtitleAr: 'الروتين والاتجاهات والوصف والماضي والمستقبل', color: 'amber' },
  { stage: 4, titleAr: 'المتوسط', subtitleAr: 'السفر والدراسة والعمل والآراء والمواقف الواقعية', color: 'violet' },
  { stage: 5, titleAr: 'المتوسط المتقدم', subtitleAr: 'حوارات أطول وتعبيرات طبيعية وتواصل أكثر دقة', color: 'rose' },
  { stage: 6, titleAr: 'المتقدم', subtitleAr: 'الأدلة والعروض والتفاوض الدقيق', color: 'violet' },
  { stage: 7, titleAr: 'الإتقان المتقدم', subtitleAr: 'الفروق الدقيقة والسجل الرسمي والتعبيرات الاصطلاحية', color: 'rose' },
] as const;

export const LEARNING_PATH_LESSONS: Lesson[] = Object.values(stageOrder).flatMap((ids) =>
  ids.map((id) => {
    const lesson = completeLessonById.get(id) ?? lessonById.get(id);
    if (!lesson) throw new Error(`Curriculum lesson is missing: ${id}`);
    return lesson;
  })
);

export const curriculumLessonSeeds = seeds;
