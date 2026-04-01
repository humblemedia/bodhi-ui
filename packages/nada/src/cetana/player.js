/**
 * Nāda Player — Web Audio API playback
 *
 * Nothing auto-plays. Ever. The user always initiates playback.
 */

import { signal } from '@bodhi/cetana';
import { currentTrack, isPlaying, queue, volume } from './app.js';

let audioCtx = null;
let sourceNode = null;
let gainNode = null;
let audioElement = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
  }
  return audioCtx;
}

export async function playTrack(track) {
  const ctx = getAudioContext();

  // Stop current playback
  if (audioElement) {
    audioElement.pause();
    audioElement.src = '';
  }

  // Create object URL from file
  const url = URL.createObjectURL(track.file);
  audioElement = new Audio(url);

  // Connect through Web Audio for gain control
  sourceNode = ctx.createMediaElementSource(audioElement);
  sourceNode.connect(gainNode);

  // Set volume
  gainNode.gain.value = volume.get() / 100;

  currentTrack.set(track);
  audioElement.play();
  isPlaying.set(true);

  // MediaSession API
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
    });
    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
  }

  audioElement.addEventListener('ended', () => {
    isPlaying.set(false);
    nextTrack();
  });
}

export function togglePlay() {
  if (!audioElement) return;
  if (audioElement.paused) {
    audioElement.play();
    isPlaying.set(true);
  } else {
    audioElement.pause();
    isPlaying.set(false);
  }
}

export function nextTrack() {
  const q = queue.get();
  if (q.length === 0) return;
  const current = currentTrack.get();
  const idx = q.findIndex(t => t.id === current?.id);
  const next = q[idx + 1] || q[0];
  if (next?.file) playTrack(next);
}

export function prevTrack() {
  const q = queue.get();
  if (q.length === 0) return;
  const current = currentTrack.get();
  const idx = q.findIndex(t => t.id === current?.id);
  const prev = q[idx - 1] || q[q.length - 1];
  if (prev?.file) playTrack(prev);
}

export function setVolume(event) {
  const val = Number(event?.target?.value ?? event);
  volume.set(val);
  if (gainNode) gainNode.gain.value = val / 100;
}

export function addToQueue(track) {
  queue.set([...queue.get(), track]);
}

export function removeFromQueue(trackId) {
  queue.set(queue.get().filter(t => t.id !== trackId));
}

export function clearQueue() {
  queue.set([]);
}
