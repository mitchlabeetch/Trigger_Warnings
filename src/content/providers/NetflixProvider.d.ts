/**
 * Netflix streaming provider
 */
import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
export declare class NetflixProvider extends BaseProvider {
    readonly name = "Netflix";
    readonly domains: string[];
    private videoElement;
    private lastSeekTime;
    initialize(): Promise<void>;
    getCurrentMedia(): Promise<MediaInfo | null>;
    getVideoElement(): HTMLVideoElement | null;
    getInjectionPoint(): HTMLElement | null;
    private setupVideoListeners;
    private extractTitle;
    private monitorURLChanges;
    protected handleDOMMutations(_mutations: MutationRecord[]): void;
    dispose(): void;
}
//# sourceMappingURL=NetflixProvider.d.ts.map