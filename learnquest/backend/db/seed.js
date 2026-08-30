const { nanoid } = require("nanoid");
const db = require("./index");

const subjects = [
  { id: "maths", name_en: "Maths", name_hi: "गणित", name_mr: "गणित" },
  { id: "english", name_en: "English", name_hi: "अंग्रेज़ी", name_mr: "इंग्रजी" },
  { id: "gk", name_en: "General Knowledge", name_hi: "सामान्य ज्ञान", name_mr: "सामान्य ज्ञान" },
];

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


// Extra bundled questions keep every normal gate and boss battle fully playable
// without repeating the same question in a single attempt.
questions.push(
  // Maths 4-6 (8 total)
  { subject_id:"maths", topic:"Addition", age_group:"4-6", difficulty:"easy", question_en:"1 + 4 = ?", question_hi:"1 + 4 = ?", question_mr:"1 + 4 = ?", options:["4","5","6","7"], correct_index:1, explanation_en:"1 + 4 = 5.", explanation_hi:"1 + 4 = 5।", explanation_mr:"1 + 4 = 5.", xp_reward:10 },
  { subject_id:"maths", topic:"Counting", age_group:"4-6", difficulty:"easy", question_en:"What comes after 7?", question_hi:"7 के बाद क्या आता है?", question_mr:"7 नंतर काय येते?", options:["6","8","9","10"], correct_index:1, explanation_en:"8 comes after 7.", explanation_hi:"7 के बाद 8 आता है।", explanation_mr:"7 नंतर 8 येतो.", xp_reward:10 },
  { subject_id:"maths", topic:"Shapes", age_group:"4-6", difficulty:"easy", question_en:"How many sides does a triangle have?", question_hi:"त्रिभुज की कितनी भुजाएँ होती हैं?", question_mr:"त्रिकोणाला किती बाजू असतात?", options:["2","3","4","5"], correct_index:1, explanation_en:"A triangle has 3 sides.", explanation_hi:"त्रिभुज की 3 भुजाएँ होती हैं।", explanation_mr:"त्रिकोणाला 3 बाजू असतात.", xp_reward:10 },
  { subject_id:"maths", topic:"Subtraction", age_group:"4-6", difficulty:"easy", question_en:"6 - 1 = ?", question_hi:"6 - 1 = ?", question_mr:"6 - 1 = ?", options:["4","5","6","7"], correct_index:1, explanation_en:"6 - 1 = 5.", explanation_hi:"6 - 1 = 5।", explanation_mr:"6 - 1 = 5.", xp_reward:10 },
  { subject_id:"maths", topic:"Comparison", age_group:"4-6", difficulty:"easy", question_en:"Which number is bigger?", question_hi:"कौन सी संख्या बड़ी है?", question_mr:"कोणती संख्या मोठी आहे?", options:["3","7","2","1"], correct_index:1, explanation_en:"7 is the biggest number here.", explanation_hi:"यहाँ 7 सबसे बड़ी संख्या है।", explanation_mr:"येथे 7 ही सर्वात मोठी संख्या आहे.", xp_reward:10 },

  // Maths 7-9 (8 total)
  { subject_id:"maths", topic:"Addition", age_group:"7-9", difficulty:"medium", question_en:"125 + 75 = ?", question_hi:"125 + 75 = ?", question_mr:"125 + 75 = ?", options:["180","190","200","210"], correct_index:2, explanation_en:"125 + 75 = 200.", explanation_hi:"125 + 75 = 200।", explanation_mr:"125 + 75 = 200.", xp_reward:15 },
  { subject_id:"maths", topic:"Subtraction", age_group:"7-9", difficulty:"medium", question_en:"90 - 36 = ?", question_hi:"90 - 36 = ?", question_mr:"90 - 36 = ?", options:["44","54","64","74"], correct_index:1, explanation_en:"90 - 36 = 54.", explanation_hi:"90 - 36 = 54।", explanation_mr:"90 - 36 = 54.", xp_reward:15 },
  { subject_id:"maths", topic:"Multiplication", age_group:"7-9", difficulty:"medium", question_en:"9 × 6 = ?", question_hi:"9 × 6 = ?", question_mr:"9 × 6 = ?", options:["45","54","63","72"], correct_index:1, explanation_en:"9 × 6 = 54.", explanation_hi:"9 × 6 = 54।", explanation_mr:"9 × 6 = 54.", xp_reward:15 },
  { subject_id:"maths", topic:"Fractions", age_group:"7-9", difficulty:"medium", question_en:"Half of 20 is?", question_hi:"20 का आधा कितना है?", question_mr:"20 चे अर्धे किती?", options:["5","10","15","20"], correct_index:1, explanation_en:"Half of 20 is 10.", explanation_hi:"20 का आधा 10 है।", explanation_mr:"20 चे अर्धे 10 आहे.", xp_reward:15 },
  { subject_id:"maths", topic:"Time", age_group:"7-9", difficulty:"medium", question_en:"How many minutes are in 1 hour?", question_hi:"1 घंटे में कितने मिनट होते हैं?", question_mr:"1 तासात किती मिनिटे असतात?", options:["30","45","60","90"], correct_index:2, explanation_en:"1 hour = 60 minutes.", explanation_hi:"1 घंटा = 60 मिनट।", explanation_mr:"1 तास = 60 मिनिटे.", xp_reward:15 },

  // Maths 10-12 (8 total)
  { subject_id:"maths", topic:"Percentages", age_group:"10-12", difficulty:"hard", question_en:"25% of 200 = ?", question_hi:"200 का 25% = ?", question_mr:"200 चे 25% = ?", options:["25","40","50","75"], correct_index:2, explanation_en:"25% is one quarter; one quarter of 200 is 50.", explanation_hi:"25% एक चौथाई है; 200 का चौथाई 50 है।", explanation_mr:"25% म्हणजे एक चतुर्थांश; 200 चा चतुर्थांश 50 आहे.", xp_reward:20 },
  { subject_id:"maths", topic:"Algebra", age_group:"10-12", difficulty:"hard", question_en:"If x + 7 = 15, x = ?", question_hi:"यदि x + 7 = 15, तो x = ?", question_mr:"जर x + 7 = 15, तर x = ?", options:["6","7","8","9"], correct_index:2, explanation_en:"15 - 7 = 8.", explanation_hi:"15 - 7 = 8।", explanation_mr:"15 - 7 = 8.", xp_reward:20 },
  { subject_id:"maths", topic:"Fractions", age_group:"10-12", difficulty:"hard", question_en:"3/4 of 20 = ?", question_hi:"20 का 3/4 = ?", question_mr:"20 चे 3/4 = ?", options:["10","12","15","18"], correct_index:2, explanation_en:"20 ÷ 4 × 3 = 15.", explanation_hi:"20 ÷ 4 × 3 = 15।", explanation_mr:"20 ÷ 4 × 3 = 15.", xp_reward:20 },
  { subject_id:"maths", topic:"Geometry", age_group:"10-12", difficulty:"hard", question_en:"A square has side 6 cm. Its perimeter is?", question_hi:"एक वर्ग की भुजा 6 सेमी है। उसका परिमाप?", question_mr:"चौरसाची बाजू 6 सेमी आहे. परिमिती किती?", options:["12 cm","18 cm","24 cm","36 cm"], correct_index:2, explanation_en:"Perimeter = 4 × 6 = 24 cm.", explanation_hi:"परिमाप = 4 × 6 = 24 सेमी।", explanation_mr:"परिमिती = 4 × 6 = 24 सेमी.", xp_reward:20 },
  { subject_id:"maths", topic:"Decimals", age_group:"10-12", difficulty:"hard", question_en:"0.5 + 0.25 = ?", question_hi:"0.5 + 0.25 = ?", question_mr:"0.5 + 0.25 = ?", options:["0.65","0.70","0.75","0.80"], correct_index:2, explanation_en:"0.50 + 0.25 = 0.75.", explanation_hi:"0.50 + 0.25 = 0.75।", explanation_mr:"0.50 + 0.25 = 0.75.", xp_reward:20 },
  { subject_id:"maths", topic:"Ratio", age_group:"10-12", difficulty:"hard", question_en:"Simplify the ratio 8:12.", question_hi:"8:12 अनुपात को सरल करें।", question_mr:"8:12 हे गुणोत्तर सोपे करा.", options:["1:2","2:3","3:4","4:5"], correct_index:1, explanation_en:"Divide both numbers by 4: 8:12 = 2:3.", explanation_hi:"दोनों संख्याओं को 4 से भाग दें: 2:3।", explanation_mr:"दोन्ही संख्यांना 4 ने भागा: 2:3.", xp_reward:20 },

  // English: ensure at least 3 unique questions per age group
  { subject_id:"english", topic:"Letters", age_group:"4-6", difficulty:"easy", question_en:"Which letter comes after C?", question_hi:"C के बाद कौन सा अक्षर आता है?", question_mr:"C नंतर कोणते अक्षर येते?", options:["B","D","E","F"], correct_index:1, explanation_en:"D comes after C.", explanation_hi:"C के बाद D आता है।", explanation_mr:"C नंतर D येते.", xp_reward:10 },
  { subject_id:"english", topic:"Opposites", age_group:"7-9", difficulty:"medium", question_en:"What is the opposite of 'hot'?", question_hi:"'hot' का विपरीत क्या है?", question_mr:"'hot' चा विरुद्धार्थी शब्द कोणता?", options:["warm","cold","dry","bright"], correct_index:1, explanation_en:"The opposite of hot is cold.", explanation_hi:"Hot का विपरीत cold है।", explanation_mr:"Hot चा विरुद्धार्थी cold आहे.", xp_reward:15 },
  { subject_id:"english", topic:"Grammar", age_group:"10-12", difficulty:"hard", question_en:"Choose the adjective: 'The tall tree swayed.'", question_hi:"विशेषण चुनें: 'The tall tree swayed.'", question_mr:"विशेषण निवडा: 'The tall tree swayed.'", options:["The","tall","tree","swayed"], correct_index:1, explanation_en:"'Tall' describes the tree, so it is an adjective.", explanation_hi:"'Tall' पेड़ का वर्णन करता है, इसलिए यह विशेषण है।", explanation_mr:"'Tall' झाडाचे वर्णन करते, म्हणून ते विशेषण आहे.", xp_reward:20 },
  { subject_id:"english", topic:"Vocabulary", age_group:"10-12", difficulty:"hard", question_en:"Which word means 'very large'?", question_hi:"कौन सा शब्द 'बहुत बड़ा' का अर्थ देता है?", question_mr:"'खूप मोठा' असा अर्थ कोणत्या शब्दाचा?", options:["tiny","huge","quiet","slow"], correct_index:1, explanation_en:"'Huge' means very large.", explanation_hi:"'Huge' का अर्थ बहुत बड़ा है।", explanation_mr:"'Huge' म्हणजे खूप मोठा.", xp_reward:20 },

  // GK: ensure at least 3 unique questions per age group
  { subject_id:"gk", topic:"Nature", age_group:"4-6", difficulty:"easy", question_en:"Which one can fly?", question_hi:"इनमें से कौन उड़ सकता है?", question_mr:"यापैकी कोण उडू शकतो?", options:[{en:"Fish",hi:"मछली",mr:"मासा"},{en:"Bird",hi:"पक्षी",mr:"पक्षी"},{en:"Cat",hi:"बिल्ली",mr:"मांजर"},{en:"Dog",hi:"कुत्ता",mr:"कुत्रा"}], correct_index:1, explanation_en:"A bird can fly.", explanation_hi:"पक्षी उड़ सकता है।", explanation_mr:"पक्षी उडू शकतो.", xp_reward:10 },
  { subject_id:"gk", topic:"Science", age_group:"7-9", difficulty:"medium", question_en:"Which organ pumps blood?", question_hi:"कौन सा अंग रक्त पंप करता है?", question_mr:"कोणता अवयव रक्त पंप करतो?", options:[{en:"Heart",hi:"हृदय",mr:"हृदय"},{en:"Lung",hi:"फेफड़ा",mr:"फुफ्फुस"},{en:"Stomach",hi:"पेट",mr:"पोट"},{en:"Eye",hi:"आँख",mr:"डोळा"}], correct_index:0, explanation_en:"The heart pumps blood around the body.", explanation_hi:"हृदय शरीर में रक्त पंप करता है।", explanation_mr:"हृदय शरीरात रक्त पंप करते.", xp_reward:15 },
  { subject_id:"gk", topic:"Space", age_group:"10-12", difficulty:"hard", question_en:"Which planet is closest to the Sun?", question_hi:"सूर्य के सबसे निकट कौन सा ग्रह है?", question_mr:"सूर्याच्या सर्वात जवळ कोणता ग्रह आहे?", options:[{en:"Mercury",hi:"बुध",mr:"बुध"},{en:"Earth",hi:"पृथ्वी",mr:"पृथ्वी"},{en:"Mars",hi:"मंगल",mr:"मंगळ"},{en:"Jupiter",hi:"बृहस्पति",mr:"गुरू"}], correct_index:0, explanation_en:"Mercury is the closest planet to the Sun.", explanation_hi:"बुध सूर्य के सबसे निकट ग्रह है।", explanation_mr:"बुध हा सूर्याच्या सर्वात जवळचा ग्रह आहे.", xp_reward:20 },
  { subject_id:"gk", topic:"Environment", age_group:"10-12", difficulty:"hard", question_en:"Which gas do plants mainly absorb from air?", question_hi:"पौधे हवा से मुख्यतः कौन सी गैस लेते हैं?", question_mr:"वनस्पती हवेतून मुख्यतः कोणता वायू घेतात?", options:[{en:"Oxygen",hi:"ऑक्सीजन",mr:"ऑक्सिजन"},{en:"Carbon dioxide",hi:"कार्बन डाइऑक्साइड",mr:"कार्बन डायऑक्साइड"},{en:"Hydrogen",hi:"हाइड्रोजन",mr:"हायड्रोजन"},{en:"Helium",hi:"हीलियम",mr:"हीलियम"}], correct_index:1, explanation_en:"Plants absorb carbon dioxide for photosynthesis.", explanation_hi:"पौधे प्रकाश संश्लेषण के लिए कार्बन डाइऑक्साइड लेते हैं।", explanation_mr:"वनस्पती प्रकाशसंश्लेषणासाठी कार्बन डायऑक्साइड घेतात.", xp_reward:20 }
);

