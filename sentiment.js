/**
 * sentiment.js — Lightweight client-side sentiment analysis
 * No API keys. No network calls. Runs entirely in the browser.
 * Scores text across 6 emotional dimensions using weighted word lists.
 */

const SENTIMENT_LEXICON = {
  // Joy & happiness
  joy: {
    words: ['happy','happiness','joy','joyful','excited','excitement','wonderful','amazing','fantastic','great','love','loved','loving','fun','funny','laugh','laughing','smile','smiling','celebrate','celebration','grateful','gratitude','blessed','blessing','cheerful','delight','delighted','ecstatic','elated','euphoric','glee','gleeful','jubilant','lighthearted','merry','overjoyed','pleased','radiant','thrilled','upbeat','vivid','wonderful','good','awesome','brilliant','superb','magnificent','splendid','terrific','bliss','blissful','content','contented','pleasant','pleasure','enjoy','enjoying','enjoyed','success','successful','achieve','achievement','accomplished','proud','pride','inspiring','inspired','optimistic','hopeful','hope','positive','motivate','motivated','energetic','enthusiastic','passion','passionate'],
    emoji: '☀️',
    label: 'Joyful',
    color: '#f7c948',
    glow: 'rgba(247,201,72,0.25)'
  },
  // Calm & peace
  calm: {
    words: ['calm','calmed','calming','peaceful','peace','serene','serenity','tranquil','tranquility','relaxed','relaxing','relax','rest','resting','quiet','still','stillness','gentle','tender','soft','slow','breathe','breathing','meditation','meditate','mindful','mindfulness','centered','grounded','stable','steady','secure','safe','comfort','comfortable','soothing','smooth','ease','easy','free','freedom','balance','balanced','harmony','harmonious','nature','natural','simple','simplicity','clear','clarity','focus','focused'],
    emoji: '🌿',
    label: 'Calm',
    color: '#5db8a8',
    glow: 'rgba(93,184,168,0.25)'
  },
  // Sadness
  sad: {
    words: ['sad','sadness','unhappy','unhappiness','cry','crying','tears','tear','grief','grieve','grieving','loss','lost','alone','lonely','loneliness','miss','missing','miss you','heartbreak','heartbroken','broken','hurt','hurting','pain','painful','suffer','suffering','sorrow','sorrowful','depressed','depression','hopeless','hopelessness','despair','despairing','empty','emptiness','hollow','numb','miserable','misery','melancholy','disappointed','disappointment','regret','regretful','wish','wished','tired','exhausted','exhaustion','drained','heavy','down','low','dark','darkness','gloomy','gloom','bleak','bitter','bittersweet'],
    emoji: '🌧️',
    label: 'Sad',
    color: '#6e8ccc',
    glow: 'rgba(110,140,204,0.25)'
  },
  // Anger & frustration
  angry: {
    words: ['angry','anger','mad','furious','fury','frustrated','frustration','rage','raging','irritated','irritation','annoyed','annoying','annoyance','hate','hatred','despise','disgust','disgusted','bitter','bitterness','resentful','resentment','hostile','hostility','aggressive','aggression','outraged','outrage','infuriated','livid','enraged','upset','irate','seething','storm','explode','exploding','yell','yelling','scream','screaming','unfair','injustice','wrong','wronged','betrayal','betrayed','deceived','lied','cheated','manipulated','disrespected','disrespect'],
    emoji: '🔥',
    label: 'Frustrated',
    color: '#e05c5c',
    glow: 'rgba(224,92,92,0.25)'
  },
  // Anxiety & worry
  anxious: {
    words: ['anxious','anxiety','worried','worry','worrying','nervous','nervousness','scared','fear','fearful','afraid','terror','terrified','panic','panicking','stressed','stress','overwhelmed','overwhelming','dread','dreading','uncertain','uncertainty','doubt','doubtful','doubt','confused','confusion','lost','desperate','racing','thoughts','overthinking','overthink','pressure','pressured','tight','tense','tension','uneasy','unease','restless','restlessness','insecure','insecurity','helpless','helplessness','trapped','stuck','freeze','freezing','spiral','spiraling','what if'],
    emoji: '🌀',
    label: 'Anxious',
    color: '#d68adf',
    glow: 'rgba(214,138,223,0.25)'
  },
  // Neutral baseline
  neutral: {
    words: [],
    emoji: '◎',
    label: 'Neutral',
    color: '#8a8590',
    glow: 'rgba(138,133,144,0.1)'
  }
};

