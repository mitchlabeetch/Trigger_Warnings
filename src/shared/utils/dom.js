/**
 * DOM manipulation utilities
 */
/**
 * Wait for an element to appear in the DOM
 */
export function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
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
export function isFullscreen() {
    return !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement);
}
/**
 * Get the fullscreen element
 */
export function getFullscreenElement() {
    return (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null);
}
/**
 * Create a container for injecting Svelte components
 */
export function createContainer(id, className) {
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
export function injectContainer(container, parent) {
    const targetParent = parent || document.body;
    // Ensure parent has position: relative for absolute positioned children
    const computedStyle = window.getComputedStyle(targetParent);
    if (computedStyle.position === 'static') {
        targetParent.style.position = 'relative';
    }
    targetParent.appendChild(container);
}
//# sourceMappingURL=dom.js.map