/**
 * Nāda Library — metadata indexing and OPFS caching
 */

import { library } from './app.js';

/**
 * Index audio files — parse metadata and build library structure.
 * Runs metadata parsing in a Web Worker when available.
 */
export async function indexFiles(audioFiles) {
  const tracks = [];

  for (const file of audioFiles) {
    try {
      // Dynamic import — music-metadata is a browser dependency
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
      // Fallback: use filename as title
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
  }

  // Build artist/album structure
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

  // Sort tracks within albums by track number
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

  // Cache to OPFS if available
  await cacheLibrary(tracks);
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
