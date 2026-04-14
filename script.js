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

function getQuoteForToday() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const index = dayOfYear % dailyQuotes.length;
  return dailyQuotes[index];
}

function renderQuote() {
  const quotePanel = document.getElementById('quotePanel');
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');

  if (!quotePanel || !quoteText || !quoteAuthor) {
    return;
  }

  if (!userSettings.showQuotes) {
    quotePanel.hidden = true;
    return;
  }

  const quote = getQuoteForToday();
  quoteText.textContent = `"${quote.text}"`;
  quoteAuthor.textContent = `—— ${quote.author}`;
  quotePanel.hidden = false;
}

function applyTheme(themeName) {
  const theme = wallpaperThemes[themeName];
  if (!theme) {
    return;
  }

  const root = document.documentElement;
  const orbOne = document.querySelector('.orb-one');
  const orbTwo = document.querySelector('.orb-two');

  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-strong', theme.accentStrong);
  root.style.setProperty('--accent-secondary', theme.accentSecondary);

  document.body.style.background = theme.gradient;

  if (orbOne) {
    const orb1 = theme.orbs[0];
    orbOne.setAttribute('style', `${orb1.pos} background: ${orb1.bg};`);
  }

  if (orbTwo) {
    const orb2 = theme.orbs[1];
    orbTwo.setAttribute('style', `${orb2.pos} background: ${orb2.bg};`);
  }
}

function resolveTheme() {
  if (userSettings.theme === "auto") {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    return themeOrder[dayOfYear % themeOrder.length];
  }
  return userSettings.theme;
}

async function loadSettings() {
  const defaults = { theme: "warm", showQuotes: true };

  // Try chrome.storage.local first
  try {
    if (chrome.storage && chrome.storage.local && chrome.storage.local.get) {
      const result = await chrome.storage.local.get(defaults);
      if (result && result.theme) {
        userSettings = result;
        applyTheme(resolveTheme());
        renderQuote();
        updateSettingsUI();
        return;
      }
    }
  } catch {
    // Fall through to localStorage
  }

  // Fallback: use localStorage
  try {
    const raw = localStorage.getItem("simpleIndexSettings");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.theme || parsed.showQuotes !== undefined) {
        userSettings = { ...defaults, ...parsed };
        applyTheme(resolveTheme());
        renderQuote();
        updateSettingsUI();
        return;
      }
    }
  } catch {
    // Fall through to defaults
  }

  // Use defaults
  userSettings = { ...defaults };
  applyTheme(resolveTheme());
  renderQuote();
  updateSettingsUI();
}

async function saveSettings() {
  // Try chrome.storage.local first
  try {
    if (chrome.storage && chrome.storage.local && chrome.storage.local.set) {
      await chrome.storage.local.set(userSettings);
      return;
    }
  } catch {
    // Fall through to localStorage
  }

  // Fallback: use localStorage
  try {
    localStorage.setItem("simpleIndexSettings", JSON.stringify(userSettings));
  } catch {
    // Storage not available, skip
  }
}

function updateSettingsUI() {
  const themeGrid = document.getElementById('themeGrid');
  const quoteToggle = document.getElementById('quoteToggle');

  if (themeGrid) {
    themeGrid.querySelectorAll('.theme-option').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.theme === userSettings.theme);
    });
  }

  if (quoteToggle) {
    quoteToggle.checked = userSettings.showQuotes;
  }
}

let bookmarksRootNodes = [];
let flatBookmarks = [];
let searchSuggestions = [];
let activeSuggestionIndex = -1;

