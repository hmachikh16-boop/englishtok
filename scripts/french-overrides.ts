/**
 * Curated corrections applied after machine translation of the English
 * curriculum. Only entries that need a human decision belong here; leaving a
 * word out means "accept Google Translate's dictionary form".
 */

/** Dictionary-form overrides keyed by the lower-cased English headword. */
export const WORD_OVERRIDES: Record<string, string> = {
  // Idioms and phrasal verbs must not be translated literally.
  'break a leg': 'bonne chance',
  'call it a day': 'arrêter pour aujourd’hui',
  'figure out': 'comprendre',
  'carry on': 'continuer',
  'on the other hand': 'd’autre part',
  'from my perspective': 'de mon point de vue',
  'strongly believe': 'croire fermement',
  'in my opinion': 'à mon avis',
  'make up your mind': 'prendre une décision',
  'look forward to': 'attendre avec impatience',
  'get along with': 'bien s’entendre avec',
  'give up': 'abandonner',
  'put off': 'reporter',
  'run out of': 'manquer de',
  'take care of': 'prendre soin de',
  'find out': 'découvrir',
  'turn down': 'refuser',
  'bring up': 'soulever',
  'come across': 'tomber sur',
  'get over': 'surmonter',
  'look after': 's’occuper de',
  'pick up': 'ramasser',
  'point out': 'signaler',
  'set up': 'mettre en place',
  'work out': 'résoudre',
  'break down': 'tomber en panne',
  'calm down': 'se calmer',
  'check in': 's’enregistrer',
  'check out': 'régler et partir',
  'drop off': 'déposer',
  'fill in': 'remplir',
  'go over': 'revoir',
  'hold on': 'attendre',
  'log in': 'se connecter',
  'look up': 'chercher',
  'move on': 'passer à autre chose',
  'plug in': 'brancher',
  'print out': 'imprimer',
  'put on': 'porter',
  'sign up': 's’inscrire',
  'take off': 'décoller',
  'try on': 'essayer',
  'turn on': 'allumer',
  'turn off': 'éteindre',
  'wake up': 'se réveiller',
  'warm up': 's’échauffer',
  'write down': 'noter',
  // Polysemes where a standalone lookup picks the wrong sense.
  fine: 'amende',
  match: 'allumette',
  mean: 'signifier',
  present: 'cadeau',
  left: 'gauche',
  right: 'droite',
  light: 'lumière',
  bark: 'aboiement',
  bat: 'chauve-souris',
  spring: 'printemps',
  bank: 'banque',
  watch: 'montre',
  ring: 'bague',
  fly: 'mouche',
  saw: 'scie',
  wave: 'vague',
  tear: 'larme',
  close: 'fermer',
  live: 'vivre',
  read: 'lire',
  lead: 'mener',
  wind: 'vent',
  row: 'rangée',
  bow: 'arc',
  minute: 'minute',
  desert: 'désert',
  contract: 'contrat',
  object: 'objet',
  subject: 'sujet',
  project: 'projet',
  record: 'enregistrement',
  permit: 'permis',
  refuse: 'refuser',
  content: 'contenu',
  entrance: 'entrée',
  invalid: 'invalide',
  // Translation fixes found by auditing the generated lessons. Many of these
  // are words whose English spelling has two senses and where Google picked
  // the wrong one in isolation.
  chicken: 'poule',
  english: 'anglais',
  french: 'français',
  sister: 'sœur',
  eye: 'œil',
  healthy: 'sain',
  cook: 'cuisiner',
  visit: 'rendre visite',
  dress: 's’habiller',
  please: 's’il vous plaît',
  brush: 'se brosser',
  tidy: 'ranger',
  running: 'courir',
  'going to': 'aller',
  'would you like to': 'voudriez-vous',
  'join us': 'rejoindre',
  'give you a hand': 'donner un coup de main',
  collect: 'collectionner',
  attach: 'joindre',
  'works for me': 'ça me convient',
  'no problem': 'pas de problème',
  burnout: 'épuisement professionnel',
  advocate: 'défendre',
  volunteer: 'faire du bénévolat',
  stigma: 'stigmatisation',
  supportive: 'solidaire',
  organic: 'bio',
  craftsmanship: 'savoir-faire',
  addiction: 'dépendance',
  signpost: 'indiquer',
  'body language': 'langage corporel',
  backchannel: 'canal parallèle',
  stimulus: 'relance',
  remedy: 'recours',
  credential: 'diplôme',
  sampling: 'échantillonnage',
  retrospective: 'rétrospectif',
  lampoon: 'critiquer',
  'shall we': 'on se retrouve',
  swing: 'balançoire',
  slide: 'toboggan',
  like: 'aimer',
  love: 'adorer',
  clean: 'propre',
  cross: 'traverser',
  doctor: 'docteur',
  remember: 'se souvenir',
  run: 'courir',
  prescription: 'ordonnance',
  headache: 'mal de tête',
  'sore throat': 'mal de gorge',
  'public transport': 'transports en commun',
  'speak to': 'parler',
  friendly: 'sympathique',
  profit: 'profit',
  heritage: 'patrimoine',
  pivot: 'réorientation',
  post: 'publier',
  'window seat': 'siège côté fenêtre',
  'slice of cake': 'part de gâteau',
  freezing: 'glacial',
  peaceful: 'paisible',
  traffic: 'circulation',
  fare: 'prix',
  journey: 'trajet',
  can: 'peux',
  could: 'pourriez-vous',
  might: 'pourraient',
  must: 'dois',
  should: 'devriez',
  went: 'aller',
  'turn left': 'tourner à gauche',
  'where is...?': 'où est',
  'had better': 'il vaut mieux',
  'why not': 'pourquoi ne pas',
  'have been': 'être allé',
  'used to': 'avoir l’habitude de',
  'no longer': 'ne plus',
  'in the end': 'au final',
  confident: 'confiant',
  bias: 'biais',
  plot: 'intrigue',
  lyrics: 'paroles',
  caregiver: 'aidant',
  default: 'paramètre par défaut',
  runway: 'piste de financement',
  valuation: 'valorisation',
  remittance: 'envois de fonds',
  framing: 'cadrage',
  enjambment: 'enjambement',
  climax: 'point culminant',
  deadpan: 'pince-sans-rire',
  agenda: 'ordre du jour',
  entail: 'impliquer',
  'trust-building': 'instauration de la confiance',
  reputational: 'réputationnel',
  reskilling: 'reconversion',
  'aller à': 'aller',
  // French classroom vocabulary that machine translation often renders with
  // an unnecessary article or a different register.
  hello: 'bonjour',
  goodbye: 'au revoir',
  'thank you': 'merci',
  'you’re welcome': 'de rien',
  'excuse me': 'excusez-moi',
  'i’m sorry': 'je suis désolé',
  'how are you?': 'comment allez-vous ?',
  'nice to meet you': 'enchanté',
  'see you later': 'à plus tard',
  'good morning': 'bonjour',
  'good evening': 'bonsoir',
  'good night': 'bonne nuit',
  'how many?': 'combien ?',
  'how much?': 'combien ?',
  'what is your name?': 'comment vous appelez-vous ?',
  'where is it?': 'où est-ce ?',
  'what color?': 'de quelle couleur ?',
};

