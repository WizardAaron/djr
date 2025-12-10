// Spotify API Module
// Functions for interacting with Spotify Web API

import { getAccessToken } from './spotify-auth.js';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Helper function to make authenticated API requests
async function spotifyFetch(endpoint, options = {}) {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  return response.json();
}

// Get current user profile
export async function getCurrentUserProfile() {
  return spotifyFetch('/me');
}

// Search for tracks
export async function searchTracks(query, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: limit
  });
  
  return spotifyFetch(`/search?${params.toString()}`);
}

// Get track details
export async function getTrack(trackId) {
  return spotifyFetch(`/tracks/${trackId}`);
}

// Get user's playlists
export async function getUserPlaylists(limit = 50) {
  return spotifyFetch(`/me/playlists?limit=${limit}`);
}

// Create a new playlist
export async function createPlaylist(userId, name, description = '', isPublic = true) {
  return spotifyFetch(`/users/${userId}/playlists`, {
    method: 'POST',
    body: JSON.stringify({
      name: name,
      description: description,
      public: isPublic
    })
  });
}

// Add tracks to playlist
export async function addTracksToPlaylist(playlistId, trackUris) {
  return spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: JSON.stringify({
      uris: trackUris
    })
  });
}

// Get user's saved tracks
export async function getSavedTracks(limit = 50, offset = 0) {
  return spotifyFetch(`/me/tracks?limit=${limit}&offset=${offset}`);
}

// Save tracks to library
export async function saveTracks(trackIds) {
  return spotifyFetch('/me/tracks', {
    method: 'PUT',
    body: JSON.stringify({
      ids: trackIds
    })
  });
}

// Remove tracks from library
export async function removeTracks(trackIds) {
  return spotifyFetch('/me/tracks', {
    method: 'DELETE',
    body: JSON.stringify({
      ids: trackIds
    })
  });
}

// Check if tracks are saved
export async function checkSavedTracks(trackIds) {
  const params = new URLSearchParams({
    ids: trackIds.join(',')
  });
  
  return spotifyFetch(`/me/tracks/contains?${params.toString()}`);
}

// Get recommendations
export async function getRecommendations(seedTracks = [], seedArtists = [], seedGenres = [], limit = 20) {
  const params = new URLSearchParams({
    limit: limit
  });
  
  if (seedTracks.length > 0) {
    params.append('seed_tracks', seedTracks.join(','));
  }
  if (seedArtists.length > 0) {
    params.append('seed_artists', seedArtists.join(','));
  }
  if (seedGenres.length > 0) {
    params.append('seed_genres', seedGenres.join(','));
  }
  
  return spotifyFetch(`/recommendations?${params.toString()}`);
}

// Get available devices
export async function getDevices() {
  return spotifyFetch('/me/player/devices');
}

// Get current playback state
export async function getPlaybackState() {
  return spotifyFetch('/me/player');
}

// Play a track
export async function playTrack(trackUri, deviceId = null) {
  const body = {
    uris: [trackUri]
  };
  
  const endpoint = deviceId 
    ? `/me/player/play?device_id=${deviceId}`
    : '/me/player/play';
    
  return spotifyFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

// Pause playback
export async function pausePlayback() {
  return spotifyFetch('/me/player/pause', {
    method: 'PUT'
  });
}

// Resume playback
export async function resumePlayback() {
  return spotifyFetch('/me/player/play', {
    method: 'PUT'
  });
}

// Skip to next track
export async function skipToNext() {
  return spotifyFetch('/me/player/next', {
    method: 'POST'
  });
}

// Skip to previous track
export async function skipToPrevious() {
  return spotifyFetch('/me/player/previous', {
    method: 'POST'
  });
}

// Set volume
export async function setVolume(volumePercent) {
  return spotifyFetch(`/me/player/volume?volume_percent=${volumePercent}`, {
    method: 'PUT'
  });
}