const dailyQuotes = [
  { text: "千里之行，始于足下。", author: "老子" },
  { text: "知人者智，自知者明。", author: "老子" },
  { text: "学而不思则罔，思而不学则殆。", author: "孔子" },
  { text: "三人行，必有我师焉。", author: "孔子" },
  { text: "己所不欲，勿施于人。", author: "孔子" },
  { text: "天行健，君子以自强不息。", author: "《周易》" },
  { text: "地势坤，君子以厚德载物。", author: "《周易》" },
  { text: "不积跬步，无以至千里；不积小流，无以成江海。", author: "荀子" },
  { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原" },
  { text: "长风破浪会有时，直挂云帆济沧海。", author: "李白" },
  { text: "天生我材必有用，千金散尽还复来。", author: "李白" },
  { text: "会当凌绝顶，一览众山小。", author: "杜甫" },
  { text: "读书破万卷，下笔如有神。", author: "杜甫" },
  { text: "山重水复疑无路，柳暗花明又一村。", author: "陆游" },
  { text: "不畏浮云遮望眼，自缘身在最高层。", author: "王安石" },
  { text: "人生自古谁无死，留取丹心照汗青。", author: "文天祥" },
  { text: "海纳百川，有容乃大；壁立千仞，无欲则刚。", author: "林则徐" },
  { text: "苟利国家生死以，岂因祸福避趋之。", author: "林则徐" },
  { text: "世上无难事，只怕有心人。", author: "谚语" },
  { text: "活到老，学到老。", author: "谚语" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Stay hungry, stay foolish.", author: "Stewart Brand" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" }
];

const wallpaperThemes = {
  warm: {
    orbs: [
      { pos: "top: -100px; left: -70px;", bg: "radial-gradient(circle, rgba(255, 173, 201, 0.95) 0%, rgba(255, 173, 201, 0) 72%)" },
      { pos: "right: -90px; bottom: -140px;", bg: "radial-gradient(circle, rgba(255, 207, 118, 0.95) 0%, rgba(255, 207, 118, 0) 72%)" }
    ],
    gradient: "radial-gradient(circle at top left, rgba(255, 197, 214, 0.85), transparent 28%), radial-gradient(circle at 85% 18%, rgba(255, 229, 163, 0.9), transparent 24%), linear-gradient(135deg, #fffaf2 0%, #eef7ff 52%, #f5fbff 100%)",
    accent: "#ff8a8a",
    accentStrong: "#ff6b8a",
    accentSecondary: "#ffbf69"
  },
  ocean: {
    orbs: [
      { pos: "top: -80px; left: 10%;", bg: "radial-gradient(circle, rgba(100, 180, 255, 0.9) 0%, rgba(100, 180, 255, 0) 70%)" },
      { pos: "right: -60px; bottom: -100px;", bg: "radial-gradient(circle, rgba(80, 220, 200, 0.85) 0%, rgba(80, 220, 200, 0) 70%)" }
    ],
    gradient: "radial-gradient(circle at top left, rgba(120, 200, 255, 0.7), transparent 30%), radial-gradient(circle at 80% 20%, rgba(100, 230, 210, 0.65), transparent 26%), linear-gradient(135deg, #e8f4fd 0%, #d5f0f5 50%, #f0f8ff 100%)",
    accent: "#4db8ff",
    accentStrong: "#2196F3",
    accentSecondary: "#4dd0c8"
  },
  forest: {
    orbs: [
      { pos: "top: -120px; right: 15%;", bg: "radial-gradient(circle, rgba(130, 200, 120, 0.9) 0%, rgba(130, 200, 120, 0) 72%)" },
      { pos: "left: -80px; bottom: -80px;", bg: "radial-gradient(circle, rgba(180, 220, 100, 0.85) 0%, rgba(180, 220, 100, 0) 72%)" }
    ],
    gradient: "radial-gradient(circle at top right, rgba(140, 210, 130, 0.75), transparent 28%), radial-gradient(circle at 15% 80%, rgba(200, 230, 110, 0.7), transparent 25%), linear-gradient(135deg, #f5fdf0 0%, #e8f5e0 50%, #fafff5 100%)",
    accent: "#66bb6a",
    accentStrong: "#43a047",
    accentSecondary: "#aed581"
  },
  sunset: {
    orbs: [
      { pos: "top: -60px; right: -40px;", bg: "radial-gradient(circle, rgba(255, 140, 100, 0.95) 0%, rgba(255, 140, 100, 0) 70%)" },
      { pos: "left: 20%; bottom: -120px;", bg: "radial-gradient(circle, rgba(200, 100, 255, 0.8) 0%, rgba(200, 100, 255, 0) 70%)" }
    ],
    gradient: "radial-gradient(circle at top right, rgba(255, 160, 120, 0.85), transparent 30%), radial-gradient(circle at 25% 90%, rgba(210, 120, 255, 0.6), transparent 28%), linear-gradient(135deg, #fff5ee 0%, #fce4ec 45%, #f3e5f5 100%)",
    accent: "#ff8a65",
    accentStrong: "#ff7043",
    accentSecondary: "#ce93d8"
  },
  lavender: {
    orbs: [
      { pos: "top: -90px; left: 20%;", bg: "radial-gradient(circle, rgba(180, 140, 255, 0.9) 0%, rgba(180, 140, 255, 0) 72%)" },
      { pos: "right: -70px; bottom: -60px;", bg: "radial-gradient(circle, rgba(230, 160, 200, 0.85) 0%, rgba(230, 160, 200, 0) 72%)" }
    ],
    gradient: "radial-gradient(circle at top center, rgba(190, 150, 255, 0.7), transparent 28%), radial-gradient(circle at 80% 70%, rgba(240, 170, 210, 0.6), transparent 25%), linear-gradient(135deg, #f8f0ff 0%, #fce4f0 50%, #fff0f8 100%)",
    accent: "#ab47bc",
    accentStrong: "#9c27b0",
    accentSecondary: "#f48fb1"
  }
};

const themeOrder = ["warm", "ocean", "forest", "sunset", "lavender"];

let userSettings = {
  theme: "warm",
  showQuotes: true
};

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

function extractBookmarkPath(pathSegments) {
  return pathSegments.filter(Boolean).join(' / ');
}

function flattenBookmarks(nodes, pathSegments = []) {
  return nodes.reduce((result, node) => {
    if (node.url) {
      result.push({
        id: node.id,
        title: sanitizeBookmarkTitle(node.title, node.url),
        url: node.url,
        domain: getBookmarkDomain(node.url),
        path: extractBookmarkPath(pathSegments)
      });
      return result;
    }

    const nextPath = node.title ? [...pathSegments, node.title] : pathSegments;
    result.push(...flattenBookmarks(node.children || [], nextPath));
    return result;
  }, []);
}

function scoreBookmarkMatch(bookmark, query) {
  const normalizedTitle = normalizeSearchText(bookmark.title);
  const normalizedDomain = normalizeSearchText(bookmark.domain);
  let score = 0;

  if (normalizedTitle === query) {
    score += 120;
  } else if (normalizedTitle.startsWith(query)) {
    score += 90;
  } else if (normalizedTitle.includes(query)) {
    score += 55;
  }

  if (normalizedDomain === query) {
    score += 110;
  } else if (normalizedDomain.startsWith(query)) {
    score += 80;
  } else if (normalizedDomain.includes(query)) {
    score += 50;
  }

  if (bookmark.path && normalizeSearchText(bookmark.path).includes(query)) {
    score += 12;
  }

  return score;
}

function getBookmarkSuggestions(query) {
  if (!query) {
    return [];
  }

  return flatBookmarks
    .map((bookmark) => ({
      ...bookmark,
      score: scoreBookmarkMatch(bookmark, query)
    }))
    .filter((bookmark) => bookmark.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, 'zh-CN'))
    .slice(0, 8);
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

function renderSearchSuggestions() {
  const container = document.getElementById('searchSuggestions');
  const query = normalizeSearchText(document.getElementById('searchInput')?.value);
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!query) {
    container.hidden = true;
    activeSuggestionIndex = -1;
    return;
  }

  searchSuggestions = getBookmarkSuggestions(query);
  if (activeSuggestionIndex >= searchSuggestions.length) {
    activeSuggestionIndex = -1;
  }

  if (!searchSuggestions.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'search-suggestion-empty';
    emptyState.textContent = '未找到匹配书签，按 Enter 将直接搜索';
    container.appendChild(emptyState);
    container.hidden = false;
    return;
  }

  searchSuggestions.forEach((suggestion, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `search-suggestion${index === activeSuggestionIndex ? ' is-active' : ''}`;
    button.dataset.index = String(index);

    const icon = document.createElement('span');
    icon.className = 'search-suggestion-icon';
    icon.textContent = '↗';

    const content = document.createElement('span');
    content.className = 'search-suggestion-content';

    const title = document.createElement('span');
    title.className = 'search-suggestion-title';
    title.textContent = suggestion.title;

    const meta = document.createElement('span');
    meta.className = 'search-suggestion-meta';
    meta.textContent = suggestion.path ? `${suggestion.domain} · ${suggestion.path}` : suggestion.domain;

    content.appendChild(title);
    content.appendChild(meta);
    button.appendChild(icon);
    button.appendChild(content);

    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      openSuggestion(index);
    });

    container.appendChild(button);
  });

  container.hidden = false;
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
    flatBookmarks = flattenBookmarks(bookmarksRootNodes);
    renderBookmarksTree(bookmarksRootNodes);
    renderSearchSuggestions();
  });
}

