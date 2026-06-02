/**
 * app.js — MoodBoard AI core logic
 * Handles journal input, mood visualization, localStorage persistence,
 * timeline chart, and insights rendering.
 */

// ===== STATE =====
let entries = JSON.parse(localStorage.getItem('moodboard_entries') || '[]');
let debounceTimer = null;
let currentMood = null;
let currentReflection = '';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setDateLabel();
  updateCharCount(0);
});

function setDateLabel() {
  const now = new Date();
  const opts = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('dateLabel').textContent = now.toLocaleDateString('en-US', opts).toUpperCase();
}

// ===== NAVIGATION =====
function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.remove('hidden');
  document.getElementById(`btn-${view}`).classList.add('active');

  if (view === 'timeline') renderTimeline();
  if (view === 'insights') renderInsights();
}

// ===== JOURNAL INPUT =====
function handleInput(textarea) {
  const text = textarea.value;
  const len = text.length;
  updateCharCount(len);

  // Enable save only if 10+ chars
  document.getElementById('saveBtn').disabled = len < 10;

  // Debounce analysis
  clearTimeout(debounceTimer);
  if (len < 5) {
    resetMoodDisplay();
    hideAIPanel();
    return;
  }
  debounceTimer = setTimeout(() => analyzeAndUpdate(text), 400);
}

function updateCharCount(len) {
  document.getElementById('charCount').textContent = `${len} / 500`;
}

function analyzeAndUpdate(text) {
  const result = analyzeSentiment(text);
  currentMood = result;
  currentReflection = result.reflection;
  updateMoodUI(result);
}

function updateMoodUI(result) {
  const { mood, score, tags, data } = result;
  const ring = document.getElementById('moodRing');
  const emoji = document.getElementById('moodEmoji');
  const label = document.getElementById('moodLabel');
  const scoreEl = document.getElementById('moodScore');
  const tagsRow = document.getElementById('tagsRow');

  // Update ring color
  if (data) {
    ring.style.borderColor = data.color;
    ring.style.boxShadow = `0 0 30px ${data.glow}`;
    ring.style.setProperty('--current-glow', data.glow);
    ring.classList.add('pulsing');

    // Update orbs
    updateOrbs(data.color);
  }

  // Animate emoji change
  emoji.style.transform = 'scale(0)';
  setTimeout(() => {
    emoji.textContent = data ? data.emoji : '◎';
    emoji.style.transform = 'scale(1)';
  }, 300);

  // Update label and score
  label.textContent = data ? data.label : 'Neutral';
  label.style.color = data ? data.color : 'var(--text-secondary)';
  scoreEl.textContent = score > 0 ? `${score}% intensity` : '';

  // Tags
  tagsRow.innerHTML = '';
  tags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = 'mood-tag';
    pill.textContent = tag;
    pill.style.borderColor = SENTIMENT_LEXICON[tag]?.color || 'var(--border)';
    tagsRow.appendChild(pill);
  });

  // Show AI reflection after short delay
  setTimeout(() => showAIPanel(currentReflection), 600);
}

function updateOrbs(color) {
  const orb1 = document.getElementById('orb1');
  const orb2 = document.getElementById('orb2');
  const hex = color;
  orb1.style.background = hex;
  orb2.style.background = hex;
}

function resetMoodDisplay() {
  document.getElementById('moodRing').classList.remove('pulsing');
  document.getElementById('moodRing').style.borderColor = '';
  document.getElementById('moodRing').style.boxShadow = '';
  document.getElementById('moodEmoji').textContent = '✦';
  document.getElementById('moodLabel').textContent = 'How are you feeling today?';
  document.getElementById('moodLabel').style.color = '';
  document.getElementById('moodScore').textContent = '';
  document.getElementById('tagsRow').innerHTML = '';
  document.getElementById('orb1').style.background = '#6e5ce6';
  document.getElementById('orb2').style.background = '#5db8a8';
}

