const { nanoid } = require("nanoid");
const db = require("./index");

function id(prefix) {
  return `${prefix}_${nanoid(10)}`;
}

// ---------- SUBJECTS ----------
const subjects = [
  { id: "maths", name_en: "Maths", name_hi: "गणित", name_mr: "गणित" },
  { id: "english", name_en: "English", name_hi: "अंग्रेज़ी", name_mr: "इंग्रजी" },
  { id: "gk", name_en: "General Knowledge", name_hi: "सामान्य ज्ञान", name_mr: "सामान्य ज्ञान" },
];

const insertSubject = db.prepare(
  `INSERT OR IGNORE INTO subjects (id, name_en, name_hi, name_mr) VALUES (@id, @name_en, @name_hi, @name_mr)`
);
subjects.forEach((s) => insertSubject.run(s));

// ---------- QUESTIONS ----------
// Kept intentionally small (a real deployment would have hundreds per age group).
// Add more rows here to grow the bank -- age_group must be one of 4-6 | 7-9 | 10-12.
const questions = [
  // ---- Maths 4-6 ----
  {
    subject_id: "maths", topic: "Addition", age_group: "4-6", difficulty: "easy",
    question_en: "2 + 3 = ?", question_hi: "2 + 3 = ?", question_mr: "2 + 3 = ?",
    options: ["4", "5", "6", "7"], correct_index: 1,
    explanation_en: "2 apples + 3 apples = 5 apples. Count on your fingers!",
    explanation_hi: "2 सेब + 3 सेब = 5 सेब। अपनी उंगलियों पर गिनें!",
    explanation_mr: "2 सफरचंद + 3 सफरचंद = 5 सफरचंद. बोटांवर मोजा!",
    xp_reward: 10,
  },
  {
    subject_id: "maths", topic: "Counting", age_group: "4-6", difficulty: "easy",
    question_en: "How many legs does a cat have?", question_hi: "बिल्ली के कितने पैर होते हैं?", question_mr: "मांजरीला किती पाय असतात?",
    options: ["2", "3", "4", "6"], correct_index: 2,
    explanation_en: "A cat has 4 legs, just like most animals in the jungle!",
    explanation_hi: "बिल्ली के 4 पैर होते हैं, जंगल के ज़्यादातर जानवरों की तरह!",
    explanation_mr: "मांजरीला 4 पाय असतात, जंगलातील बहुतेक प्राण्यांसारखे!",
    xp_reward: 10,
  },
  {
    subject_id: "maths", topic: "Subtraction", age_group: "4-6", difficulty: "easy",
    question_en: "5 - 2 = ?", question_hi: "5 - 2 = ?", question_mr: "5 - 2 = ?",
    options: ["2", "3", "4", "1"], correct_index: 1,
    explanation_en: "Take 2 away from 5 balloons — 3 balloons are left.",
    explanation_hi: "5 गुब्बारों में से 2 हटाओ — 3 गुब्बारे बचते हैं।",
    explanation_mr: "5 फुग्यांमधून 2 काढा — 3 फुगे उरतात.",
    xp_reward: 10,
  },
  // ---- Maths 7-9 ----
  {
    subject_id: "maths", topic: "Division", age_group: "7-9", difficulty: "medium",
    question_en: "24 ÷ 4 = ?", question_hi: "24 ÷ 4 = ?", question_mr: "24 ÷ 4 = ?",
    options: ["5", "6", "7", "8"], correct_index: 1,
    explanation_en: "4 groups of 6 make 24, so 24 ÷ 4 = 6.",
    explanation_hi: "6 की 4 टोलियाँ मिलकर 24 बनती हैं, तो 24 ÷ 4 = 6.",
    explanation_mr: "6 चे 4 गट मिळून 24 होतात, म्हणून 24 ÷ 4 = 6.",
    xp_reward: 15,
  },
  {
    subject_id: "maths", topic: "Multiplication", age_group: "7-9", difficulty: "medium",
    question_en: "7 x 8 = ?", question_hi: "7 x 8 = ?", question_mr: "7 x 8 = ?",
    options: ["54", "56", "58", "64"], correct_index: 1,
    explanation_en: "7 rows of 8 = 56.",
    explanation_hi: "8 की 7 पंक्तियाँ = 56.",
    explanation_mr: "8 च्या 7 ओळी = 56.",
    xp_reward: 15,
  },
  {
    subject_id: "maths", topic: "Fractions", age_group: "7-9", difficulty: "medium",
    question_en: "Which is bigger: 1/2 or 1/4?", question_hi: "कौन बड़ा है: 1/2 या 1/4?", question_mr: "कोणते मोठे आहे: 1/2 की 1/4?",
    options: ["1/2", "1/4", "Equal", "Can't tell"], correct_index: 0,
    explanation_en: "Half a pizza is more than a quarter of a pizza.",
    explanation_hi: "आधा पिज़्ज़ा एक चौथाई पिज़्ज़ा से ज़्यादा होता है।",
    explanation_mr: "अर्धा पिझ्झा हा एक चतुर्थांश पिझ्झ्यापेक्षा जास्त असतो.",
    xp_reward: 15,
  },
  // ---- Maths 10-12 ----
  {
    subject_id: "maths", topic: "Algebra", age_group: "10-12", difficulty: "hard",
    question_en: "3x + 5 = 20. Find x.", question_hi: "3x + 5 = 20. x ज्ञात करें.", question_mr: "3x + 5 = 20. x शोधा.",
    options: ["3", "4", "5", "6"], correct_index: 2,
    explanation_en: "3x = 15, so x = 5.",
    explanation_hi: "3x = 15, तो x = 5.",
    explanation_mr: "3x = 15, म्हणून x = 5.",
    xp_reward: 20,
  },
  {
    subject_id: "maths", topic: "Percentages", age_group: "10-12", difficulty: "hard",
    question_en: "What is 20% of 150?", question_hi: "150 का 20% क्या है?", question_mr: "150 च्या 20% किती?",
    options: ["20", "25", "30", "35"], correct_index: 2,
    explanation_en: "20% of 150 = 0.2 x 150 = 30.",
    explanation_hi: "150 का 20% = 0.2 x 150 = 30.",
    explanation_mr: "150 च्या 20% = 0.2 x 150 = 30.",
    xp_reward: 20,
  },
  // ---- English 4-6 ----
  {
    subject_id: "english", topic: "Vocabulary", age_group: "4-6", difficulty: "easy",
    question_en: "Which word means a baby dog?", question_hi: "कौन सा शब्द कुत्ते के बच्चे के लिए है?", question_mr: "कुत्र्याच्या पिल्लासाठी कोणता शब्द आहे?",
    options: ["Kitten", "Puppy", "Cub", "Calf"], correct_index: 1,
    explanation_en: "A baby dog is called a puppy.",
    explanation_hi: "कुत्ते के बच्चे को पिल्ला (puppy) कहते हैं।",
    explanation_mr: "कुत्र्याच्या पिल्लाला puppy म्हणतात.",
    xp_reward: 10,
  },
  {
    subject_id: "english", topic: "Opposites", age_group: "4-6", difficulty: "easy",
    question_en: "What is the opposite of 'Big'?", question_hi: "'बड़ा' का विपरीत शब्द क्या है?", question_mr: "'मोठा' चा विरुद्धार्थी शब्द कोणता?",
    options: ["Tall", "Small", "Round", "Fast"], correct_index: 1,
    explanation_en: "The opposite of Big is Small.",
    explanation_hi: "'बड़ा' का विपरीत 'छोटा' है।",
    explanation_mr: "'मोठा' चा विरुद्धार्थी शब्द 'लहान' आहे.",
    xp_reward: 10,
  },
  // ---- English 7-9 ----
  {
    subject_id: "english", topic: "Grammar", age_group: "7-9", difficulty: "medium",
    question_en: "Choose the correct sentence:", question_hi: "सही वाक्य चुनें:", question_mr: "योग्य वाक्य निवडा:",
    options: ["She go to school", "She goes to school", "She going school", "She gone school"], correct_index: 1,
    explanation_en: "'She goes to school' uses the correct verb form for 'she'.",
    explanation_hi: "'She goes to school' में 'she' के लिए सही क्रिया रूप है।",
    explanation_mr: "'She goes to school' मध्ये 'she' साठी योग्य क्रियापद वापरले आहे.",
    xp_reward: 15,
  },
  {
    subject_id: "english", topic: "Synonyms", age_group: "7-9", difficulty: "medium",
    question_en: "Which word means the same as 'Happy'?", question_hi: "'Happy' के समान अर्थ वाला शब्द कौन सा है?", question_mr: "'Happy' सारखा अर्थ असलेला शब्द कोणता?",
    options: ["Sad", "Angry", "Joyful", "Tired"], correct_index: 2,
    explanation_en: "'Joyful' means the same as 'Happy'.",
    explanation_hi: "'Joyful' का अर्थ 'Happy' के समान है।",
    explanation_mr: "'Joyful' चा अर्थ 'Happy' सारखाच आहे.",
    xp_reward: 15,
  },
  // ---- English 10-12 ----
  {
    subject_id: "english", topic: "Comprehension", age_group: "10-12", difficulty: "hard",
    question_en: "Identify the noun in: 'The brave lion roared loudly.'", question_hi: "इस वाक्य में संज्ञा पहचानें: 'The brave lion roared loudly.'", question_mr: "या वाक्यात नाम ओळखा: 'The brave lion roared loudly.'",
    options: ["Brave", "Lion", "Roared", "Loudly"], correct_index: 1,
    explanation_en: "'Lion' is the noun — it names the animal.",
    explanation_hi: "'Lion' संज्ञा है — यह जानवर का नाम बताता है।",
    explanation_mr: "'Lion' हे नाम आहे — ते प्राण्याचे नाव सांगते.",
    xp_reward: 20,
  },
  // ---- GK 4-6 ----
  {
    subject_id: "gk", topic: "Animals", age_group: "4-6", difficulty: "easy",
    question_en: "Which animal is called the 'King of the Jungle'?", question_hi: "किस जानवर को 'जंगल का राजा' कहा जाता है?", question_mr: "कोणत्या प्राण्याला 'जंगलाचा राजा' म्हणतात?",
    options: ["Elephant", "Lion", "Tiger", "Bear"], correct_index: 1,
    explanation_en: "The Lion is known as the King of the Jungle.",
    explanation_hi: "शेर को जंगल का राजा कहा जाता है।",
    explanation_mr: "सिंहाला जंगलाचा राजा म्हणतात.",
    xp_reward: 10,
  },
  {
    subject_id: "gk", topic: "Colors", age_group: "4-6", difficulty: "easy",
    question_en: "What color do you get by mixing blue and yellow?", question_hi: "नीले और पीले को मिलाने से कौन सा रंग बनता है?", question_mr: "निळा आणि पिवळा मिसळल्यास कोणता रंग तयार होतो?",
    options: ["Purple", "Green", "Orange", "Pink"], correct_index: 1,
    explanation_en: "Blue + Yellow = Green.",
    explanation_hi: "नीला + पीला = हरा।",
    explanation_mr: "निळा + पिवळा = हिरवा.",
    xp_reward: 10,
  },
  // ---- GK 7-9 ----
  {
    subject_id: "gk", topic: "Geography", age_group: "7-9", difficulty: "medium",
    question_en: "Which is the largest ocean on Earth?", question_hi: "पृथ्वी का सबसे बड़ा महासागर कौन सा है?", question_mr: "पृथ्वीवरील सर्वात मोठा महासागर कोणता?",
    options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct_index: 2,
    explanation_en: "The Pacific Ocean is the largest ocean on Earth.",
    explanation_hi: "प्रशांत महासागर पृथ्वी का सबसे बड़ा महासागर है।",
    explanation_mr: "पॅसिफिक महासागर हा पृथ्वीवरील सर्वात मोठा महासागर आहे.",
    xp_reward: 15,
  },
  {
    subject_id: "gk", topic: "India", age_group: "7-9", difficulty: "medium",
    question_en: "What is the capital of India?", question_hi: "भारत की राजधानी क्या है?", question_mr: "भारताची राजधानी कोणती?",
    options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correct_index: 1,
    explanation_en: "New Delhi is the capital of India.",
    explanation_hi: "नई दिल्ली भारत की राजधानी है।",
    explanation_mr: "नवी दिल्ली ही भारताची राजधानी आहे.",
    xp_reward: 15,
  },
  // ---- GK 10-12 ----
  {
    subject_id: "gk", topic: "Science", age_group: "10-12", difficulty: "hard",
    question_en: "Which planet is known as the Red Planet?", question_hi: "किस ग्रह को 'लाल ग्रह' कहा जाता है?", question_mr: "कोणत्या ग्रहाला 'लाल ग्रह' म्हणतात?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"], correct_index: 1,
    explanation_en: "Mars is called the Red Planet because of iron oxide on its surface.",
    explanation_hi: "मंगल को उसकी सतह पर आयरन ऑक्साइड के कारण 'लाल ग्रह' कहा जाता है।",
    explanation_mr: "मंगळाच्या पृष्ठभागावरील लोह ऑक्साईडमुळे त्याला 'लाल ग्रह' म्हणतात.",
    xp_reward: 20,
  },
];

