// ══════════════════════════════════════
// SUPABASE CONFIG — Fill in your values
// ══════════════════════════════════════
const SUPABASE_URL = 'https://jvesrvvlxmwtrjawbenk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_r712xehcJ57ruHiPGILcZA_uki_TgOc';
let sbClient = null;

function initSupabase() {
  try {
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && window.supabase) {
      sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) { console.warn('Supabase init failed:', e); }
}

// ══════════════════════════════════════
// CORE DATA
// ══════════════════════════════════════
const START_DATE = new Date(2026, 0, 3);
const TOTAL_WEEKS = 52;
const ADMIN_PASSWORD = 'admin123';
const EMPLOYEES = ['Ahmed', 'Yousef', 'Omar'];

const SPECIAL_WEEKS = {
  "28/03/2026": { first: "Omar", second: "Yousef", third: "Ahmed" },
  "04/04/2026": { first: "Ahmed", second: "Yousef", third: "Omar" }
};

const HOLIDAYS_DEFAULT = ["07/01/2026", "25/01/2026", "20/03/2026", "13/04/2026", "25/04/2026", "01/05/2026", "26/05/2026", "27/05/2026", "17/06/2026", "30/06/2026", "23/07/2026", "26/08/2026", "06/10/2026"];

const HOLIDAY_NAMES = {
  "07/01/2026": "عيد الميلاد المجيد 🎄", "25/01/2026": "عيد الشرطة وثورة 25 يناير 🇪🇬",
  "20/03/2026": "عيد الفطر المبارك 🌙", "13/04/2026": "اجازة شم النسيم 🌸",
  "25/04/2026": "عيد تحرير سيناء 🦅", "01/05/2026": "عيد العمال 👷",
  "26/05/2026": "وقفة عرفات 🕌", "27/05/2026": "عيد الأضحى المبارك 🐑",
  "17/06/2026": "رأس السنة الهجرية ☪️", "30/06/2026": "ثورة 30 يونيو 🇪🇬",
  "23/07/2026": "ثورة 23 يوليو 🇪🇬", "26/08/2026": "المولد النبوي الشريف ☪️",
  "06/10/2026": "عيد القوات المسلحة ⚔️"
};

// ══════════════════════════════════════
// STATE
// ══════════════════════════════════════
let fullSchedule = [];
let supabaseOverrides = {};
let dateFilter = null;
let currentFilter = null;
let adminAuthenticated = false;

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════
const isMobileLike = () => window.matchMedia("(max-width:820px)").matches;
function formatDate(d) { return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function getHolidayName(s) { return HOLIDAY_NAMES[s] || "إجازة رسمية 🎉"; }
function getHolidayMap() { try { const r = localStorage.getItem("wardiya_holidays"); const o = r ? JSON.parse(r) : HOLIDAY_NAMES; return new Map(Object.entries(typeof o === 'object' ? o : HOLIDAY_NAMES)); } catch (_) { return new Map(Object.entries(HOLIDAY_NAMES)); } }
function getPersonClass(p) { return `person-${p.toLowerCase()}`; }
function parseDateInput(s) { if (!s) return null; const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return null; const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])); if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null; d.setHours(0, 0, 0, 0); return d; }
function weekContainsDate(w, d) { const s = new Date(w.weekStart); s.setHours(0, 0, 0, 0); return d >= s && d < addDays(s, 7); }

// Toast
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.className = 'toast ' + type + ' show';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { t.classList.remove('show'); }, 3500);
}

// ══════════════════════════════════════
// SUPABASE FETCH
// ══════════════════════════════════════
async function fetchOverrides() {
  if (!sbClient) return {};
  try {
    const { data, error } = await sbClient.from('shift_overrides').select('*');
    if (error) throw error;
    const map = {};
    (data || []).forEach(r => { map[r.week_date] = { first: r.first_shift, second: r.second_shift, third: r.third_shift, notes: r.notes || '' }; });
    return map;
  } catch (e) { console.warn('Fetch overrides failed:', e); return {}; }
}

