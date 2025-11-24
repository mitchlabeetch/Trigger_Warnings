/**
 * Base provider class with common functionality
 */

import type { IStreamingProvider, MediaInfo } from '@shared/types/Provider.types';

export abstract class BaseProvider implements IStreamingProvider {
  abstract readonly name: string;
  abstract readonly domains: string[];

  protected callbacks: {
    onPlay: (() => void)[];
    onPause: (() => void)[];
    onSeek: ((time: number) => void)[];
    onMediaChange: ((media: MediaInfo) => void)[];
  } = {
    onPlay: [],
    onPause: [],
    onSeek: [],
    onMediaChange: [],
  };

  protected currentMedia: MediaInfo | null = null;
  protected observers: MutationObserver[] = [];
  protected eventListeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
  }> = [];

  async initialize(): Promise<void> {
    // Override in subclasses
  }

  abstract getCurrentMedia(): Promise<MediaInfo | null>;
  abstract getVideoElement(): HTMLVideoElement | null;
  abstract getInjectionPoint(): HTMLElement | null;

  onPlay(callback: () => void): void {
    this.callbacks.onPlay.push(callback);
  }

  onPause(callback: () => void): void {
    this.callbacks.onPause.push(callback);
  }

  onSeek(callback: (time: number) => void): void {
    this.callbacks.onSeek.push(callback);
  }

  onMediaChange(callback: (media: MediaInfo) => void): void {
    this.callbacks.onMediaChange.push(callback);
  }

  protected triggerPlayCallbacks(): void {
    this.callbacks.onPlay.forEach((cb) => cb());
  }

  protected triggerPauseCallbacks(): void {
    this.callbacks.onPause.forEach((cb) => cb());
  }

  protected triggerSeekCallbacks(time: number): void {
    this.callbacks.onSeek.forEach((cb) => cb(time));
  }

  protected async triggerMediaChangeCallbacks(media: MediaInfo): Promise<void> {
    if (this.currentMedia?.id !== media.id) {
      this.currentMedia = media;
      this.callbacks.onMediaChange.forEach((cb) => cb(media));
    }
  }

  protected addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  protected observeDOM(target: Node, options: MutationObserverInit): MutationObserver {
    const observer = new MutationObserver((mutations) => {
      this.handleDOMMutations(mutations);
    });
    observer.observe(target, options);
    this.observers.push(observer);
    return observer;
  }

  protected handleDOMMutations(_mutations: MutationRecord[]): void {
    // Override in subclasses if needed
  }

  protected waitForElement<T extends Element>(
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

  dispose(): void {
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
