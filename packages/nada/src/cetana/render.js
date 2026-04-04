/**
 * Nada Render — connects compiled Bodhi HTML to Cetana signals and actions.
 *
 * No eval, no dynamic lookup. Explicit mappings only.
 */

import { list } from '@bodhi/cetana';
import {
  folderPath, currentView, currentTrack, isPlaying,
  queue, volume, theme, library,
  trackTitle, trackArtist, libraryStats,
  openFolder, showArtists, showAlbums, showQueue, showSettings,
  toggleTheme, clearCache,
} from './app.js';
import {
  page, pageSize, totalPages,
  paginatedArtists, paginatedAlbums,
  selectedArtist, selectedAlbum, filteredTracks,
  breadcrumb,
  selectArtist, selectAlbum, showArtistAlbums, breadcrumbBack,
  nextPage, prevPage,
} from './views.js';
import { indexProgress } from './library.js';
import {
  togglePlay, nextTrack, prevTrack, setVolume,
  addToQueue, removeFromQueue, playTrack,
} from './player.js';

// ── Signal-to-bind mapping ───────────────────────────────────
// Keys = data-bodhi-bind values in compiled HTML
// Values = Cetana signals or computed values

const SIGNAL_MAP = {
  folderPath,
  trackTitle,
  trackArtist,
  artistCards: paginatedArtists,
  albumCards: paginatedAlbums,
  queueItems: queue,
  breadcrumb,
  indexProgress,
  currentTrack,
  libraryStats,
};

// ── Action-to-function mapping ───────────────────────────────
// Keys = data-bodhi-on-* values in compiled HTML
// Values = action functions

const ACTION_MAP = {
  openFolder,
  showArtists,
  showAlbums,
  showQueue,
  togglePlay,
  nextTrack,
  prevTrack,
  setVolume,
  toggleTheme,
  showSettings,
  clearCache,
  selectArtist,
  selectAlbum,
  showArtistAlbums,
  breadcrumbBack,
  nextPage,
  prevPage,
  playTrack,
  addToQueue,
  removeFromQueue,
};

/**
 * Inject compiled HTML and wire up signals + actions.
 */
export function renderApp(root, compiledHtml) {
  // 1. Inject compiled HTML
  root.innerHTML = compiledHtml;

  const unsubs = [];

  // 2. Wire text bindings — simple signal → textContent
  wireTextBindings(root, unsubs);

  // 3. Wire event listeners
  wireEventListeners(root);

  // 4. Wire view switching
  wireViewSwitching(root, unsubs);

  // 5. Wire dynamic lists (grids and queue)
  wireGridLists(root, unsubs);

  // 6. Wire breadcrumb
  wireBreadcrumb(root, unsubs);

  // 7. Wire progress indicator
  wireProgress(root, unsubs);

  // 8. Wire keyboard navigation
  wireKeyboard(root);

  return () => unsubs.forEach(fn => fn());
}

function wireTextBindings(root, unsubs) {
  const boundEls = root.querySelectorAll('[data-bodhi-bind]');
  for (const el of boundEls) {
    const bindName = el.dataset.bodhiBind;
    const sig = SIGNAL_MAP[bindName];
    if (!sig || typeof sig.subscribe !== 'function') continue;

    // Skip list containers — those are handled by wireGridLists
    const yantra = el.dataset.bodhiYantra;
    if (yantra === 'sangraha' || yantra === 'suci') continue;

    unsubs.push(sig.subscribe(value => {
      el.textContent = value ?? '';
    }));
  }
}

function wireEventListeners(root) {
  // Click handlers
  const clickEls = root.querySelectorAll('[data-bodhi-on-click]');
  for (const el of clickEls) {
    const actionName = el.dataset.bodhiOnClick;
    const fn = ACTION_MAP[actionName];
    if (!fn) continue;

    el.addEventListener('click', (e) => {
      // For list items, pass context from data attributes
      const itemData = el.closest('[data-item-id]');
      if (actionName === 'selectArtist' && itemData) {
        fn(itemData.dataset.itemName);
      } else if (actionName === 'selectAlbum' && itemData) {
        fn(itemData.dataset.itemArtist, itemData.dataset.itemName);
      } else if (actionName === 'playTrack' && itemData) {
        const track = findTrack(itemData.dataset.itemId);
        if (track) fn(track);
      } else if (actionName === 'removeFromQueue' && itemData) {
        fn(itemData.dataset.itemId);
      } else {
        fn(e);
      }
    });
  }

  // Input handlers
  const inputEls = root.querySelectorAll('[data-bodhi-on-input]');
  for (const el of inputEls) {
    const actionName = el.dataset.bodhiOnInput;
    const fn = ACTION_MAP[actionName];
    if (!fn) continue;
    el.addEventListener('input', fn);
  }
}

function wireViewSwitching(root, unsubs) {
  unsubs.push(currentView.subscribe(view => {
    // Show/hide view panels
    root.querySelectorAll('[data-bodhi-view]').forEach(v => {
      v.setAttribute('data-bodhi-hidden', v.id !== view ? 'true' : 'false');
    });
    // Update tab aria-selected
    root.querySelectorAll('[data-bodhi-tab]').forEach(btn => {
      btn.setAttribute('aria-selected', btn.dataset.bodhiTab === view ? 'true' : 'false');
    });
  }));
}

