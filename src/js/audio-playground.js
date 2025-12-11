// Audio Playground - Web Audio API effects
import { loadHeaderFooter } from "./utils.mjs";

let audioContext;
let audioSource;
let gainNode;
let bassFilter;
let trebleFilter;
let convolver;
let delayNode;
let feedbackGain;
let audioElement;
let isPlaying = false;

// Favorites storage key
const FAVORITES_KEY = 'djr-audio-favorites';

// Initialize page
async function init() {
  await loadHeaderFooter();
  loadFavorites();
  setupEventListeners();
  sortEffectsByFavorites();
}

// Set up event listeners
function setupEventListeners() {
  const fileInput = document.getElementById('audio-file');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const stopBtn = document.getElementById('stop-btn');
  const downloadBtn = document.getElementById('download-btn');
  const resetBtn = document.getElementById('reset-filters');

  fileInput.addEventListener('change', handleFileUpload);
  playBtn.addEventListener('click', playAudio);
  pauseBtn.addEventListener('click', pauseAudio);
  stopBtn.addEventListener('click', stopAudio);
  downloadBtn.addEventListener('click', downloadProcessedAudio);
  resetBtn.addEventListener('click', resetFilters);

  // Filter sliders
  document.getElementById('volume-slider').addEventListener('input', updateVolume);
  document.getElementById('bass-slider').addEventListener('input', updateBass);
  document.getElementById('treble-slider').addEventListener('input', updateTreble);
  document.getElementById('reverb-slider').addEventListener('input', updateReverb);
  document.getElementById('echo-slider').addEventListener('input', updateEcho);
  document.getElementById('echo-feedback-slider').addEventListener('input', updateEchoFeedback);

  // Favorite star click handlers
  document.querySelectorAll('.favorite-star').forEach(star => {
    star.addEventListener('click', toggleFavorite);
  });
}

// Handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('file-name').textContent = `Selected: ${file.name}`;

  // Create audio context if it doesn't exist
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    setupAudioNodes();
  }

  // Create audio element
  audioElement = document.getElementById('audio-player');
  const url = URL.createObjectURL(file);
  audioElement.src = url;

  // Show player and filters
  document.getElementById('player-section').classList.remove('hidden');
  document.getElementById('filters-section').classList.remove('hidden');

  // Connect audio element to Web Audio API
  if (!audioSource) {
    audioSource = audioContext.createMediaElementSource(audioElement);
    connectAudioNodes();
  }
}

// Setup audio nodes
function setupAudioNodes() {
  // Gain (volume) node
  gainNode = audioContext.createGain();
  
  // Bass filter (low shelf)
  bassFilter = audioContext.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 200;
  
  // Treble filter (high shelf)
  trebleFilter = audioContext.createBiquadFilter();
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 3000;
  
  // Convolver for reverb (we'll create impulse response)
  convolver = audioContext.createConvolver();
  createReverbImpulse();
  
  // Delay for echo
  delayNode = audioContext.createDelay(2.0);
  feedbackGain = audioContext.createGain();
  feedbackGain.gain.value = 0;
}

// Connect audio nodes
function connectAudioNodes() {
  // Create dry/wet mix for reverb
  const dryGain = audioContext.createGain();
  const wetGain = audioContext.createGain();
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;
  
  // Main signal chain: source -> bass -> treble -> gain -> destination
  audioSource.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(gainNode);
  
  // Echo feedback loop
  gainNode.connect(delayNode);
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  
  // Reverb wet/dry mix
  gainNode.connect(dryGain);
  gainNode.connect(convolver);
  convolver.connect(wetGain);
  
  // Mix everything to destination
  dryGain.connect(audioContext.destination);
  wetGain.connect(audioContext.destination);
  delayNode.connect(audioContext.destination);
  
  // Store wet gain for reverb control
  window.reverbWetGain = wetGain;
}

// Create reverb impulse response
function createReverbImpulse() {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * 2; // 2 second reverb
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
  }
  
  convolver.buffer = impulse;
}

// Playback controls
function playAudio() {
  if (audioElement) {
    audioElement.play();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    isPlaying = true;
  }
}

