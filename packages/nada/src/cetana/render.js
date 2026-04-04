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

  // 9. Move album-detail into garbha-content if needed
  const gc = root.querySelector('.garbha-content');
  const albumDetail = root.querySelector('article.album-detail, .album-detail');
  if (albumDetail && gc && albumDetail.parentElement !== gc) {
    albumDetail.setAttribute('data-bodhi-view', 'album-detail');
    albumDetail.id = 'album-detail';
    gc.appendChild(albumDetail);
  }

  // 10. Wire track list rendering
  wireTrackList(root, unsubs);

  // 11. Wire now-playing display
  wireNowPlaying(root, unsubs);

  return () => unsubs.forEach(fn => fn());
}

// Bind names whose values are arrays (rendered by wireGridLists, not text)
const LIST_BINDS = new Set([
  'artistCards', 'albumCards', 'queueItems', 'filteredTracks',
  'trackListItems', 'breadcrumb', 'breadcrumbLabel',
  'currentTrack',
]);

function wireTextBindings(root, unsubs) {
  const boundEls = root.querySelectorAll('[data-bodhi-bind]');
  for (const el of boundEls) {
    const bindName = el.dataset.bodhiBind;
    const sig = SIGNAL_MAP[bindName];
    if (!sig || typeof sig.subscribe !== 'function') continue;

    // Skip list/array signals — handled by wireGridLists or wireBreadcrumb
    if (LIST_BINDS.has(bindName)) continue;

    // Skip elements inside list containers (nested bind spans)
    if (el.closest('[data-bodhi-yantra="sangraha"], [data-bodhi-yantra="suci"]')) continue;

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
    // Clear compiled template content
    artistGrid.innerHTML = '';
    unsubs.push(paginatedArtists.subscribe(artists => {
      artistGrid.innerHTML = '';
      for (const artist of artists) {
        const card = document.createElement('article');
        card.className = 'bindu artist-card';
        card.dataset.bodhiYantra = 'bindu';
        card.dataset.itemId = artist.name;
        card.dataset.itemName = artist.name;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.innerHTML = `
          <h3 class="artist-name">${escapeHtml(artist.name)}</h3>
          <p class="artist-count">${escapeHtml(artist.albumCount + ' album' + (artist.albumCount !== 1 ? 's' : ''))}</p>
        `;
        card.addEventListener('click', () => selectArtist(artist.name));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectArtist(artist.name); }
        });
        artistGrid.appendChild(card);
      }
      renderPagination(artistGrid);
    }));
  }

  // Album grid
  const albumGrid = root.querySelector('[data-bodhi-component="AlbumsView"]');
  if (albumGrid) {
    albumGrid.innerHTML = '';
    unsubs.push(paginatedAlbums.subscribe(albums => {
      albumGrid.innerHTML = '';
      for (const album of albums) {
        const card = document.createElement('article');
        card.className = 'bindu album-card';
        card.dataset.bodhiYantra = 'bindu';
        card.dataset.itemId = `${album.artist}|||${album.title}`;
        card.dataset.itemName = album.title;
        card.dataset.itemArtist = album.artist;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.innerHTML = `
          <div class="album-art"></div>
          <h3 class="album-title">${escapeHtml(album.title)}</h3>
          <p class="album-artist">${escapeHtml(album.artist)}</p>
        `;
        card.addEventListener('click', () => selectAlbum(album.artist, album.title));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAlbum(album.artist, album.title); }
        });
        albumGrid.appendChild(card);
      }
      renderPagination(albumGrid);
    }));
  }

  // Queue list
  const queueList = root.querySelector('[data-bodhi-component="QueueView"]');
  if (queueList) {
    queueList.innerHTML = '';
    unsubs.push(queue.subscribe(items => {
      queueList.innerHTML = '';
      for (const track of items) {
        const row = document.createElement('article');
        row.className = 'bindu queue-item';
        row.dataset.bodhiYantra = 'bindu';
        row.dataset.itemId = track.id;
        row.innerHTML = `
          <span class="queue-track-title">${escapeHtml(track.title)}</span>
          <span class="queue-track-artist">${escapeHtml(track.artist)}</span>
          <button class="kriya queue-remove" type="button" aria-label="Remove from queue">✕</button>
        `;
        const removeBtn = row.querySelector('.queue-remove');
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeFromQueue(track.id);
        });
        queueList.appendChild(row);
      }
    }));
  }
}