/** Full-sentence overrides keyed by the exact English source. */
/** Arabic glosses that need a human correction even when the French word is fine. */
export const AR_OVERRIDES: Record<string, string> = {
  'shall we': 'هل نلتقي؟',
  will: 'المستقبل البسيط',
  would: 'الماضي المستخدم للعادات',
};

export const SENTENCE_OVERRIDES: Record<string, string> = {
  'A is for Apple.': 'A comme pomme.',
  'B is for Ball.': 'B comme ballon.',
  'C is for Cat.': 'C comme chat.',
  'D is for Dog.': 'D comme chien.',
  'A is for Apple / B is for Ball': 'A comme pomme / B comme ballon',
  'I have a red ball.': 'J’ai un ballon rouge.',
  'The slide is very fast.': 'Le toboggan est très rapide.',
  'The pot is very hot.': 'Le pot est très chaud.',
  'A تعني تفاحة / B تعني Ball': 'A veut dire pomme / B veut dire ballon',
  'How many? → Three balls.': 'Combien ? → Trois ballons.',
  'It is a yellow circle.': 'C’est un cercle jaune.',
  'Hello, I am [Name]. I am [Number] years old.':
    'Bonjour, je m’appelle [Nom]. J’ai [Nombre] ans.',
  'Regular: [verb+ed] / Irregular: Go → Went.':
    'Réguliers : [verbe + -er] / Irréguliers : aller → je suis allé.',
  'If + Past Perfect → Would have + P.P':
    'Si + plus-que-parfait → conditionnel passé',
  'Phrasal Verb + Object / Idiomatic Expressions':
    'Verbe à particule + complément / expressions idiomatiques',
  'Passive Voice for formal topics.': 'La voix passive pour les sujets formels.',
  'Hedging & Diplomatic Language.': 'Langue de nuance et diplomatie.',
  'Advanced Cohesive Devices & Academic Structures.':
    'Connecteurs avancés et structures académiques.',
  'Inverted Structures for Emphasis.': 'Structures inversées pour insister.',
  'Rhetorical Questions & Rule of Three.':
    'Questions rhétoriques et règle de trois.',
  'In my opinion, [Clause], although [Counter-argument].':
    'À mon avis, [proposition], bien que [contre-argument].',
  'Can I have [Food], please? / I prefer [X] to [Y].':
    'Puis-je avoir [plat], s’il vous plaît ? / Je préfère [X] à [Y].',
  'How can I get to [Place]?': 'Comment puis-je aller à [lieu] ?',
  'I [verb] every day. / He [verb+s] at 7 AM.':
    'Je [verbe] chaque jour. / Il [verbe] à 7 h.',
  'We can use these words together.': 'Nous pouvons utiliser ces mots ensemble.',
  'Let’s call it a day.': 'Arrêtons pour aujourd’hui.',
  "Let's call it a day.": 'Arrêtons pour aujourd’hui.',
  'Break a leg.': 'Bonne chance.',
  'Figure it out.': 'Débrouille-toi.',
  'Carry on.': 'Continue.',
  'He ___ at 7 AM.': 'Il ___ à 7 h.',
  'She ___ a new student.': 'Elle ___ une nouvelle élève.',
  'There ___ two cats in the garden.': 'Il y ___ deux chats dans le jardin.',
  'He ___ football yesterday.': 'Il ___ au football hier.',
  'This bag is ___ than that one.': 'Ce sac est ___ que celui-là.',
  'If I had studied harder, I ___ the exam.':
    'Si j’avais étudié davantage, j’___ réussi l’examen.',
  'The report ___ by the team yesterday.':
    'Le rapport ___ par l’équipe hier.',
  'Rarely ___ such a compelling argument.':
    'Rarement ___ entendu un argument aussi convaincant.',
  'Not only ___ the deadline, but the team also improved quality.':
    'Non seulement l’équipe ___ le délai, mais elle a aussi amélioré la qualité.',
  'Sara wakes up at seven, eats breakfast, and walks to school.':
    'Sara se réveille à sept heures, prend son petit-déjeuner et va à l’école à pied.',
  'I usually take the bus to work, but today I am walking because the weather is beautiful.':
    'Je prends habituellement le bus pour aller au travail, mais aujourd’hui je marche parce que le temps est magnifique.',
  'Although the proposal was ambitious, the committee rejected it because the budget was unclear.':
    'Bien que la proposition ait été ambitieuse, le comité l’a rejetée parce que le budget n’était pas clair.',
  "The author's tone is deliberately restrained; she lets the evidence speak rather than urging the reader toward a conclusion.":
    'Le ton de l’auteure est volontairement retenu ; elle laisse les preuves parler plutôt que de pousser le lecteur vers une conclusion.',
  // Idioms whose literal translation would be misleading.
  'Break a leg at your interview!': 'Bonne chance pour votre entretien !',
  "It's late. Let's call it a day.": 'Il est tard. Arrêtons pour aujourd’hui.',
  'Can you figure out the problem?': 'Pouvez-vous comprendre le problème ?',
  'Break a leg is a common idiom.': '« Poser un lapin » est un idiome courant.',
  "You're right. Let's call it a day.": 'Tu as raison. Arrêtons pour aujourd’hui.',
  'Before we go, can you figure out the last report?':
    'Avant de partir, pouvez-vous comprendre le dernier rapport ?',
  'Great! Break a leg at your presentation tomorrow.':
    'Super ! Bonne chance pour votre présentation demain.',
  // Examples where the first translation used a synonym of the headword.
  'Hidden bias in hiring tools can quietly exclude capable candidates from minority backgrounds.':
    'Les biais cachés dans les outils de recrutement peuvent exclure discrètement des candidats compétents issus de minorités.',
  'Anaphora builds momentum because the repeated opening creates a rhythm the audience can anticipate.':
    'L’anaphore crée une dynamique parce que l’ouverture répétée installe un rythme que le public peut anticiper.',
  'An unpaid caregiver often works long hours that nobody notices, including their own family.':
    'Un aidant non rémunéré travaille souvent de longues heures que personne ne remarque, y compris sa propre famille.',
  'Then change the default enrollment, because inertia is stronger than any leaflet we could print.':
    'Changez ensuite le paramètre par défaut, car l’inertie est plus forte que n’importe quel dépliant que nous pourrions imprimer.',
  'With that runway, they can afford one pivot and perhaps one serious hiring mistake.':
    'Avec cette piste de financement, ils peuvent se permettre un pivot et peut-être une grave erreur de recrutement.',
  'Remittance money supports schools and clinics in the country they left.':
    'Les envois de fonds des migrants soutiennent les écoles et les cliniques du pays qu’ils ont quitté.',
  'The reputational damage from that lawsuit will outlast the settlement and every press release defending it.':
    'Les dommages réputationnels causés par ce procès survivront à la transaction et à tous les communiqués de presse qui la défendent.',
  'Would you like a window seat, sir?':
    'Voulez-vous un siège côté fenêtre, monsieur ?',
  'It is sunny and warm in the park.':
    'Le temps est ensoleillé et chaud au parc.',
  'It is a sunny day.': 'Le temps est ensoleillé aujourd’hui.',
  'I do not like rainy days.': 'Je n’aime pas les jours pluvieux.',
  'Now it is windy and cold.': 'Maintenant, il fait venteux et froid.',
  'Public transport in the city is fast and cheap.':
    'Les transports en commun en ville sont rapides et bon marché.',
  'I also have a sore throat and a cough.':
    'J’ai aussi mal de gorge et je tousse.',
  'Why don\'t we meet in front of the mall at seven?':
    'Pourquoi ne pas nous retrouver devant le centre commercial à sept heures ?',
  'Would you like to come with me? I have two tickets.':
    'Voudriez-vous venir avec moi ? J’ai deux billets.',
  'I will open a quiet backchannel with their deputy, far from the cameras and the prepared statements.':
    'J’ouvrirai un canal parallèle discret avec leur adjoint, loin des caméras et des déclarations préparées.',
  'Any vague answer risks escalation, especially while three television crews are waiting outside the gate.':
    'Toute réponse vague risque une escalade, surtout lorsque trois équipes de télévision attendent devant la porte.',
  'The sampling frame excluded rural households, which makes the national claim considerably weaker.':
    'La base d’échantillonnage excluait les ménages ruraux, ce qui affaiblit considérablement la revendication nationale.',
  'The privacy of the family matters more than the photograph, however much it would improve the page.':
    'La vie privée de la famille compte plus que la photographie, même si elle améliorait la page.',
  'We have little leverage here, because they have three other interested buyers.':
    'Nous avons peu d’effet de levier ici, car ils ont trois autres acheteurs intéressés.',
  'We used our leverage in the deal.':
    'Nous avons utilisé notre effet de levier dans la transaction.',
  'Furthermore, the sample was small.': 'En outre, l’échantillon était petit.',
  'She gave a persuasive speech.': 'Elle a prononcé un discours persuasif.',
  'We should review the past tenses before the test.':
    'Nous devrions revoir les temps du passé avant le test.',
  'The subject line should be short and clear.':
    'La ligne d’objet doit être courte et claire.',
  'Please clean the table.': 'Veuillez nettoyer la table.',
  'We cook dinner together.': 'Nous cuisinons le dîner ensemble.',
  'We visit my grandmother.': 'Nous rendons visite à ma grand-mère.',
  'We bake a cake today.': 'Nous cuisons un gâteau aujourd’hui.',
  'Please sit on the chair.': 'Asseyez-vous sur la chaise, s’il vous plaît.',
  'We eat breakfast together.': 'Nous mangeons le petit déjeuner ensemble.',
  'I remember all the words.': 'Je me souviens de tous les mots.',
  'I wake up at seven.': 'Je me réveille à sept heures.',
  'I brush my teeth.': 'Je me brosse les dents.',
  'I feel more confident when I speak English now.':
    'Je me sens plus confiant lorsque je parle français maintenant.',
  'I always read the review before I buy.':
    'Je lis toujours la critique avant d’acheter.',
  'My favourite subject is history.':
    'Ma matière préférée est l’histoire.',
  'I keep my hands clean.': 'Je garde les mains propres.',
  'My head hurts, doctor.': 'J’ai mal à la tête, docteur.',
  'The plot slows in the middle, but the final chapters justify the patience.':
    'L’intrigue ralentit au milieu, mais les derniers chapitres justifient la patience.',
  'The lyrics are simple, yet they capture what my generation felt.':
    'Les paroles sont simples, mais elles capturent ce que ma génération a ressenti.',
  'Set the agenda carefully, because the order of items can determine which concessions feel possible.':
    'Établissez soigneusement l’ordre du jour, car l’ordre des points peut déterminer quelles concessions semblent possibles.',
  'The deadpan delivery is what saves it, because the joke never announces itself as a joke.':
    'C’est le discours pince-sans-rire qui le sauve, car la plaisanterie ne s’annonce jamais comme une plaisanterie.',
  'Notice the enjambment at the line break, where the syntax hesitates before releasing the final word.':
    'Remarquez l’enjambement au niveau du saut de ligne, où la syntaxe hésite avant de libérer le dernier mot.',
  'The climax works emotionally, yet it depends on a coincidence the earlier chapters never prepare us for.':
    'Le point culminant fonctionne émotionnellement, mais il dépend d’une coïncidence à laquelle les chapitres précédents ne nous préparent jamais.',
  'Framing works because audiences evaluate options relative to a reference point, not in absolute terms.':
    'Le cadrage fonctionne parce que le public évalue les options par rapport à un point de référence, et non en termes absolus.',
  'A lower valuation now might attract patient capital instead of investors chasing a quick exit.':
    'Une valorisation plus faible aujourd’hui pourrait attirer des capitaux patients au lieu d’investisseurs cherchant une sortie rapide.',
  'Reskilling works when it is funded during working hours, not offered as an evening course after a full shift.':
    'La reconversion fonctionne lorsqu’elle est financée pendant les heures de travail et non proposée sous forme de cours du soir après une journée complète.',
  'We eat dinner at six.': 'Nous mangeons le dîner à six heures.',
  'Hold on a moment, please. I will check.':
    'Veuillez attendre un instant, s’il vous plaît. Je vais vérifier.',
  'Wait, are you sure? I think I have the wrong number.':
    'Attends, tu es sûr ? Je crois que j’ai fait un mauvais numéro.',
  'How about going to the cinema tonight?':
    'Que diriez-vous d’aller au cinéma ce soir ?',
  'The drive back was long and tiring.':
    'Le retour fut long et fatigant.',
  'I learn quickly, and my salary expectation is fair.':
    'J’apprends vite et mes attentes de salaire sont équitables.',
  'I used to play football every day after school.':
    'J’avais l’habitude de jouer au football tous les jours après l’école.',
  'We often misinterpret directness as rudeness when another culture values honesty.':
    'Il est facile de mal interpréter la franchise comme de l’impolitesse, alors qu’une autre culture valorise l’honnêteté.',
  'The real breakthrough came from a young researcher nobody had invited.':
    'La véritable percée est venue d’un jeune chercheur que personne n’avait invité.',
  'Good nutrition supports recovery, yet hospital meals are often an afterthought.':
    'Une bonne nutrition favorise la récupération, mais les repas à l’hôpital sont souvent négligés.',
  'Compliance is expensive, but ignoring safety rules costs far more in trust.':
    'La conformité coûte cher, mais ignorer les règles de sécurité coûte bien plus cher en termes de confiance.',
  'We should argue for the policy, but acknowledge its costs honestly.':
    'Nous devrions argumenter en faveur de cette politique, mais reconnaître honnêtement ses coûts.',
  'Even so, their pivot from hardware to software looks credible and the team has executed quickly.':
    'Même ainsi, leur réorientation du matériel vers le logiciel semble crédible et l’équipe a agi rapidement.',
  'Make the benefit salient in the first sentence, since attention decays faster than interest.':
    'Rendez l’avantage saillant dès la première phrase, car l’attention diminue plus rapidement que l’intérêt.',
  'Every loanword arrives with a history, and resisting it rarely reverses the social forces that brought it.':
    'Chaque mot d’emprunt arrive avec une histoire, et y résister inverse rarement les forces sociales qui l’ont amené.',
};