const insertQuestion = db.prepare(`
  INSERT OR IGNORE INTO questions
  (id, subject_id, topic, age_group, difficulty, question_en, question_hi, question_mr,
   options_json, correct_index, explanation_en, explanation_hi, explanation_mr, xp_reward)
  VALUES (@id, @subject_id, @topic, @age_group, @difficulty, @question_en, @question_hi, @question_mr,
          @options_json, @correct_index, @explanation_en, @explanation_hi, @explanation_mr, @xp_reward)
`);

questions.forEach((q) => {
  insertQuestion.run({
    id: id("q"),
    subject_id: q.subject_id,
    topic: q.topic,
    age_group: q.age_group,
    difficulty: q.difficulty,
    question_en: q.question_en,
    question_hi: q.question_hi,
    question_mr: q.question_mr,
    options_json: JSON.stringify(q.options),
    correct_index: q.correct_index,
    explanation_en: q.explanation_en,
    explanation_hi: q.explanation_hi,
    explanation_mr: q.explanation_mr,
    xp_reward: q.xp_reward,
  });
});

// ---------- WORLDS ----------
const insertWorld = db.prepare(`
  INSERT OR IGNORE INTO worlds (id, name_en, name_hi, name_mr, emoji, is_active, sort_order)
  VALUES (@id, @name_en, @name_hi, @name_mr, @emoji, @is_active, @sort_order)
`);
[
  { id: "jungle", name_en: "Jungle World", name_hi: "जंगल दुनिया", name_mr: "जंगल जग", emoji: "🌳", is_active: 1, sort_order: 1 },
  { id: "maths_kingdom", name_en: "Maths Kingdom", name_hi: "गणित साम्राज्य", name_mr: "गणित राज्य", emoji: "🏰", is_active: 0, sort_order: 2 },
  { id: "space", name_en: "Space World", name_hi: "अंतरिक्ष दुनिया", name_mr: "अंतराळ जग", emoji: "🚀", is_active: 0, sort_order: 3 },
  { id: "puzzle_island", name_en: "Puzzle Island", name_hi: "पहेली द्वीप", name_mr: "कोडे बेट", emoji: "🧩", is_active: 0, sort_order: 4 },
].forEach((w) => insertWorld.run(w));

