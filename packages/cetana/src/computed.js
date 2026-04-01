/**
 * Cetanā Computed — derived reactive value
 *
 * A computed signal re-evaluates when any of its dependency signals change.
 * It exposes .get() and .subscribe() like a signal but has no .set().
 */

import { signal } from './signal.js';

export function computed(fn, deps) {
  const inner = signal(fn());
  const unsubs = [];

  for (const dep of deps) {
    unsubs.push(dep.subscribe(() => inner.set(fn())));
  }

  return {
    get() { return inner.get(); },
    subscribe(cb) { return inner.subscribe(cb); },
    dispose() { unsubs.forEach(u => u()); },
    get size() { return inner.size; },
  };
}
