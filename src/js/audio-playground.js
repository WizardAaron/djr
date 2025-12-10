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

// Initialize page
async function init() {
  await loadHeaderFooter();
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
  const fileInput = document.getElementById('audio-file');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resetBtn = document.getElementById('reset-filters');

  fileInput.addEventListener('change', handleFileUpload);
  playBtn.addEventListener('click', playAudio);
  pauseBtn.addEventListener('click', pauseAudio);
  stopBtn.addEventListener('click', stopAudio);
  resetBtn.addEventListener('click', resetFilters);

  // Filter sliders
  document.getElementById('volume-slider').addEventListener('input', updateVolume);
  document.getElementById('bass-slider').addEventListener('input', updateBass);
  document.getElementById('treble-slider').addEventListener('input', updateTreble);
  document.getElementById('reverb-slider').addEventListener('input', updateReverb);
  document.getElementById('echo-slider').addEventListener('input', updateEcho);
  document.getElementById('echo-feedback-slider').addEventListener('input', updateEchoFeedback);
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

// Initialize on load
init();
