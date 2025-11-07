/**
 * Provider factory - detects and creates the appropriate provider for the current site
 */
import { NetflixProvider } from './NetflixProvider';
import { PrimeVideoProvider } from './PrimeVideoProvider';
import { YouTubeProvider } from './YouTubeProvider';
import { HuluProvider } from './HuluProvider';
import { DisneyPlusProvider } from './DisneyPlusProvider';
import { MaxProvider } from './MaxProvider';
import { PeacockProvider } from './PeacockProvider';
export class ProviderFactory {
    static providers = [
        NetflixProvider,
        PrimeVideoProvider,
        YouTubeProvider,
        HuluProvider,
        DisneyPlusProvider,
        MaxProvider,
        PeacockProvider,
    ];
    /**
     * Detect and create the appropriate provider for the current domain
     */
    static async createProvider() {
        const currentDomain = window.location.hostname;
        for (const ProviderClass of this.providers) {
            const instance = new ProviderClass();
            // Check if current domain matches any of the provider's domains
            const matches = instance.domains.some((domain) => currentDomain.includes(domain));
            if (matches) {
                try {
                    await instance.initialize();
                    console.log(`[TW] Initialized provider: ${instance.name}`);
                    return instance;
                }
                catch (error) {
                    console.error(`[TW] Failed to initialize ${instance.name}:`, error);
                    return null;
                }
            }
        }
        console.warn('[TW] No matching provider found for domain:', currentDomain);
        return null;
    }
    /**
     * Check if the current domain is supported
     */
    static isSupported() {
        const currentDomain = window.location.hostname;
        return this.providers.some((ProviderClass) => {
            const instance = new ProviderClass();
            return instance.domains.some((domain) => currentDomain.includes(domain));
        });
    }
    /**
     * Get list of all supported domains
     */
    static getSupportedDomains() {
        const domains = [];
        this.providers.forEach((ProviderClass) => {
            const instance = new ProviderClass();
            domains.push(...instance.domains);
        });
        return domains;
    }
}
//# sourceMappingURL=ProviderFactory.js.map