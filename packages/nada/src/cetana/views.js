/**
 * Nada Views — view switching, pagination, and breadcrumb drill-down
 *
 * Bodhi no-scroll constraint: content is paginated, not scrolled.
 */

import { signal, computed } from '@bodhi/cetana';
import { currentView, library } from './app.js';

// ── Pagination ───────────────────────────────────────────────

export const page = signal(0);
export const pageSize = signal(12); // items per page

// ── Breadcrumb drill-down ────────────────────────────────────

export const selectedArtist = signal(null);
export const selectedAlbum = signal(null);

export const breadcrumb = computed(() => {
  const crumbs = [];
  const view = currentView.get();
  const artist = selectedArtist.get();
  const album = selectedAlbum.get();

  if (view === 'artists' || view === 'albums' || view === 'album-detail') {
    if (artist) {
      crumbs.push({ label: 'Artists', action: 'showArtists' });
      crumbs.push({ label: artist, action: 'showArtistAlbums' });
    }
    if (album) {
      crumbs.push({ label: album.title });
    }
  }

  return crumbs;
}, [currentView, selectedArtist, selectedAlbum]);

// ── Filtered views for drill-down ────────────────────────────

export const filteredAlbums = computed(() => {
  const artist = selectedArtist.get();
  if (!artist) return library.get().albums;
  return library.get().albums.filter(a => a.artist === artist);
}, [selectedArtist, library]);

export const filteredTracks = computed(() => {
  const album = selectedAlbum.get();
  if (!album) return [];
  return album.tracks || [];
}, [selectedAlbum]);

// ── Paginated views ──────────────────────────────────────────

export const paginatedArtists = computed(() => {
  const artists = library.get().artists;
  const start = page.get() * pageSize.get();
  return artists.slice(start, start + pageSize.get());
}, [library, page, pageSize]);

export const paginatedAlbums = computed(() => {
  const albums = selectedArtist.get()
    ? filteredAlbums.get()
    : library.get().albums;
  const start = page.get() * pageSize.get();
  return albums.slice(start, start + pageSize.get());
}, [library, page, pageSize, selectedArtist, filteredAlbums]);

export const totalPages = computed(() => {
  const view = currentView.get();
  const lib = library.get();
  let items;
  if (view === 'artists') {
    items = lib.artists;
  } else if (view === 'albums') {
    items = selectedArtist.get() ? filteredAlbums.get() : lib.albums;
  } else if (view === 'album-detail') {
    items = filteredTracks.get();
  } else {
    items = [];
  }
  return Math.ceil(items.length / pageSize.get()) || 1;
}, [currentView, library, pageSize, selectedArtist, filteredAlbums, filteredTracks]);

// ── Navigation actions ───────────────────────────────────────

export function selectArtist(name) {
  selectedArtist.set(name);
  selectedAlbum.set(null);
  page.set(0);
  currentView.set('albums');
}

export function selectAlbum(artist, title) {
  const lib = library.get();
  const album = lib.albums.find(a => a.artist === artist && a.title === title);
  if (album) {
    selectedAlbum.set(album);
    page.set(0);
    currentView.set('album-detail');
  }
}

export function showArtistAlbums() {
  selectedAlbum.set(null);
  page.set(0);
  currentView.set('albums');
}

export function breadcrumbBack(index) {
  const crumbs = breadcrumb.get();
  if (index >= crumbs.length) return;
  const crumb = crumbs[index];
  if (crumb.action === 'showArtists') {
    selectedArtist.set(null);
    selectedAlbum.set(null);
    page.set(0);
    currentView.set('artists');
  } else if (crumb.action === 'showArtistAlbums') {
    showArtistAlbums();
  }
}

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