const worlds = [
  { id: "jungle", name_en: "Jungle World", name_hi: "जंगल दुनिया", name_mr: "जंगल जग", emoji: "🌳", is_active: 1, sort_order: 1 },
  { id: "maths_kingdom", name_en: "Maths Kingdom", name_hi: "गणित साम्राज्य", name_mr: "गणित राज्य", emoji: "🏰", is_active: 0, sort_order: 2 },
  { id: "space", name_en: "Space World", name_hi: "अंतरिक्ष दुनिया", name_mr: "अंतराळ जग", emoji: "🚀", is_active: 0, sort_order: 3 },
  { id: "puzzle_island", name_en: "Puzzle Island", name_hi: "पहेली द्वीप", name_mr: "कोडे बेट", emoji: "🧩", is_active: 0, sort_order: 4 },
];

const jungleLevels = [
  { level_number: 1, name_en: "Jungle Entrance", name_hi: "जंगल प्रवेश द्वार", name_mr: "जंगल प्रवेशद्वार", unlock_type: "free", unlock_value: null, gate_subject_id: "maths", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 2, name_en: "Coconut Grove", name_hi: "नारियल वन", name_mr: "नारळाचे वन", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "maths", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 3, name_en: "River Crossing", name_hi: "नदी पार करना", name_mr: "नदी ओलांडणे", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "english", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 4, name_en: "Ancient Ruins", name_hi: "प्राचीन खंडहर", name_mr: "प्राचीन अवशेष", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "gk", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 5, name_en: "Waterfall Camp", name_hi: "झरना शिविर", name_mr: "धबधबा शिबीर", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "maths", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 6, name_en: "Vine Bridge", name_hi: "बेल पुल", name_mr: "वेल पूल", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "english", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 7, name_en: "Hidden Cave", name_hi: "छुपी हुई गुफा", name_mr: "लपलेली गुहा", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "gk", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 8, name_en: "Mountain Path", name_hi: "पहाड़ी रास्ता", name_mr: "डोंगर वाट", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "maths", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 9, name_en: "Temple Gate", name_hi: "मंदिर द्वार", name_mr: "मंदिर दार", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "english", questions_required: 3, is_boss: 0, boss_hp: null },
  { level_number: 10, name_en: "Boss Battle: Jungle Guardian", name_hi: "बॉस युद्ध: जंगल रक्षक", name_mr: "बॉस लढाई: जंगल संरक्षक", unlock_type: "prior_level", unlock_value: null, gate_subject_id: "maths", questions_required: 8, is_boss: 1, boss_hp: 5 },
];

