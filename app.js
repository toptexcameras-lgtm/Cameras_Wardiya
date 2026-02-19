// Core Data & Configuration
const START_DATE = new Date(2026, 0, 3); // Saturday, Jan 03, 2026
const TOTAL_WEEKS = 52;

// Helper Functions
function formatDate(date){
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function addDays(date, days){
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Official Holidays (Expected OFF)
const HOLIDAYS_DEFAULT = [
  "08/01/2026",
  "29/01/2026",
  "19/03/2026",
  "26/03/2026",
  "16/04/2026",
  "30/04/2026",
  "28/05/2026",
  "18/06/2026",
  "02/07/2026",
  "23/07/2026",
  "27/08/2026",
  "08/10/2026"
];

function getHolidaySet(){
  try{
    const raw = localStorage.getItem("wardiya_holidays");
    const arr = raw ? JSON.parse(raw) : HOLIDAYS_DEFAULT;
    if(!Array.isArray(arr)) return new Set(HOLIDAYS_DEFAULT);
    return new Set(arr);
  }catch(_){
    return new Set(HOLIDAYS_DEFAULT);
  }
}

// Date Search
let dateFilter = null;

function parseDateInput(str){
  if(!str) return null;
  const s = str.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(iso){
    const yyyy = Number(iso[1]), mm = Number(iso[2]), dd = Number(iso[3]);
    const d = new Date(yyyy, mm-1, dd);
    if(d.getFullYear() !== yyyy || d.getMonth() !== (mm-1) || d.getDate() !== dd) return null;
    d.setHours(0,0,0,0);
    return d;
  }
  return null;
}

function weekContainsDate(weekObj, dateObj){
  const ws = new Date(weekObj.weekStart); 
  ws.setHours(0,0,0,0);
  const we = addDays(ws, 7);
  return dateObj >= ws && dateObj < we;
}

function getWeekRotation(weekIndex){
  const rotationIndex = weekIndex % 3;
  const rotations = [
    { first: "Ahmed",  second: "Yousef", third: "Omar"  },
    { first: "Yousef", second: "Omar",   third: "Ahmed" },
    { first: "Omar",   second: "Ahmed",  third: "Yousef"}
  ];
  return rotations[rotationIndex];
}

function generateSchedule(){
  const schedule = [];
  for(let i=0;i<TOTAL_WEEKS;i++){
    const weekStart = addDays(START_DATE, i*7);
    const weekEnd   = addDays(weekStart, 5); // Thu (week ends Thursday)
    const rotation  = getWeekRotation(i);
    schedule.push({
      weekNumber: i+1,
      weekStart,
      weekEnd,
      weekStartFormatted: formatDate(weekStart),
      weekEndFormatted: formatDate(weekEnd),
      first: rotation.first,
      second: rotation.second,
      third: rotation.third,
    });
  }
  return schedule;
}

function getEffectiveNow(){
  const now = new Date();
  if(now.getDay() === 5 && now.getHours() >= 18){
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(0,0,0,0);
    return d;
  }
  now.setHours(0,0,0,0);
  return now;
}

function getCurrentWeekIndex(schedule){
  const today = new Date();
  today.setHours(0,0,0,0);
  for(let i=0;i<schedule.length;i++){
    const ws = new Date(schedule[i].weekStart);
    ws.setHours(0,0,0,0);
    const next = addDays(ws, 7);
    if(today >= ws && today < next) return i;
  }
  return -1;
}

function getPersonClass(person){
  return `person-${person.toLowerCase()}`;
}

// Render Dashboard
function renderDashboard(schedule, currentWeekIndex){
  const container = document.getElementById("dashboardContent");
  container.innerHTML = "";

  const today = new Date();
  const scheduleStart = new Date(schedule[0].weekStart);
  const scheduleEnd = addDays(new Date(schedule[schedule.length-1].weekStart), 7);

  let lastWeekIndex, currentWeekIndexDisplay, nextWeekIndex;

  if(today < scheduleStart){
    lastWeekIndex = 0;
    currentWeekIndexDisplay = 1;
    nextWeekIndex = 2;
  }else if(currentWeekIndex === -1 && today >= scheduleEnd){
    lastWeekIndex = schedule.length - 3;
    currentWeekIndexDisplay = schedule.length - 2;
    nextWeekIndex = schedule.length - 1;
  }else{
    lastWeekIndex = currentWeekIndex - 1;
    currentWeekIndexDisplay = currentWeekIndex;
    nextWeekIndex = currentWeekIndex + 1;
  }

  const cards = [
    { index: lastWeekIndex,  label: "Last Week",   pos: "last" },
    { index: currentWeekIndexDisplay, label: "Current Week", pos: "current" },
    { index: nextWeekIndex,  label: "Next Week",   pos: "next" }
  ];

  cards.forEach((c)=>{
    if(c.index < 0 || c.index >= schedule.length){
      const empty = document.createElement("div");
      empty.className = "week-card empty-card";
      empty.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-secondary)">Not Available</div>`;
      container.appendChild(empty);
      return;
    }

    const week = schedule[c.index];
    const card = document.createElement("div");

    const isCurrent = (currentWeekIndex !== -1 && c.index === currentWeekIndex);
    let className = "week-card";
    if(isCurrent) className += " current";
    else className += " " + c.pos;

    card.className = className;
    card.setAttribute('data-card-index', c.index);
    
    card.innerHTML = `
      <div class="week-header">
        <div class="week-label">${c.label}</div>
      </div>
      <div class="date-range">${week.weekStartFormatted} - ${week.weekEndFormatted}</div>

      <div class="shift-grid">
        <div class="shift-item">
          <span class="shift-role">First Shift</span>
          <span class="shift-person person-badge ${getPersonClass(week.first)}">${week.first}</span>
        </div>
        <div class="shift-item">
          <span class="shift-role">Second Shift</span>
          <span class="shift-person person-badge ${getPersonClass(week.second)}">${week.second}</span>
        </div>
        <div class="shift-item">
          <span class="shift-role">Third Shift</span>
          <span class="shift-person person-badge ${getPersonClass(week.third)}">${week.third}</span>
        </div>
      </div>

      <div style="margin-top:12px;text-align:center;">
        <span class="off-badge"></span>
        ${(() => {
          const offDate = new Date(week.weekEnd);
          const offStr = formatDate(offDate);
          const holidaySet = getHolidaySet();
          if(holidaySet.has(offStr)){
            return `<div class="off-note holiday">🎉 Holiday!</div>`;
          }
          return ``;
        })()}
      </div>
      ${(() => {
        const offDate = new Date(week.weekEnd);
        const offStr = formatDate(offDate);
        const holidaySet = getHolidaySet();
        if(holidaySet.has(offStr)){
          return `<div class="week-note">ℹ️ متوقع إجازة رسمية مرحلة للخميس</div>`;
        }
        return ``;
      })()}
    `;
    container.appendChild(card);
  });

  // Snap to center card on mobile
  if(isMobileLike()){
    setTimeout(() => {
      const currentCard = container.querySelector('.week-card.current');
      if(currentCard){
        currentCard.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
      }
    }, 100);
  }
}

// Render Schedule Table (Desktop & Mobile)
function renderScheduleTable(scheduleToRender, currentWeekIndex){
  const container = document.getElementById("scheduleContainer");
  if(!container) return;
  
  const isMobile = isMobileLike();
  
  if(isMobile){
    // Mobile: Card layout
    container.innerHTML = "";
    
    scheduleToRender.forEach((week, idx)=>{
      const card = document.createElement("div");
      card.className = "schedule-card";
      
      const actualIndex = fullSchedule.findIndex(w => w.weekNumber === week.weekNumber);
      card.id = `week-${actualIndex}`;
      
      const isCurrentWeek = currentWeekIndex !== -1 && week.weekNumber === (currentWeekIndex + 1);
      if(isCurrentWeek){
        card.classList.add("current-week");
      }
      
      card.innerHTML = `
        <div class="schedule-card-header">
          <span class="schedule-week-num">${week.weekNumber}</span>
          <span class="schedule-dates">${week.weekStartFormatted} - ${week.weekEndFormatted}</span>
        </div>
        <div class="schedule-shifts">
          <div class="schedule-shift-item">
            <span class="schedule-shift-label">1st</span>
            <span class="person-badge ${getPersonClass(week.first)}">${week.first}</span>
          </div>
          <div class="schedule-shift-item">
            <span class="schedule-shift-label">2nd</span>
            <span class="person-badge ${getPersonClass(week.second)}">${week.second}</span>
          </div>
          <div class="schedule-shift-item">
            <span class="schedule-shift-label">3rd</span>
            <span class="person-badge ${getPersonClass(week.third)}">${week.third}</span>
          </div>
        </div>
        ${(()=>{
          const offStr = formatDate(new Date(week.weekEnd)); 
          const holidaySet = getHolidaySet();
          if(holidaySet.has(offStr)){
            return `<div class="schedule-note holiday">🎉 متوقع إجازة رسمية مرحلة للخميس</div>`;
          }
          return `<div class="schedule-note">Regular OFF Day</div>`;
        })()}
      `;
      
      container.appendChild(card);
    });
  }else{
    // Desktop: Table layout
    let html = '<table class="schedule-table"><thead><tr>' +
      '<th>Week #</th><th>Start (Sat)</th><th>End (Thu)</th>' +
      '<th>First</th><th>Second</th><th>Third</th><th>Notes</th>' +
      '</tr></thead><tbody>';
    
    scheduleToRender.forEach((week)=>{
      const isCurrentWeek = currentWeekIndex !== -1 && week.weekNumber === (currentWeekIndex + 1);
      const rowClass = isCurrentWeek ? ' class="current-week"' : '';
      const actualIndex = fullSchedule.findIndex(w => w.weekNumber === week.weekNumber);
      
      html += `<tr id="week-${actualIndex}"${rowClass}>
        <td><strong>Week ${week.weekNumber}</strong></td>
        <td>${week.weekStartFormatted}</td>
        <td>${week.weekEndFormatted}</td>
        <td><span class="person-badge ${getPersonClass(week.first)}">${week.first}</span></td>
        <td><span class="person-badge ${getPersonClass(week.second)}">${week.second}</span></td>
        <td><span class="person-badge ${getPersonClass(week.third)}">${week.third}</span></td>
        <td>${(()=>{
          const offStr = formatDate(new Date(week.weekEnd)); 
          const holidaySet = getHolidaySet();
          if(holidaySet.has(offStr)){
            return `🎉 متوقع إجازة رسمية مرحلة للخميس`;
          }
          return `Regular OFF`;
        })()}</td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
  }
}

// Tabs
function switchTab(tabName){
  document.querySelectorAll(".tab-content").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  document.querySelector(`.nav-item[data-tab="${tabName}"]`).classList.add("active");
  
  // NOTE: No auto-scroll on open schedule. Highlight is enough.
}

// Filters
let currentFilter = null;
let fullSchedule = [];

function applyFilters(){
  let filtered = [...fullSchedule];
  if(currentFilter){
    filtered = filtered.filter(week =>
      week.first === currentFilter || week.second === currentFilter || week.third === currentFilter
    );
  }
  if(dateFilter){
    filtered = filtered.filter(week => weekContainsDate(week, dateFilter));
  }
  
  let currentWeekIndex = getCurrentWeekIndex(fullSchedule);
  renderScheduleTable(filtered, currentWeekIndex);
}

function clearFilters(){
  currentFilter = null;
  dateFilter = null;
  const dateInput = document.getElementById('dateSearch');
  if(dateInput){ 
    dateInput.value = ''; 
    dateInput.classList.remove('invalid'); 
  }

  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  let currentWeekIndex = getCurrentWeekIndex(fullSchedule);
  renderScheduleTable(fullSchedule, currentWeekIndex);
}

// Go to current week
function goToCurrentWeek(){
  let currentWeekIndex = getCurrentWeekIndex(fullSchedule);
  if(currentWeekIndex === -1) return;
  const element = document.getElementById(`week-${currentWeekIndex}`);
  if(!element) return;

  element.scrollIntoView({behavior:"smooth", block:"center"});
  element.style.animation = "none";
  setTimeout(()=>{ element.style.animation = "flash 1s ease-out"; }, 10);
}

// New Week Banner
const WEEK_TRACK_KEY = "wardiya_last_seen_week_index_v1";

function showNewWeekBanner(weekNumber){
  const banner = document.getElementById("newWeekBanner");
  if(!banner) return;
  banner.textContent = `🎉 New Week Started! Week #${weekNumber}`;
  banner.classList.add("show");
  clearTimeout(showNewWeekBanner._t1);
  clearTimeout(showNewWeekBanner._t2);
  showNewWeekBanner._t1 = setTimeout(()=>{ banner.style.opacity = "0"; }, 3800);
  showNewWeekBanner._t2 = setTimeout(()=>{
    banner.classList.remove("show");
    banner.style.opacity = "";
  }, 4300);
}

function checkNewWeek(fullSchedule){
  const currentIndex = getCurrentWeekIndex(fullSchedule);
  if(currentIndex === -1) return;

  try{
    const lastSeen = localStorage.getItem(WEEK_TRACK_KEY);
    if(lastSeen === null){
      localStorage.setItem(WEEK_TRACK_KEY, String(currentIndex));
      return;
    }

    if(Number(lastSeen) !== currentIndex){
      localStorage.setItem(WEEK_TRACK_KEY, String(currentIndex));
      showNewWeekBanner(fullSchedule[currentIndex].weekNumber);
    }
  }catch(_){}
}

// Date Search
function applyDate(){
  const dateInput = document.getElementById("dateSearch");
  if(!dateInput) return;
  
  const val = dateInput.value.trim();
  if(val === ""){
    dateFilter = null;
    dateInput.classList.remove("invalid");
    applyFilters();
    return;
  }
  const parsed = parseDateInput(val);
  if(!parsed){
    dateInput.classList.add("invalid");
    return;
  }
  dateInput.classList.remove("invalid");
  dateFilter = parsed;
  applyFilters();
  
  // Scroll to matching week
  const match = fullSchedule.find(w => weekContainsDate(w, parsed));
  if(match){
    const row = document.getElementById(`week-${match.weekNumber - 1}`);
    if(row){
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.style.animation = "none";
      setTimeout(()=>{ row.style.animation = "flash 1s ease-out"; }, 10);
    }
  }
}

// Init
function init(){
  fullSchedule = generateSchedule();
  let currentWeekIndex = getCurrentWeekIndex(fullSchedule);

  renderDashboard(fullSchedule, currentWeekIndex);
  renderScheduleTable(fullSchedule, currentWeekIndex);
  checkNewWeek(fullSchedule);

  // Wire tab buttons
  document.querySelectorAll(".nav-item").forEach(btn=>{
    btn.addEventListener("click", ()=> switchTab(btn.dataset.tab));
  });

  // Go current button
  const goBtn = document.getElementById("goCurrentBtn");
  if(goBtn){
    goBtn.addEventListener("click", ()=>{
      switchTab("schedule");
      setTimeout(goToCurrentWeek, 60);
    });
  }

  // Date search
  const dateInput = document.getElementById("dateSearch");
  const clearDateBtn = document.getElementById("clearDateBtn");

  if(dateInput){
    let _dt;
    dateInput.addEventListener("input", ()=>{
      clearTimeout(_dt);
      _dt = setTimeout(applyDate, 180);
    });
    dateInput.addEventListener("keydown", (e)=>{
      if(e.key === "Enter"){
        e.preventDefault();
        applyDate();
      }
    });
  }
  
  if(clearDateBtn){
    clearDateBtn.addEventListener("click", ()=>{
      if(dateInput){
        dateInput.value = "";
        dateInput.classList.remove("invalid");
      }
      dateFilter = null;
      applyFilters();
    });
  }

  // Resize handler
  let resizeTimer;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(()=>{
      renderScheduleTable(fullSchedule, getCurrentWeekIndex(fullSchedule));
    }, 250);
  });

  // Auto-refresh every minute
  let lastIndex = currentWeekIndex;
  setInterval(()=>{
    const nowIndex = getCurrentWeekIndex(fullSchedule);
    if(nowIndex !== lastIndex){
      lastIndex = nowIndex;
      renderDashboard(fullSchedule, nowIndex);
      renderScheduleTable(currentFilter ? fullSchedule.filter(w=> w.first===currentFilter || w.second===currentFilter || w.third===currentFilter) : fullSchedule, nowIndex);
      checkNewWeek(fullSchedule);
    }
  }, 60000);
}

window.addEventListener("DOMContentLoaded", init);
// Mobile = narrow viewport only.
// "View as Desktop" on phone has wide viewport → treated as desktop (shows table).
const isMobileLike = () => window.matchMedia("(max-width: 820px)").matches;