async function upsertOverride(weekDate, first, second, third, notes) {
  if (!sbClient) throw new Error('Supabase not configured');
  const { error } = await sbClient.from('shift_overrides').upsert({ week_date: weekDate, first_shift: first, second_shift: second, third_shift: third, notes: notes || '' }, { onConflict: 'week_date' });
  if (error) throw error;
}

async function deleteOverride(weekDate) {
  if (!sbClient) throw new Error('Supabase not configured');
  const { error } = await sbClient.from('shift_overrides').delete().eq('week_date', weekDate);
  if (error) throw error;
}

// ══════════════════════════════════════
// SCHEDULE GENERATION
// ══════════════════════════════════════
function getWeekRotation(weekIndex) {
  const ws = addDays(START_DATE, weekIndex * 7);
  const wsStr = formatDate(ws);
  // Priority: Supabase > SPECIAL_WEEKS > rotation
  if (supabaseOverrides[wsStr]) return supabaseOverrides[wsStr];
  if (SPECIAL_WEEKS[wsStr]) return SPECIAL_WEEKS[wsStr];
  const NEW_ROT_START = 14;
  if (weekIndex >= NEW_ROT_START) {
    const ri = (weekIndex - NEW_ROT_START) % 3;
    return [{ first: "Yousef", second: "Omar", third: "Ahmed" }, { first: "Omar", second: "Ahmed", third: "Yousef" }, { first: "Ahmed", second: "Yousef", third: "Omar" }][ri];
  }
  const ri = weekIndex % 3;
  return [{ first: "Ahmed", second: "Yousef", third: "Omar" }, { first: "Yousef", second: "Omar", third: "Ahmed" }, { first: "Omar", second: "Ahmed", third: "Yousef" }][ri];
}

function generateSchedule() {
  const s = [];
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const ws = addDays(START_DATE, i * 7), we = addDays(ws, 5), rot = getWeekRotation(i);
    const wsStr = formatDate(ws);
    const notes = (supabaseOverrides[wsStr] && supabaseOverrides[wsStr].notes) || (SPECIAL_WEEKS[wsStr] && SPECIAL_WEEKS[wsStr].notes) || '';
    s.push({ weekNumber: i + 1, weekStart: ws, weekEnd: we, weekStartFormatted: wsStr, weekEndFormatted: formatDate(we), first: rot.first, second: rot.second, third: rot.third, notes });
  }
  return s;
}

function getCurrentWeekIndex(sched) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  for (let i = 0; i < sched.length; i++) { const ws = new Date(sched[i].weekStart); ws.setHours(0, 0, 0, 0); if (t >= ws && t < addDays(ws, 7)) return i; }
  return -1;
}