/** Lesson-title overrides for the hand-authored foundation lessons. */
export const TITLE_OVERRIDES: Record<string, string> = {
  'Alphabet & Phonics': 'Alphabet et phonétique',
  'Numbers & Counting': 'Les nombres et le comptage',
  'Colors & Shapes': 'Couleurs et formes',
  'Self-Introduction': 'Se présenter',
  'Daily Routine & Present Simple': 'Routine quotidienne et présent simple',
  'Ordering Food & Preferences': 'Commander à manger et exprimer ses préférences',
  'Past Experiences & Past Simple': 'Le passé et les expériences vécues',
  'Asking for Directions & Travel': 'Demander son chemin et voyager',
  'Expressing Opinions & Debate': 'Exprimer son opinion et débattre',
  'Idioms & Phrasal Verbs in Context': 'Expressions idiomatiques et verbes à particule',
  'Complex Tenses & Conditionals': 'Temps complexes et conditionnels',
  'Technology & Environmental Issues': 'Technologie et enjeux environnementaux',
  'Business Communication & Negotiation': 'Communication professionnelle et négociation',
  'Academic Writing & Analysis': 'Écriture académique et analyse',
  'Nuances, Irony & Cultural Subtleties': 'Nuances, ironie et subtilités culturelles',
  'Public Speaking & Rhetoric': 'Art oratoire et rhétorique',
  'Modals: can/could/must/should': 'Les verbes modaux : pouvoir et devoir',
  'Bridge: Daily Routine & Present Simple × Past Experiences & Past Simple':
    'Pont : routine quotidienne et présent simple × expériences passées et passé composé',
  'Link: Past Experiences & Past Simple × Ordering Food & Preferences':
    'Lien : expériences passées et passé composé × commander à manger et préférences',
  'Link: Comparatives & Superlatives × Modals: can/could/must/should':
    'Lien : comparatifs et superlatifs × verbes modaux',
  'Practice: Modals: can/could/must/should × Shopping for Clothes':
    'Pratique : verbes modaux × acheter des vêtements',
  'Challenge: Review & Showcase × Daily Routine & Present Simple':
    'Défi : révision et présentation × routine quotidienne et présent simple',
  'Bridge: Abilities: Can & Can\'t × Likes & Dislikes':
    'Pont : capacités : je peux / je ne peux pas × ce que j’aime et ce que je n’aime pas',
};

