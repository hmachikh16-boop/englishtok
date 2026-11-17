// image_map.dart
// Maps each lesson (1-10) to its images for every window.
// Lessons 11-100 are NOT included — they use data.dart as-is.

class LessonImageMap {
  final String speaking; // image for Speaking window (window 1)
  final bool speakingIsPack;
  final int speakingIndexInPack;
  final String sentence; // sentence for Speaking window
  final List<String> listening; // 4 image file names for Listening (window 2)
  final List<bool> listeningIsPack;
  final List<int> listeningIndexInPack;
  final List<String> matchingImages; // 3 image file names for Matching (window 3)
  final List<bool> matchingIsPack;
  final List<int> matchingIndexInPack;
  final List<String> matchingWords; // 3 words for Matching (window 3)
  final String writing; // image for Writing (window 4)
  final bool writingIsPack;
  final int writingIndexInPack;
  final String writingWord; // word for Writing (window 4)
  final List<String> smartChoose; // 4 image file names for Smart Choose (window 5)
  final List<bool> smartChooseIsPack;
  final List<int> smartChooseIndexInPack;
  final String smartChooseQuestion; // question for Smart Choose (window 5)
  final String smartChooseCorrect; // correct image file name for Smart Choose

  const LessonImageMap({
    required this.speaking,
    this.speakingIsPack = false,
    this.speakingIndexInPack = 0,
    required this.sentence,
    required this.listening,
    required this.listeningIsPack,
    required this.listeningIndexInPack,
    required this.matchingImages,
    required this.matchingIsPack,
    required this.matchingIndexInPack,
    required this.matchingWords,
    required this.writing,
    this.writingIsPack = false,
    this.writingIndexInPack = 0,
    required this.writingWord,
    required this.smartChoose,
    required this.smartChooseIsPack,
    required this.smartChooseIndexInPack,
    required this.smartChooseQuestion,
    required this.smartChooseCorrect,
  });
}

