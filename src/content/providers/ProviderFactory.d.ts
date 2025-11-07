/**
 * Provider factory - detects and creates the appropriate provider for the current site
 */
import type { IStreamingProvider } from '@shared/types/Provider.types';
export declare class ProviderFactory {
    private static providers;
    /**
     * Detect and create the appropriate provider for the current domain
     */
    static createProvider(): Promise<IStreamingProvider | null>;
    /**
     * Check if the current domain is supported
     */
    static isSupported(): boolean;
    /**
     * Get list of all supported domains
     */
    static getSupportedDomains(): string[];
}
//# sourceMappingURL=ProviderFactory.d.ts.map