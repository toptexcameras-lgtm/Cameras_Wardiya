// Core Data & Configuration
const START_DATE = new Date(2026, 0, 3); // Saturday, Jan 03, 2026
const TOTAL_WEEKS = 52;

// 🆕 Special Weeks Overrides
const SPECIAL_WEEKS = {
  "28/03/2026": { first: "Omar", second: "Yousef", third: "Ahmed" },
  "04/04/2026": { first: "Ahmed", second: "Yousef", third: "Omar" }
};

// 🆕 New Rotation Start Date
const NEW_ROTATION_DATE = "11/04/2026";

// 🆕 Holidays with Names (Egypt)
const HOLIDAYS_DEFAULT = {
  "08/01/2026": "إجازة رسمية",
  "29/01/2026": "إجازة رسمية",
  "19/03/2026": "إجازة رسمية",
  "26/03/2026": "إجازة رسمية",
  "16/04/2026": "شم النسيم",
  "30/04/2026": "عيد العمال",
  "28/05/2026": "وقفة عرفات",
  "18/06/2026": "عيد الأضحى",
  "02/07/2026": "رأس السنة الهجرية",
  "23/07/2026": "عيد الثورة",
  "27/08/2026": "المولد النبوي",
  "08/10/2026": "عيد القوات المسلحة"
};

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

function parseDDMMYYYY(str){
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, m - 1, d);
}

// 🆕 Holiday Map بدل Set
function getHolidayMap(){
  try{
    const raw = localStorage.getItem("wardiya_holidays");
    const obj = raw ? JSON.parse(raw) : HOLIDAYS_DEFAULT;
    if(typeof obj !== "object") return new Map(Object.entries(HOLIDAYS_DEFAULT));
    return new Map(Object.entries(obj));
  }catch(_){
    return new Map(Object.entries(HOLIDAYS_DEFAULT));
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

// 🔥 Rotation Logic
function getWeekRotation(weekIndex){
  const weekStart = addDays(START_DATE, weekIndex * 7);
  const weekStartStr = formatDate(weekStart);

  // Special override
  if(SPECIAL_WEEKS[weekStartStr]){
    return SPECIAL_WEEKS[weekStartStr];
  }

  const newRotationDateObj = parseDDMMYYYY(NEW_ROTATION_DATE);

  // New system
  if(weekStart >= newRotationDateObj){
    const diffDays = Math.floor((weekStart - newRotationDateObj) / (1000 * 60 * 60 * 24));
    const newIndex = Math.floor(diffDays / 7) % 3;

    const newRotations = [
      { first: "Yousef", second: "Omar",  third: "Ahmed" },
      { first: "Omar",   second: "Ahmed", third: "Yousef" },
      { first: "Ahmed",  second: "Yousef", third: "Omar" }
    ];

    return newRotations[newIndex];
  }

  // Old system
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
    const weekEnd   = addDays(weekStart, 5);
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

    const offDate = new Date(week.weekEnd);
    const offStr = formatDate(offDate);
    const holidayMap = getHolidayMap();

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
        ${
          holidayMap.has(offStr)
            ? `<div class="off-note holiday">🎉 ${holidayMap.get(offStr)}</div>
               <div class="week-note">🎉 ${holidayMap.get(offStr)} 🎉</div>`
            : ``
        }
      </div>
    `;
    container.appendChild(card);
  });

  if(isMobileLike()){
    setTimeout(() => {
      const currentCard = container.querySelector('.week-card.current');
      if(currentCard){
        currentCard.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
      }
    }, 100);
  }
}

// Render Schedule Table
function renderScheduleTable(scheduleToRender, currentWeekIndex){
  const container = document.getElementById("scheduleContainer");
  if(!container) return;

  let html = '<table class="schedule-table"><thead><tr>' +
    '<th>Week #</th><th>Start</th><th>End</th>' +
    '<th>First</th><th>Second</th><th>Third</th><th>Notes</th>' +
    '</tr></thead><tbody>';

  scheduleToRender.forEach((week)=>{
    const offStr = formatDate(new Date(week.weekEnd));
    const holidayMap = getHolidayMap();

    html += `<tr>
      <td><strong>Week ${week.weekNumber}</strong></td>
      <td>${week.weekStartFormatted}</td>
      <td>${week.weekEndFormatted}</td>
      <td>${week.first}</td>
      <td>${week.second}</td>
      <td>${week.third}</td>
      <td>${holidayMap.has(offStr) ? "🎉 " + holidayMap.get(offStr) : "Regular OFF"}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Init
let fullSchedule = [];

function init(){
  fullSchedule = generateSchedule();
  let currentWeekIndex = getCurrentWeekIndex(fullSchedule);

  renderDashboard(fullSchedule, currentWeekIndex);
  renderScheduleTable(fullSchedule, currentWeekIndex);
}

window.addEventListener("DOMContentLoaded", init);

// Mobile check
const isMobileLike = () => window.matchMedia("(max-width: 820px)").matches;