function pauseAudio() {
  if (audioElement) {
    audioElement.pause();
    isPlaying = false;
  }
}

function stopAudio() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    isPlaying = false;
  }
}

// Download processed audio
async function downloadProcessedAudio() {
  if (!audioElement || !audioContext) {
    alert('Please upload an audio file first!');
    return;
  }

  // Pause current playback
  const wasPlaying = !audioElement.paused;
  pauseAudio();

  try {
    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      2, // stereo
      audioContext.sampleRate * audioElement.duration,
      audioContext.sampleRate
    );

    // Fetch the audio file and decode it
    const response = await fetch(audioElement.src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);

    // Create source from buffer
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Recreate all effects in offline context
    const offlineGain = offlineContext.createGain();
    offlineGain.gain.value = gainNode.gain.value;

    const offlineBass = offlineContext.createBiquadFilter();
    offlineBass.type = 'lowshelf';
    offlineBass.frequency.value = 200;
    offlineBass.gain.value = bassFilter.gain.value;

    const offlineTreble = offlineContext.createBiquadFilter();
    offlineTreble.type = 'highshelf';
    offlineTreble.frequency.value = 3000;
    offlineTreble.gain.value = trebleFilter.gain.value;

    const offlineConvolver = offlineContext.createConvolver();
    offlineConvolver.buffer = convolver.buffer;

    const offlineDelay = offlineContext.createDelay(2.0);
    offlineDelay.delayTime.value = delayNode.delayTime.value;

    const offlineFeedback = offlineContext.createGain();
    offlineFeedback.gain.value = feedbackGain.gain.value;

    // Recreate dry/wet mix
    const dryGain = offlineContext.createGain();
    const wetGain = offlineContext.createGain();
    dryGain.gain.value = 1;
    wetGain.gain.value = window.reverbWetGain ? window.reverbWetGain.gain.value : 0;

    // Connect nodes
    source.connect(offlineBass);
    offlineBass.connect(offlineTreble);
    offlineTreble.connect(offlineGain);

    offlineGain.connect(offlineDelay);
    offlineDelay.connect(offlineFeedback);
    offlineFeedback.connect(offlineDelay);

    offlineGain.connect(dryGain);
    offlineGain.connect(offlineConvolver);
    offlineConvolver.connect(wetGain);

    dryGain.connect(offlineContext.destination);
    wetGain.connect(offlineContext.destination);
    offlineDelay.connect(offlineContext.destination);

    // Start rendering
    source.start();
    const renderedBuffer = await offlineContext.startRendering();

    // Convert to WAV and download
    const wav = audioBufferToWav(renderedBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-audio.wav';
    a.click();

    URL.revokeObjectURL(url);

    // Resume playback if it was playing
    if (wasPlaying) {
      playAudio();
    }
  } catch (error) {
    console.error('Error downloading audio:', error);
    alert('Failed to download audio. Please try again.');
  }
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
  const length = buffer.length * buffer.numberOfChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  const channels = [];
  let offset = 0;
  let pos = 0;

  // Write WAV header
  const setUint16 = (data) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };
  const setUint32 = (data) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  // "RIFF" chunk descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // "fmt " sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // subchunk size
  setUint16(1); // audio format (1 = PCM)
  setUint16(buffer.numberOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * buffer.numberOfChannels * 2); // byte rate
  setUint16(buffer.numberOfChannels * 2); // block align
  setUint16(16); // bits per sample

  // "data" sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // chunk size

  // Write interleaved audio data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return arrayBuffer;
}

// Filter updates
function updateVolume(event) {
  const value = parseFloat(event.target.value);
  if (gainNode) {
    gainNode.gain.value = value;
  }
  document.getElementById('volume-value').textContent = `${Math.round(value * 100)}%`;
}

function updateBass(event) {
  const value = parseFloat(event.target.value);
  if (bassFilter) {
    bassFilter.gain.value = value;
  }
  document.getElementById('bass-value').textContent = `${value} dB`;
}

function updateTreble(event) {
  const value = parseFloat(event.target.value);
  if (trebleFilter) {
    trebleFilter.gain.value = value;
  }
  document.getElementById('treble-value').textContent = `${value} dB`;
}

