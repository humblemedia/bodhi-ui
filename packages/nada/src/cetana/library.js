/**
 * Nada Library — metadata indexing and OPFS caching
 */

import { signal } from '@bodhi/cetana';
import { library } from './app.js';

/** Progress signal: { current, total } or null when idle */
export const indexProgress = signal(null);

/**
 * Index audio files — parse metadata and build library structure.
 * Runs metadata parsing in a Web Worker when available,
 * falls back to main thread in environments without Worker support.
 */
export async function indexFiles(audioFiles) {
  let tracks;

  if (typeof Worker !== 'undefined') {
    tracks = await indexInWorker(audioFiles);
  } else {
    tracks = await indexOnMainThread(audioFiles);
  }

  buildLibrary(tracks, audioFiles);
  indexProgress.set(null);
  await cacheLibrary(tracks);
}

/**
 * Parse metadata in a Web Worker (off main thread).
 * Files are read to ArrayBuffer on main thread and transferred.
 */
async function indexInWorker(audioFiles) {
  const fileData = await Promise.all(
    audioFiles.map(async (file) => ({
      name: file.name,
      size: file.size,
      buffer: await file.arrayBuffer(),
    }))
  );

  return new Promise((resolve) => {
    const worker = new Worker(
      new URL('../workers/index-worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        indexProgress.set({ current: msg.current, total: msg.total });
      } else if (msg.type === 'done') {
        worker.terminate();
        // Re-attach file references (can't transfer File objects)
        const fileMap = new Map(audioFiles.map(f => [f.name + f.size, f]));
        const tracks = msg.tracks.map(t => ({
          ...t,
          file: fileMap.get(t.id) || null,
        }));
        resolve(tracks);
      }
    });

    // Transfer buffers for zero-copy
    const transferables = fileData.map(f => f.buffer);
    worker.postMessage({ files: fileData }, transferables);
  });
}

/**
 * Parse metadata on the main thread (fallback for test/no-Worker envs).
 */
async function indexOnMainThread(audioFiles) {
  const tracks = [];
  const total = audioFiles.length;

  for (let i = 0; i < total; i++) {
    const file = audioFiles[i];
    try {
      const mm = await import('music-metadata');
      const metadata = await mm.parseBlob(file, { skipCovertArt: true });
      tracks.push({
        id: file.name + file.size,
        title: metadata.common.title || file.name.replace(/\.[^.]+$/, ''),
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        track: metadata.common.track?.no || 0,
        year: metadata.common.year || null,
        duration: metadata.format.duration || 0,
        file,
      });
    } catch {
      tracks.push({
        id: file.name + file.size,
        title: file.name.replace(/\.[^.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        track: 0,
        year: null,
        duration: 0,
        file,
      });
    }
    indexProgress.set({ current: i + 1, total });
  }

  return tracks;
}

/**
 * Build artist/album structure from tracks and set the library signal.
 */
function buildLibrary(tracks, audioFiles) {
  const artistMap = new Map();
  const albumMap = new Map();

  for (const track of tracks) {
    if (!artistMap.has(track.artist)) {
      artistMap.set(track.artist, { name: track.artist, albums: new Set() });
    }
    artistMap.get(track.artist).albums.add(track.album);

    const albumKey = `${track.artist}|||${track.album}`;
    if (!albumMap.has(albumKey)) {
      albumMap.set(albumKey, {
        title: track.album,
        artist: track.artist,
        year: track.year,
        tracks: [],
      });
    }
    albumMap.get(albumKey).tracks.push(track);
  }

  for (const album of albumMap.values()) {
    album.tracks.sort((a, b) => a.track - b.track);
  }

  library.set({
    artists: [...artistMap.values()].map(a => ({
      name: a.name,
      albumCount: a.albums.size,
    })).sort((a, b) => a.name.localeCompare(b.name)),
    albums: [...albumMap.values()].sort((a, b) => a.title.localeCompare(b.title)),
    tracks,
  });
}

async function cacheLibrary(tracks) {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return;
    const root = await navigator.storage.getDirectory();
    const file = await root.getFileHandle('nada-library.json', { create: true });
    const writable = await file.createWritable();
    const serializable = tracks.map(({ file, ...rest }) => rest);
    await writable.write(JSON.stringify(serializable));
    await writable.close();
  } catch {
    // OPFS not available — that's fine
  }
}

export async function loadCachedLibrary() {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return null;
    const root = await navigator.storage.getDirectory();
    const file = await root.getFileHandle('nada-library.json');
    const blob = await (await file.getFile()).text();
    return JSON.parse(blob);
  } catch {
    return null;
  }
}
