// ⚙️ CONFIGURATION - CHANGE THIS TO YOUR SERVER IP
const SERVER_URL = 'https://ai.lighthouseindia.com/lhsfinder';

// Cache for faster responses
let cache = {};
let isLoading = false;

// 🔥 OMNIBOX - Main search functionality
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  console.log('🔍 User typed:', text);
  
  const query = text.trim();
  
  // Empty query - show nothing
  if (!query) {
    suggest([]);
    return;
  }

  // Prevent duplicate requests
  if (isLoading) {
    console.log('⏳ Already loading, skipping...');
    return;
  }

  try {
    // Check cache first
    if (cache[query]) {
      console.log('📦 Cache hit for:', query);
      suggest(cache[query]);
      return;
    }

    isLoading = true;
    console.log('🌐 Fetching from API:', query);

    // Fetch from Django
    const url = `${SERVER_URL}/api/search/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      console.error('❌ API error:', response.status);
      suggest([{
        content: `${SERVER_URL}/${query}`,
        description: `❌ Error ${response.status}. Try: ${query}`
      }]);
      return;
    }

    const data = await response.json();
    console.log('✅ Got results:', data.count);
    
    if (data.results && data.results.length > 0) {
      // Format suggestions
      const suggestions = data.results.slice(0, 8).map(result => {
        const score = Math.round(result.score * 100);
        return {
          content: result.url,
          description: `<match>${result.app_name}</match> <dim>(${score}%)</dim> - <url>${result.server}</url> | ${result.ip}`
        };
      });

      // Cache it
      cache[query] = suggestions;
      
      // Show suggestions
      suggest(suggestions);
      console.log('✨ Displayed', suggestions.length, 'suggestions');
    } else {
      console.log('⚠️ No results found');
      suggest([{
        content: `${SERVER_URL}/${query}`,
        description: `No results for "<match>${query}</match>". Press Enter to search...`
      }]);
    }
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
    suggest([{
      content: `${SERVER_URL}/${query}`,
      description: `Connection error. Try: <match>${query}</match>`
    }]);
  } finally {
    isLoading = false;
  }
});

// 🎯 OMNIBOX - When user presses Enter
chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  console.log('🚀 Opening:', text);
  
  let url = text;
  
  // If not a full URL, make it one
  if (!text.startsWith('http://') && !text.startsWith('https://')) {
    url = `${SERVER_URL}/${text}`;
  }

  // Open based on how user clicked
  switch (disposition) {
    case 'currentTab':
      chrome.tabs.update({ url });
      break;
    case 'newForegroundTab':
      chrome.tabs.create({ url, active: true });
      break;
    case 'newBackgroundTab':
      chrome.tabs.create({ url, active: false });
      break;
    default:
      chrome.tabs.update({ url });
  }
});

// 🔄 Clear cache periodically
setInterval(() => {
  cache = {};
  console.log('🧹 Cache cleared');
}, 3 * 60 * 1000);

// 🎉 Installation handler
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🎉 LHS App Finder installed!');
  console.log('🌐 Server:', SERVER_URL);
  
  // Save config
  await chrome.storage.sync.set({ serverUrl: SERVER_URL });
  
  // Test connection
  try {
    const response = await fetch(`${SERVER_URL}/api/search/?q=test`);
    if (response.ok) {
      console.log('✅ Server connection successful!');
    } else {
      console.error('❌ Server returned:', response.status);
    }
  } catch (error) {
    console.error('❌ Cannot connect to server:', error.message);
  }
});

// 🔌 Startup handler
chrome.runtime.onStartup.addListener(() => {
  console.log('🔄 Extension started');
});

// 📬 Message handler (for content script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchApps') {
    fetchSuggestions(request.query).then(sendResponse);
    return true;
  }
});

async function fetchSuggestions(query) {
  try {
    const response = await fetch(`${SERVER_URL}/api/search/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return { results: [] };
  }
}
