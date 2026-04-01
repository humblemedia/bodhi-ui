import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { signal } from '../src/signal.js';
import { list } from '../src/list.js';

// Minimal DOM shim for Node.js testing
function createContainer() {
  const children = [];
  const container = {
    get firstChild() { return children[0] || null; },
    get childNodes() { return [...children]; },
    get textContent() { return children.map(c => c.textContent).join(''); },
    insertBefore(node, ref) {
      const refIdx = ref ? children.indexOf(ref) : -1;
      const existIdx = children.indexOf(node);
      if (existIdx >= 0) children.splice(existIdx, 1);
      if (ref && refIdx >= 0) {
        children.splice(refIdx, 0, node);
      } else {
        children.push(node);
      }
    },
  };
  // Give each "element" a remove() and nextSibling
  function makeEl(text) {
    const el = {
      textContent: text,
      remove() {
        const idx = children.indexOf(el);
        if (idx >= 0) children.splice(idx, 1);
      },
      get nextSibling() {
        const idx = children.indexOf(el);
        return idx >= 0 && idx < children.length - 1 ? children[idx + 1] : null;
      },
    };
    return el;
  }
  return { container, children, makeEl };
}

describe('list', () => {
  it('renders initial items', () => {
    const { container, children, makeEl } = createContainer();
    const items = signal([{ id: 1, text: 'a' }, { id: 2, text: 'b' }]);

    list(container, items, {
      key: i => i.id,
      render: i => makeEl(i.text),
    });

    assert.equal(children.length, 2);
    assert.equal(children[0].textContent, 'a');
    assert.equal(children[1].textContent, 'b');
  });

  it('inserts new items', async () => {
    const { container, children, makeEl } = createContainer();
    const items = signal([{ id: 1, text: 'a' }]);

    list(container, items, {
      key: i => i.id,
      render: i => makeEl(i.text),
    });

    items.set([{ id: 1, text: 'a' }, { id: 2, text: 'b' }]);
    await new Promise(r => queueMicrotask(r));

    assert.equal(children.length, 2);
    assert.equal(children[1].textContent, 'b');
  });

  it('removes stale items', async () => {
    const { container, children, makeEl } = createContainer();
    const items = signal([{ id: 1, text: 'a' }, { id: 2, text: 'b' }]);

    list(container, items, {
      key: i => i.id,
      render: i => makeEl(i.text),
    });

    items.set([{ id: 2, text: 'b' }]);
    await new Promise(r => queueMicrotask(r));

    assert.equal(children.length, 1);
    assert.equal(children[0].textContent, 'b');
  });

  it('reorders items', async () => {
    const { container, children, makeEl } = createContainer();
    const items = signal([{ id: 1, text: 'a' }, { id: 2, text: 'b' }, { id: 3, text: 'c' }]);

    list(container, items, {
      key: i => i.id,
      render: i => makeEl(i.text),
    });

    items.set([{ id: 3, text: 'c' }, { id: 1, text: 'a' }, { id: 2, text: 'b' }]);
    await new Promise(r => queueMicrotask(r));

    assert.equal(children[0].textContent, 'c');
    assert.equal(children[1].textContent, 'a');
    assert.equal(children[2].textContent, 'b');
  });

  it('updates existing items via update callback', async () => {
    const { container, children, makeEl } = createContainer();
    const items = signal([{ id: 1, text: 'old' }]);

    list(container, items, {
      key: i => i.id,
      render: i => makeEl(i.text),
      update: (el, i) => { el.textContent = i.text; },
    });

    const original = children[0];
    items.set([{ id: 1, text: 'new' }]);
    await new Promise(r => queueMicrotask(r));

    // Same element, updated content
    assert.equal(children[0], original);
    assert.equal(children[0].textContent, 'new');
  });

  it('handles mixed insert + remove + reorder', async () => {
    const { container, children, makeEl } = createContainer();
    const items = signal([
      { id: 1, text: 'a' },
      { id: 2, text: 'b' },
      { id: 3, text: 'c' },
    ]);

    list(container, items, {
      key: i => i.id,
      render: i => makeEl(i.text),
    });

    // Remove 2, add 4, reorder
    items.set([
      { id: 3, text: 'c' },
      { id: 4, text: 'd' },
      { id: 1, text: 'a' },
    ]);
    await new Promise(r => queueMicrotask(r));

    assert.equal(children.length, 3);
    assert.equal(children[0].textContent, 'c');
    assert.equal(children[1].textContent, 'd');
    assert.equal(children[2].textContent, 'a');
  });

  it('returns unsubscribe function', async () => {
    const { container, children, makeEl } = createContainer();
    const items = signal([{ id: 1, text: 'a' }]);

    const unsub = list(container, items, {
      key: i => i.id,
      render: i => makeEl(i.text),
    });

    unsub();
    items.set([{ id: 1, text: 'a' }, { id: 2, text: 'b' }]);
    await new Promise(r => queueMicrotask(r));

    // No update after unsubscribe
    assert.equal(children.length, 1);
  });
});
