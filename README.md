# ◎ MoodBoard AI — Your Emotional Journal

> *Write. Reflect. Understand yourself.*

MoodBoard AI is a real-time mood journaling app that uses client-side sentiment analysis to detect your emotional state as you type, visualizes it with a stunning animated gradient interface, and tracks your emotional journey over time.

**No backend. No API keys. No database setup. Just open it and go.**

---

## ✨ Features

| Feature | Description |
|---|---|
| **Live Mood Detection** | Analyzes your writing in real-time (400ms debounce) across 5 emotional dimensions: Joy, Calm, Sadness, Frustration, Anxiety |
| **Animated Mood Visualizer** | Dynamic color-shifting orbs and a pulsing mood ring reflect your emotional state |
| **AI Reflections** | Thoughtful, contextual responses generated per mood to help you process emotions |
| **Mood Timeline** | Smooth line chart showing your emotional journey across your last 14 entries |
| **Insights Dashboard** | Word cloud, streak calendar (30 days), and mood statistics |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Sentiment Engine | Custom weighted lexicon (800+ mood words, 5 dimensions) |
| Storage | Browser `localStorage` (no server needed) |
| Fonts | DM Serif Display + DM Sans (Google Fonts) |
| Charts | HTML5 Canvas (built-in, no library) |
| Deploy | Netlify / Vercel (static) |

---

## 📁 Project Structure

```
moodboard-ai/
├── index.html       # App shell & all three views (Journal, Timeline, Insights)
├── style.css        # Animated background, dark theme, all component styles
├── sentiment.js     # Client-side NLP engine (800+ word lexicon, 5 emotions)
├── app.js           # Core logic: input handling, chart rendering, localStorage
└── README.md        # You are here
```

---

## 🚀 Running Locally

No build step. No npm install. Just:

```bash
# Option 1: Python (most machines have this)
python3 -m http.server 3000
# Open: http://localhost:3000

# Option 2: Node.js (if installed)
npx serve .
# Open the URL it shows you

# Option 3: VS Code
# Install the "Live Server" extension → right-click index.html → Open with Live Server
```

---

## 🌐 Deploy to Netlify (2 minutes, free)

```bash
# Step 1: Install Netlify CLI
npm install -g netlify-cli

# Step 2: Login (opens browser)
netlify login

# Step 3: Deploy!
netlify deploy --prod --dir .
```

Your live URL will appear in the terminal. Done.

---

## 🌐 Deploy to Vercel (alternative)

```bash
npm install -g vercel
vercel --prod
```

---

## 💡 How the Sentiment Engine Works

The app scores your writing against 5 weighted word lists:

- **Joy** — 70+ words related to happiness, excitement, gratitude
- **Calm** — 55+ words related to peace, mindfulness, ease
- **Sad** — 65+ words related to grief, loss, loneliness
- **Frustrated** — 55+ words related to anger, injustice, resentment
- **Anxious** — 55+ words related to worry, stress, uncertainty

Intensity is calculated as: `min(100, (matchCount / √wordCount) × 40)`

The dominant emotion drives the UI color, emoji, and AI reflection text.

---

## 🏆 Hackathon Pitch

**Problem:** Most people don't track their mental health because existing apps are clinical, complex, or require account setup.

**Solution:** A zero-friction, beautiful journaling tool that gives you emotional insight the moment you start typing — no signup, no data leaving your device.

**Impact:** Privacy-first mental health tech. Your data stays on your device via localStorage. No servers, no accounts, no surveillance.

---

## 🔮 What's Next (post-hackathon roadmap)

- Export journal as PDF
- PWA mode (installable, offline-first)
- Weekly email digest via EmailJS (free tier)
- Spotify mood playlist integration
- Claude API integration for deeper AI reflections

---

*Built with ♥ at [Hackathon Name] · [Your Name] · [Date]*
