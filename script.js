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

function handleSearch(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      window.location.href = searchUrl;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keypress', handleSearch);
  
  searchInput.focus();
});
