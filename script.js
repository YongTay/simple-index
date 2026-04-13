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

let bookmarksRootNodes = [];

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

function sanitizeBookmarkTitle(title, fallback) {
  if (title && title.trim()) {
    return title.trim();
  }

  return fallback;
}

function getBookmarkDomain(url) {
  if (!url) {
    return '';
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function normalizeSearchText(value) {
  return (value || '').trim().toLowerCase();
}

function filterBookmarkTree(nodes, query) {
  if (!query) {
    return nodes;
  }

  return nodes.reduce((result, node) => {
    if (node.url) {
      const title = normalizeSearchText(node.title);
      const domain = normalizeSearchText(getBookmarkDomain(node.url));
      if (title.includes(query) || domain.includes(query)) {
        result.push(node);
      }
      return result;
    }

    const matchedChildren = filterBookmarkTree(node.children || [], query);
    const folderTitle = normalizeSearchText(node.title);
    if (matchedChildren.length || folderTitle.includes(query)) {
      result.push({
        ...node,
        children: folderTitle.includes(query) ? (node.children || []) : matchedChildren
      });
    }

    return result;
  }, []);
}

function markFoldersOpen(nodes, shouldOpen) {
  return nodes.map((node) => {
    if (!node.children) {
      return node;
    }

    return {
      ...node,
      forceOpen: shouldOpen,
      children: markFoldersOpen(node.children, shouldOpen)
    };
  });
}

function createBookmarkNode(node) {
  if (!node) {
    return null;
  }

  if (node.url) {
    const link = document.createElement('a');
    link.className = 'bookmark-link';
    link.href = node.url;
    link.textContent = '';
    link.title = node.title || node.url;

    const icon = document.createElement('span');
    icon.className = 'bookmark-icon';
    icon.textContent = '•';

    const text = document.createElement('span');
    text.className = 'bookmark-text';
    text.textContent = sanitizeBookmarkTitle(node.title, node.url);

    const textWrapper = document.createElement('span');
    textWrapper.className = 'bookmark-text-group';

    const title = document.createElement('span');
    title.textContent = sanitizeBookmarkTitle(node.title, node.url);

    const meta = document.createElement('span');
    meta.className = 'bookmark-meta';
    meta.textContent = getBookmarkDomain(node.url) || node.url;

    textWrapper.appendChild(title);
    textWrapper.appendChild(meta);
    link.appendChild(icon);
    link.appendChild(textWrapper);
    return link;
  }

  const children = (node.children || [])
    .map(createBookmarkNode)
    .filter(Boolean);

  if (children.length === 0) {
    return null;
  }

  const details = document.createElement('details');
  details.className = 'bookmark-folder';
  details.open = node.id === '1' || node.id === '2' || node.forceOpen;

  const summary = document.createElement('summary');

  const icon = document.createElement('span');
  icon.className = 'bookmark-icon';
  icon.textContent = '⌄';

  const name = document.createElement('span');
  name.className = 'bookmark-folder-name';
  name.textContent = sanitizeBookmarkTitle(node.title, '未命名文件夹');

  const arrow = document.createElement('span');
  arrow.className = 'bookmark-folder-arrow';
  arrow.textContent = '›';

  summary.appendChild(icon);
  summary.appendChild(name);
  summary.appendChild(arrow);
  details.appendChild(summary);

  const childContainer = document.createElement('div');
  childContainer.className = 'bookmark-children';
  children.forEach((child) => childContainer.appendChild(child));
  details.appendChild(childContainer);

  return details;
}

function renderBookmarksTree(nodes) {
  const container = document.getElementById('bookmarksTree');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  const fragment = document.createDocumentFragment();
  nodes.map(createBookmarkNode).filter(Boolean).forEach((node) => {
    fragment.appendChild(node);
  });

  if (!fragment.childNodes.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'bookmarks-empty';
    emptyState.textContent = '暂无可显示的书签';
    container.appendChild(emptyState);
    return;
  }

  container.appendChild(fragment);
}

function updateBookmarksSearch() {
  const searchInput = document.getElementById('bookmarksSearchInput');
  const query = normalizeSearchText(searchInput ? searchInput.value : '');
  const filteredNodes = markFoldersOpen(filterBookmarkTree(bookmarksRootNodes, query), Boolean(query));

  renderBookmarksTree(filteredNodes);
}

function loadBookmarks() {
  const container = document.getElementById('bookmarksTree');
  if (!container) {
    return;
  }

  if (!chrome.bookmarks || !chrome.bookmarks.getTree) {
    container.innerHTML = '<p class="bookmarks-empty">当前环境不支持书签读取</p>';
    return;
  }

  chrome.bookmarks.getTree((tree) => {
    if (chrome.runtime.lastError) {
      container.innerHTML = '<p class="bookmarks-empty">书签读取失败</p>';
      return;
    }

    bookmarksRootNodes = tree && tree[0] && tree[0].children ? tree[0].children : [];
    updateBookmarksSearch();
  });
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
  loadBookmarks();
  setInterval(updateDateTime, 1000);
  
  const searchInput = document.getElementById('searchInput');
  const bookmarksSearchInput = document.getElementById('bookmarksSearchInput');
  searchInput.addEventListener('keypress', handleSearch);
  searchInput.addEventListener('blur', handleSearchBlur);
  if (bookmarksSearchInput) {
    bookmarksSearchInput.addEventListener('input', updateBookmarksSearch);
  }

  focusSearchInput();
  window.addEventListener('focus', focusSearchInput);
});
