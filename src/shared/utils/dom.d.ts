/**
 * DOM manipulation utilities
 */
/**
 * Wait for an element to appear in the DOM
 */
export declare function waitForElement<T extends Element>(selector: string, timeout?: number): Promise<T | null>;
/**
 * Check if element is in fullscreen mode
 */
export declare function isFullscreen(): boolean;
/**
 * Get the fullscreen element
 */
export declare function getFullscreenElement(): Element | null;
/**
 * Create a container for injecting Svelte components
 */
export declare function createContainer(id: string, className?: string): HTMLDivElement;
/**
 * Inject a container into the DOM at the appropriate location
 */
export declare function injectContainer(container: HTMLElement, parent?: HTMLElement): void;
//# sourceMappingURL=dom.d.ts.map