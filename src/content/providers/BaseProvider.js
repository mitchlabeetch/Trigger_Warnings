/**
 * Base provider class with common functionality
 */
export class BaseProvider {
    callbacks = {
        onPlay: [],
        onPause: [],
        onSeek: [],
        onMediaChange: [],
    };
    currentMedia = null;
    observers = [];
    eventListeners = [];
    async initialize() {
        // Override in subclasses
    }
    onPlay(callback) {
        this.callbacks.onPlay.push(callback);
    }
    onPause(callback) {
        this.callbacks.onPause.push(callback);
    }
    onSeek(callback) {
        this.callbacks.onSeek.push(callback);
    }
    onMediaChange(callback) {
        this.callbacks.onMediaChange.push(callback);
    }
    triggerPlayCallbacks() {
        this.callbacks.onPlay.forEach((cb) => cb());
    }
    triggerPauseCallbacks() {
        this.callbacks.onPause.forEach((cb) => cb());
    }
    triggerSeekCallbacks(time) {
        this.callbacks.onSeek.forEach((cb) => cb(time));
    }
    async triggerMediaChangeCallbacks(media) {
        if (this.currentMedia?.id !== media.id) {
            this.currentMedia = media;
            this.callbacks.onMediaChange.forEach((cb) => cb(media));
        }
    }
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }
    observeDOM(target, options) {
        const observer = new MutationObserver((mutations) => {
            this.handleDOMMutations(mutations);
        });
        observer.observe(target, options);
        this.observers.push(observer);
        return observer;
    }
    handleDOMMutations(_mutations) {
        // Override in subclasses if needed
    }
    waitForElement(selector, timeout = 10000) {
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
    dispose() {
        // Clean up observers
        this.observers.forEach((observer) => observer.disconnect());
        this.observers = [];
        // Clean up event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
        // Clear callbacks
        this.callbacks = {
            onPlay: [],
            onPause: [],
            onSeek: [],
            onMediaChange: [],
        };
        this.currentMedia = null;
    }
}
//# sourceMappingURL=BaseProvider.js.map