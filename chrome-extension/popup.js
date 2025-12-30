// Load server URL from storage
chrome.storage.sync.get(['serverUrl'], (result) => {
  if (result.serverUrl) {
    document.getElementById('serverUrl').value = result.serverUrl;
  }
});

// Save configuration
document.getElementById('saveConfig').addEventListener('click', () => {
  const serverUrl = document.getElementById('serverUrl').value.trim();
  
  if (!serverUrl) {
    alert('Please enter a valid server URL');
    return;
  }
  
  chrome.storage.sync.set({ serverUrl }, () => {
    alert('✅ Configuration saved! Please reload the extension.');
  });
});

// Search functionality
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
let debounceTimer;

searchInput.addEventListener('input', function() {
  clearTimeout(debounceTimer);
  const query = this.value.trim();
  
  if (query.length < 2) {
    resultsDiv.innerHTML = '';
    return;
  }
  
  debounceTimer = setTimeout(() => {
    searchApps(query);
  }, 300);
});

async function searchApps(query) {
  try {
    const { serverUrl } = await chrome.storage.sync.get(['serverUrl']);
    const url = `${serverUrl}/api/search/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      displayResults(data.results);
    } else {
      resultsDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: #999;">No results found</div>';
    }
  } catch (error) {
    console.error('Search error:', error);
    resultsDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: red;">Error connecting to server</div>';
  }
}

function displayResults(results) {
  resultsDiv.innerHTML = results.map(result => `
    <div class="result-item" data-url="${result.url}">
      <div class="result-name">${result.app_name}</div>
      <div class="result-url">${result.url}</div>
    </div>
  `).join('');
  
  // Add click handlers
  document.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', () => {
      chrome.tabs.create({ url: item.dataset.url });
    });
  });
}
