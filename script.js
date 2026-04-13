function updateDateTime() {
  const now = new Date();
  const timeElement = document.getElementById('time');
  const dateElement = document.getElementById('date');
  
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  timeElement.textContent = `${hours}:${minutes}`;
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long' 
  };
  dateElement.textContent = now.toLocaleDateString('zh-CN', options);
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const calendarTitle = document.getElementById('calendarTitle');
  const calendarToday = document.getElementById('calendarToday');
  const calendarWeekdays = document.getElementById('calendarWeekdays');
  const calendarGrid = document.getElementById('calendarGrid');

  if (!calendarTitle || !calendarToday || !calendarWeekdays || !calendarGrid) {
    return;
  }

  const monthLabel = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long'
  }).format(now);

  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  }).format(now);

  calendarTitle.textContent = monthLabel;
  calendarToday.textContent = `今天 ${todayLabel}`;

  const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  calendarWeekdays.innerHTML = '';
  weekdayLabels.forEach((label) => {
    const weekdayElement = document.createElement('div');
    weekdayElement.className = 'calendar-weekday';
    weekdayElement.textContent = label;
    calendarWeekdays.appendChild(weekdayElement);
  });

  calendarGrid.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekdayIndex = (firstDay.getDay() + 6) % 7;
  const leadingDays = firstWeekdayIndex;
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  for (let index = 0; index < totalCells; index += 1) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    const dayNumber = index - leadingDays + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      dayElement.classList.add('is-muted');
      calendarGrid.appendChild(dayElement);
      continue;
    }

    dayElement.textContent = dayNumber;

    if (dayNumber === today) {
      dayElement.classList.add('is-today');
    }

    calendarGrid.appendChild(dayElement);
  }
}

function handleSearch(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      window.location.href = searchUrl;
    }
  }
}

function focusSearchInput() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) {
    return;
  }

  requestAnimationFrame(() => {
    searchInput.focus();
    searchInput.select();
  });
}

function handleSearchBlur(event) {
  const nextTarget = event.relatedTarget;
  if (nextTarget && (nextTarget.tagName === 'INPUT' || nextTarget.tagName === 'TEXTAREA' || nextTarget.isContentEditable)) {
    return;
  }

  requestAnimationFrame(() => {
    focusSearchInput();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateDateTime();
  renderCalendar();
  setInterval(updateDateTime, 1000);
  
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keypress', handleSearch);
  searchInput.addEventListener('blur', handleSearchBlur);

  focusSearchInput();
  window.addEventListener('focus', focusSearchInput);
});
