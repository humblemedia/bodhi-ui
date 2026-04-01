import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { signal } from '../src/signal.js';

describe('signal', () => {
  it('holds and returns a value', () => {
    const s = signal(42);
    assert.equal(s.get(), 42);
  });

  it('updates value with set()', () => {
    const s = signal('a');
    s.set('b');
    assert.equal(s.get(), 'b');
  });

  it('notifies subscribers asynchronously (batched)', async () => {
    const s = signal(0);
    const calls = [];
    s.subscribe(v => calls.push(v));

    s.set(1);
    s.set(2);
    s.set(3);

    // Synchronously, no calls yet (batched via microtask)
    assert.equal(calls.length, 0);

    // Wait for microtask flush
    await new Promise(r => queueMicrotask(r));
    // Should receive only the final value (3)
    assert.equal(calls.length, 1);
    assert.equal(calls[0], 3);
  });

  it('does not notify if value is unchanged', async () => {
    const s = signal(5);
    const calls = [];
    s.subscribe(v => calls.push(v));

    s.set(5); // same value
    await new Promise(r => queueMicrotask(r));
    assert.equal(calls.length, 0);
  });

  it('unsubscribe stops notifications', async () => {
    const s = signal(0);
    const calls = [];
    const unsub = s.subscribe(v => calls.push(v));

    unsub();
    s.set(1);
    await new Promise(r => queueMicrotask(r));
    assert.equal(calls.length, 0);
  });

  it('multiple subscribers all receive updates', async () => {
    const s = signal(0);
    const a = [], b = [];
    s.subscribe(v => a.push(v));
    s.subscribe(v => b.push(v));

    s.set(10);
    await new Promise(r => queueMicrotask(r));
    assert.deepEqual(a, [10]);
    assert.deepEqual(b, [10]);
  });

  it('tracks subscriber count via .size', () => {
    const s = signal(0);
    assert.equal(s.size, 0);
    const u1 = s.subscribe(() => {});
    assert.equal(s.size, 1);
    const u2 = s.subscribe(() => {});
    assert.equal(s.size, 2);
    u1();
    assert.equal(s.size, 1);
    u2();
    assert.equal(s.size, 0);
  });
});
