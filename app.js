// =============================
// Core Data & Configuration
// =============================
const START_DATE = new Date(2026, 0, 3);
const TOTAL_WEEKS = 52;

// =============================
// Official Holidays
// =============================
const HOLIDAYS_DEFAULT = [
  "08/01/2026", "29/01/2026", "19/03/2026", "26/03/2026",
  "16/04/2026", "30/04/2026", "28/05/2026", "18/06/2026",
  "02/07/2026", "23/07/2026", "27/08/2026", "08/10/2026"
];

function getHolidaySet() {
  try {
    const raw = localStorage.getItem("wardiya_holidays");
    const arr = raw ? JSON.parse(raw) : HOLIDAYS_DEFAULT;
    if (!Array.isArray(arr)) return new Set(HOLIDAYS_DEFAULT);
    return new Set(arr);
  } catch (e) {
    return new Set(HOLIDAYS_DEFAULT);
  }
}

// =============================
// Helper Functions
// =============================
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return day + "/" + month + "/" + year;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function parseDateInput(str) {
  if (!str) return null;
  const s = str.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const yyyy = Number(iso[1]), mm = Number(iso[2]), dd = Number(iso[3]);
    const d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== (mm - 1) || d.getDate() !== dd) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function weekContainsDate(weekObj, dateObj) {
  const ws = new Date(weekObj.weekStart);
  ws.setHours(0, 0, 0, 0);
  const we = addDays(ws, 7);
  return dateObj >= ws && dateObj < we;
}

// =============================
// Week Rotation Logic
// =============================
function getWeekRotation(weekIndex) {
  const rotations = [
    { first: "Ahmed", second: "Yousef", third: "Omar" },
    { first: "Yousef", second: "Omar", third: "Ahmed" },
    { first: "Omar", second: "Ahmed", third: "Yousef" }
  ];
  return rotations[weekIndex % 3];
}

function generateSchedule() {
  const schedule = [];
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const weekStart = addDays(START_DATE, i * 7);
    const weekEnd = addDays(weekStart, 5);
    const rotation = getWeekRotation(i);
    schedule.push({
      weekNumber: i + 1,
      weekStart: weekStart,
      weekEnd: weekEnd,
      weekStartFormatted: formatDate(weekStart),
      weekEndFormatted: formatDate(weekEnd),
      first: rotation.first,
      second: rotation.second,
      third: rotation.third
    });
  }
  return schedule;
}

// =============================
// Current Week Detection
// =============================
function getEffectiveNow() {
  const now = new Date();
  if (now.getDay() === 5 && now.getHours() >= 18) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  now.setHours(0, 0, 0, 0);
  return now;
}

function getCurrentWeekIndex(schedule) {
  const today = getEffectiveNow();
  for (let i = 0; i < schedule.length; i++) {
    const ws = new Date(schedule[i].weekStart);
    ws.setHours(0, 0, 0, 0);
    const next = addDays(ws, 7);
    if (today >= ws && today < next) return i;
  }
  return -1;
}

function getPersonClass(person) {
  return "person-" + person.toLowerCase();
}

