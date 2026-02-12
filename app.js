// Core Data & Configuration
    const START_DATE = new Date(2026, 0, 3); // Saturday, Jan 03, 2026 (table anchored from Jan 01, 2026)
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
    


// =============================
// Official Holidays (Expected OFF)
// =============================
// You can customize by editing HOLIDAYS or by setting localStorage key "wardiya_holidays"
// Format: ["dd/mm/yyyy", ...]
const HOLIDAYS_DEFAULT = [
  // مثال: "25/04/2026"
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


// =============================
// Date Search (dd/mm/yyyy)
// Filters weeks where: date >= weekStart AND date < weekStart + 7 days
// =============================
let dateFilter = null;

function parseDDMMYYYY(str){
  if(!str) return null;
  const m = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m) return null;
  const dd = Number(m[1]), mm = Number(m[2]), yyyy = Number(m[3]);
  if(mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm-1, dd);
  if(d.getFullYear() !== yyyy || d.getMonth() !== (mm-1) || d.getDate() !== dd) return null;
  d.setHours(0,0,0,0);
  return d;
}


function parseDateInput(str){
  if(!str) return null;
  const s = str.trim();
  // yyyy-mm-dd from <input type="date">
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(iso){
    const yyyy = Number(iso[1]), mm = Number(iso[2]), dd = Number(iso[3]);
    const d = new Date(yyyy, mm-1, dd);
    if(d.getFullYear() !== yyyy || d.getMonth() !== (mm-1) || d.getDate() !== dd) return null;
    d.setHours(0,0,0,0);
    return d;
  }
  // fallback dd/mm/yyyy (older browsers)
  return parseDDMMYYYY(s);
}