const rewards = [
  { id: "reward_forest_fox", name_en: "Forest Fox", name_hi: "वन लोमड़ी", name_mr: "वन कोल्हा", type: "character", cost_coins: 0, emoji: "🦊" },
  { id: "reward_jungle_cape", name_en: "Jungle Cape", name_hi: "जंगल लबादा", name_mr: "जंगल झगा", type: "clothes", cost_coins: 100, emoji: "🧥" },
  { id: "reward_pet_parrot", name_en: "Pet Parrot", name_hi: "पालतू तोता", name_mr: "पाळीव पोपट", type: "pet", cost_coins: 150, emoji: "🦜" },
  { id: "reward_wooden_sword", name_en: "Wooden Sword", name_hi: "लकड़ी की तलवार", name_mr: "लाकडी तलवार", type: "sword", cost_coins: 120, emoji: "🗡️" },
  { id: "reward_magic_sparkle", name_en: "Magic Sparkle", name_hi: "जादुई चमक", name_mr: "जादुई चमक", type: "power", cost_coins: 200, emoji: "✨" },
  { id: "reward_bamboo_raft", name_en: "Bamboo Raft", name_hi: "बांस की बेड़ा", name_mr: "बांबूचा तराफा", type: "vehicle", cost_coins: 250, emoji: "🛶" },
  { id: "reward_treehouse", name_en: "Treehouse Decor", name_hi: "ट्रीहाउस सजावट", name_mr: "ट्रीहाऊस सजावट", type: "decoration", cost_coins: 180, emoji: "🏡" },
];

