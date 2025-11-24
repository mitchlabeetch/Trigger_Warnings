/**
 * DOM manipulation utilities
 */

/**
 * Wait for an element to appear in the DOM
 */
export function waitForElement<T extends Element>(
  selector: string,
  timeout = 10000
): Promise<T | null> {
  return new Promise((resolve) => {
    const element = document.querySelector<T>(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector<T>(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Check if element is in fullscreen mode
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Get the fullscreen element
 */
export function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
}

/**
 * Create a container for injecting Svelte components
 */
export function createContainer(id: string, className?: string): HTMLDivElement {
  const container = document.createElement('div');
  container.id = id;
  if (className) {
    container.className = className;
  }
  return container;
}

/**
 * Inject a container into the DOM at the appropriate location
 */
export function injectContainer(container: HTMLElement, parent?: HTMLElement): void {
  const targetParent = parent || document.body;
  targetParent.appendChild(container);
}