// ---------- JUNGLE WORLD LEVELS ----------
const insertLevel = db.prepare(`
  INSERT OR IGNORE INTO game_levels
  (id, world_id, level_number, name_en, name_hi, name_mr, unlock_type, unlock_value, gate_subject_id, questions_required, is_boss, boss_hp)
  VALUES (@id, @world_id, @level_number, @name_en, @name_hi, @name_mr, @unlock_type, @unlock_value, @gate_subject_id, @questions_required, @is_boss, @boss_hp)
`);

const jungleLevels = [
  { level_number: 1, name_en: "Jungle Entrance", name_hi: "जंगल प्रवेश द्वार", name_mr: "जंगल प्रवेशद्वार", unlock_type: "free", unlock_value: null, gate_subject_id: null, questions_required: 0, is_boss: 0 },
  { level_number: 2, name_en: "Coconut Grove", name_hi: "नारियल वन", name_mr: "नारळाचे वन", unlock_type: "questions", unlock_value: 3, gate_subject_id: "maths", questions_required: 3, is_boss: 0 },
  { level_number: 3, name_en: "River Crossing", name_hi: "नदी पार करना", name_mr: "नदी ओलांडणे", unlock_type: "questions", unlock_value: 3, gate_subject_id: "english", questions_required: 3, is_boss: 0 },
  { level_number: 4, name_en: "Ancient Ruins", name_hi: "प्राचीन खंडहर", name_mr: "प्राचीन अवशेष", unlock_type: "xp", unlock_value: 200, gate_subject_id: "gk", questions_required: 3, is_boss: 0 },
  { level_number: 5, name_en: "Waterfall Camp", name_hi: "झरना शिविर", name_mr: "धबधबा शिबीर", unlock_type: "questions", unlock_value: 3, gate_subject_id: "maths", questions_required: 3, is_boss: 0 },
  { level_number: 6, name_en: "Vine Bridge", name_hi: "बेल पुल", name_mr: "वेल पूल", unlock_type: "questions", unlock_value: 3, gate_subject_id: "english", questions_required: 3, is_boss: 0 },
  { level_number: 7, name_en: "Hidden Cave", name_hi: "छुपी हुई गुफा", name_mr: "लपलेली गुहा", unlock_type: "questions", unlock_value: 3, gate_subject_id: "gk", questions_required: 3, is_boss: 0 },
  { level_number: 8, name_en: "Mountain Path", name_hi: "पहाड़ी रास्ता", name_mr: "डोंगर वाट", unlock_type: "questions", unlock_value: 3, gate_subject_id: "maths", questions_required: 3, is_boss: 0 },
  { level_number: 9, name_en: "Temple Gate", name_hi: "मंदिर द्वार", name_mr: "मंदिर दार", unlock_type: "questions", unlock_value: 3, gate_subject_id: "english", questions_required: 3, is_boss: 0 },
  { level_number: 10, name_en: "Boss Battle: Jungle Guardian", name_hi: "बॉस युद्ध: जंगल रक्षक", name_mr: "बॉस लढाई: जंगल संरक्षक", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "maths", questions_required: 5, is_boss: 1, boss_hp: 5 },
];