async function upsertById(table, id, fields) {
  const existing = await db.one(`SELECT id FROM ${table} WHERE id = ?`, [id]);
  const entries = Object.entries(fields);
  if (existing) {
    const setSql = entries.map(([key]) => `${key} = ?`).join(", ");
    await db.run(`UPDATE ${table} SET ${setSql} WHERE id = ?`, [...entries.map(([, value]) => value), id]);
  } else {
    const cols = ["id", ...entries.map(([key]) => key)];
    const values = [id, ...entries.map(([, value]) => value)];
    const marks = cols.map(() => "?").join(", ");
    await db.run(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${marks})`, values);
  }
}

async function seedDatabase() {
  for (const subject of subjects) {
    const { id, ...fields } = subject;
    await upsertById("subjects", id, fields);
  }

  const questionCountRow = await db.one("SELECT COUNT(*) AS count FROM questions");
  const questionCount = Number(questionCountRow?.count || 0);
  if (questionCount === 0) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qid = `q_${String(i + 1).padStart(3, "0")}`;
      await db.run(`
        INSERT INTO questions
        (id, subject_id, topic, age_group, difficulty, question_en, question_hi, question_mr,
         options_json, correct_index, explanation_en, explanation_hi, explanation_mr, xp_reward)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        qid, q.subject_id, q.topic, q.age_group, q.difficulty,
        q.question_en, q.question_hi, q.question_mr,
        JSON.stringify(q.options), q.correct_index,
        q.explanation_en, q.explanation_hi, q.explanation_mr, q.xp_reward,
      ]);
    }
  }

  for (const world of worlds) {
    const { id, ...fields } = world;
    await upsertById("worlds", id, fields);
  }

  for (const level of jungleLevels) {
    const id = `jungle_lvl_${level.level_number}`;
    await upsertById("game_levels", id, { world_id: "jungle", ...level });
  }

  const rewardCountRow = await db.one("SELECT COUNT(*) AS count FROM rewards");
  const rewardCount = Number(rewardCountRow?.count || 0);
  if (rewardCount === 0) {
    for (const reward of rewards) {
      const { id, ...fields } = reward;
      await upsertById("rewards", id, fields);
    }
  }

  const children = await db.all("SELECT id FROM children");
  for (const child of children) {
    const progress = await db.one(
      "SELECT id FROM child_level_progress WHERE child_id = ? AND level_id = ?",
      [child.id, "jungle_lvl_1"]
    );
    if (!progress) {
      await db.run(
        "INSERT INTO child_level_progress (id, child_id, level_id, status) VALUES (?, ?, ?, ?)",
        [`clp_${nanoid(10)}`, child.id, "jungle_lvl_1", "unlocked"]
      );
    }
  }

  console.log("✅ LearnQuest content ready:", {
    subjects: subjects.length,
    bundledQuestions: questions.length,
    worlds: worlds.length,
    jungleLevels: jungleLevels.length,
    rewards: rewards.length,
  });
}

if (require.main === module) {
  (async () => {
    try {
      await db.init();
      await seedDatabase();
      await db.close();
      process.exit(0);
    } catch (err) {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    }
  })();
}

module.exports = seedDatabase;
