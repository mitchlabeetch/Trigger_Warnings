
import type { IStreamingProvider } from '../../shared/types/Provider.types';

const PLATFORM_SELECTORS = {
    YouTube: {
        controls: '.ytp-chrome-bottom',
    },
    Netflix: {
        controls: '.PlayerControls--container',
    },
    Default: {
        controls: null,
    },
};

export class LayoutEngine {
    private provider: IStreamingProvider;
    private observer: MutationObserver;

    constructor(provider: IStreamingProvider) {
        this.provider = provider;
        this.observer = new MutationObserver(this.updateLayout);
    }

    public initialize(): void {
        this.updateLayout();
        this.startObserver();
    }

    public dispose(): void {
        this.observer.disconnect();
    }

    private updateLayout = (): void => {
        const platform = this.provider.name;
        const selectors = PLATFORM_SELECTORS[platform] || PLATFORM_SELECTORS.Default;
        const controlsElement = selectors.controls ? document.querySelector(selectors.controls) : null;

        if (controlsElement) {
            const controlsRect = controlsElement.getBoundingClientRect();
            const offset = window.innerHeight - controlsRect.top;
            document.documentElement.style.setProperty('--tw-dock-bottom-offset', `${offset}px`);
        } else {
            document.documentElement.style.setProperty('--tw-dock-bottom-offset', '20px');
        }
    };

    private startObserver(): void {
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
    }
}