const Map<int, LessonImageMap> lessonImageMap = {
  // Lesson 1: A boy
  1: LessonImageMap(
    speaking: 'q0',
    sentence: 'A boy.',
    listening: ['q0', 'n02', 'n42', 'n41'],
    listeningIsPack: [false, true, true, true],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['q0', 'n02', 'n42'],
    matchingIsPack: [false, true, true],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Boy', 'Girl', 'Cat'],
    writing: 'q0',
    writingWord: 'BOY',
    smartChoose: ['q0', 'n02', 'n42', 'n41'],
    smartChooseIsPack: [false, true, true, true],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is A boy?',
    smartChooseCorrect: 'q0',
  ),
  // Lesson 2: A girl
  2: LessonImageMap(
    speaking: 'n02',
    speakingIsPack: true,
    sentence: 'A girl.',
    listening: ['n02', 'q0', 'n42', 'n41'],
    listeningIsPack: [true, false, true, true],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['n02', 'q0', 'n41'],
    matchingIsPack: [true, false, true],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Girl', 'Boy', 'Dog'],
    writing: 'n02',
    writingIsPack: true,
    writingWord: 'GIRL',
    smartChoose: ['n02', 'q0', 'n42', 'n41'],
    smartChooseIsPack: [true, false, true, true],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is A girl?',
    smartChooseCorrect: 'n02',
  ),
  // Lesson 3: A cat
  3: LessonImageMap(
    speaking: 'n42',
    speakingIsPack: true,
    sentence: 'A cat.',
    listening: ['n42', 'n41', 'n02', 'q0'],
    listeningIsPack: [true, true, true, false],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['n42', 'n41', 'q0'],
    matchingIsPack: [true, true, false],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Cat', 'Dog', 'Boy'],
    writing: 'n42',
    writingIsPack: true,
    writingWord: 'CAT',
    smartChoose: ['n42', 'n41', 'n02', 'q0'],
    smartChooseIsPack: [true, true, true, false],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is A cat?',
    smartChooseCorrect: 'n42',
  ),
  // Lesson 4: The boy is eating
  4: LessonImageMap(
    speaking: 'n18',
    speakingIsPack: true,
    sentence: 'The boy is eating.',
    listening: ['n18', 'n19', 'n15', 'q6'],
    listeningIsPack: [true, true, true, false],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['n18', 'n19', 'n15'],
    matchingIsPack: [true, true, true],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Eating', 'Drinking', 'Running'],
    writing: 'n18',
    writingIsPack: true,
    writingWord: 'EATING',
    smartChoose: ['n18', 'n19', 'n15', 'q6'],
    smartChooseIsPack: [true, true, true, false],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is The boy is eating?',
    smartChooseCorrect: 'n18',
  ),
  // Lesson 5: The girl is drinking
  5: LessonImageMap(
    speaking: 'n19',
    speakingIsPack: true,
    sentence: 'The girl is drinking.',
    listening: ['n19', 'n18', 'n15', 'q6'],
    listeningIsPack: [true, true, true, false],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['n19', 'n18', 'n15'],
    matchingIsPack: [true, true, true],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Drinking', 'Eating', 'Running'],
    writing: 'n19',
    writingIsPack: true,
    writingWord: 'DRINKING',
    smartChoose: ['n19', 'n18', 'n15', 'q6'],
    smartChooseIsPack: [true, true, true, false],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is The girl is drinking?',
    smartChooseCorrect: 'n19',
  ),
  // Lesson 6: A big dog
  6: LessonImageMap(
    speaking: 'q2',
    sentence: 'A big dog.',
    listening: ['q2', 'n47', 'q6', 'q0'],
    listeningIsPack: [false, true, false, false],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['q2', 'n47', 'n45'],
    matchingIsPack: [false, true, true],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Big', 'Small', 'Tall'],
    writing: 'q2',
    writingWord: 'BIG',
    smartChoose: ['q2', 'n47', 'q6', 'q0'],
    smartChooseIsPack: [false, true, false, false],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is A big dog?',
    smartChooseCorrect: 'q2',
  ),
  // Lesson 7: A red apple
  7: LessonImageMap(
    speaking: 'q4',
    sentence: 'A red apple.',
    listening: ['q4', 'n22', 'n37', 'n39'],
    listeningIsPack: [false, true, true, true],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['q4', 'color_green', 'color_yellow'],
    matchingIsPack: [false, false, false],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Red', 'Green', 'Yellow'],
    writing: 'q4',
    writingWord: 'RED',
    smartChoose: ['q4', 'n22', 'n37', 'n39'],
    smartChooseIsPack: [false, true, true, true],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is A red apple?',
    smartChooseCorrect: 'q4',
  ),
  // Lesson 8: The boy and the girl
  8: LessonImageMap(
    speaking: 'n76',
    speakingIsPack: true,
    sentence: 'The boy and the girl.',
    listening: ['n76', 'q0', 'n02', 'q6'],
    listeningIsPack: [true, false, true, false],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['q0', 'n02', 'n76'],
    matchingIsPack: [false, true, true],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Boy', 'Girl', 'Boy and girl'],
    writing: 'n76',
    writingIsPack: true,
    writingWord: 'BOY AND GIRL',
    smartChoose: ['n76', 'q0', 'n02', 'q6'],
    smartChooseIsPack: [true, false, true, false],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is The boy and the girl?',
    smartChooseCorrect: 'n76',
  ),
  // Lesson 9: I am eating
  9: LessonImageMap(
    speaking: 'n18',
    speakingIsPack: true,
    sentence: 'I am eating.',
    listening: ['n18', 'n19', 'n15', 'q6'],
    listeningIsPack: [true, true, true, false],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['n18', 'n19', 'n15'],
    matchingIsPack: [true, true, true],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['Eating', 'Drinking', 'Running'],
    writing: 'n18',
    writingIsPack: true,
    writingWord: 'EATING',
    smartChoose: ['n18', 'n19', 'n15', 'q6'],
    smartChooseIsPack: [true, true, true, false],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is I am eating?',
    smartChooseCorrect: 'n18',
  ),
  // Lesson 10: The sun
  10: LessonImageMap(
    speaking: 'n56',
    speakingIsPack: true,
    sentence: 'The sun.',
    listening: ['n56', 'n57', 'n58', 'n69'],
    listeningIsPack: [true, true, true, true],
    listeningIndexInPack: [0, 0, 0, 0],
    matchingImages: ['n56', 'n57', 'n58'],
    matchingIsPack: [true, true, true],
    matchingIndexInPack: [0, 0, 0],
    matchingWords: ['SUN', 'MOON', 'STAR'],
    writing: 'n56',
    writingIsPack: true,
    writingWord: 'SUN',
    smartChoose: ['n56', 'n57', 'n58', 'n69'],
    smartChooseIsPack: [true, true, true, true],
    smartChooseIndexInPack: [0, 0, 0, 0],
    smartChooseQuestion: 'Which picture is The sun?',
    smartChooseCorrect: 'n56',
  ),
};