function updateReverb(event) {
  const value = parseFloat(event.target.value);
  if (window.reverbWetGain) {
    window.reverbWetGain.gain.value = value;
  }
  document.getElementById('reverb-value').textContent = `${Math.round(value * 100)}%`;
}

function updateEcho(event) {
  const value = parseFloat(event.target.value);
  if (delayNode) {
    delayNode.delayTime.value = value;
  }
  document.getElementById('echo-value').textContent = `${value.toFixed(1)}s`;
}

function updateEchoFeedback(event) {
  const value = parseFloat(event.target.value);
  if (feedbackGain) {
    feedbackGain.gain.value = value;
  }
  document.getElementById('echo-feedback-value').textContent = `${Math.round(value * 100)}%`;
}

// Reset all filters
function resetFilters() {
  document.getElementById('volume-slider').value = 1;
  document.getElementById('bass-slider').value = 0;
  document.getElementById('treble-slider').value = 0;
  document.getElementById('reverb-slider').value = 0;
  document.getElementById('echo-slider').value = 0;
  document.getElementById('echo-feedback-slider').value = 0;
  
  if (gainNode) gainNode.gain.value = 1;
  if (bassFilter) bassFilter.gain.value = 0;
  if (trebleFilter) trebleFilter.gain.value = 0;
  if (window.reverbWetGain) window.reverbWetGain.gain.value = 0;
  if (delayNode) delayNode.delayTime.value = 0;
  if (feedbackGain) feedbackGain.gain.value = 0;
  
  document.getElementById('volume-value').textContent = '100%';
  document.getElementById('bass-value').textContent = '0 dB';
  document.getElementById('treble-value').textContent = '0 dB';
  document.getElementById('reverb-value').textContent = '0%';
  document.getElementById('echo-value').textContent = '0s';
  document.getElementById('echo-feedback-value').textContent = '0%';
}

// ============= FAVORITES MANAGEMENT =============

// Load favorites from localStorage
function loadFavorites() {
  const favorites = getFavorites();
  favorites.forEach(effectId => {
    const star = document.querySelector(`.favorite-star[data-effect="${effectId}"]`);
    if (star) {
      star.src = '../public/images/icons/yellow-star.svg';
      star.classList.add('favorited');
    }
  });
}

// Get favorites array from localStorage
function getFavorites() {
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save favorites array to localStorage
function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// Toggle favorite status
function toggleFavorite(event) {
  const star = event.target;
  const effectId = star.dataset.effect;
  const favorites = getFavorites();
  
  if (favorites.includes(effectId)) {
    // Remove from favorites
    const index = favorites.indexOf(effectId);
    favorites.splice(index, 1);
    star.src = '../public/images/icons/empty-star.svg';
    star.classList.remove('favorited');
  } else {
    // Add to favorites
    favorites.push(effectId);
    star.src = '../public/images/icons/yellow-star.svg';
    star.classList.add('favorited');
  }
  
  saveFavorites(favorites);
  sortEffectsByFavorites();
}

// Sort effects by favorites (favorited ones go to top, after volume)
function sortEffectsByFavorites() {
  const filtersSection = document.getElementById('filters-section');
  const volumeControl = document.querySelector('.filter-control[data-effect-id="volume"]');
  const effectControls = Array.from(document.querySelectorAll('.filter-control[data-effect-id]'))
    .filter(el => el.dataset.effectId !== 'volume'); // Exclude volume from sorting
  const favorites = getFavorites();
  
  // Sort: favorited effects first, then non-favorited
  effectControls.sort((a, b) => {
    const aId = a.dataset.effectId;
    const bId = b.dataset.effectId;
    const aFav = favorites.includes(aId);
    const bFav = favorites.includes(bId);
    
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0; // Maintain original order within same category
  });
  
  // Re-insert in sorted order after volume control (volume stays at top)
  const resetButton = document.getElementById('reset-filters');
  effectControls.forEach(control => {
    filtersSection.insertBefore(control, resetButton);
  });
}

// Initialize on load
init();
