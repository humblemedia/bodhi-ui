/**
 * Cetanā List — keyed list rendering with efficient diffing
 *
 * Renders a list of items into a container element, keyed by identity.
 * On updates: inserts new, removes stale, optionally updates existing,
 * and reorders to match the new sequence.
 */

export function list(container, itemsSignal, opts) {
  const { key, render, update } = opts;
  let keyMap = new Map(); // key → { el, item }

  function sync(items) {
    const newKeys = new Set();
    const newMap = new Map();

    // Build new entries, reuse existing
    for (const item of items) {
      const k = key(item);
      newKeys.add(k);

      if (keyMap.has(k)) {
        const entry = keyMap.get(k);
        if (update) update(entry.el, item);
        entry.item = item;
        newMap.set(k, entry);
      } else {
        const el = render(item);
        newMap.set(k, { el, item });
      }
    }

    // Remove stale
    for (const [k, entry] of keyMap) {
      if (!newKeys.has(k)) entry.el.remove();
    }

    // Reorder / insert
    let prev = null;
    for (const item of items) {
      const k = key(item);
      const entry = newMap.get(k);
      const next = prev ? prev.nextSibling : container.firstChild;
      if (entry.el !== next) {
        container.insertBefore(entry.el, next);
      }
      prev = entry.el;
    }

    keyMap = newMap;
  }

  // Initial render
  sync(itemsSignal.get() || []);

  // Subscribe to updates
  const unsub = itemsSignal.subscribe(items => sync(items || []));

  return unsub;
}