// ══════════════════════════════════════
// RENDER DASHBOARD
// ══════════════════════════════════════
function renderDashboard(schedule, ci) {
  const c = document.getElementById('dashboardContent'); if (!c) return; c.innerHTML = '';
  const today = new Date(), ss = new Date(schedule[0].weekStart), se = addDays(new Date(schedule[schedule.length - 1].weekStart), 7);
  let li, cdi, ni;
  if (today < ss) { li = 0; cdi = 1; ni = 2; }
  else if (ci === -1 && today >= se) { li = schedule.length - 3; cdi = schedule.length - 2; ni = schedule.length - 1; }
  else { li = ci - 1; cdi = ci; ni = ci + 1; }

  [{ index: li, label: "Last Week", pos: "last" }, { index: cdi, label: "Current Week", pos: "current" }, { index: ni, label: "Next Week", pos: "next" }].forEach(card => {
    if (card.index < 0 || card.index >= schedule.length) {
      const e = document.createElement('div'); e.className = 'week-card empty-card';
      e.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3)">Not Available</div>';
      c.appendChild(e); return;
    }
    const w = schedule[card.index], el = document.createElement('div');
    const isCur = ci !== -1 && card.index === ci;
    el.className = 'week-card ' + (isCur ? 'current' : card.pos);
    el.setAttribute('data-card-index', card.index);

    const offStr = formatDate(new Date(w.weekEnd)), hm = getHolidayMap();
    let holidayHtml = '';
    if (hm.has(offStr)) holidayHtml = `<div class="week-note">🎉 ${getHolidayName(offStr)} 🎉</div>`;
    let notesHtml = '';
    if (w.notes) notesHtml = `<div class="card-notes">📝 ${w.notes}</div>`;

    el.innerHTML = `
      <div class="week-header"><div class="week-label">${card.label}</div></div>
      <div class="date-range">${w.weekStartFormatted} — ${w.weekEndFormatted}</div>
      <div class="shift-grid">
        <div class="shift-item"><span class="shift-role">1st Shift</span><span class="shift-person person-badge ${getPersonClass(w.first)}">${w.first}</span></div>
        <div class="shift-item"><span class="shift-role">2nd Shift</span><span class="shift-person person-badge ${getPersonClass(w.second)}">${w.second}</span></div>
        <div class="shift-item"><span class="shift-role">3rd Shift</span><span class="shift-person person-badge ${getPersonClass(w.third)}">${w.third}</span></div>
      </div>
      ${holidayHtml}${notesHtml}`;
    c.appendChild(el);
  });

  if (isMobileLike()) setTimeout(() => { const cur = c.querySelector('.week-card.current'); if (cur) cur.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }, 100);
}

// ══════════════════════════════════════
// RENDER SCHEDULE TABLE
// ══════════════════════════════════════
function renderScheduleTable(sched, ci) {
  const c = document.getElementById('scheduleContainer'); if (!c) return;
  if (isMobileLike()) {
    c.innerHTML = '';
    sched.forEach(w => {
      const card = document.createElement('div'); card.className = 'schedule-card';
      const ai = fullSchedule.findIndex(x => x.weekNumber === w.weekNumber); card.id = `week-${ai}`;
      if (ci !== -1 && w.weekNumber === ci + 1) card.classList.add('current-week');
      const offStr = formatDate(new Date(w.weekEnd)), hm = getHolidayMap();
      let noteHtml = hm.has(offStr) ? `<div class="schedule-note holiday">🎉 ${getHolidayName(offStr)}</div>` : `<div class="schedule-note">Regular OFF Day</div>`;
      if (w.notes) noteHtml += `<div class="schedule-note" style="margin-top:6px">📝 ${w.notes}</div>`;
      card.innerHTML = `
        <div class="schedule-card-header"><span class="schedule-week-num">${w.weekNumber}</span><span class="schedule-dates">${w.weekStartFormatted} — ${w.weekEndFormatted}</span></div>
        <div class="schedule-shifts">
          <div class="schedule-shift-item"><span class="schedule-shift-label">1st</span><span class="person-badge ${getPersonClass(w.first)}">${w.first}</span></div>
          <div class="schedule-shift-item"><span class="schedule-shift-label">2nd</span><span class="person-badge ${getPersonClass(w.second)}">${w.second}</span></div>
          <div class="schedule-shift-item"><span class="schedule-shift-label">3rd</span><span class="person-badge ${getPersonClass(w.third)}">${w.third}</span></div>
        </div>${noteHtml}`;
      c.appendChild(card);
    });
  } else {
    let h = '<table class="schedule-table"><thead><tr><th>Week</th><th>Start</th><th>End</th><th>1st</th><th>2nd</th><th>3rd</th><th>Notes</th></tr></thead><tbody>';
    sched.forEach(w => {
      const isCur = ci !== -1 && w.weekNumber === ci + 1, rc = isCur ? ' class="current-week"' : '';
      const ai = fullSchedule.findIndex(x => x.weekNumber === w.weekNumber);
      const offStr = formatDate(new Date(w.weekEnd)), hm = getHolidayMap();
      let noteText = hm.has(offStr) ? '🎉 ' + getHolidayName(offStr) : '';
      if (w.notes) noteText += (noteText ? ' | ' : '') + '📝 ' + w.notes;
      h += `<tr id="week-${ai}"${rc}><td><strong>${w.weekNumber}</strong></td><td>${w.weekStartFormatted}</td><td>${w.weekEndFormatted}</td>
        <td><span class="person-badge ${getPersonClass(w.first)}">${w.first}</span></td>
        <td><span class="person-badge ${getPersonClass(w.second)}">${w.second}</span></td>
        <td><span class="person-badge ${getPersonClass(w.third)}">${w.third}</span></td>
        <td>${noteText}</td></tr>`;
    });
    h += '</tbody></table>'; c.innerHTML = h;
  }
}

