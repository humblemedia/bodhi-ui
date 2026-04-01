/**
 * Cetanā Component — mount/unmount lifecycle
 *
 * Mounts a component to a DOM element, running a setup function
 * that returns a cleanup function. Calling the returned cleanup
 * unmounts the component and releases all resources.
 */

export function mount(element, setup) {
  const cleanup = setup(element);
  return () => {
    if (typeof cleanup === 'function') cleanup();
  };
}
