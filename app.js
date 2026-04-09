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

// 🔥 Rotation Logic (قديم + جديد)
function getWeekRotation(weekIndex){
  const weekStart = addDays(START_DATE, weekIndex * 7);
  const weekStartStr = formatDate(weekStart);

  // Special override
  if(SPECIAL_WEEKS[weekStartStr]){
    return SPECIAL_WEEKS[weekStartStr];
  }

  const newRotationDateObj = parseDDMMYYYY(NEW_ROTATION_DATE);

  // 🆕 النظام الجديد بعد 11/04
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

  // النظام القديم
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

// 🔥 Example usage في أي render
function renderNote(offDate){
  const offStr = formatDate(offDate);
  const holidayMap = getHolidayMap();

  if(holidayMap.has(offStr)){
    return `🎉 ${holidayMap.get(offStr)}`;
  }
  return `Regular OFF`;
}

// INIT
let fullSchedule = [];

function init(){
  fullSchedule = generateSchedule();
  console.log(fullSchedule);

  // مثال طباعة
  fullSchedule.forEach(week=>{
    const note = renderNote(new Date(week.weekEnd));
    console.log(
      `Week ${week.weekNumber}:`,
      week.first, week.second, week.third,
      "|", note
    );
  });
}

window.addEventListener("DOMContentLoaded", init);