// Reflection phrases indexed by dominant mood
const AI_REFLECTIONS = {
  joy: [
    "There's a bright energy in your words — hold onto that feeling. It's yours.",
    "Joy like this is worth noticing. You've found something good today.",
    "Your words carry light. Whatever brought this warmth, it matters.",
    "Reading this made me feel the sunshine in your day. Keep that.",
  ],
  calm: [
    "There's a quiet strength in your words. You seem grounded right now.",
    "This stillness you're describing — that's not emptiness. That's peace.",
    "You sound like someone who has found their footing today.",
    "Calm isn't the absence of feeling — it's clarity. You have it right now.",
  ],
  sad: [
    "These feelings are real and they're allowed to exist. Thank you for writing them down.",
    "Sadness held in words is a little lighter than sadness held alone.",
    "Whatever you're carrying right now, you don't have to carry it in silence.",
    "Some days are heavy. Writing is one way to set some of it down.",
  ],
  angry: [
    "There's fire in what you've written. Sometimes anger is the right response.",
    "Your frustration is valid. These feelings are trying to tell you something.",
    "It's okay to feel this. Getting it out on the page is a healthy start.",
    "Strong feelings often point to things we care about deeply.",
  ],
  anxious: [
    "I notice some tension in your words. Take a slow breath — you're here, now.",
    "The mind can race ahead of us sometimes. You're doing the right thing by writing.",
    "Anxiety is often the gap between now and an imagined future. You're safe, right now.",
    "Whatever feels uncertain — writing it down is already a step toward clarity.",
  ],
  neutral: [
    "Sometimes a day is just a day. There's honesty in that.",
    "Not every entry needs to be a revelation. Showing up is enough.",
    "You wrote. That matters, even when the words feel ordinary.",
    "A neutral day is still a day worth remembering.",
  ]
};

function analyzeSentiment(text) {
  if (!text || text.trim().length < 3) {
    return { mood: 'neutral', score: 0, scores: {}, tags: [], reflection: '' };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.match(/\b[a-z']+\b/g) || [];
  const scores = {};

  for (const [mood, data] of Object.entries(SENTIMENT_LEXICON)) {
    if (mood === 'neutral') continue;
    let count = 0;
    for (const word of data.words) {
      if (word.includes(' ')) {
        if (lowerText.includes(word)) count += 2;
      } else {
        count += words.filter(w => w === word).length;
      }
    }
    scores[mood] = count;
  }

  // Find dominant mood
  let dominant = 'neutral';
  let maxScore = 0;
  for (const [mood, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      dominant = mood;
    }
  }

  // Calculate intensity (0-100)
  const totalWords = words.length;
  const rawIntensity = totalWords > 0 ? (maxScore / Math.sqrt(totalWords)) * 40 : 0;
  const intensity = Math.min(100, Math.round(rawIntensity));

  // Pick tags
  const tags = Object.entries(scores)
    .filter(([_, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mood]) => mood);

  // Pick random reflection
  const reflections = AI_REFLECTIONS[dominant] || AI_REFLECTIONS.neutral;
  const reflection = reflections[Math.floor(Math.random() * reflections.length)];

  return {
    mood: dominant,
    score: intensity,
    scores,
    tags,
    reflection,
    data: SENTIMENT_LEXICON[dominant]
  };
}

// Stop words for word cloud
const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','need','dare','ought','used','i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','as','until','while','of','so','if','then','than','too','very','just','also','more','most','other','some','such','no','not','only','same','so','than','too','s','t','don','dont','im','ive','id','youre','hes','shes','its','were','theyre','i\'m','i\'ve','i\'d','you\'re','he\'s','she\'s','it\'s','we\'re','they\'re']);

function getTopWords(entries, limit = 20) {
  const freq = {};
  for (const entry of entries) {
    const words = entry.text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    for (const w of words) {
      if (!STOP_WORDS.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
