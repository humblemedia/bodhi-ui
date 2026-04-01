import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { signal } from '../src/signal.js';
import { computed } from '../src/computed.js';

describe('computed', () => {
  it('derives initial value from dependencies', () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a.get() + b.get(), [a, b]);
    assert.equal(sum.get(), 5);
  });

  it('auto-updates when dependency changes', async () => {
    const count = signal(1);
    const doubled = computed(() => count.get() * 2, [count]);

    count.set(5);
    await new Promise(r => queueMicrotask(r));
    assert.equal(doubled.get(), 10);
  });

  it('notifies subscribers on change', async () => {
    const x = signal(10);
    const half = computed(() => x.get() / 2, [x]);
    const calls = [];
    half.subscribe(v => calls.push(v));

    x.set(20);
    await new Promise(r => queueMicrotask(r));
    // Computed subscriber gets notified after the computed re-evaluates
    await new Promise(r => queueMicrotask(r));
    assert.ok(calls.includes(10));
  });

  it('dispose() stops tracking dependencies', async () => {
    const x = signal(1);
    const c = computed(() => x.get() + 1, [x]);

    c.dispose();
    x.set(100);
    await new Promise(r => queueMicrotask(r));
    // Value should still be the old computed value since disposed
    assert.equal(c.get(), 2);
  });
});
