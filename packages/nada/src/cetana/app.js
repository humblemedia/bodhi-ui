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

    return () => unsubs.forEach(fn => fn());
  });
}