function openSuggestion(index) {
  const suggestion = searchSuggestions[index];
  if (!suggestion) {
    return;
  }

  window.location.href = suggestion.url;
}

function performDefaultSearch(query) {
  if (!query) {
    return;
  }

  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  window.location.href = searchUrl;
}

function updateActiveSuggestion(nextIndex) {
  if (!searchSuggestions.length) {
    activeSuggestionIndex = -1;
    return;
  }

  const total = searchSuggestions.length;
  if (activeSuggestionIndex === -1) {
    activeSuggestionIndex = nextIndex >= 0 ? 0 : total - 1;
  } else {
    activeSuggestionIndex = (nextIndex + total) % total;
  }
  renderSearchSuggestions();
}

function handleSearchInput(event) {
  searchSuggestions = [];
  activeSuggestionIndex = -1;
  renderSearchSuggestions();
  renderBookmarksTree(markFoldersOpen(filterBookmarkTree(bookmarksRootNodes, normalizeSearchText(event.target.value)), Boolean(event.target.value.trim())));
}

function handleSearchKeydown(event) {
  const query = event.target.value.trim();

  if (event.key === 'ArrowDown' && searchSuggestions.length) {
    event.preventDefault();
    updateActiveSuggestion(activeSuggestionIndex + 1);
    return;
  }

  if (event.key === 'ArrowUp' && searchSuggestions.length) {
    event.preventDefault();
    updateActiveSuggestion(activeSuggestionIndex - 1);
    return;
  }

  if (event.key === 'Escape') {
    const container = document.getElementById('searchSuggestions');
    if (container) {
      container.hidden = true;
    }
    activeSuggestionIndex = -1;
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    if (activeSuggestionIndex >= 0 && searchSuggestions[activeSuggestionIndex]) {
      openSuggestion(activeSuggestionIndex);
      return;
    }

    performDefaultSearch(query);
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  updateDateTime();
  renderCalendar();
  loadBookmarks();
  setInterval(updateDateTime, 1000);

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('keydown', handleSearchKeydown);
  searchInput.addEventListener('blur', handleSearchBlur);

  focusSearchInput();
  window.addEventListener('focus', focusSearchInput);

  // Settings panel
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsDialog = document.getElementById('settingsDialog');
  const settingsClose = document.getElementById('settingsClose');
  const themeGrid = document.getElementById('themeGrid');
  const quoteToggle = document.getElementById('quoteToggle');

  if (settingsToggle && settingsDialog) {
    settingsToggle.addEventListener('click', () => {
      settingsDialog.showModal();
    });
  }

  if (settingsClose && settingsDialog) {
    settingsClose.addEventListener('click', () => {
      settingsDialog.close();
    });

    settingsDialog.addEventListener('click', (event) => {
      if (event.target === settingsDialog) {
        settingsDialog.close();
      }
    });
  }

  if (themeGrid) {
    themeGrid.addEventListener('click', (event) => {
      const btn = event.target.closest('.theme-option');
      if (!btn) {
        return;
      }

      const theme = btn.dataset.theme;
      userSettings.theme = theme;
      applyTheme(resolveTheme());
      updateSettingsUI();
      saveSettings();
    });
  }

  if (quoteToggle) {
    quoteToggle.addEventListener('change', () => {
      userSettings.showQuotes = quoteToggle.checked;
      renderQuote();
      saveSettings();
    });
  }
});