// ══════════════════════════════════════
// TABS
// ══════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  const btn = document.querySelector(`.nav-item[data-tab="${name}"]`); if (btn) btn.classList.add('active');
  if (name === 'admin' && !adminAuthenticated) { document.getElementById('adminGate').style.display = ''; document.getElementById('adminPanel').style.display = 'none'; }
}

// ══════════════════════════════════════
// FILTERS
// ══════════════════════════════════════
function applyFilters() {
  let f = [...fullSchedule];
  if (currentFilter) f = f.filter(w => w.first === currentFilter || w.second === currentFilter || w.third === currentFilter);
  if (dateFilter) f = f.filter(w => weekContainsDate(w, dateFilter));
  renderScheduleTable(f, getCurrentWeekIndex(fullSchedule));
}

function goToCurrentWeek() {
  const ci = getCurrentWeekIndex(fullSchedule); if (ci === -1) return;
  const el = document.getElementById(`week-${ci}`); if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.animation = 'none'; setTimeout(() => { el.style.animation = 'flash 1s ease-out'; }, 10);
}

function applyDate() {
  const inp = document.getElementById('dateSearch'); if (!inp) return;
  if (!inp.value.trim()) { dateFilter = null; inp.classList.remove('invalid'); applyFilters(); return; }
  const p = parseDateInput(inp.value); if (!p) { inp.classList.add('invalid'); return; }
  inp.classList.remove('invalid'); dateFilter = p; applyFilters();
  const m = fullSchedule.find(w => weekContainsDate(w, p));
  if (m) { const r = document.getElementById(`week-${m.weekNumber - 1}`); if (r) { r.scrollIntoView({ behavior: 'smooth', block: 'center' }); r.style.animation = 'none'; setTimeout(() => { r.style.animation = 'flash 1s ease-out'; }, 10); } }
}

// ══════════════════════════════════════
// NEW WEEK BANNER
// ══════════════════════════════════════
const WEEK_TRACK_KEY = 'wardiya_last_seen_week_index_v1';
function showNewWeekBanner(wn) {
  const b = document.getElementById('newWeekBanner'); if (!b) return;
  b.textContent = `🎉 New Week Started! Week #${wn}`; b.classList.add('show');
  clearTimeout(showNewWeekBanner._t1); clearTimeout(showNewWeekBanner._t2);
  showNewWeekBanner._t1 = setTimeout(() => { b.style.opacity = '0'; }, 3800);
  showNewWeekBanner._t2 = setTimeout(() => { b.classList.remove('show'); b.style.opacity = ''; }, 4300);
}
function checkNewWeek(s) {
  const ci = getCurrentWeekIndex(s); if (ci === -1) return;
  try { const ls = localStorage.getItem(WEEK_TRACK_KEY); if (ls === null) { localStorage.setItem(WEEK_TRACK_KEY, String(ci)); return; } if (Number(ls) !== ci) { localStorage.setItem(WEEK_TRACK_KEY, String(ci)); showNewWeekBanner(s[ci].weekNumber); } } catch (_) { }
}

