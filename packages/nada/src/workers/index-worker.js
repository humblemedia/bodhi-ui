/**
 * Nada Index Worker — parses audio metadata off the main thread.
 *
 * Receives ArrayBuffer + filename pairs, returns parsed metadata.
 * Posts progress messages so the UI can show real counts.
 */

/* global self, importScripts */

self.addEventListener('message', async (event) => {
  const { files } = event.data; // Array of { name, size, buffer }
  const total = files.length;
  const tracks = [];

  for (let i = 0; i < total; i++) {
    const { name, size, buffer } = files[i];
    try {
      const mm = await import('music-metadata');
      const blob = new Blob([buffer]);
      const metadata = await mm.parseBlob(blob, { skipCovertArt: true });
      tracks.push({
        id: name + size,
        title: metadata.common.title || name.replace(/\.[^.]+$/, ''),
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        track: metadata.common.track?.no || 0,
        year: metadata.common.year || null,
        duration: metadata.format.duration || 0,
        fileName: name,
        fileSize: size,
      });
    } catch {
      tracks.push({
        id: name + size,
        title: name.replace(/\.[^.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        track: 0,
        year: null,
        duration: 0,
        fileName: name,
        fileSize: size,
      });
    }

    // Post progress — real count, not fake animation
    self.postMessage({ type: 'progress', current: i + 1, total });
  }

  self.postMessage({ type: 'done', tracks });
});
