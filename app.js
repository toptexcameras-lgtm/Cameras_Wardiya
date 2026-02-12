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
            <span class="off-badge">Friday: OFF</span>
          </div>
        `;
        container.appendChild(card);
      });
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
          <td><span class="off-badge">OFF</span></td>
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
      renderScheduleTable(filtered, currentWeekIndex);
    }

    function clearFilters(){
      currentFilter = null;
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

    // Flash animation
    const flashStyle = document.createElement("style");
    flashStyle.textContent = `
      @keyframes flash {
        0%,100%{ background: rgba(37,99,235,.04); }
        50%{ background: #dbeafe; }
      }
    `;
    document.head.appendChild(flashStyle);

    // 🎉 New Week Started Feature (fixed)
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

      // Auto-scroll current card into view on dashboard (mobile)
      setTimeout(()=>{
        const currentCard = document.querySelector(".week-card.current");
        if(currentCard){
          currentCard.scrollIntoView({behavior:"smooth", block:"nearest", inline:"center"});
        }
      }, 250);
    }

    window.addEventListener("DOMContentLoaded", init);