function renderPagination(container) {
  const total = totalPages.get();
  if (total <= 1) return;
  const current = page.get();
  const nav = document.createElement('nav');
  nav.className = 'pagination';
  nav.setAttribute('aria-label', 'Page navigation');
  nav.innerHTML = `
    <button class="kriya pagination-prev" type="button" aria-label="Previous page" ${current === 0 ? 'disabled' : ''}>‹ Prev</button>
    <span class="pagination-info">Page ${current + 1} of ${total}</span>
    <button class="kriya pagination-next" type="button" aria-label="Next page" ${current >= total - 1 ? 'disabled' : ''}>Next ›</button>
  `;
  nav.querySelector('.pagination-prev').addEventListener('click', prevPage);
  nav.querySelector('.pagination-next').addEventListener('click', nextPage);
  container.appendChild(nav);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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

function wireTrackList(root, unsubs) {
  const trackList = root.querySelector('.track-list');
  if (!trackList) return;

  // Clear compiled template content
  trackList.innerHTML = '';
  trackList.style.cssText = 'list-style:none; padding:0; margin:0;';

  unsubs.push(filteredTracks.subscribe(tracks => {
    trackList.innerHTML = '';
    if (tracks.length === 0) return;

    tracks.forEach((track, i) => {
      const row = document.createElement('li');
      row.className = 'bindu track-row';
      row.setAttribute('tabindex', '0');
      row.style.cssText = 'display:flex; align-items:center; gap:1rem; padding:0.75rem 1rem; border-bottom:1px solid var(--nada-border, #ddd); cursor:pointer;';

      const num = document.createElement('span');
      num.className = 'track-num';
      num.style.cssText = 'min-width:2rem; color:var(--nada-text-muted, #888);';
      num.textContent = String(i + 1);

      const name = document.createElement('span');
      name.className = 'track-name';
      name.style.cssText = 'flex:1; font-weight:500;';
      name.textContent = track.title;

      const dur = document.createElement('span');
      dur.className = 'track-duration';
      dur.style.cssText = 'color:var(--nada-text-muted, #888);';
      dur.textContent = formatDuration(track.duration);

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'kriya track-play';
      playBtn.textContent = '\u25B6 Play';
      playBtn.style.cssText = 'padding:4px 12px; cursor:pointer; border:1px solid var(--nada-border,#ccc); border-radius:4px; background:var(--nada-accent, #4a6fa5); color:white; font-weight:500;';
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playTrack(track);
      });

      const queueBtn = document.createElement('button');
      queueBtn.type = 'button';
      queueBtn.className = 'kriya track-queue';
      queueBtn.textContent = '+ Queue';
      queueBtn.style.cssText = 'padding:4px 12px; cursor:pointer; border:1px solid var(--nada-border,#ccc); border-radius:4px; background:var(--nada-surface,#fff); color:var(--nada-text,#222);';
      queueBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToQueue(track);
      });

      row.append(num, name, dur, playBtn, queueBtn);
      row.addEventListener('click', () => playTrack(track));
      trackList.appendChild(row);
    });
  }));
}

function formatDuration(sec) {
  if (!sec) return '';
  return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
}

function wireNowPlaying(root, unsubs) {
  unsubs.push(trackTitle.subscribe(title => {
    const el = root.querySelector('.track-title');
    if (el) el.textContent = title;
  }));
  unsubs.push(trackArtist.subscribe(artist => {
    const el = root.querySelector('.track-artist');
    if (el) el.textContent = artist;
  }));
  unsubs.push(isPlaying.subscribe(playing => {
    const btn = root.querySelector('.ctrl-play');
    if (btn) btn.textContent = playing ? '\u23F8' : '\u25B6';
  }));
}
