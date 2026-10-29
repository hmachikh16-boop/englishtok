export interface EducationalStory {
  id: string;
  titleAr: string;
  titleEn: string;
  textEn: string;
  textFr: string;
  level: string;
}

export const EDUCATIONAL_STORIES: EducationalStory[] = [
  {
    id: 'story-morning-routine',
    titleAr: 'روتين الصباح',
    titleEn: 'A Calm Morning',
    textEn: 'Every morning, Sara drinks water, reviews five words, and listens to one short sentence. Small habits build strong language skills.',
    textFr: 'Chaque matin, Sara boit de l’eau, révise cinq mots et écoute une courte phrase. Les petites habitudes créent de solides compétences linguistiques.',
    level: 'A1',
  },
  {
    id: 'story-market',
    titleAr: 'في السوق',
    titleEn: 'At the Market',
    textEn: 'Tom buys fruit, asks the price, and thanks the seller. Real conversations make vocabulary easier to remember.',
    textFr: 'Tom achète des fruits, demande le prix et remercie le vendeur. Les vraies conversations rendent le vocabulaire plus facile à retenir.',
    level: 'A2',
  },
  {
    id: 'story-interview',
    titleAr: 'مقابلة عمل',
    titleEn: 'The Job Interview',
    textEn: 'Maria prepares answers, speaks slowly, and asks one question at the end. Confidence grows with practice, not perfection.',
    textFr: 'Maria prépare ses réponses, parle lentement et pose une question à la fin. La confiance vient avec la pratique, pas la perfection.',
    level: 'B1',
  },
  {
    id: 'story-travel',
    titleAr: 'رحلة سفر',
    titleEn: 'A Short Trip',
    textEn: 'During a trip, short phrases help: “Where is the station?”, “How much is this?”, and “Thank you.” Practice them before you travel.',
    textFr: 'En voyage, les phrases courtes aident : « Où est la gare ? », « Combien ça coûte ? » et « Merci. » Exercez-les avant de partir.',
    level: 'A2',
  },
  {
    id: 'story-feedback',
    titleAr: 'تصحيح لطيف',
    titleEn: 'Gentle Correction',
    textEn: 'A good teacher corrects one mistake at a time and praises progress. Feedback should guide, not discourage.',
    textFr: 'Un bon enseignant corrige une erreur à la fois et encourage les progrès. Le retour doit guider, pas décourager.',
    level: 'B2',
  },
  {
    id: 'story-consistency',
    titleAr: 'الاستمرارية',
    titleEn: 'Consistency Wins',
    textEn: 'Ten minutes every day beats two hours once a week. Your brain remembers patterns through repetition.',
    textFr: 'Dix minutes par jour valent mieux que deux heures une fois par semaine. Le cerveau retient les schémas par la répétition.',
    level: 'A1',
  },
];