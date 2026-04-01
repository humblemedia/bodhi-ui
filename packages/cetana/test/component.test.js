import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mount } from '../src/component.js';
import { signal } from '../src/signal.js';

describe('mount', () => {
  it('calls setup with the element', () => {
    const el = { id: 'test' };
    let received = null;
    mount(el, (e) => {
      received = e;
      return () => {};
    });
    assert.equal(received, el);
  });

  it('returns a cleanup function', () => {
    let cleaned = false;
    const cleanup = mount({}, () => {
      return () => { cleaned = true; };
    });
    assert.equal(cleaned, false);
    cleanup();
    assert.equal(cleaned, true);
  });

  it('integrates with signals for subscription cleanup', async () => {
    const s = signal(0);
    let lastValue = null;

    const cleanup = mount({}, () => {
      const unsub = s.subscribe(v => { lastValue = v; });
      return () => unsub();
    });

    s.set(42);
    await new Promise(r => queueMicrotask(r));
    assert.equal(lastValue, 42);

    cleanup();
    assert.equal(s.size, 0); // subscription removed
  });

  it('handles setup that returns nothing', () => {
    // Should not throw
    const cleanup = mount({}, () => {});
    cleanup();
  });
});