// ══════════════════════════════════════
// DOWNLOAD AS IMAGE
// ══════════════════════════════════════
function downloadScheduleImage() {
  // Target Next Week card only
  const container = document.getElementById('dashboardContent');
  const el = container ? container.querySelector('.week-card.next') : null;
  if (!el) { showToast('Next week card not found', 'error'); return; }
  if (typeof html2canvas === 'undefined') { showToast('Download library not loaded', 'error'); return; }
  showToast('Capturing Next Week…', 'success');
  html2canvas(el, { backgroundColor: '#0a0e1a', scale: 2, useCORS: true, logging: false }).then(canvas => {
    canvas.toBlob(function(blob) {
      if (!blob) { showToast('Screenshot failed', 'error'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'next-week-schedule-' + formatDate(new Date()).replace(/\//g, '-') + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Image downloaded!', 'success');
    }, 'image/png');
  }).catch(e => { console.error(e); showToast('Screenshot failed', 'error'); });
}

// ══════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════
function populateWeekSelector() {
  const sel = document.getElementById('weekSelect'); if (!sel) return; sel.innerHTML = '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const ws = addDays(START_DATE, i * 7);
    if (ws < addDays(today, -7)) continue;
    const o = document.createElement('option'); o.value = formatDate(ws);
    o.textContent = `Week ${i + 1} — ${formatDate(ws)}`; sel.appendChild(o);
    if (sel.options.length >= 12) break;
  }
}

function loadExistingOverride() {
  const sel = document.getElementById('weekSelect'); if (!sel) return;
  const key = sel.value, ov = supabaseOverrides[key] || SPECIAL_WEEKS[key];
  if (ov) {
    document.getElementById('firstShiftSelect').value = ov.first;
    document.getElementById('secondShiftSelect').value = ov.second;
    document.getElementById('thirdShiftSelect').value = ov.third;
    document.getElementById('notesInput').value = ov.notes || '';
    showToast('Loaded existing override', 'success');
  } else { showToast('No override found for this week', 'error'); }
}

async function saveOverride() {
  const btn = document.getElementById('saveOverrideBtn'); btn.disabled = true;
  const weekDate = document.getElementById('weekSelect').value;
  const first = document.getElementById('firstShiftSelect').value;
  const second = document.getElementById('secondShiftSelect').value;
  const third = document.getElementById('thirdShiftSelect').value;
  const notes = document.getElementById('notesInput').value.trim();

  if (new Set([first, second, third]).size < 3) { showToast('Each person must have a unique shift!', 'error'); btn.disabled = false; return; }
  try {
    await upsertOverride(weekDate, first, second, third, notes);
    supabaseOverrides[weekDate] = { first, second, third, notes };
    fullSchedule = generateSchedule();
    const ci = getCurrentWeekIndex(fullSchedule);
    renderDashboard(fullSchedule, ci); renderScheduleTable(fullSchedule, ci);
    renderOverridesList(); showToast('Override saved successfully!', 'success');
  } catch (e) { console.error(e); showToast('Save failed: ' + e.message, 'error'); }
  btn.disabled = false;
}

async function removeOverride(weekDate) {
  try {
    showToast('Deleting override…', 'success');
    await deleteOverride(weekDate);
    delete supabaseOverrides[weekDate];
    // Re-fetch from Supabase to ensure consistency
    try { supabaseOverrides = await fetchOverrides(); } catch(e) {}
    fullSchedule = generateSchedule();
    const ci = getCurrentWeekIndex(fullSchedule);
    renderDashboard(fullSchedule, ci);
    renderScheduleTable(fullSchedule, ci);
    renderOverridesList();
    showToast('Override deleted successfully!', 'success');
  } catch (e) { showToast('Delete failed: ' + e.message, 'error'); }
}

function renderOverridesList() {
  const c = document.getElementById('overridesList'); if (!c) return;
  const keys = Object.keys(supabaseOverrides);
  if (!keys.length) { c.innerHTML = '<div class="no-overrides">No overrides saved yet.</div>'; return; }
  c.innerHTML = '';
  keys.sort().forEach(k => {
    const ov = supabaseOverrides[k];
    const el = document.createElement('div'); el.className = 'override-item';
    el.innerHTML = `<span class="override-week">📅 ${k}</span>
      <div class="override-shifts"><span class="person-badge ${getPersonClass(ov.first)}">${ov.first}</span><span class="person-badge ${getPersonClass(ov.second)}">${ov.second}</span><span class="person-badge ${getPersonClass(ov.third)}">${ov.third}</span></div>
      ${ov.notes ? `<div class="override-notes">📝 ${ov.notes}</div>` : ''}
      <button class="override-delete" data-week="${k}">Delete</button>`;
    el.querySelector('.override-delete').addEventListener('click', () => removeOverride(k));
    c.appendChild(el);
  });
}

function setupAdmin() {
  const loginBtn = document.getElementById('adminLoginBtn'), pwInput = document.getElementById('adminPasswordInput');
  const logoutBtn = document.getElementById('adminLogoutBtn'), saveBtn = document.getElementById('saveOverrideBtn');
  const loadBtn = document.getElementById('loadExistingBtn');
  if (!loginBtn || !pwInput) { console.warn('Admin elements not found'); return; }

  function tryLogin() {
    if (pwInput.value === ADMIN_PASSWORD) {
      adminAuthenticated = true; document.getElementById('adminGate').style.display = 'none';
      document.getElementById('adminPanel').style.display = ''; populateWeekSelector(); renderOverridesList();
      document.getElementById('gateError').textContent = '';
    } else { document.getElementById('gateError').textContent = '❌ Wrong password'; pwInput.value = ''; }
  }
  loginBtn.addEventListener('click', tryLogin);
  pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  if (logoutBtn) logoutBtn.addEventListener('click', () => { adminAuthenticated = false; switchTab('dashboard'); });
  if (saveBtn) saveBtn.addEventListener('click', saveOverride);
  if (loadBtn) loadBtn.addEventListener('click', loadExistingOverride);
}

// ══════════════════════════════════════
// LOADING
// ══════════════════════════════════════
function hideLoading() { const o = document.getElementById('loadingOverlay'); if (o) { o.classList.add('hidden'); setTimeout(() => { o.style.display = 'none'; }, 600); } }

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
async function init() {
  const safetyTimer = setTimeout(hideLoading, 5000);
  initSupabase();
  try {
    supabaseOverrides = await fetchOverrides();
  } catch (e) { console.warn('Override fetch failed:', e); supabaseOverrides = {}; }

  try {
    fullSchedule = generateSchedule();
    const ci = getCurrentWeekIndex(fullSchedule);
    renderDashboard(fullSchedule, ci);
    renderScheduleTable(fullSchedule, ci);
    checkNewWeek(fullSchedule);

    // Tabs
    document.querySelectorAll('.nav-item').forEach(btn => { btn.addEventListener('click', () => switchTab(btn.dataset.tab)); });
    // Go current
    const goBtn = document.getElementById('goCurrentBtn');
    if (goBtn) goBtn.addEventListener('click', () => { switchTab('schedule'); setTimeout(goToCurrentWeek, 60); });
    // Date search
    const di = document.getElementById('dateSearch'), cb = document.getElementById('clearDateBtn');
    if (di) { let _t; di.addEventListener('input', () => { clearTimeout(_t); _t = setTimeout(applyDate, 180); }); di.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyDate(); } }); }
    if (cb) cb.addEventListener('click', () => { if (di) { di.value = ''; di.classList.remove('invalid'); } dateFilter = null; applyFilters(); });
    // Download
    const dlBtn = document.getElementById('downloadBtn');
    if (dlBtn) dlBtn.addEventListener('click', downloadScheduleImage);
    // Admin
    setupAdmin();
    // Resize
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { renderScheduleTable(fullSchedule, getCurrentWeekIndex(fullSchedule)); }, 250); });
    // Auto-refresh
    let lastIdx = ci;
    setInterval(() => { const ni = getCurrentWeekIndex(fullSchedule); if (ni !== lastIdx) { lastIdx = ni; renderDashboard(fullSchedule, ni); applyFilters(); checkNewWeek(fullSchedule); } }, 60000);
  } catch (e) { console.error('Init error:', e); }
  finally { clearTimeout(safetyTimer); hideLoading(); }
}

window.addEventListener('DOMContentLoaded', init);