// =============================
// Render Dashboard
// =============================
function renderDashboard(schedule, currentWeekIndex) {
  const container = document.getElementById("dashboardContent");
  if (!container) return;
  container.innerHTML = "";

  const today = new Date();
  const scheduleStart = new Date(schedule[0].weekStart);
  const scheduleEnd = addDays(new Date(schedule[schedule.length - 1].weekStart), 7);

  let lastWeekIndex, currentWeekIndexDisplay, nextWeekIndex;

  if (today < scheduleStart) {
    lastWeekIndex = 0;
    currentWeekIndexDisplay = 1;
    nextWeekIndex = 2;
  } else if (currentWeekIndex === -1 && today >= scheduleEnd) {
    lastWeekIndex = schedule.length - 3;
    currentWeekIndexDisplay = schedule.length - 2;
    nextWeekIndex = schedule.length - 1;
  } else {
    lastWeekIndex = currentWeekIndex - 1;
    currentWeekIndexDisplay = currentWeekIndex;
    nextWeekIndex = currentWeekIndex + 1;
  }

  const cards = [
    { index: lastWeekIndex, label: "Last Week", pos: "last" },
    { index: currentWeekIndexDisplay, label: "Current Week", pos: "current" },
    { index: nextWeekIndex, label: "Next Week", pos: "next" }
  ];

  const holidays = getHolidaySet();

  cards.forEach(function(c) {
    if (c.index < 0 || c.index >= schedule.length) {
      const empty = document.createElement("div");
      empty.className = "week-card empty-card";
      empty.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)">Not Available</div>';
      container.appendChild(empty);
      return;
    }

    const week = schedule[c.index];
    const card = document.createElement("div");

    const isCurrent = (currentWeekIndex !== -1 && c.index === currentWeekIndex);
    let className = "week-card";
    if (isCurrent) className += " current";
    else className += " " + c.pos;

    card.className = className;

    const offDate = new Date(week.weekEnd);
    offDate.setDate(offDate.getDate() + 1);
    const offDateStr = formatDate(offDate);
    const isHoliday = holidays.has(offDateStr);
    const offNote = isHoliday ? '<div class="off-note holiday">🎉 Holiday!</div>' : '';
    const weekNote = isHoliday ? 
      '<div class="week-note">ℹ️ متوقع إجازة رسمية مرحلة للخميس</div>' : 
      '<div class="week-note">📋 Regular work week</div>';

    card.innerHTML = 
      '<div class="week-header"><div class="week-label">' + c.label + '</div></div>' +
      '<div class="date-range">' + week.weekStartFormatted + ' - ' + week.weekEndFormatted + '</div>' +
      '<div class="shift-grid">' +
        '<div class="shift-item">' +
          '<span class="shift-role">First Shift</span>' +
          '<span class="shift-person person-badge ' + getPersonClass(week.first) + '">' + week.first + '</span>' +
        '</div>' +
        '<div class="shift-item">' +
          '<span class="shift-role">Second Shift</span>' +
          '<span class="shift-person person-badge ' + getPersonClass(week.second) + '">' + week.second + '</span>' +
        '</div>' +
        '<div class="shift-item">' +
          '<span class="shift-role">Third Shift</span>' +
          '<span class="shift-person person-badge ' + getPersonClass(week.third) + '">' + week.third + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:12px;text-align:center;">' +
        '<span class="off-badge">🌴 OFF</span>' + offNote +
      '</div>' + weekNote;
    
    container.appendChild(card);
  });

  if (window.innerWidth <= 820) {
    setTimeout(function() {
      const currentCard = container.querySelector('.week-card.current');
      if (currentCard) {
        currentCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 100);
  }
}

// =============================
// Render Schedule (Desktop & Mobile)
// =============================
function renderScheduleTable(schedule, currentWeekIndex) {
  const container = document.getElementById("scheduleContainer");
  if (!container) return;
  
  const holidays = getHolidaySet();
  
  // Check if mobile
  const isMobile = window.innerWidth <= 820;
  
  if (isMobile) {
    // Render card-based layout for mobile
    container.innerHTML = "";
    
    schedule.forEach(function(week, idx) {
      const card = document.createElement("div");
      card.className = "schedule-card";
      card.id = "week-" + idx;
      
      if (idx === currentWeekIndex) {
        card.classList.add("current-week");
      }
      
      const offDate = new Date(week.weekEnd);
      offDate.setDate(offDate.getDate() + 1);
      const offDateStr = formatDate(offDate);
      const isHoliday = holidays.has(offDateStr);
      
      const noteHTML = isHoliday ? 
        '<div class="schedule-note holiday">🎉 متوقع إجازة رسمية مرحلة للخميس</div>' :
        '<div class="schedule-note">Regular OFF Day</div>';
      
      card.innerHTML = 
        '<div class="schedule-card-header">' +
          '<span class="schedule-week-num">' + week.weekNumber + '</span>' +
          '<span class="schedule-dates">' + week.weekStartFormatted + ' - ' + week.weekEndFormatted + '</span>' +
        '</div>' +
        '<div class="schedule-shifts">' +
          '<div class="schedule-shift-item">' +
            '<span class="schedule-shift-label">1st</span>' +
            '<span class="schedule-shift-person person-badge ' + getPersonClass(week.first) + '">' + week.first + '</span>' +
          '</div>' +
          '<div class="schedule-shift-item">' +
            '<span class="schedule-shift-label">2nd</span>' +
            '<span class="schedule-shift-person person-badge ' + getPersonClass(week.second) + '">' + week.second + '</span>' +
          '</div>' +
          '<div class="schedule-shift-item">' +
            '<span class="schedule-shift-label">3rd</span>' +
            '<span class="schedule-shift-person person-badge ' + getPersonClass(week.third) + '">' + week.third + '</span>' +
          '</div>' +
        '</div>' +
        noteHTML;
      
      container.appendChild(card);
    });
  } else {
    // Render table for desktop
    let tableHTML = '<table class="schedule-table"><thead><tr>' +
      '<th>Week #</th><th>Start (Sat)</th><th>End (Thu)</th>' +
      '<th>First</th><th>Second</th><th>Third</th><th>Notes</th>' +
      '</tr></thead><tbody>';
    
    schedule.forEach(function(week, idx) {
      const offDate = new Date(week.weekEnd);
      offDate.setDate(offDate.getDate() + 1);
      const offDateStr = formatDate(offDate);
      const isHoliday = holidays.has(offDateStr);
      const noteText = isHoliday ? '🎉 متوقع إجازة رسمية مرحلة للخميس' : 'Regular OFF';
      
      const rowClass = (idx === currentWeekIndex) ? ' class="current-week"' : '';
      
      tableHTML += '<tr id="week-' + idx + '"' + rowClass + '>' +
        '<td><strong>Week ' + week.weekNumber + '</strong></td>' +
        '<td>' + week.weekStartFormatted + '</td>' +
        '<td>' + week.weekEndFormatted + '</td>' +
        '<td><span class="person-badge ' + getPersonClass(week.first) + '">' + week.first + '</span></td>' +
        '<td><span class="person-badge ' + getPersonClass(week.second) + '">' + week.second + '</span></td>' +
        '<td><span class="person-badge ' + getPersonClass(week.third) + '">' + week.third + '</span></td>' +
        '<td>' + noteText + '</td>' +
        '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
  }
}

// =============================
// Tab Navigation
// =============================
function switchTab(tabName) {
  document.querySelectorAll(".tab-content").forEach(function(t) { t.classList.remove("active"); });
  document.querySelectorAll(".nav-item").forEach(function(b) { b.classList.remove("active"); });
  
  const tabContent = document.getElementById(tabName);
  const navItem = document.querySelector('.nav-item[data-tab="' + tabName + '"]');
  
  if (tabContent) tabContent.classList.add("active");
  if (navItem) navItem.classList.add("active");
  
  if (tabName === "schedule" && window.innerWidth <= 820) {
    setTimeout(function() {
      let currentWeekIndex = getCurrentWeekIndex(fullSchedule);
      if (currentWeekIndex !== -1) {
        const card = document.getElementById("week-" + currentWeekIndex);
        if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
  }
}

// =============================
// Filters
// =============================
let currentFilter = null;
let dateFilter = null;
let fullSchedule = [];

function applyFilters() {
  let filtered = fullSchedule.slice();
  
  if (currentFilter) {
    filtered = filtered.filter(function(week) {
      return week.first === currentFilter || week.second === currentFilter || week.third === currentFilter;
    });
  }
  
  if (dateFilter) {
    filtered = filtered.filter(function(week) { return weekContainsDate(week, dateFilter); });
  }

  renderScheduleTable(filtered, getCurrentWeekIndex(fullSchedule));
}

function clearFilters() {
  currentFilter = null;
  dateFilter = null;
  const dateInput = document.getElementById('dateSearch');
  if (dateInput) {
    dateInput.value = '';
    dateInput.classList.remove('invalid');
  }
  document.querySelectorAll(".filter-btn").forEach(function(b) { b.classList.remove("active"); });
  renderScheduleTable(fullSchedule, getCurrentWeekIndex(fullSchedule));
}

// =============================
// Go to Current Week
// =============================
function goToCurrentWeek() {
  let currentWeekIndex = getCurrentWeekIndex(fullSchedule);
  if (currentWeekIndex === -1) return;
  const element = document.getElementById("week-" + currentWeekIndex);
  if (!element) return;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  
  element.style.animation = "none";
  setTimeout(function() { element.style.animation = "flash 1s ease-out"; }, 10);
}

// =============================
// New Week Banner
// =============================
function showNewWeekBanner(weekNumber) {
  const banner = document.getElementById("newWeekBanner");
  if (!banner) return;
  
  banner.textContent = "🎉 New Week Started! Week #" + weekNumber;
  banner.classList.add("show");
  
  setTimeout(function() { banner.style.opacity = "0"; }, 3800);
  setTimeout(function() { banner.classList.remove("show"); banner.style.opacity = ""; }, 4300);
}

function checkNewWeek(schedule) {
  const currentIndex = getCurrentWeekIndex(schedule);
  if (currentIndex === -1) return;

  try {
    const lastSeen = localStorage.getItem("wardiya_last_seen_week_index_v1");
    if (lastSeen === null) {
      localStorage.setItem("wardiya_last_seen_week_index_v1", String(currentIndex));
      return;
    }
    if (Number(lastSeen) !== currentIndex) {
      localStorage.setItem("wardiya_last_seen_week_index_v1", String(currentIndex));
      showNewWeekBanner(schedule[currentIndex].weekNumber);
    }
  } catch (e) {}
}

// =============================
// Date Search
// =============================
function applyDateSearch() {
  const dateInput = document.getElementById("dateSearch");
  if (!dateInput) return;
  
  const val = dateInput.value.trim();
  if (val === "") {
    dateFilter = null;
    dateInput.classList.remove("invalid");
    applyFilters();
    return;
  }
  
  const parsed = parseDateInput(val);
  if (!parsed) {
    dateInput.classList.add("invalid");
    return;
  }
  
  dateInput.classList.remove("invalid");
  dateFilter = parsed;
  applyFilters();

  const match = fullSchedule.find(function(w) { return weekContainsDate(w, parsed); });
  if (match) {
    const element = document.getElementById("week-" + (match.weekNumber - 1));
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.style.animation = "none";
      setTimeout(function() { element.style.animation = "flash 1s ease-out"; }, 10);
    }
  }
}

// =============================
// Initialization
// =============================
function init() {
  fullSchedule = generateSchedule();
  let currentWeekIndex = getCurrentWeekIndex(fullSchedule);

  renderDashboard(fullSchedule, currentWeekIndex);
  renderScheduleTable(fullSchedule, currentWeekIndex);
  checkNewWeek(fullSchedule);

  document.querySelectorAll(".nav-item").forEach(function(btn) {
    btn.addEventListener("click", function() { switchTab(btn.dataset.tab); });
  });

  const goCurrentBtn = document.getElementById("goCurrentBtn");
  if (goCurrentBtn) {
    goCurrentBtn.addEventListener("click", function() {
      switchTab("schedule");
      setTimeout(goToCurrentWeek, 60);
    });
  }

  const dateInput = document.getElementById("dateSearch");
  const clearDateBtn = document.getElementById("clearDateBtn");

  if (dateInput) {
    let debounceTimer;
    dateInput.addEventListener("input", function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyDateSearch, 200);
    });
    dateInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyDateSearch();
      }
    });
  }

  if (clearDateBtn) {
    clearDateBtn.addEventListener("click", function() {
      if (dateInput) {
        dateInput.value = "";
        dateInput.classList.remove("invalid");
      }
      dateFilter = null;
      applyFilters();
    });
  }

  // Re-render on window resize (mobile/desktop switch)
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      renderScheduleTable(fullSchedule, getCurrentWeekIndex(fullSchedule));
    }, 250);
  });

  let lastIndex = currentWeekIndex;
  setInterval(function() {
    const nowIndex = getCurrentWeekIndex(fullSchedule);
    if (nowIndex !== lastIndex) {
      lastIndex = nowIndex;
      renderDashboard(fullSchedule, nowIndex);
      let filtered = fullSchedule;
      if (currentFilter) {
        filtered = filtered.filter(function(w) {
          return w.first === currentFilter || w.second === currentFilter || w.third === currentFilter;
        });
      }
      renderScheduleTable(filtered, nowIndex);
      checkNewWeek(fullSchedule);
    }
  }, 60000);
}

window.addEventListener("DOMContentLoaded", init);
