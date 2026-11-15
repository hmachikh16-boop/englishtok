import 'package:flutter/material.dart';

// ================= COLORS =================
const Color kNavy = Color(0xFF1E3A6D);
const Color kOrange = Color(0xFFF6A55C);
const Color kBlue = Color(0xFFA9CCE3);
const Color kGreen = Color(0xFFBFE3A8);
const Color kYellow = Color(0xFFF7D794);
const Color kPurple = Color(0xFFD7BDE2);
const Color kPink = Color(0xFFF5B7B1);
const Color kRed = Color(0xFFE53935);
const Color kGrey = Color(0xFF8A8A8A);
const Color kBorder = Color(0xFFE3E3E3);
const Color kTeal = Color(0xFFA8DADC);
const Color kPeach = Color(0xFFF5CBA7);
const Color kMint = Color(0xFFB5EAD7);

// ================= MODEL =================
class Lesson {
  final String word;
  final String sentence;
  final List<String> options;
  final String imageFile; // مثال: 'q0' أو 'pack1'
  final int indexInPack; // للـ Pack فقط: 0..9 ، للـ Single: 0
  final bool isPack; // true = صورة مجمعة، false = صورة وحدها
  final String category;
  final String translation;

  const Lesson({
    required this.word,
    required this.sentence,
    required this.options,
    required this.imageFile,
    required this.indexInPack,
    required this.isPack,
    required this.category,
    required this.translation,
  });
}

// ================= GROUPS =================
class LessonGroup {
  final String name;
  final Color color;
  final IconData icon;
  const LessonGroup(this.name, this.color, this.icon);
}

const List<LessonGroup> groups = [
  LessonGroup('Verb To Be', kOrange, Icons.description_outlined),
  LessonGroup('Family', kBlue, Icons.family_restroom),
  LessonGroup('People & Actions', kGreen, Icons.directions_run),
  LessonGroup('Food', kYellow, Icons.restaurant),
  LessonGroup('Food & More', kPink, Icons.cake_outlined),
  LessonGroup('Animals', kPurple, Icons.pets),
  LessonGroup('Home & Nature', kTeal, Icons.park_outlined),
  LessonGroup('Fun & School', kPeach, Icons.sports_basketball),
  LessonGroup('Greetings', kMint, Icons.waving_hand),
];

