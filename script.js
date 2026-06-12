/* ═══════════════════════════════════════════
   Crowdo — script.js
   AI Crowd Management System
   All JavaScript: routing, queue, chart, clock
═══════════════════════════════════════════ */

/* ══════════════════════════════
   1. PAGE ROUTER
══════════════════════════════ */
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show the target page
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lazy init chart only when dashboard is opened
  if (pageId === 'dashboard' && !window.chartInitialized) {
    initChart();
    animateCounter();
    window.chartInitialized = true;
  }

  // Init camera dots when monitoring opened
  if (pageId === 'monitor' && !window.camsInitialized) {
    spawnDots('simA', 130, 'hot');
    spawnDots('simB', 65,  'dense');
    spawnDots('simC', 22,  '');
    spawnDots('simD', 16,  '');
    window.camsInitialized = true;
  }

  // Init queue when opened
  if (pageId === 'queue' && !window.queueInitialized) {
    renderPeopleIcons();
    renderBoard();
    window.queueInitialized = true;
  }
}

/* ══════════════════════════════
   2. HAMBURGER / SIDEBAR
══════════════════════════════ */
const hamburgerBtn   = document.getElementById('hamburgerBtn');
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

hamburgerBtn.addEventListener('click', openSidebar);

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ══════════════════════════════
   3. LIVE CLOCK
══════════════════════════════ */
function updateClock() {
  const el = document.getElementById('liveClock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
}
updateClock();
setInterval(updateClock, 1000);

/* ══════════════════════════════
   4. CROWD DOT SIMULATION
══════════════════════════════ */
function spawnDots(containerId, count, className) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = ''; // Clear before spawning
  const total = 200;
  const used  = new Set();
  while (used.size < count) used.add(Math.floor(Math.random() * total));
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    if (used.has(i)) {
      d.className = 'dot ' + className;
      d.style.animationDelay = (Math.random() * 1.2) + 's';
    }
    wrap.appendChild(d);
  }
}

/* ══════════════════════════════
   5. COUNTER ANIMATION
══════════════════════════════ */
function animateCounter() {
  const el = document.getElementById('count');
  if (!el) return;
  let v = 0;
  const run = () => {
    v = Math.min(v + Math.ceil((120 - v) / 8), 120);
    el.textContent = v;
    if (v < 120) requestAnimationFrame(run);
  };
  setTimeout(run, 200);
}

/* ══════════════════════════════
   6. LINE CHART (Dashboard)
══════════════════════════════ */
function initChart() {
  const canvas = document.getElementById('sparkChart');
  if (!canvas) return;
  new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: ['2am','3am','4am','5am','6am','7am','8am','9am','10am','11am','12pm','1pm','2pm'],
      datasets: [{
        label: 'People',
        data: [18, 22, 15, 30, 55, 88, 102, 130, 115, 98, 110, 125, 120],
        borderColor: '#3b82f6',
        borderWidth: 2.5,
        backgroundColor: 'rgba(59,130,246,0.08)',
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'white',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          titleColor: '#1e293b',
          bodyColor: '#475569',
          titleFont: { family: 'Nunito', weight: '800' },
          bodyFont:  { family: 'Nunito' },
          callbacks: { label: c => ` ${c.parsed.y} people detected` }
        }
      },
      scales: {
        x: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { family: 'Nunito', size: 11 } } },
        y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { family: 'Nunito', size: 11 } } }
      }
    }
  });
}

/* ══════════════════════════════
   7. QUEUE MANAGEMENT SYSTEM
══════════════════════════════ */

// --- Queue State ---
const queues = {
  A: { name: 'Queue A — General',      count: 18, wait: '~14 min', barW: '87%', speed: 'slow',   serving: 2 },
  B: { name: 'Queue B — Express',      count: 5,  wait: '~4 min',  barW: '28%', speed: 'fast',   serving: 1 },
  C: { name: 'Queue C — Senior',       count: 9,  wait: '~8 min',  barW: '52%', speed: 'medium', serving: 1 },
  D: { name: 'Queue D — Online',       count: 3,  wait: '~2 min',  barW: '15%', speed: 'fast',   serving: 1 }
};

let tokenCounter = { A: 41, B: 33, C: 37, D: 29 };
let trackerStep  = 2;

const sampleNames = [
  'Rahul S.','Priya K.','Amit V.','Sunita R.','Vikas M.',
  'Neha P.','Deepak J.','Anita B.','Rajesh T.','Pooja L.'
];

let boardData = [
  { token: 'A-039', name: 'Rahul S.',  queue: 'General',       wait: '2 min',  status: 'serving' },
  { token: 'A-040', name: 'Priya K.',  queue: 'General',       wait: '4 min',  status: 'next'    },
  { token: 'B-033', name: 'Amit V.',   queue: 'Express',       wait: '1 min',  status: 'serving' },
  { token: 'B-034', name: 'Sunita R.', queue: 'Express',       wait: '3 min',  status: 'waiting' },
  { token: 'C-037', name: 'Vikas M.',  queue: 'Senior',        wait: '5 min',  status: 'serving' },
  { token: 'D-029', name: 'Neha P.',   queue: 'Online Pickup', wait: '1 min',  status: 'serving' },
];