function wireGridLists(root, unsubs) {
  // Artist grid
  const artistGrid = root.querySelector('[data-bodhi-component="ArtistsView"]');
  if (artistGrid) {
    const template = artistGrid.querySelector('.artist-card');
    if (template) {
      template.remove();
      unsubs.push(paginatedArtists.subscribe(artists => {
        artistGrid.innerHTML = '';
        for (const artist of artists) {
          const card = template.cloneNode(true);
          card.dataset.itemId = artist.name;
          card.dataset.itemName = artist.name;
          const nameEl = card.querySelector('.artist-name');
          if (nameEl) nameEl.textContent = artist.name;
          const countEl = card.querySelector('.artist-count');
          if (countEl) countEl.textContent = `${artist.albumCount} album${artist.albumCount !== 1 ? 's' : ''}`;
          // Re-wire click
          card.addEventListener('click', () => selectArtist(artist.name));
          artistGrid.appendChild(card);
        }
      }));
    }
  }

  // Album grid
  const albumGrid = root.querySelector('[data-bodhi-component="AlbumsView"]');
  if (albumGrid) {
    const template = albumGrid.querySelector('.album-card');
    if (template) {
      template.remove();
      unsubs.push(paginatedAlbums.subscribe(albums => {
        albumGrid.innerHTML = '';
        for (const album of albums) {
          const card = template.cloneNode(true);
          card.dataset.itemId = `${album.artist}|||${album.title}`;
          card.dataset.itemName = album.title;
          card.dataset.itemArtist = album.artist;
          const titleEl = card.querySelector('.album-title');
          if (titleEl) titleEl.textContent = album.title;
          const artistEl = card.querySelector('.album-artist');
          if (artistEl) artistEl.textContent = album.artist;
          card.addEventListener('click', () => selectAlbum(album.artist, album.title));
          albumGrid.appendChild(card);
        }
      }));
    }
  }

  // Queue list
  const queueList = root.querySelector('[data-bodhi-component="QueueView"]');
  if (queueList) {
    const template = queueList.querySelector('.queue-item');
    if (template) {
      template.remove();
      unsubs.push(queue.subscribe(items => {
        queueList.innerHTML = '';
        for (const track of items) {
          const row = template.cloneNode(true);
          row.dataset.itemId = track.id;
          const titleEl = row.querySelector('.queue-track-title');
          if (titleEl) titleEl.textContent = track.title;
          const artistEl = row.querySelector('.queue-track-artist');
          if (artistEl) artistEl.textContent = track.artist;
          const removeBtn = row.querySelector('.queue-remove');
          if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              removeFromQueue(track.id);
            });
          }
          queueList.appendChild(row);
        }
      }));
    }
  }
}

function wireBreadcrumb(root, unsubs) {
  const bcNav = root.querySelector('.breadcrumb-nav');
  if (!bcNav) return;

  unsubs.push(breadcrumb.subscribe(crumbs => {
    bcNav.innerHTML = '';
    crumbs.forEach((crumb, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.textContent = ' \u203A ';
        sep.className = 'breadcrumb-sep';
        bcNav.appendChild(sep);
      }
      if (crumb.action) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'kriya breadcrumb-link';
        btn.textContent = crumb.label;
        btn.addEventListener('click', () => breadcrumbBack(i));
        bcNav.appendChild(btn);
      } else {
        const span = document.createElement('span');
        span.className = 'breadcrumb-current';
        span.textContent = crumb.label;
        bcNav.appendChild(span);
      }
    });
  }));
}

function wireProgress(root, unsubs) {
  // Find or create progress element
  let progressEl = root.querySelector('.index-progress');
  if (!progressEl) {
    progressEl = document.createElement('p');
    progressEl.className = 'index-progress';
    progressEl.setAttribute('aria-live', 'polite');
    const folderBar = root.querySelector('.folder-bar');
    if (folderBar) folderBar.appendChild(progressEl);
  }

  unsubs.push(indexProgress.subscribe(progress => {
    if (progress) {
      progressEl.textContent = `Indexing ${progress.current} of ${progress.total} files...`;
      progressEl.style.display = '';
    } else {
      progressEl.textContent = '';
      progressEl.style.display = 'none';
    }
  }));
}

function wireKeyboard(root) {
  root.addEventListener('keydown', (e) => {
    // Escape: navigate breadcrumb back
    if (e.key === 'Escape') {
      const crumbs = breadcrumb.get();
      if (crumbs.length > 0) {
        breadcrumbBack(crumbs.length - 2 >= 0 ? crumbs.length - 2 : 0);
      }
    }
  });

  // Move focus to first interactive element when view changes
  currentView.subscribe(() => {
    requestAnimationFrame(() => {
      const activePanel = root.querySelector('[data-bodhi-view]:not([data-bodhi-hidden="true"])');
      if (activePanel) {
        const firstFocusable = activePanel.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }
    });
  });
}

function findTrack(id) {
  const lib = library.get();
  return lib.tracks.find(t => t.id === id) || null;
}
