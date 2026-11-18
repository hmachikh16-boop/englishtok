// Firebase Firestore access layer for Lingo Gold (dynamic content).
// Uses streams so the app updates in real time when the admin panel changes data.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'models.dart';

class FirestoreService {
  FirestoreService._();
  static final FirestoreService instance = FirestoreService._();

  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Category>> categoriesStream() => _db
      .collection('categories')
      .orderBy('order')
      .snapshots()
      .map((s) => s.docs
          .map((d) => Category.fromMap(d.id, d.data()))
          .toList());

  Stream<List<Lesson>> lessonsStream(String categoryId) => _db
      .collection('lessons')
      .where('categoryId', isEqualTo: categoryId)
      .where('isActive', isEqualTo: true)
      .orderBy('order')
      .snapshots()
      .map((s) => s.docs
          .map((d) => Lesson.fromMap(d.id, d.data()))
          .toList());

  Stream<List<Question>> questionsStream(String lessonId) => _db
      .collection('questions')
      .where('lessonId', isEqualTo: lessonId)
      .orderBy('order')
      .snapshots()
      .map((s) => s.docs
          .map((d) => Question.fromMap(d.id, d.data()))
          .toList());
}