jungleLevels.forEach((lvl) => {
  insertLevel.run({
    id: `jungle_lvl_${lvl.level_number}`,
    world_id: "jungle",
    boss_hp: lvl.boss_hp ?? null,
    ...lvl,
  });
});

// ---------- REWARDS ----------
const insertReward = db.prepare(`
  INSERT OR IGNORE INTO rewards (id, name_en, name_hi, name_mr, type, cost_coins, emoji)
  VALUES (@id, @name_en, @name_hi, @name_mr, @type, @cost_coins, @emoji)
`);
[
  { name_en: "Forest Fox", name_hi: "वन लोमड़ी", name_mr: "वन कोल्हा", type: "character", cost_coins: 0, emoji: "🦊" },
  { name_en: "Jungle Cape", name_hi: "जंगल लबादा", name_mr: "जंगल झगा", type: "clothes", cost_coins: 100, emoji: "🧥" },
  { name_en: "Pet Parrot", name_hi: "पालतू तोता", name_mr: "पाळीव पोपट", type: "pet", cost_coins: 150, emoji: "🦜" },
  { name_en: "Wooden Sword", name_hi: "लकड़ी की तलवार", name_mr: "लाकडी तलवार", type: "sword", cost_coins: 120, emoji: "🗡️" },
  { name_en: "Magic Sparkle", name_hi: "जादुई चमक", name_mr: "जादुई चमक", type: "power", cost_coins: 200, emoji: "✨" },
  { name_en: "Bamboo Raft", name_hi: "बांस की बेड़ा", name_mr: "बांबूचा तराफा", type: "vehicle", cost_coins: 250, emoji: "🛶" },
  { name_en: "Treehouse Decor", name_hi: "ट्रीहाउस सजावट", name_mr: "ट्रीहाऊस सजावट", type: "decoration", cost_coins: 180, emoji: "🏡" },
].forEach((r) => insertReward.run({ id: id("rw"), ...r }));

console.log("✅ Seed complete:", {
  subjects: subjects.length,
  questions: questions.length,
  worlds: 4,
  jungleLevels: jungleLevels.length,
  rewards: 7,
});
