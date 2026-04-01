/**
 * Nāda Views — view switching and pagination
 *
 * Bodhi no-scroll constraint: content is paginated, not scrolled.
 */

import { signal, computed } from '@bodhi/cetana';
import { currentView, library } from './app.js';

export const page = signal(0);
export const pageSize = signal(12); // items per page

export const paginatedArtists = computed(() => {
  const artists = library.get().artists;
  const start = page.get() * pageSize.get();
  return artists.slice(start, start + pageSize.get());
}, [library, page, pageSize]);

export const paginatedAlbums = computed(() => {
  const albums = library.get().albums;
  const start = page.get() * pageSize.get();
  return albums.slice(start, start + pageSize.get());
}, [library, page, pageSize]);

export const totalPages = computed(() => {
  const view = currentView.get();
  const lib = library.get();
  const items = view === 'artists' ? lib.artists : lib.albums;
  return Math.ceil(items.length / pageSize.get()) || 1;
}, [currentView, library, pageSize]);

export function nextPage() {
  if (page.get() < totalPages.get() - 1) {
    page.set(page.get() + 1);
  }
}

export function prevPage() {
  if (page.get() > 0) {
    page.set(page.get() - 1);
  }
}

// Reset page when view changes
currentView.subscribe(() => page.set(0));