// --- Render people icons ---
function renderPeopleIcons() {
  Object.keys(queues).forEach(key => {
    const wrap = document.getElementById('people-' + key);
    if (!wrap) return;
    wrap.innerHTML = '';
    const q = queues[key];
    for (let i = 0; i < q.serving; i++) {
      const p = document.createElement('div');
      p.className = 'person-icon serving';
      p.textContent = '👤';
      p.title = 'Being served now';
      wrap.appendChild(p);
    }
    const cls  = q.speed === 'slow' ? 'delayed' : 'waiting';
    const show = Math.min(q.count, 14);
    for (let i = 0; i < show; i++) {
      const p = document.createElement('div');
      p.className = 'person-icon ' + cls;
      p.textContent = '👤';
      wrap.appendChild(p);
    }
    if (q.count > 14) {
      const more = document.createElement('div');
      more.className = 'person-icon waiting';
      more.style.background = '#64748b';
      more.style.fontSize = '0.6rem';
      more.textContent = '+' + (q.count - 14);
      wrap.appendChild(more);
    }
  });
}

// --- Render live board ---
function renderBoard() {
  const tbody = document.getElementById('boardBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  boardData.slice(0, 8).forEach(row => {
    const tr = document.createElement('tr');
    let statusHtml = '';
    if (row.status === 'serving') {
      statusHtml = `<span class="token-badge serving">Serving</span>`;
    } else if (row.status === 'next') {
      statusHtml = `<span class="token-badge" style="background:#fef3c7;color:#d97706;">⏭ Next</span>`;
    } else {
      statusHtml = `<span class="token-badge"> Waiting</span>`;
    }
    const mins = parseInt(row.wait) || 0;
    const wc   = mins <= 3 ? 'fast' : mins <= 7 ? 'medium' : 'slow';
    tr.innerHTML = `
      <td><strong>${row.token}</strong></td>
      <td>${row.name}</td>
      <td>${row.queue}</td>
      <td><span class="wait-chip ${wc}">${row.wait}</span></td>
      <td>${statusHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Refresh board (simulate progress) ---
function refreshBoard() {
  boardData.forEach(r => {
    if (r.status === 'serving') r.status = 'done';
    else if (r.status === 'next') r.status = 'serving';
    else if (r.status === 'waiting') r.status = 'next';
  });
  boardData = boardData.filter(r => r.status !== 'done');
  if (boardData.length < 6) {
    const letters = ['A','B','C','D'];
    const l = letters[Math.floor(Math.random() * 4)];
    tokenCounter[l]++;
    boardData.push({
      token:  l + '-' + String(tokenCounter[l]).padStart(3,'0'),
      name:   sampleNames[Math.floor(Math.random() * sampleNames.length)],
      queue:  queues[l].name.replace('Queue ' + l + ' — ', ''),
      wait:   Math.floor(Math.random() * 12 + 1) + ' min',
      status: 'waiting'
    });
  }
  renderBoard();
}

// --- Live queue auto-update ---
setInterval(() => {
  if (!window.queueInitialized) return;
  Object.keys(queues).forEach(key => {
    const q = queues[key];
    const delta = Math.floor(Math.random() * 3) - 1;
    q.count = Math.max(1, q.count + delta);
    const cntEl = document.getElementById('cnt-' + key);
    if (cntEl) cntEl.textContent = q.count;

    const mins    = Math.round(q.count * 0.75);
    const waitStr = '~' + mins + ' min';
    const speed   = mins <= 5 ? 'fast' : mins <= 10 ? 'medium' : 'slow';
    q.speed = speed;

    const waitEl = document.getElementById('wait-' + key);
    if (waitEl) { waitEl.textContent = waitStr; waitEl.className = 'ql-wait-time ' + speed; }

    const barEl = document.getElementById('bar-' + key);
    if (barEl) { barEl.className = 'ql-bar-fill ' + speed; barEl.style.width = Math.min(q.count * 5, 100) + '%'; }
  });

  refreshBoard();
  renderPeopleIcons();

  const sc = document.getElementById('servedCount');
  const tt = document.getElementById('totalTokens');
  if (sc) sc.textContent = parseInt(sc.textContent) + 1;
  if (tt) tt.textContent = parseInt(tt.textContent) + 1;

  advanceTracker();
}, 8000);

// --- Join queue shortcut ---
function joinQueue(key) {
  const sel = document.getElementById('tokenQueue');
  if (sel) sel.value = key;
  document.querySelector('.token-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  const tf = document.querySelector('.token-section');
  tf.style.outline = '3px solid #7c3aed';
  setTimeout(() => { tf.style.outline = 'none'; }, 2000);
}

// --- Accept AI suggestion ---
function acceptAISuggestion() {
  const banner = document.getElementById('aiSuggestion');
  if (!banner) return;
  banner.style.background  = 'linear-gradient(135deg,#d1fae5,#dbeafe)';
  banner.style.borderColor = '#10b981';
  banner.querySelector('.ai-text-bold').textContent = '✅ Switched to Queue B!';
  banner.querySelector('.ai-text-sub').textContent  = 'Great choice! Queue B is ready. Expected wait: ~4 min.';
  banner.querySelector('.ai-action-btn').textContent = '🎫 Get Token';
  banner.querySelector('.ai-action-btn').onclick = () => joinQueue('B');
}

// --- Generate digital token ---
function generateToken() {
  const name  = (document.getElementById('tokenName')  || {}).value?.trim();
  const phone = (document.getElementById('tokenPhone') || {}).value?.trim();
  const qKey  = (document.getElementById('tokenQueue') || {}).value;

  if (!name)  { alert('Please enter your name ');          return; }
  if (!phone) { alert('Please enter your mobile number '); return; }
  if (!qKey)  { alert('Please select a queue ');           return; }

  const q = queues[qKey];
  tokenCounter[qKey]++;
  const tokenNum = qKey + '-' + String(tokenCounter[qKey]).padStart(3, '0');
  const position = q.count + 1;
  const now      = new Date().toLocaleTimeString('en-GB', { hour12: false });

  // Fill token card fields
  setText('displayTokenNum',   '#' + tokenNum);
  setText('displayTokenName',  name);
  setText('displayTokenQueue', q.name);
  setText('displayWait',       q.wait);
  setText('displayPosition',   '#' + position + ' in line');
  setText('displayIssuedAt',   now);
  setText('displayPhone',      phone);
  setText('tickerNow',         'Now Serving: Token #' + qKey + '-' + String(tokenCounter[qKey] - 1).padStart(3,'0'));
  setText('tickerSub',         q.name + ' · Please be ready');

  // Generate QR Code
  const qrWrap = document.getElementById('qrCode');
  if (qrWrap) {
    qrWrap.innerHTML = '';
    new QRCode(qrWrap, {
      text:         `Token:${tokenNum}|Name:${name}|Queue:${q.name}|Wait:${q.wait}|Pos:${position}`,
      width:        90,
      height:       90,
      colorDark:    '#1e293b',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // Add to board
  boardData.unshift({
    token:  tokenNum,
    name:   name.split(' ')[0] + '.',
    queue:  q.name.replace('Queue ' + qKey + ' — ', ''),
    wait:   q.wait.replace('~', ''),
    status: 'waiting'
  });
  renderBoard();

  // Update queue count
  q.count++;
  const cntEl = document.getElementById('cnt-' + qKey);
  if (cntEl) cntEl.textContent = q.count;
  renderPeopleIcons();

  // Show token card
  const wrap = document.getElementById('tokenCardWrap');
  if (wrap) wrap.classList.add('show');

  // Reset tracker
  resetTracker();

  // Scroll to token
  setTimeout(() => { wrap?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// --- Tracker ---
function resetTracker() {
  trackerStep = 2;
  updateTrackerUI();
}

function advanceTracker() {
  const wrap = document.getElementById('tokenCardWrap');
  if (!wrap || !wrap.classList.contains('show')) return;
  if (trackerStep < 4) { trackerStep++; updateTrackerUI(); }
}

function updateTrackerUI() {
  ['step1','step2','step3','step4','step5'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'tracker-step';
    if (i < trackerStep)      el.classList.add('done');
    else if (i === trackerStep) el.classList.add('active');
    el.querySelector('.step-circle').textContent = i < trackerStep ? '✓' : (i + 1);
  });
}

/* ══════════════════════════════
   8. LOGIN / SIGNUP
══════════════════════════════ */
function switchTab(tab) {
  const loginForm  = document.getElementById('formLogin');
  const signupForm = document.getElementById('formSignup');
  const tabLogin   = document.getElementById('tabLogin');
  const tabSignup  = document.getElementById('tabSignup');
  const success    = document.getElementById('authSuccess');

  // Hide success
  if (success) success.classList.add('hidden');

  if (tab === 'login') {
    loginForm?.classList.remove('hidden');
    signupForm?.classList.add('hidden');
    tabLogin?.classList.add('active');
    tabSignup?.classList.remove('active');
  } else {
    loginForm?.classList.add('hidden');
    signupForm?.classList.remove('hidden');
    tabLogin?.classList.remove('active');
    tabSignup?.classList.add('active');
  }
}

function handleLogin() {
  const loginForm = document.getElementById('formLogin');
  const success   = document.getElementById('authSuccess');
  const msg       = document.getElementById('successMsg');
  if (loginForm) loginForm.classList.add('hidden');
  if (msg) msg.textContent = 'Welcome back! Redirecting to Dashboard...';
  if (success) success.classList.remove('hidden');
  setTimeout(() => showPage('dashboard'), 2000);
}

function handleSignup() {
  const signupForm = document.getElementById('formSignup');
  const success    = document.getElementById('authSuccess');
  const msg        = document.getElementById('successMsg');
  if (signupForm) signupForm.classList.add('hidden');
  if (msg) msg.textContent = 'Account created! Welcome to ACMS 🎉 Redirecting...';
  if (success) success.classList.remove('hidden');
  setTimeout(() => showPage('dashboard'), 2200);
}

/* ══════════════════════════════
   9. INIT — show home on load
══════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  showPage('home');
});