// ================= 90 LESSONS =================
const List<Lesson> lessons = [
  // ===== 1. الدروس 10 القديمة - Verb To Be - تبقى كما هي =====
  Lesson(word: 'am', sentence: 'I ___ a boy.', options: ['am', 'is', 'are'], imageFile: 'q0', indexInPack: 0, isPack: false, translation: 'أنا صبي.', category: 'Verb To Be'),
  Lesson(word: 'are', sentence: 'We ___ students.', options: ['am', 'is', 'are'], imageFile: 'q1', indexInPack: 0, isPack: false, translation: 'نحن طلاب.', category: 'Verb To Be'),
  Lesson(word: 'is', sentence: 'The dog ___ black.', options: ['am', 'is', 'are'], imageFile: 'q2', indexInPack: 0, isPack: false, translation: 'الكلب أسود.', category: 'Verb To Be'),
  Lesson(word: 'are', sentence: 'The flowers ___ small.', options: ['am', 'is', 'are'], imageFile: 'q3', indexInPack: 0, isPack: false, translation: 'الزهور صغيرة.', category: 'Verb To Be'),
  Lesson(word: 'is', sentence: 'The apple ___ red.', options: ['am', 'is', 'are'], imageFile: 'q4', indexInPack: 0, isPack: false, translation: 'التفاحة حمراء.', category: 'Verb To Be'),
  Lesson(word: 'is', sentence: 'The car ___ blue.', options: ['am', 'is', 'are'], imageFile: 'q5', indexInPack: 0, isPack: false, translation: 'السيارة زرقاء.', category: 'Verb To Be'),
  Lesson(word: 'is', sentence: 'The cat ___ fast.', options: ['am', 'is', 'are'], imageFile: 'q6', indexInPack: 0, isPack: false, translation: 'القطة سريعة.', category: 'Verb To Be'),
  Lesson(word: 'is', sentence: 'The house ___ big.', options: ['am', 'is', 'are'], imageFile: 'q7', indexInPack: 0, isPack: false, translation: 'البيت كبير.', category: 'Verb To Be'),
  Lesson(word: 'is', sentence: 'The man ___ eating.', options: ['am', 'is', 'are'], imageFile: 'q8', indexInPack: 0, isPack: false, translation: 'الرجل يأكل.', category: 'Verb To Be'),
  Lesson(word: 'is', sentence: 'The sun ___ bright.', options: ['am', 'is', 'are'], imageFile: 'q9', indexInPack: 0, isPack: false, translation: 'الشمس مشرقة.', category: 'Verb To Be'),

  // ===== 2. الدروس الجديدة - 70 درساً بصور عالية الجودة =====
  // GROUP 1 - Family - 11 to 20
  Lesson(word: 'Boy', sentence: 'I am a ___.', options: ['Boy', 'Girl', 'Baby'], imageFile: 'n01', indexInPack: 0, isPack: true, translation: 'أنا صبي.', category: 'Family'),
  Lesson(word: 'Girl', sentence: 'She is a ___.', options: ['Boy', 'Girl', 'Baby'], imageFile: 'n02', indexInPack: 0, isPack: true, translation: 'هي فتاة.', category: 'Family'),
  Lesson(word: 'Father', sentence: 'This is my ___.', options: ['Father', 'Mother', 'Baby'], imageFile: 'n03', indexInPack: 0, isPack: true, translation: 'هذا أبي.', category: 'Family'),
  Lesson(word: 'Mother', sentence: 'This is my ___.', options: ['Father', 'Mother', 'Baby'], imageFile: 'n04', indexInPack: 0, isPack: true, translation: 'هذه أمي.', category: 'Family'),
  Lesson(word: 'Baby', sentence: 'The ___ is small.', options: ['Baby', 'Boy', 'Girl'], imageFile: 'n05', indexInPack: 0, isPack: true, translation: 'الطفل صغير.', category: 'Family'),
  Lesson(word: 'Grandfather', sentence: 'He is my ___.', options: ['Grandfather', 'Grandmother', 'Father'], imageFile: 'n06', indexInPack: 0, isPack: true, translation: 'هو جدي.', category: 'Family'),
  Lesson(word: 'Grandmother', sentence: 'She is my ___.', options: ['Grandfather', 'Grandmother', 'Mother'], imageFile: 'n07', indexInPack: 0, isPack: true, translation: 'هي جدتي.', category: 'Family'),
  Lesson(word: 'Family', sentence: 'This is my ___.', options: ['Family', 'Father', 'Mother'], imageFile: 'n08', indexInPack: 0, isPack: true, translation: 'هذه عائلتي.', category: 'Family'),
  Lesson(word: 'Man', sentence: 'He is a ___.', options: ['Man', 'Woman', 'Boy'], imageFile: 'n09', indexInPack: 0, isPack: true, translation: 'هو رجل.', category: 'Family'),
  Lesson(word: 'Woman', sentence: 'She is a ___.', options: ['Woman', 'Man', 'Girl'], imageFile: 'n10', indexInPack: 0, isPack: true, translation: 'هي امرأة.', category: 'Family'),

  // GROUP 2 - People & Actions - 21 to 30
  Lesson(word: 'Daughter', sentence: 'She is my ___.', options: ['Daughter', 'Mother', 'Girl'], imageFile: 'n11', indexInPack: 0, isPack: true, translation: 'هي ابنتي.', category: 'People & Actions'),
  Lesson(word: 'Happy', sentence: 'The boy is ___.', options: ['Happy', 'Sad', 'Angry'], imageFile: 'n12', indexInPack: 0, isPack: true, translation: 'الصبي سعيد.', category: 'People & Actions'),
  Lesson(word: 'Sad', sentence: 'The boy is ___.', options: ['Happy', 'Sad', 'Angry'], imageFile: 'n13', indexInPack: 0, isPack: true, translation: 'الصبي حزين.', category: 'People & Actions'),
  Lesson(word: 'Hello', sentence: 'He says ___.', options: ['Hello', 'Goodbye', 'Sorry'], imageFile: 'n14', indexInPack: 0, isPack: true, translation: 'هو يقول مرحبا.', category: 'People & Actions'),
  Lesson(word: 'Run', sentence: 'The boy can ___.', options: ['Run', 'Jump', 'Sleep'], imageFile: 'n15', indexInPack: 0, isPack: true, translation: 'الصبي يستطيع الركض.', category: 'People & Actions'),
  Lesson(word: 'Jump', sentence: 'The girl can ___.', options: ['Jump', 'Run', 'Sleep'], imageFile: 'n16', indexInPack: 0, isPack: true, translation: 'الفتاة تستطيع القفز.', category: 'People & Actions'),
  Lesson(word: 'Play', sentence: 'The children ___.', options: ['Play', 'Sleep', 'Eat'], imageFile: 'n17', indexInPack: 0, isPack: true, translation: 'الأطفال يلعبون.', category: 'People & Actions'),
  Lesson(word: 'Eat', sentence: 'The boy can ___.', options: ['Eat', 'Drink', 'Sleep'], imageFile: 'n18', indexInPack: 0, isPack: true, translation: 'الصبي يستطيع الأكل.', category: 'People & Actions'),
  Lesson(word: 'Drink', sentence: 'The boy can ___.', options: ['Drink', 'Eat', 'Sleep'], imageFile: 'n19', indexInPack: 0, isPack: true, translation: 'الصبي يستطيع الشرب.', category: 'People & Actions'),
  Lesson(word: 'Sleep', sentence: 'The boy can ___.', options: ['Sleep', 'Run', 'Jump'], imageFile: 'n20', indexInPack: 0, isPack: true, translation: 'الصبي يستطيع النوم.', category: 'People & Actions'),

  // GROUP 3 - Food - 31 to 40
  Lesson(word: 'Apple', sentence: 'The ___ is red.', options: ['Apple', 'Banana', 'Egg'], imageFile: 'n21', indexInPack: 0, isPack: true, translation: 'التفاحة حمراء.', category: 'Food'),
  Lesson(word: 'Banana', sentence: 'The ___ is yellow.', options: ['Banana', 'Apple', 'Bread'], imageFile: 'n22', indexInPack: 0, isPack: true, translation: 'الموزة صفراء.', category: 'Food'),
  Lesson(word: 'Bread', sentence: 'I eat ___.', options: ['Bread', 'Milk', 'Egg'], imageFile: 'n23', indexInPack: 0, isPack: true, translation: 'أنا آكل خبزاً.', category: 'Food'),
  Lesson(word: 'Milk', sentence: 'I drink ___.', options: ['Milk', 'Bread', 'Egg'], imageFile: 'n24', indexInPack: 0, isPack: true, translation: 'أنا أشرب حليباً.', category: 'Food'),
  Lesson(word: 'Egg', sentence: 'The ___ is white.', options: ['Egg', 'Milk', 'Apple'], imageFile: 'n25', indexInPack: 0, isPack: true, translation: 'البيضة بيضاء.', category: 'Food'),
  Lesson(word: 'Cheese', sentence: 'I like ___.', options: ['Cheese', 'Bread', 'Milk'], imageFile: 'n26', indexInPack: 0, isPack: true, translation: 'أنا أحب الجبن.', category: 'Food'),
  Lesson(word: 'Orange', sentence: 'The ___ is orange.', options: ['Orange', 'Apple', 'Banana'], imageFile: 'n27', indexInPack: 0, isPack: true, translation: 'البرتقالة برتقالية.', category: 'Food'),
  Lesson(word: 'Strawberry', sentence: 'The ___ is red.', options: ['Strawberry', 'Banana', 'Bread'], imageFile: 'n28', indexInPack: 0, isPack: true, translation: 'الفراولة حمراء.', category: 'Food'),
  Lesson(word: 'Grapes', sentence: 'I like ___.', options: ['Grapes', 'Cheese', 'Egg'], imageFile: 'n29', indexInPack: 0, isPack: true, translation: 'أنا أحب العنب.', category: 'Food'),
  Lesson(word: 'Cookie', sentence: 'I eat a ___.', options: ['Cookie', 'Apple', 'Egg'], imageFile: 'n30', indexInPack: 0, isPack: true, translation: 'أنا آكل بسكويتاً.', category: 'Food'),

  // GROUP 4 - Food & More - 41 to 50
  Lesson(word: 'Ice Cream', sentence: 'I like ___.', options: ['Ice Cream', 'Bread', 'Egg'], imageFile: 'n31', indexInPack: 0, isPack: true, translation: 'أنا أحب آيس كريم.', category: 'Food & More'),
  Lesson(word: 'Juice', sentence: 'I drink ___.', options: ['Juice', 'Milk', 'Water'], imageFile: 'n32', indexInPack: 0, isPack: true, translation: 'أنا أشرب عصيراً.', category: 'Food & More'),
  Lesson(word: 'Cake', sentence: 'The ___ is sweet.', options: ['Cake', 'Bread', 'Cheese'], imageFile: 'n33', indexInPack: 0, isPack: true, translation: 'الكعكة حلوة.', category: 'Food & More'),
  Lesson(word: 'Lemon', sentence: 'The ___ is yellow.', options: ['Lemon', 'Banana', 'Apple'], imageFile: 'n34', indexInPack: 0, isPack: true, translation: 'الليمونة صفراء.', category: 'Food & More'),
  Lesson(word: 'Cup', sentence: 'This is a ___.', options: ['Cup', 'Book', 'Chair'], imageFile: 'n35', indexInPack: 0, isPack: true, translation: 'هذا كوب.', category: 'Food & More'),
  Lesson(word: 'Kitchen', sentence: 'This is a ___.', options: ['Kitchen', 'House', 'Door'], imageFile: 'n36', indexInPack: 0, isPack: true, translation: 'هذا مطبخ.', category: 'Food & More'),
  Lesson(word: 'Oranges', sentence: 'I like ___.', options: ['Oranges', 'Apples', 'Grapes'], imageFile: 'n37', indexInPack: 0, isPack: true, translation: 'أنا أحب البرتقال.', category: 'Food & More'),
  Lesson(word: 'Strawberries', sentence: 'I like ___.', options: ['Strawberries', 'Oranges', 'Grapes'], imageFile: 'n38', indexInPack: 0, isPack: true, translation: 'أنا أحب الفراولة.', category: 'Food & More'),
  Lesson(word: 'Apples', sentence: 'The ___ are red.', options: ['Apples', 'Bananas', 'Eggs'], imageFile: 'n39', indexInPack: 0, isPack: true, translation: 'التفاح أحمر.', category: 'Food & More'),
  Lesson(word: 'Red', sentence: 'The apple is ___.', options: ['Red', 'Blue', 'Yellow'], imageFile: 'n40', indexInPack: 0, isPack: true, translation: 'التفاحة حمراء.', category: 'Food & More'),

  // GROUP 5 - Animals - 51 to 60
  Lesson(word: 'Dog', sentence: 'The ___ is small.', options: ['Dog', 'Cat', 'Bird'], imageFile: 'n41', indexInPack: 0, isPack: true, translation: 'الكلب صغير.', category: 'Animals'),
  Lesson(word: 'Cat', sentence: 'The ___ is white.', options: ['Cat', 'Dog', 'Fish'], imageFile: 'n42', indexInPack: 0, isPack: true, translation: 'القطة بيضاء.', category: 'Animals'),
  Lesson(word: 'Bird', sentence: 'The ___ can fly.', options: ['Bird', 'Fish', 'Dog'], imageFile: 'n43', indexInPack: 0, isPack: true, translation: 'الطائر يستطيع الطيران.', category: 'Animals'),
  Lesson(word: 'Fish', sentence: 'The ___ can swim.', options: ['Fish', 'Bird', 'Cat'], imageFile: 'n44', indexInPack: 0, isPack: true, translation: 'السمكة تستطيع السباحة.', category: 'Animals'),
  Lesson(word: 'Elephant', sentence: 'The ___ is big.', options: ['Elephant', 'Dog', 'Cat'], imageFile: 'n45', indexInPack: 0, isPack: true, translation: 'الفيل كبير.', category: 'Animals'),
  Lesson(word: 'Turtle', sentence: 'The ___ is slow.', options: ['Turtle', 'Rabbit', 'Bird'], imageFile: 'n46', indexInPack: 0, isPack: true, translation: 'السلحفاة بطيئة.', category: 'Animals'),
  Lesson(word: 'Rabbit', sentence: 'The ___ is fast.', options: ['Rabbit', 'Turtle', 'Fish'], imageFile: 'n47', indexInPack: 0, isPack: true, translation: 'الأرنب سريع.', category: 'Animals'),
  Lesson(word: 'Leopard', sentence: 'The ___ is fast.', options: ['Leopard', 'Turtle', 'Elephant'], imageFile: 'n48', indexInPack: 0, isPack: true, translation: 'النمر سريع.', category: 'Animals'),
  Lesson(word: 'Kitten', sentence: 'The ___ is small.', options: ['Kitten', 'Dog', 'Elephant'], imageFile: 'n49', indexInPack: 0, isPack: true, translation: 'القطة الصغيرة صغيرة.', category: 'Animals'),
  Lesson(word: 'Black Cat', sentence: 'The ___ is black.', options: ['Black Cat', 'White Cat', 'Dog'], imageFile: 'n50', indexInPack: 0, isPack: true, translation: 'القطة السوداء سوداء.', category: 'Animals'),

  // GROUP 6 - Home & Nature - 61 to 70
  Lesson(word: 'House', sentence: 'The ___ is big.', options: ['House', 'Door', 'Tree'], imageFile: 'n51', indexInPack: 0, isPack: true, translation: 'البيت كبير.', category: 'Home & Nature'),
  Lesson(word: 'Door', sentence: 'Open the ___.', options: ['Door', 'Window', 'Chair'], imageFile: 'n52', indexInPack: 0, isPack: true, translation: 'افتح الباب.', category: 'Home & Nature'),
  Lesson(word: 'Window', sentence: 'Open the ___.', options: ['Window', 'Door', 'House'], imageFile: 'n53', indexInPack: 0, isPack: true, translation: 'افتح النافذة.', category: 'Home & Nature'),
  Lesson(word: 'Chair', sentence: 'Sit on the ___.', options: ['Chair', 'Door', 'Window'], imageFile: 'n54', indexInPack: 0, isPack: true, translation: 'اجلس على الكرسي.', category: 'Home & Nature'),
  Lesson(word: 'Tree', sentence: 'The ___ is green.', options: ['Tree', 'Rose', 'Sunflower'], imageFile: 'n55', indexInPack: 0, isPack: true, translation: 'الشجرة خضراء.', category: 'Home & Nature'),
  Lesson(word: 'Sky', sentence: 'The ___ is blue.', options: ['Sky', 'Moon', 'Star'], imageFile: 'n56', indexInPack: 0, isPack: true, translation: 'السماء زرقاء.', category: 'Home & Nature'),
  Lesson(word: 'Moon', sentence: 'The ___ is white.', options: ['Moon', 'Sky', 'Star'], imageFile: 'n57', indexInPack: 0, isPack: true, translation: 'القمر أبيض.', category: 'Home & Nature'),
  Lesson(word: 'Star', sentence: 'The ___ is bright.', options: ['Star', 'Moon', 'Sky'], imageFile: 'n58', indexInPack: 0, isPack: true, translation: 'النجمة مشرقة.', category: 'Home & Nature'),
  Lesson(word: 'Rose', sentence: 'The ___ is red.', options: ['Rose', 'Sunflower', 'Tree'], imageFile: 'n59', indexInPack: 0, isPack: true, translation: 'الوردة حمراء.', category: 'Home & Nature'),
  Lesson(word: 'Sunflower', sentence: 'The ___ is yellow.', options: ['Sunflower', 'Rose', 'Tree'], imageFile: 'n60', indexInPack: 0, isPack: true, translation: 'دوار الشمس أصفر.', category: 'Home & Nature'),

  // GROUP 7 - Fun & School - 71 to 80
  Lesson(word: 'Snowman', sentence: 'The ___ is white.', options: ['Snowman', 'Rainbow', 'Balloon'], imageFile: 'n61', indexInPack: 0, isPack: true, translation: 'رجل الثلج أبيض.', category: 'Fun & School'),
  Lesson(word: 'Rainbow', sentence: 'The ___ is colorful.', options: ['Rainbow', 'Snowman', 'Star'], imageFile: 'n62', indexInPack: 0, isPack: true, translation: 'قوس قزح ملون.', category: 'Fun & School'),
  Lesson(word: 'Balloons', sentence: 'The ___ are colorful.', options: ['Balloons', 'Balloon', 'Ball'], imageFile: 'n63', indexInPack: 0, isPack: true, translation: 'البالونات ملونة.', category: 'Fun & School'),
  Lesson(word: 'Balloon', sentence: 'The ___ is red.', options: ['Balloon', 'Balloons', 'Ball'], imageFile: 'n64', indexInPack: 0, isPack: true, translation: 'البالون أحمر.', category: 'Fun & School'),
  Lesson(word: 'Water', sentence: 'I drink ___.', options: ['Water', 'Juice', 'Milk'], imageFile: 'n65', indexInPack: 0, isPack: true, translation: 'أنا أشرب ماء.', category: 'Fun & School'),
  Lesson(word: 'Ball', sentence: 'The ___ is orange.', options: ['Ball', 'Balloon', 'Balloons'], imageFile: 'n66', indexInPack: 0, isPack: true, translation: 'الكرة برتقالية.', category: 'Fun & School'),
  Lesson(word: 'Pencils', sentence: 'I write with ___.', options: ['Pencils', 'Pen', 'Book'], imageFile: 'n67', indexInPack: 0, isPack: true, translation: 'أنا أكتب بأقلام.', category: 'Fun & School'),
  Lesson(word: 'Pen', sentence: 'I write with a ___.', options: ['Pen', 'Pencils', 'Book'], imageFile: 'n68', indexInPack: 0, isPack: true, translation: 'أنا أكتب بقلم.', category: 'Fun & School'),
  Lesson(word: 'Book', sentence: 'I read a ___.', options: ['Book', 'Pen', 'Pencils'], imageFile: 'n69', indexInPack: 0, isPack: true, translation: 'أنا أقرأ كتاباً.', category: 'Fun & School'),
  Lesson(word: 'Car', sentence: 'The ___ is red.', options: ['Car', 'Ball', 'Book'], imageFile: 'n70', indexInPack: 0, isPack: true, translation: 'السيارة حمراء.', category: 'Fun & School'),

  // GROUP 8 - Greetings - 81 to 90
  Lesson(word: 'Wave', sentence: 'He can ___.', options: ['Wave', 'Run', 'Sleep'], imageFile: 'n71', indexInPack: 0, isPack: true, translation: 'هو يستطيع أن يلوّح.', category: 'Greetings'),
  Lesson(word: 'Goodbye', sentence: 'He says ___.', options: ['Goodbye', 'Hello', 'Welcome'], imageFile: 'n72', indexInPack: 0, isPack: true, translation: 'هو يقول وداعاً.', category: 'Greetings'),
  Lesson(word: 'Raise hand', sentence: 'He can ___.', options: ['Raise hand', 'Wave', 'Run'], imageFile: 'n73', indexInPack: 0, isPack: true, translation: 'هو يستطيع رفع يده.', category: 'Greetings'),
  Lesson(word: 'Dinner', sentence: 'We eat ___.', options: ['Dinner', 'Breakfast', 'Lunch'], imageFile: 'n74', indexInPack: 0, isPack: true, translation: 'نحن نأكل عشاء.', category: 'Greetings'),
  Lesson(word: 'Goodnight', sentence: 'She says ___.', options: ['Goodnight', 'Hello', 'Goodbye'], imageFile: 'n75', indexInPack: 0, isPack: true, translation: 'هي تقول تصبح على خير.', category: 'Greetings'),
  Lesson(word: 'Talk', sentence: 'They ___.', options: ['Talk', 'Sleep', 'Run'], imageFile: 'n76', indexInPack: 0, isPack: true, translation: 'هم يتحدثون.', category: 'Greetings'),
  Lesson(word: 'Gift', sentence: 'This is a ___.', options: ['Gift', 'Book', 'Ball'], imageFile: 'n77', indexInPack: 0, isPack: true, translation: 'هذه هدية.', category: 'Greetings'),
  Lesson(word: 'Welcome', sentence: 'They say ___.', options: ['Welcome', 'Goodbye', 'Sorry'], imageFile: 'n78', indexInPack: 0, isPack: true, translation: 'هم يقولون أهلاً.', category: 'Greetings'),
  Lesson(word: 'Wake up', sentence: 'I ___ in the morning.', options: ['Wake up', 'Sleep', 'Eat'], imageFile: 'n79', indexInPack: 0, isPack: true, translation: 'أنا أستيقظ في الصباح.', category: 'Greetings'),
  Lesson(word: 'Shake hands', sentence: 'They ___.', options: ['Shake hands', 'Run', 'Sleep'], imageFile: 'n80', indexInPack: 0, isPack: true, translation: 'هم يتصافحون.', category: 'Greetings'),
];
