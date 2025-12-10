// Music Explorer - Main functionality
import { loadHeaderFooter } from "./utils.mjs";
import { 
  redirectToSpotifyAuth, 
  handleSpotifyCallback, 
  isAuthenticated, 
  logout 
} from './spotify-auth.js';
import { 
  getCurrentUserProfile, 
  searchTracks 
} from './spotify-api.js';

// MOCK MODE - Set to true to bypass authentication for UI testing
const MOCK_AUTH = false;

// Initialize page
async function init() {
  // Load header and footer
  await loadHeaderFooter();
  
  // Mock authentication for testing
  if (MOCK_AUTH) {
    showSearchInterface();
    displayMockUserInfo();
    setupEventListeners();
    return;
  }
  
  // Check for callback from Spotify
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('code')) {
    showLoading('Authenticating with Spotify...');
    const result = await handleSpotifyCallback();
    hideLoading();
    
    if (result.success) {
      showSearchInterface();
      await displayUserInfo();
    } else {
      showError('Authentication failed. Please try again.');
    }
  } else if (isAuthenticated()) {
    // User is already authenticated
    showSearchInterface();
    await displayUserInfo();
  } else {
    // Show login button
    showLoginInterface();
  }
  
  // Set up event listeners
  setupEventListeners();
}

// Display mock user info for testing
function displayMockUserInfo() {
  const userInfoDiv = document.getElementById('user-info');
  if (userInfoDiv) {
    userInfoDiv.innerHTML = `
      <div class="user-profile">
        <span>Welcome, Test User! (Mock Mode)</span>
        <button id="logout-btn" class="btn-secondary" disabled>Logout (Mock)</button>
      </div>
    `;
  }
}

// Display user info
async function displayUserInfo() {
  try {
    const user = await getCurrentUserProfile();
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `
      <div class="user-profile">
        ${user.images && user.images[0] ? `<img src="${user.images[0].url}" alt="${user.display_name}" class="user-avatar">` : ''}
        <span>Welcome, ${user.display_name}!</span>
        <button id="logout-btn" class="btn-secondary">Logout</button>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load user profile:', error);
  }
}

// Show login interface
function showLoginInterface() {
  const searchSection = document.querySelector('.search-section');
  searchSection.innerHTML = `
    <h2>Connect to Spotify</h2>
    <p>Login with your Spotify account to search for songs and create playlists.</p>
    <button id="login-btn" class="cta-button">Login with Spotify</button>
    <div id="user-info"></div>
  `;
}

// Show search interface
function showSearchInterface() {
  const searchSection = document.querySelector('.search-section');
  searchSection.innerHTML = `
    <h2>Search for Songs</h2>
    <div id="user-info"></div>
    <form id="search-form">
      <input type="text" id="search-input" placeholder="Search for a song, artist, or album..." required>
      <button type="submit" class="cta-button">Search</button>
    </form>
    <div id="loading" class="loading hidden">Searching...</div>
    <div id="error-message" class="error-message hidden"></div>
  `;
}

// Set up event listeners
function setupEventListeners() {
  // Login button
  document.addEventListener('click', (e) => {
    if (e.target.id === 'login-btn') {
      redirectToSpotifyAuth();
    }
    
    // Logout button
    if (e.target.id === 'logout-btn') {
      logout();
      location.reload();
    }
  });
  
  // Search form
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'search-form') {
      e.preventDefault();
      const query = document.getElementById('search-input').value;
      await performSearch(query);
    }
  });
}

// Perform search
async function performSearch(query) {
  showLoading('Searching...');
  hideError();
  
  try {
    const results = await searchTracks(query);
    displaySearchResults(results.tracks.items);
  } catch (error) {
    console.error('Search failed:', error);
    showError('Search failed. Please try again.');
  } finally {
    hideLoading();
  }
}

// Display search results
function displaySearchResults(tracks) {
  const resultsSection = document.querySelector('.results-section');
  
  if (tracks.length === 0) {
    resultsSection.innerHTML = `
      <h2>Search Results</h2>
      <p>No results found. Try a different search term.</p>
    `;
    return;
  }
  
  // Debug: Log tracks to see preview_url availability
  console.log('Tracks with preview URLs:', tracks.filter(t => t.preview_url).length, '/', tracks.length);
  console.log('Full track data for first track:', tracks[0]);
  console.log('ALL keys in first track object:', Object.keys(tracks[0]));
  console.log('Does preview_url exist?', 'preview_url' in tracks[0]);
  console.log('Type of preview_url:', typeof tracks[0].preview_url);
  console.log('Value of preview_url:', tracks[0].preview_url);
  
  tracks.forEach((track, index) => {
    console.log(`Track ${index + 1}: "${track.name}" by ${track.artists[0].name}`);
    console.log('  - Preview URL:', track.preview_url || 'NONE');
    console.log('  - Available markets:', track.available_markets?.length || 0);
    console.log('  - Is playable:', track.is_playable);
  });
  
  const trackHTML = tracks.map(track => `
    <div class="track-item" data-track-id="${track.id}">
      <img src="${track.album.images[2]?.url || track.album.images[0]?.url}" alt="${track.name}" class="track-image">
      <div class="track-info">
        <h3 class="track-name">${track.name}</h3>
        <p class="track-artist">${track.artists.map(a => a.name).join(', ')}</p>
        <p class="track-album">${track.album.name}</p>
      </div>
      <div class="track-actions">
        <button class="btn-play" data-uri="${track.uri}">Play Preview</button>
        <button class="btn-save" data-id="${track.id}">Save</button>
      </div>
      ${track.preview_url ? `<audio src="${track.preview_url}" class="track-preview"></audio>` : ''}
    </div>
  `).join('');
  
  resultsSection.innerHTML = `
    <h2>Search Results</h2>
    <div class="track-list">
      ${trackHTML}
    </div>
  `;
  
  // Add play preview functionality
  document.querySelectorAll('.btn-play').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trackItem = e.target.closest('.track-item');
      const audio = trackItem.querySelector('.track-preview');
      
      if (audio) {
        // Pause all other audio
        document.querySelectorAll('.track-preview').forEach(a => {
          if (a !== audio) a.pause();
        });
        
        if (audio.paused) {
          audio.play();
          e.target.textContent = 'Pause';
        } else {
          audio.pause();
          e.target.textContent = 'Play Preview';
        }
        
        audio.addEventListener('ended', () => {
          e.target.textContent = 'Play Preview';
        });
      } else {
        showError('No preview available for this track.');
      }
    });
  });
}

// Utility functions
function showLoading(message = 'Loading...') {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.textContent = message;
    loading.classList.remove('hidden');
  }
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }
}

function hideError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
