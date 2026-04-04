/**
 * Nāda App — initialization, folder access, global signals
 */

import { signal, computed, mount } from '@bodhi/cetana';

// ── Global State ──────────────────────────────────────────────

export const folderHandle = signal(null);
export const folderPath = signal('No folder selected');
export const currentView = signal('artists');
export const library = signal({ artists: [], albums: [], tracks: [] });
export const currentTrack = signal(null);
export const isPlaying = signal(false);
export const queue = signal([]);
export const volume = signal(80);
export const theme = signal(
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light'
);

// ── Derived State ─────────────────────────────────────────────

export const artistCards = computed(
  () => library.get().artists,
  [library]
);

export const albumCards = computed(
  () => library.get().albums,
  [library]
);

export const trackTitle = computed(
  () => currentTrack.get()?.title ?? '',
  [currentTrack]
);

export const trackArtist = computed(
  () => currentTrack.get()?.artist ?? '',
  [currentTrack]
);

export const libraryStats = computed(
  () => {
    const lib = library.get();
    const a = lib.artists.length;
    const al = lib.albums.length;
    const t = lib.tracks.length;
    if (t === 0) return 'No music indexed';
    return `${a} artist${a !== 1 ? 's' : ''}, ${al} album${al !== 1 ? 's' : ''}, ${t} track${t !== 1 ? 's' : ''}`;
  },
  [library]
);

// ── Actions ───────────────────────────────────────────────────

export async function openFolder() {
  try {
    // Dynamic import — browser-fs-access is a browser dependency
    const { directoryOpen } = await import('browser-fs-access');
    const files = await directoryOpen({ recursive: true });
    const audioFiles = files.filter(f =>
      /\.(mp3|flac|aac|ogg|wav|m4a|opus|wma)$/i.test(f.name)
    );
    folderPath.set(files[0]?.webkitRelativePath?.split('/')[0] || 'Music Folder');
    folderHandle.set(audioFiles);
    // Trigger indexing in library module
    const { indexFiles } = await import('./library.js');
    indexFiles(audioFiles);
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Folder access failed:', err);
    }
  }
}

export function showArtists() { currentView.set('artists'); }
export function showAlbums() { currentView.set('albums'); }
export function showQueue() { currentView.set('queue'); }
export function showSettings() { currentView.set('settings'); }

export async function clearCache() {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return;
    const root = await navigator.storage.getDirectory();
    await root.removeEntry('nada-library.json');
  } catch {
    // File may not exist — that's fine
  }
}

export function toggleTheme() {
  theme.set(theme.get() === 'dark' ? 'light' : 'dark');
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-bodhi-theme', theme.get());
  }
}

// ── App Init ──────────────────────────────────────────────────

export function initApp(root) {
  return mount(root, (el) => {
    const unsubs = [];

    // View switching
    unsubs.push(currentView.subscribe(view => {
      el.querySelectorAll('[data-bodhi-view]').forEach(v => {
        v.setAttribute('data-bodhi-hidden', v.id !== view ? 'true' : 'false');
      });
      el.querySelectorAll('[data-bodhi-tab]').forEach(btn => {
        btn.setAttribute('aria-selected', btn.dataset.bodhiTab === view ? 'true' : 'false');
      });
    }));

    // Theme
    unsubs.push(theme.subscribe(t => {
      document.documentElement.setAttribute('data-bodhi-theme', t);
    }));

    // Connect compiled HTML to signals via render module (browser only)
    if (typeof document !== 'undefined') {
      import('./render.js').then(({ renderApp }) => {
        const compiledHtml = el.innerHTML;
        if (compiledHtml.trim()) {
          const cleanup = renderApp(el, compiledHtml);
          unsubs.push(cleanup);
        }
      }).catch(() => {
        // render.js not available (e.g. in tests)
      });
    }

    return () => unsubs.forEach(fn => fn());
  });
}