function weekContainsDate(weekObj, dateObj){
  const ws = new Date(weekObj.weekStart); ws.setHours(0,0,0,0);
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
          friday: "OFF"
        });
      }
      return schedule;
    }

    // Compute current week index:
    // Find the week where today >= weekStart and today < weekStart + 7 days.
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

    // Render Functions
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
            <span class="off-badge"><span aria-hidden="true">⛱</span><span class="sr-only">Off</span></span>
            ${(() => {
              const offDate = addDays(week.weekStart, 6); // OFF day (day after Thu)
              const offStr = formatDate(offDate);
              const holidaySet = getHolidaySet();
              if(holidaySet.has(offStr)){
                return `<div class="off-note holiday">متوقع إجازة رسمية</div>`;
              }
              return ``;
            })()}
          </div>
        `;
        container.appendChild(card);
      });

      // Initialize swipe functionality after cards are rendered
      if(window.innerWidth <= 820){
        initSwipe(container, currentWeekIndex);
      }
    }

    // Swipe functionality for mobile
    function initSwipe(container, currentWeekIndex){
      let startX = 0;
      let scrollLeft = 0;
      let isDown = false;

      container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
      });

      container.addEventListener('touchend', () => {
        isDown = false;
      });

      container.addEventListener('touchmove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
      });

      // Snap to center card on mobile after initial render
      setTimeout(() => {
        const currentCard = container.querySelector('.week-card.current');
        if(currentCard){
          currentCard.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
        }
      }, 100);
    }

    function renderScheduleTable(scheduleToRender, currentWeekIndex){
      const tbody = document.getElementById("scheduleBody");
      tbody.innerHTML = "";

      scheduleToRender.forEach((week)=>{
        const row = document.createElement("tr");
        const isCurrentWeek = currentWeekIndex !== -1 && week.weekNumber === (currentWeekIndex + 1);
        row.className = isCurrentWeek ? "current-week" : "";
        row.id = `week-${week.weekNumber - 1}`;

        row.innerHTML = `
          <td class="week-num">${week.weekNumber}</td>
          <td>${week.weekStartFormatted}</td>
          <td>${week.weekEndFormatted}</td>
          <td><span class="person-badge ${getPersonClass(week.first)}">${week.first}</span></td>
          <td><span class="person-badge ${getPersonClass(week.second)}">${week.second}</span></td>
          <td><span class="person-badge ${getPersonClass(week.third)}">${week.third}</span></td>
          <td><span class="off-badge"><span aria-hidden="true">⛱</span><span class="sr-only">Off</span></span>${(()=>{const offStr=formatDate(addDays(week.weekStart,6)); return getHolidaySet().has(offStr) ? `<div class="off-note holiday">متوقع إجازة</div>` : ``;})()}</td>
        `;
        tbody.appendChild(row);
      });
    }

    // Tabs
    function switchTab(tabName){
      document.querySelectorAll(".tab-content").forEach(t=>t.classList.remove("active"));
      document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
      document.getElementById(tabName).classList.add("active");
      document.querySelector(`.nav-item[data-tab="${tabName}"]`).classList.add("active");
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
      const currentWeekIndex = getCurrentWeekIndex(fullSchedule);
      if(dateFilter){
    filtered = filtered.filter(week => weekContainsDate(week, dateFilter));
  }

  renderScheduleTable(filtered, currentWeekIndex);
    }

    function clearFilters(){
      currentFilter = null;
      dateFilter = null;
      const dateInput = document.getElementById('dateSearch');
      if(dateInput){ dateInput.value = ''; dateInput.classList.remove('invalid'); }

      document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
      const currentWeekIndex = getCurrentWeekIndex(fullSchedule);
      renderScheduleTable(fullSchedule, currentWeekIndex);
    }

    // Go to current week row
    function goToCurrentWeek(){
      const currentWeekIndex = getCurrentWeekIndex(fullSchedule);
      if(currentWeekIndex === -1) return;
      const row = document.getElementById(`week-${currentWeekIndex}`);
      if(!row) return;

      row.scrollIntoView({behavior:"smooth", block:"center"});
      row.style.animation = "none";
      setTimeout(()=>{ row.style.animation = "flash 1s ease-out"; }, 10);
    }

    // 🎉 New Week Started Feature
    const WEEK_TRACK_KEY = "wardiya_last_seen_week_index_v1";

    function showNewWeekBanner(weekNumber){
      const banner = document.getElementById("newWeekBanner");
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

      const lastSeen = localStorage.getItem(WEEK_TRACK_KEY);
      if(lastSeen === null){
        localStorage.setItem(WEEK_TRACK_KEY, String(currentIndex));
        return;
      }

      if(Number(lastSeen) !== currentIndex){
        localStorage.setItem(WEEK_TRACK_KEY, String(currentIndex));
        showNewWeekBanner(fullSchedule[currentIndex].weekNumber);
      }
    }

    // Init
    function init(){
      fullSchedule = generateSchedule();
      const currentWeekIndex = getCurrentWeekIndex(fullSchedule);

      renderDashboard(fullSchedule, currentWeekIndex);
      renderScheduleTable(fullSchedule, currentWeekIndex);
      checkNewWeek(fullSchedule);

      // Wire tab buttons
      document.querySelectorAll(".nav-item").forEach(btn=>{
        btn.addEventListener("click", ()=> switchTab(btn.dataset.tab));
      });

      // Wire filter buttons
      document.querySelectorAll(".filter-btn").forEach(btn=>{
        if(btn.dataset.clear){
          btn.addEventListener("click", clearFilters);
          return;
        }
        const person = btn.dataset.person;
        btn.addEventListener("click", ()=>{
          document.querySelectorAll(".filter-btn").forEach(b=>{
            if(!b.dataset.clear) b.classList.remove("active");
          });
          btn.classList.add("active");
          currentFilter = person;
          applyFilters();
        });
      });

      // Go current
      document.getElementById("goCurrentBtn").addEventListener("click", ()=>{
        switchTab("schedule");
        setTimeout(goToCurrentWeek, 60);
      });

      

      // Date search wiring
      const dateInput = document.getElementById("dateSearch");
      const clearDateBtn = document.getElementById("clearDateBtn");

      function applyDate(){
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
      }

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
      clearDateBtn.addEventListener("click", ()=>{
        dateInput.value = "";
        dateFilter = null;
        dateInput.classList.remove("invalid");
        applyFilters();
      });

// Auto-refresh check every minute
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

// =============================
// Date search runner (button / change)
// =============================
function runDateSearch(){
  const dateInput = document.getElementById("dateSearch");
  if(!dateInput) return;
  const val = (dateInput.value || "").trim();
  if(val === ""){
    dateFilter = null;
    dateInput.classList.remove("invalid");
    applyFilters();
    return;
  }
  const parsed = (typeof parseDateInput === "function") ? parseDateInput(val) : parseDDMMYYYY(val);
  if(!parsed){
    dateInput.classList.add("invalid");
    return;
  }
  dateInput.classList.remove("invalid");
  dateFilter = parsed;
  applyFilters();

  // Scroll to the matching week in the full schedule table (if visible)
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

// Fallback wiring (in case init wiring pattern differs)
function fallbackWireDateSearch(){
  const dateBtn = document.getElementById("dateSearchBtn");
  const dateInput = document.getElementById("dateSearch");
  const clearDateBtn = document.getElementById("clearDateBtn");
  if(dateBtn && !dateBtn._wired){ dateBtn._wired = true; dateBtn.addEventListener("click", runDateSearch); }
  if(dateInput && !dateInput._wired){
    dateInput._wired = true;
    dateInput.addEventListener("change", runDateSearch);
    dateInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); runDateSearch(); } });
  }
  if(clearDateBtn && !clearDateBtn._wired){
    clearDateBtn._wired = true;
    clearDateBtn.addEventListener("click", ()=>{ if(dateInput){ dateInput.value=""; dateInput.classList.remove("invalid"); } dateFilter=null; applyFilters(); });
  }
}
window.addEventListener("DOMContentLoaded", ()=> setTimeout(fallbackWireDateSearch, 0));
