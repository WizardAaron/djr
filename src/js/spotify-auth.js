// Spotify Authentication Module
// Uses Authorization Code Flow with PKCE (recommended for SPAs)

const CLIENT_ID = '47c49405f2df4d1b8a154dc0cda5375b';
const REDIRECT_URI = window.location.hostname === 'localhost' 
  ? 'https://localhost:5173/djr_music_explorer/'
  : 'https://digitaljamradioreborn.netlify.app/djr_music_explorer/';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-library-modify',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state'
].join(' ');

// Generate random string for state parameter
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// Generate code verifier and challenge for PKCE
async function generateCodeChallenge(codeVerifier) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier)
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Redirect to Spotify authorization
export async function redirectToSpotifyAuth() {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);

  // Store code verifier and state for later verification
  localStorage.setItem('spotify_code_verifier', codeVerifier);
  localStorage.setItem('spotify_auth_state', state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Handle callback from Spotify
export async function handleSpotifyCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    console.error('Spotify authorization error:', error);
    return { success: false, error };
  }

  const storedState = localStorage.getItem('spotify_auth_state');
  
  if (state !== storedState) {
    console.error('State mismatch - possible CSRF attack');
    return { success: false, error: 'State mismatch' };
  }

  if (code) {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return { success: false, error: 'Token exchange failed' };
    }

    const data = await tokenResponse.json();
    
    // Store tokens
    localStorage.setItem('spotify_access_token', data.access_token);
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
    localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));
    
    // Clean up temporary storage
    localStorage.removeItem('spotify_code_verifier');
    localStorage.removeItem('spotify_auth_state');
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return { success: true, accessToken: data.access_token };
  }

  return { success: false, error: 'No code received' };
}

// Get current access token (refresh if needed)
export async function getAccessToken() {
  const accessToken = localStorage.getItem('spotify_access_token');
  const expiry = localStorage.getItem('spotify_token_expiry');
  
  // Check if token exists and is not expired
  if (accessToken && expiry && Date.now() < parseInt(expiry)) {
    return accessToken;
  }
  
  // Try to refresh token
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  if (refreshToken) {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (tokenResponse.ok) {
      const data = await tokenResponse.json();
      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));
      return data.access_token;
    }
  }
  
  return null;
}

// Check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem('spotify_access_token');
  const expiry = localStorage.getItem('spotify_token_expiry');
  return token && expiry && Date.now() < parseInt(expiry);
}

// Logout
export function logout() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expiry');
  localStorage.removeItem('spotify_code_verifier');
  localStorage.removeItem('spotify_auth_state');
}
