// Data models for the dynamic, Firebase-backed Lingo Gold content.
// Mirrors the Firestore schema: categories / lessons / questions.

class Category {
  final String id;
  final String name;
  final String imageUrl;
  final int order;
  final DateTime? createdAt;

  const Category({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.order,
    this.createdAt,
  });

  factory Category.fromMap(String id, Map<String, dynamic> m) => Category(
        id: id,
        name: (m['name'] ?? '').toString(),
        imageUrl: (m['imageUrl'] ?? '').toString(),
        order: (m['order'] ?? 0) as int,
        createdAt: (m['createdAt'] as dynamic)?.toDate(),
      );
}

class Lesson {
  final String id;
  final String categoryId;
  final int lessonNumber;
  final String title;
  final int order;
  final bool isActive;
  final DateTime? createdAt;

  const Lesson({
    required this.id,
    required this.categoryId,
    required this.lessonNumber,
    required this.title,
    required this.order,
    required this.isActive,
    this.createdAt,
  });

  factory Lesson.fromMap(String id, Map<String, dynamic> m) => Lesson(
        id: id,
        categoryId: (m['categoryId'] ?? '').toString(),
        lessonNumber: (m['lessonNumber'] ?? 0) as int,
        title: (m['title'] ?? '').toString(),
        order: (m['order'] ?? 0) as int,
        isActive: (m['isActive'] ?? false) as bool,
        createdAt: (m['createdAt'] as dynamic)?.toDate(),
      );
}

enum QuestionType { speak, listen, choice, match, write }

class MatchPair {
  final String word;
  final String imageUrl;

  const MatchPair({required this.word, required this.imageUrl});

  factory MatchPair.fromMap(Map<String, dynamic> m) => MatchPair(
        word: (m['word'] ?? '').toString(),
        imageUrl: (m['imageUrl'] ?? '').toString(),
      );

  Map<String, dynamic> toMap() => {'word': word, 'imageUrl': imageUrl};
}

class Question {
  final String id;
  final String lessonId;
  final QuestionType type;
  final int order;
  final String englishText;
  final String arabicText;
  final List<String> imageUrls;
  final String? audioUrl;
  final int? correctIndex;
  final List<MatchPair> matchPairs;
  final String? correctWord;

  const Question({
    required this.id,
    required this.lessonId,
    required this.type,
    required this.order,
    required this.englishText,
    required this.arabicText,
    required this.imageUrls,
    this.audioUrl,
    this.correctIndex,
    required this.matchPairs,
    this.correctWord,
  });

  factory Question.fromMap(String id, Map<String, dynamic> m) {
    final t = (m['type'] ?? 'choice').toString();
    final type = QuestionType.values.firstWhere(
      (e) => e.name == t,
      orElse: () => QuestionType.choice,
    );
    return Question(
      id: id,
      lessonId: (m['lessonId'] ?? '').toString(),
      type: type,
      order: (m['order'] ?? 0) as int,
      englishText: (m['englishText'] ?? '').toString(),
      arabicText: (m['arabicText'] ?? '').toString(),
      imageUrls: (m['imageUrls'] as List? ?? const [])
          .map((e) => e.toString())
          .toList(),
      audioUrl: m['audioUrl']?.toString(),
      correctIndex: m['correctIndex'] as int?,
      matchPairs: (m['matchPairs'] as List? ?? const [])
          .map((e) => MatchPair.fromMap(Map<String, dynamic>.from(e)))
          .toList(),
      correctWord: m['correctWord']?.toString(),
    );
  }
}