/** Arabic titles that still carried English grammar labels from the source. */
export const TITLE_AR_OVERRIDES: Record<string, string> = {
  'Modals: can/could/must/should': 'الأفعال الناقصة: pouvoir وdevoir',
  'Link: Comparatives & Superlatives × Modals: can/could/must/should':
    'رابط تطبيقي: المقارنة والتفضيل × الأفعال الناقصة',
  'Practice: Modals: can/could/must/should × Shopping for Clothes':
    'تدريب موسّع: الأفعال الناقصة × تسوق الملابس',
};

/** Arabic descriptions that referred to English grammar terms. */
export const DESCRIPTION_AR_OVERRIDES: Record<string, string> = {
  'This & That': 'تعلّم الفرق بين ceci وcela مع ليو وجيجي.',
  'Future Predictions':
    'توقّع ما سيحدث في المستقبل باستخدام صيغة المستقبل مع أليكس ومايا.',
  'Modals: can/could/must/should':
    'اطلب المساعدة وعبّر عن الالتزام والنصيحة باستخدام pouvoir وdevoir مع أليكس ومايا في المكتب.',
  'Link: Comparatives & Superlatives × Modals: can/could/must/should':
    'درس توسعة يربط بين «المقارنة والتفضيل» و«الأفعال الناقصة» في حوار وتمارين جديدة.',
  'Practice: Modals: can/could/must/should × Shopping for Clothes':
    'درس توسعة يربط بين «الأفعال الناقصة» و«تسوق الملابس» في حوار وتمارين جديدة.',
};

export interface FrenchLessonPatch {
  title?: string;
  titleAr?: string;
  descriptionAr?: string;
  learningNoteAr?: string;
  /** Dialogue text overrides keyed by dialogue id. */
  dialogue?: Record<
    string,
    {
      textEn?: string;
      textAr?: string;
      highlightWords?: string[];
    }
  >;
  /** Vocabulary overrides keyed by vocabulary id. */
  vocabulary?: Record<
    string,
    {
      word?: string;
      phonetic?: string;
      translationAr?: string;
      exampleSentence?: string;
      exampleSentenceAr?: string;
      partOfSpeech?: string;
    }
  >;
  /** Full quiz replacement, already in French with Arabic explanations. */
  quiz?: Array<{
    id: string;
    type: 'multiple_choice' | 'arrange_sentence' | 'fill_blank';
    questionAr: string;
    questionEn?: string;
    promptAr?: string;
    options: string[];
    correctAnswer: string;
    explanationAr: string;
  }>;
}

/** Hand-authored corrections for the original and grammar lessons. */
export { LESSON_PATCHES } from './french-lesson-patches';