function showAIPanel(text) {
  if (!text) return;
  const panel = document.getElementById('aiPanel');
  const textEl = document.getElementById('aiText');
  panel.style.display = 'block';
  textEl.textContent = '';

  // Typewriter effect
  let i = 0;
  const interval = setInterval(() => {
    textEl.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 22);
}

function hideAIPanel() {
  document.getElementById('aiPanel').style.display = 'none';
}

// ===== SAVE ENTRY =====
function saveEntry() {
  const text = document.getElementById('journalInput').value.trim();
  if (!text || text.length < 10) return;

  const result = currentMood || analyzeSentiment(text);
  const entry = {
    id: Date.now(),
    text,
    mood: result.mood,
    score: result.score,
    tags: result.tags,
    emoji: result.data?.emoji || '◎',
    label: result.data?.label || 'Neutral',
    color: result.data?.color || '#8a8590',
    timestamp: new Date().toISOString()
  };

  entries.unshift(entry);
  localStorage.setItem('moodboard_entries', JSON.stringify(entries));

  // Animate save
  const btn = document.getElementById('saveBtn');
  btn.textContent = '✓ Saved!';
  btn.classList.add('saved');
  btn.disabled = true;

  // Clear editor
  setTimeout(() => {
    document.getElementById('journalInput').value = '';
    updateCharCount(0);
    btn.textContent = 'Save Entry';
    btn.classList.remove('saved');
    resetMoodDisplay();
    hideAIPanel();
    showToast('Entry saved ✦');
  }, 1200);
}

// ===== TOAST =====
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== TIMELINE VIEW =====
function renderTimeline() {
  renderTimelineChart();
  renderEntriesList();
}

function renderTimelineChart() {
  const canvas = document.getElementById('timelineCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (entries.length < 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '14px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Add more entries to see your mood chart', W / 2, H / 2);
    return;
  }

  const recent = [...entries].reverse().slice(-14);
  const padX = 40, padY = 20;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let y = 0; y <= 4; y++) {
    const yPos = padY + (chartH / 4) * y;
    ctx.beginPath();
    ctx.moveTo(padX, yPos);
    ctx.lineTo(W - padX, yPos);
    ctx.stroke();
  }

  // Mood score line
  const points = recent.map((e, i) => ({
    x: padX + (i / Math.max(recent.length - 1, 1)) * chartW,
    y: padY + chartH - (e.score / 100) * chartH,
    color: e.color,
    entry: e
  }));

  // Fill under line
  const gradient = ctx.createLinearGradient(0, padY, 0, padY + chartH);
  gradient.addColorStop(0, 'rgba(200,169,110,0.2)');
  gradient.addColorStop(1, 'rgba(200,169,110,0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, padY + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padY + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
  }
  ctx.strokeStyle = '#c8a96e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = '#0a0a0f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emoji label
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.entry.emoji, p.x, p.y - 14);
  });
}

function renderEntriesList() {
  const list = document.getElementById('entriesList');
  list.innerHTML = '';

  if (entries.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="big">📖</div>Your journal is empty.<br>Write your first entry on the Journal tab.</div>`;
    return;
  }

  entries.slice(0, 20).forEach(entry => {
    const date = new Date(entry.timestamp);
    const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="entry-emoji">${entry.emoji}</div>
      <div>
        <div class="entry-mood-name" style="color:${entry.color}">${entry.label}</div>
        <div class="entry-excerpt">${entry.text.substring(0, 80)}${entry.text.length > 80 ? '…' : ''}</div>
      </div>
      <div class="entry-time">${timeStr}</div>
    `;
    list.appendChild(card);
  });
}

// ===== INSIGHTS VIEW =====
function renderInsights() {
  renderStats();
  renderWordCloud();
  renderStreak();
}

function renderStats() {
  const grid = document.getElementById('statsGrid');
  const total = entries.length;

  const moodCounts = {};
  let totalScore = 0;
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    totalScore += e.score;
  });

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

  const uniqueDays = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;

  const stats = [
    { number: total, label: 'Total Entries' },
    { number: uniqueDays, label: 'Days Journaled' },
    { number: avgScore + '%', label: 'Avg Intensity' },
    { number: dominantMood ? SENTIMENT_LEXICON[dominantMood[0]]?.emoji || '◎' : '◎', label: 'Dominant Mood' }
  ];

  grid.innerHTML = '';
  stats.forEach(s => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `<div class="stat-number">${s.number}</div><div class="stat-label">${s.label}</div>`;
    grid.appendChild(card);
  });
}

function renderWordCloud() {
  const cloud = document.getElementById('wordCloud');
  const words = getTopWords(entries, 24);

  if (words.length === 0) {
    cloud.innerHTML = '<span style="color:var(--text-muted);font-size:14px">Write more entries to see your most used words.</span>';
    return;
  }

  const maxFreq = words[0][1];
  cloud.innerHTML = '';
  words.forEach(([word, freq]) => {
    const size = 11 + Math.round((freq / maxFreq) * 12);
    const opacity = 0.5 + (freq / maxFreq) * 0.5;
    const pill = document.createElement('span');
    pill.className = 'word-pill';
    pill.textContent = word;
    pill.style.fontSize = `${size}px`;
    pill.style.opacity = opacity;
    cloud.appendChild(pill);
  });
}

function renderStreak() {
  const display = document.getElementById('streakDisplay');
  display.innerHTML = '';

  // Show last 30 days
  const today = new Date();
  const entryDays = new Set(entries.map(e => new Date(e.timestamp).toDateString()));

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = d.toDateString();
    const isToday = i === 0;
    const hasEntry = entryDays.has(dStr);

    const day = document.createElement('div');
    day.className = 'streak-day' + (hasEntry ? ' has-entry' : '') + (isToday ? ' today' : '');
    day.title = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    day.textContent = d.getDate();
    display.appendChild(day);
  }
}
