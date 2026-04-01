/**
 * Cetanā Signal — reactive value primitive
 *
 * A signal holds a value and notifies subscribers when it changes.
 * Updates are batched: multiple synchronous .set() calls coalesce
 * into a single notification flush via microtask.
 */

let pending = null;

function flush() {
  const batch = pending;
  pending = null;
  for (const [sig, subs] of batch) {
    const val = sig.get();
    for (const fn of subs) fn(val);
  }
}

export function signal(initial) {
  let value = initial;
  const subscribers = new Set();

  return {
    get() { return value; },

    set(next) {
      if (next === value) return;
      value = next;
      if (subscribers.size === 0) return;
      if (pending === null) {
        pending = new Map();
        queueMicrotask(flush);
      }
      // Snapshot current subscribers for this signal
      pending.set(this, new Set(subscribers));
    },

    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    /** Number of active subscribers (for testing) */
    get size() { return subscribers.size; },
  };
}
