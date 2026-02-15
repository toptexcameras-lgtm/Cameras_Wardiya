// Configuration
var START_DATE = new Date(2026, 0, 3);
var TOTAL_WEEKS = 52;

var HOLIDAYS = [
  "08/01/2026", "29/01/2026", "19/03/2026", "26/03/2026",
  "16/04/2026", "30/04/2026", "28/05/2026", "18/06/2026",
  "02/07/2026", "23/07/2026", "27/08/2026", "08/10/2026"
];

var fullSchedule = [];
var currentFilter = null;
var dateFilter = null;

// Helper Functions
function formatDate(date) {
  var day = ("0" + date.getDate()).slice(-2);
  var month = ("0" + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  return day + "/" + month + "/" + year;
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getWeekRotation(weekIndex) {
  var rotations = [
    { first: "Ahmed", second: "Yousef", third: "Omar" },
    { first: "Yousef", second: "Omar", third: "Ahmed" },
    { first: "Omar", second: "Ahmed", third: "Yousef" }
  ];
  return rotations[weekIndex % 3];
}

function generateSchedule() {
  var schedule = [];
  for (var i = 0; i < TOTAL_WEEKS; i++) {
    var weekStart = addDays(START_DATE, i * 7);
    var weekEnd = addDays(weekStart, 5);
    var rotation = getWeekRotation(i);
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

function getCurrentWeekIndex(schedule) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (var i = 0; i < schedule.length; i++) {
    var ws = new Date(schedule[i].weekStart);
    ws.setHours(0, 0, 0, 0);
    var next = addDays(ws, 7);
    if (today >= ws && today < next) return i;
  }
  return -1;
}

function getPersonClass(person) {
  return "person-" + person.toLowerCase();
}

function isHoliday(dateStr) {
  for (var i = 0; i < HOLIDAYS.length; i++) {
    if (HOLIDAYS[i] === dateStr) return true;
  }
  return false;
}

// Render Dashboard
function renderDashboard(schedule, currentWeekIndex) {
  var container = document.getElementById("dashboardContent");
  if (!container) return;
  container.innerHTML = "";

  var today = new Date();
  var scheduleStart = new Date(schedule[0].weekStart);
  var scheduleEnd = addDays(new Date(schedule[schedule.length - 1].weekStart), 7);

  var lastWeekIndex, currentWeekIndexDisplay, nextWeekIndex;

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

  var cards = [
    { index: lastWeekIndex, label: "Last Week", pos: "last" },
    { index: currentWeekIndexDisplay, label: "Current Week", pos: "current" },
    { index: nextWeekIndex, label: "Next Week", pos: "next" }
  ];

  for (var c = 0; c < cards.length; c++) {
    var card = cards[c];
    
    if (card.index < 0 || card.index >= schedule.length) {
      var empty = document.createElement("div");
      empty.className = "week-card empty-card";
      empty.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)">Not Available</div>';
      container.appendChild(empty);
      continue;
    }

    var week = schedule[card.index];
    var cardEl = document.createElement("div");

    var isCurrent = (currentWeekIndex !== -1 && card.index === currentWeekIndex);
    var className = "week-card";
    if (isCurrent) className += " current";
    else className += " " + card.pos;

    cardEl.className = className;

    var offDate = new Date(week.weekEnd);
    offDate.setDate(offDate.getDate() + 1);
    var offDateStr = formatDate(offDate);
    var hasHoliday = isHoliday(offDateStr);
    
    var offNote = hasHoliday ? '<div class="off-note holiday">🎉 Holiday!</div>' : '';
    var weekNote = hasHoliday ? 
      '<div class="week-note">ℹ️ متوقع إجازة رسمية مرحلة للخميس</div>' : 
      '<div class="week-note">📋 Regular work week</div>';

    cardEl.innerHTML = 
      '<div class="week-header"><div class="week-label">' + card.label + '</div></div>' +
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
    
    container.appendChild(cardEl);
  }
}

// Render Schedule
function renderScheduleTable(schedule, currentWeekIndex) {
  var container = document.getElementById("scheduleContainer");
  if (!container) return;
  
  var isMobile = window.innerWidth <= 820;
  
  if (isMobile) {
    // Mobile: Card layout
    container.innerHTML = "";
    
    for (var idx = 0; idx < schedule.length; idx++) {
      var week = schedule[idx];
      var card = document.createElement("div");
      card.className = "schedule-card";
      card.id = "week-" + idx;
      
      if (idx === currentWeekIndex) {
        card.className += " current-week";
      }
      
      var offDate = new Date(week.weekEnd);
      offDate.setDate(offDate.getDate() + 1);
      var offDateStr = formatDate(offDate);
      var hasHoliday = isHoliday(offDateStr);
      
      var noteHTML = hasHoliday ? 
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
            '<span class="person-badge ' + getPersonClass(week.first) + '">' + week.first + '</span>' +
          '</div>' +
          '<div class="schedule-shift-item">' +
            '<span class="schedule-shift-label">2nd</span>' +
            '<span class="person-badge ' + getPersonClass(week.second) + '">' + week.second + '</span>' +
          '</div>' +
          '<div class="schedule-shift-item">' +
            '<span class="schedule-shift-label">3rd</span>' +
            '<span class="person-badge ' + getPersonClass(week.third) + '">' + week.third + '</span>' +
          '</div>' +
        '</div>' +
        noteHTML;
      
      container.appendChild(card);
    }
  } else {
    // Desktop: Table layout
    var html = '<table class="schedule-table"><thead><tr>' +
      '<th>Week #</th><th>Start (Sat)</th><th>End (Thu)</th>' +
      '<th>First</th><th>Second</th><th>Third</th><th>Notes</th>' +
      '</tr></thead><tbody>';
    
    for (var idx = 0; idx < schedule.length; idx++) {
      var week = schedule[idx];
      var offDate = new Date(week.weekEnd);
      offDate.setDate(offDate.getDate() + 1);
      var offDateStr = formatDate(offDate);
      var hasHoliday = isHoliday(offDateStr);
      
      var noteText = hasHoliday ? 
        '🎉 متوقع إجازة رسمية مرحلة للخميس' : 
        'Regular OFF';
      
      var rowClass = (idx === currentWeekIndex) ? ' class="current-week"' : '';
      
      html += '<tr id="week-' + idx + '"' + rowClass + '>' +
        '<td><strong>Week ' + week.weekNumber + '</strong></td>' +
        '<td>' + week.weekStartFormatted + '</td>' +
        '<td>' + week.weekEndFormatted + '</td>' +
        '<td><span class="person-badge ' + getPersonClass(week.first) + '">' + week.first + '</span></td>' +
        '<td><span class="person-badge ' + getPersonClass(week.second) + '">' + week.second + '</span></td>' +
        '<td><span class="person-badge ' + getPersonClass(week.third) + '">' + week.third + '</span></td>' +
        '<td>' + noteText + '</td>' +
        '</tr>';
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
  }
}

// Tab Navigation
function switchTab(tabName) {
  var tabs = document.querySelectorAll(".tab-content");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
  }
  
  var navItems = document.querySelectorAll(".nav-item");
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove("active");
  }
  
  var tabContent = document.getElementById(tabName);
  var navItem = document.querySelector('.nav-item[data-tab="' + tabName + '"]');
  
  if (tabContent) tabContent.classList.add("active");
  if (navItem) navItem.classList.add("active");
  
  if (tabName === "schedule" && window.innerWidth <= 820) {
    setTimeout(function() {
      var currentWeekIndex = getCurrentWeekIndex(fullSchedule);
      if (currentWeekIndex !== -1) {
        var card = document.getElementById("week-" + currentWeekIndex);
        if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
  }
}

// Go to Current Week
function goToCurrentWeek() {
  var currentWeekIndex = getCurrentWeekIndex(fullSchedule);
  if (currentWeekIndex === -1) return;
  var element = document.getElementById("week-" + currentWeekIndex);
  if (!element) return;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.style.animation = "none";
  setTimeout(function() { element.style.animation = "flash 1s ease-out"; }, 10);
}

// New Week Banner
function showNewWeekBanner(weekNumber) {
  var banner = document.getElementById("newWeekBanner");
  if (!banner) return;
  
  banner.textContent = "🎉 New Week Started! Week #" + weekNumber;
  banner.classList.add("show");
  
  setTimeout(function() { banner.style.opacity = "0"; }, 3800);
  setTimeout(function() { 
    banner.classList.remove("show"); 
    banner.style.opacity = ""; 
  }, 4300);
}

function checkNewWeek(schedule) {
  var currentIndex = getCurrentWeekIndex(schedule);
  if (currentIndex === -1) return;

  try {
    var lastSeen = localStorage.getItem("wardiya_last_seen_week");
    if (lastSeen === null) {
      localStorage.setItem("wardiya_last_seen_week", String(currentIndex));
      return;
    }
    if (Number(lastSeen) !== currentIndex) {
      localStorage.setItem("wardiya_last_seen_week", String(currentIndex));
      showNewWeekBanner(schedule[currentIndex].weekNumber);
    }
  } catch (e) {}
}

// Date Search
function parseDateInput(str) {
  if (!str) return null;
  var iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    var d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function weekContainsDate(weekObj, dateObj) {
  var ws = new Date(weekObj.weekStart);
  ws.setHours(0, 0, 0, 0);
  var we = addDays(ws, 7);
  return dateObj >= ws && dateObj < we;
}

function applyDateSearch() {
  var dateInput = document.getElementById("dateSearch");
  if (!dateInput) return;
  
  var val = dateInput.value.trim();
  if (val === "") {
    dateFilter = null;
    dateInput.classList.remove("invalid");
    renderScheduleTable(fullSchedule, getCurrentWeekIndex(fullSchedule));
    return;
  }
  
  var parsed = parseDateInput(val);
  if (!parsed) {
    dateInput.classList.add("invalid");
    return;
  }
  
  dateInput.classList.remove("invalid");
  dateFilter = parsed;
  
  var filtered = [];
  for (var i = 0; i < fullSchedule.length; i++) {
    if (weekContainsDate(fullSchedule[i], parsed)) {
      filtered.push(fullSchedule[i]);
    }
  }
  
  renderScheduleTable(filtered.length > 0 ? filtered : fullSchedule, getCurrentWeekIndex(fullSchedule));
  
  if (filtered.length > 0) {
    var match = filtered[0];
    var element = document.getElementById("week-" + (match.weekNumber - 1));
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.style.animation = "none";
      setTimeout(function() { element.style.animation = "flash 1s ease-out"; }, 10);
    }
  }
}

// Initialization
function init() {
  fullSchedule = generateSchedule();
  var currentWeekIndex = getCurrentWeekIndex(fullSchedule);

  renderDashboard(fullSchedule, currentWeekIndex);
  renderScheduleTable(fullSchedule, currentWeekIndex);
  checkNewWeek(fullSchedule);

  var navItems = document.querySelectorAll(".nav-item");
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener("click", function() {
      switchTab(this.dataset.tab);
    });
  }

  var goCurrentBtn = document.getElementById("goCurrentBtn");
  if (goCurrentBtn) {
    goCurrentBtn.addEventListener("click", function() {
      switchTab("schedule");
      setTimeout(goToCurrentWeek, 60);
    });
  }

  var dateInput = document.getElementById("dateSearch");
  var clearDateBtn = document.getElementById("clearDateBtn");

  if (dateInput) {
    var debounceTimer;
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
      renderScheduleTable(fullSchedule, getCurrentWeekIndex(fullSchedule));
    });
  }

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      renderScheduleTable(fullSchedule, getCurrentWeekIndex(fullSchedule));
    }, 250);
  });

  var lastIndex = currentWeekIndex;
  setInterval(function() {
    var nowIndex = getCurrentWeekIndex(fullSchedule);
    if (nowIndex !== lastIndex) {
      lastIndex = nowIndex;
      renderDashboard(fullSchedule, nowIndex);
      renderScheduleTable(fullSchedule, nowIndex);
      checkNewWeek(fullSchedule);
    }
  }, 60000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
