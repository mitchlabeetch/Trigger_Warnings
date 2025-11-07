/**
 * Base provider class with common functionality
 */
import type { IStreamingProvider, MediaInfo } from '@shared/types/Provider.types';
export declare abstract class BaseProvider implements IStreamingProvider {
    abstract readonly name: string;
    abstract readonly domains: string[];
    protected callbacks: {
        onPlay: (() => void)[];
        onPause: (() => void)[];
        onSeek: ((time: number) => void)[];
        onMediaChange: ((media: MediaInfo) => void)[];
    };
    protected currentMedia: MediaInfo | null;
    protected observers: MutationObserver[];
    protected eventListeners: Array<{
        element: EventTarget;
        event: string;
        handler: EventListener;
    }>;
    initialize(): Promise<void>;
    abstract getCurrentMedia(): Promise<MediaInfo | null>;
    abstract getVideoElement(): HTMLVideoElement | null;
    abstract getInjectionPoint(): HTMLElement | null;
    onPlay(callback: () => void): void;
    onPause(callback: () => void): void;
    onSeek(callback: (time: number) => void): void;
    onMediaChange(callback: (media: MediaInfo) => void): void;
    protected triggerPlayCallbacks(): void;
    protected triggerPauseCallbacks(): void;
    protected triggerSeekCallbacks(time: number): void;
    protected triggerMediaChangeCallbacks(media: MediaInfo): Promise<void>;
    protected addEventListener(element: EventTarget, event: string, handler: EventListener): void;
    protected observeDOM(target: Node, options: MutationObserverInit): MutationObserver;
    protected handleDOMMutations(_mutations: MutationRecord[]): void;
    protected waitForElement<T extends Element>(selector: string, timeout?: number): Promise<T | null>;
    dispose(): void;
}
//# sourceMappingURL=BaseProvider.d.ts.map