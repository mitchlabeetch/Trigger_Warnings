# Trigger Warnings Extension - Rewrite Architecture

## Project Overview
A modern, cross-browser, modular trigger warning extension for streaming platforms.

## Tech Stack

### Core Technologies
- **TypeScript**: Type-safe development
- **Svelte**: Reactive UI framework (lightweight, perfect for extensions)
- **Vite**: Modern build tool with HMR support
- **Manifest V3**: Modern extension API (with V2 fallback for Firefox)

### Build & Tooling
- **Vite Plugin WebExtension**: Cross-browser extension builds
- **PostCSS/Tailwind**: Modern CSS with utility-first framework
- **ESLint + Prettier**: Code quality and formatting
- **Vitest**: Unit testing framework

---

## Architecture Principles

### 1. Modular Provider System
Each streaming service is a self-contained provider module with:
- **Detection**: Identify what media is currently playing
- **Injection**: Know where to inject warning banners
- **Lifecycle**: Handle platform-specific events (play, pause, seek)

### 2. Separation of Concerns
```
┌─────────────────────────────────────────────────────┐
│                   Core System                        │
│  (Warning logic, settings, profiles, storage)        │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    Provider Interface         │
         └───────────────────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
    ┌────▼────┐                     ┌────▼────┐
    │ Netflix │                     │  Hulu   │
    │ Provider│                     │ Provider│
    └─────────┘                     └─────────┘
```

### 3. Type Safety
- All APIs have TypeScript interfaces
- Shared types for warnings, profiles, settings
- Strict null checks and type guards

---

## Project Structure

```
src/
├── background/              # Service worker
│   ├── index.ts            # Main background script
│   ├── message-handler.ts  # Message routing
│   └── storage-handler.ts  # Storage operations
│
├── content/                 # Content scripts
│   ├── index.ts            # Main content script
│   ├── banner/             # Warning banner components
│   │   ├── Banner.svelte
│   │   ├── BannerManager.ts
│   │   └── styles/
│   └── providers/          # Streaming service providers
│       ├── Provider.interface.ts
│       ├── NetflixProvider.ts
│       ├── PrimeVideoProvider.ts
│       ├── HuluProvider.ts
│       ├── DisneyPlusProvider.ts
│       ├── MaxProvider.ts
│       ├── PeacockProvider.ts
│       └── YouTubeProvider.ts
│
├── popup/                   # Extension popup
│   ├── Popup.svelte        # Main popup component
│   ├── index.ts            # Entry point
│   └── components/
│       ├── ProfileSelector.svelte
│       ├── QuickSettings.svelte
│       └── SubmitWarning.svelte
│
├── options/                 # Settings page
│   ├── Options.svelte      # Main options component
│   ├── index.ts            # Entry point
│   └── components/
│       ├── ProfileManager.svelte
│       ├── WarningCustomizer.svelte
│       ├── AppearanceSettings.svelte
│       └── CategoryManager.svelte
│
├── core/                    # Core business logic
│   ├── warning-system/
│   │   ├── WarningManager.ts
│   │   ├── WarningFetcher.ts
│   │   └── WarningFilter.ts
│   ├── profiles/
│   │   ├── ProfileManager.ts
│   │   └── Profile.types.ts
│   ├── storage/
│   │   ├── StorageAdapter.ts
│   │   └── Migration.ts
│   └── api/
│       ├── SupabaseClient.ts
│       └── HelperMode.ts
│
├── shared/                  # Shared utilities
│   ├── types/
│   │   ├── Warning.types.ts
│   │   ├── Profile.types.ts
│   │   ├── Settings.types.ts
│   │   └── Provider.types.ts
│   ├── constants/
│   │   ├── categories.ts
│   │   └── defaults.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── time.ts
│   │   └── dom.ts
│   └── i18n/
│       └── translations/
│
├── styles/                  # Global styles
│   ├── global.css
│   ├── themes/
│   │   ├── light.css
│   │   ├── dark.css
│   │   └── system.css
│   └── tailwind.config.js
│
└── manifest/                # Extension manifests
    ├── manifest.common.ts   # Shared manifest config
    ├── manifest.v3.ts       # Chrome/Edge MV3
    └── manifest.v2.ts       # Firefox MV2
```

---

## Provider Architecture

### Provider Interface
```typescript
interface IStreamingProvider {
  // Provider metadata
  readonly name: string;
  readonly domains: string[];

  // Core methods
  initialize(): Promise<void>;
  getCurrentMedia(): Promise<MediaInfo | null>;
  getVideoElement(): HTMLVideoElement | null;
  getInjectionPoint(): HTMLElement | null;

  // Event handlers
  onPlay(callback: () => void): void;
  onPause(callback: () => void): void;
  onSeek(callback: (time: number) => void): void;
  onMediaChange(callback: (media: MediaInfo) => void): void;

  // Cleanup
  dispose(): void;
}

interface MediaInfo {
  id: string;           // Unique identifier
  title: string;        // Display title
  type: 'movie' | 'episode';
  season?: number;      // For episodes
  episode?: number;     // For episodes
}
```

### Provider Implementation Example
```typescript
class NetflixProvider implements IStreamingProvider {
  name = 'Netflix';
  domains = ['netflix.com'];

  async getCurrentMedia(): Promise<MediaInfo | null> {
    // Extract video ID from URL
    const match = location.pathname.match(/\/watch\/(\d+)/);
    if (!match) return null;

    // Fetch metadata from Netflix API or DOM
    return {
      id: match[1],
      title: await this.extractTitle(),
      type: await this.extractType(),
    };
  }

  getVideoElement(): HTMLVideoElement | null {
    return document.querySelector('video');
  }

  getInjectionPoint(): HTMLElement | null {
    return document.querySelector('.watch-video');
  }

  // ... implement other methods
}
```

---

## Warning System

### Core Flow
```
1. Content script detects video playback
2. Identifies current provider
3. Gets MediaInfo from provider
4. Fetches warnings from backend
5. Filters based on active profile
6. Displays warnings at appropriate times
7. Applies user-configured actions (mute/hide)
```

### Warning Manager
```typescript
class WarningManager {
  private provider: IStreamingProvider;
  private profile: Profile;
  private warnings: Warning[];

  async initialize(provider: IStreamingProvider): Promise<void> {
    // Set up provider
    this.provider = provider;

    // Load active profile
    this.profile = await ProfileManager.getActive();

    // Fetch warnings
    const media = await provider.getCurrentMedia();
    this.warnings = await this.fetchWarnings(media);

    // Start monitoring
    this.startMonitoring();
  }

  private async fetchWarnings(media: MediaInfo): Promise<Warning[]> {
    const allWarnings = await WarningFetcher.fetch(media.id);
    return WarningFilter.filterByProfile(allWarnings, this.profile);
  }

  private startMonitoring(): void {
    const video = this.provider.getVideoElement();

    // Check for warnings every 250ms
    const checkInterval = setInterval(() => {
      const currentTime = video.currentTime;
      this.checkForActiveWarnings(currentTime);
    }, 250);
  }
}
```

---

## Multi-Profile System

### Profile Structure
```typescript
interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Warning preferences
  enabledCategories: Set<TriggerCategory>;
  categoryActions: Map<TriggerCategory, WarningAction>;

  // Display settings
  display: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    fontSize: number;
    backgroundColor: string;
    transparency: number;
    duration: number;
    spoilerFreeMode: boolean;
  };

  // Advanced settings
  leadTime: number;
  soundEnabled: boolean;
  autoHideTime: number;
}

type WarningAction = 'warn' | 'mute' | 'hide' | 'mute-and-hide';
```

### Profile Manager
```typescript
class ProfileManager {
  static async create(name: string): Promise<Profile> {
    const profile: Profile = {
      id: generateId(),
      name,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      enabledCategories: new Set(),
      categoryActions: new Map(),
      display: DEFAULT_DISPLAY_SETTINGS,
      leadTime: 10,
      soundEnabled: true,
      autoHideTime: 5,
    };

    await this.save(profile);
    return profile;
  }

  static async switch(profileId: string): Promise<void> {
    await storage.set('activeProfileId', profileId);
    // Notify all tabs of profile change
    await messaging.broadcast({ type: 'PROFILE_CHANGED', profileId });
  }

  static async getActive(): Promise<Profile> {
    const profileId = await storage.get('activeProfileId');
    return await this.get(profileId);
  }
}
```

---

## Helper Mode (Community Feedback)

### Features
1. **Confirm Warning**: Validate accuracy (+1 score)
2. **Refute Warning**: Flag as inaccurate (-1 score, -5 removes)
3. **Submit Warning**: Add new warning with timestamp

### Database Schema
```sql
-- Enhanced triggers table
CREATE TABLE triggers (
  id UUID PRIMARY KEY,
  video_id VARCHAR(255) NOT NULL,
  category_key VARCHAR(100) NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  submitted_by UUID,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  score INTEGER DEFAULT 0,
  confidence_level INTEGER DEFAULT 0, -- 0-100
  requires_moderation BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- Enhanced votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY,
  trigger_id UUID REFERENCES triggers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type VARCHAR(10) NOT NULL, -- 'up' or 'down'
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(trigger_id, user_id)
);

-- New moderation queue table
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY,
  trigger_id UUID REFERENCES triggers(id) ON DELETE CASCADE,
  reason VARCHAR(255),
  submitted_by UUID,
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger submissions with detailed metadata
CREATE TABLE trigger_submissions (
  id UUID PRIMARY KEY,
  trigger_id UUID REFERENCES triggers(id),
  video_id VARCHAR(255) NOT NULL,
  category_key VARCHAR(100) NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  description TEXT,
  submitted_by UUID NOT NULL,
  user_agent TEXT,
  confidence INTEGER DEFAULT 50, -- User's confidence level
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Auto-Approval Logic
```typescript
class HelperModeService {
  private static AUTO_APPROVE_THRESHOLD = 3; // 3+ votes
  private static AUTO_REJECT_THRESHOLD = -5; // -5 or lower

  async submitWarning(data: WarningSubmission): Promise<void> {
    // Create pending trigger
    const trigger = await this.createTrigger({
      ...data,
      status: 'pending',
      score: 0,
      requiresModeration: true,
    });

    // Add to moderation queue
    await this.addToModerationQueue(trigger.id);
  }

  async handleVote(triggerId: string, userId: string, voteType: 'up' | 'down'): Promise<void> {
    // Record vote
    await this.recordVote(triggerId, userId, voteType);

    // Update score
    const newScore = await this.calculateScore(triggerId);

    // Check for auto-approval/rejection
    if (newScore >= this.AUTO_APPROVE_THRESHOLD) {
      await this.approveTrigger(triggerId);
    } else if (newScore <= this.AUTO_REJECT_THRESHOLD) {
      await this.rejectTrigger(triggerId);
    }
  }
}
```

---

## UI/UX Design System

### Theme System
```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Warning colors
  warningUpcoming: string;
  warningActive: string;
  warningDismissed: string;

  // Action colors
  actionPrimary: string;
  actionSecondary: string;
  actionDanger: string;
}

const LIGHT_THEME: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f5f5',
  bgTertiary: '#e0e0e0',
  textPrimary: '#000000',
  textSecondary: '#333333',
  textMuted: '#666666',
  warningUpcoming: '#ffa500',
  warningActive: '#dc143c',
  warningDismissed: '#888888',
  actionPrimary: '#007bff',
  actionSecondary: '#6c757d',
  actionDanger: '#dc3545',
};

const DARK_THEME: ThemeColors = {
  bgPrimary: '#1a1a1a',
  bgSecondary: '#2d2d2d',
  bgTertiary: '#404040',
  textPrimary: '#ffffff',
  textSecondary: '#e0e0e0',
  textMuted: '#999999',
  warningUpcoming: '#ffb84d',
  warningActive: '#ff5555',
  warningDismissed: '#666666',
  actionPrimary: '#4dabf7',
  actionSecondary: '#868e96',
  actionDanger: '#ff6b6b',
};
```

### Banner Design Principles
1. **Seamless Integration**: Match the streaming service's design language
2. **Non-Intrusive**: Respect subtitles and player controls
3. **Accessible**: WCAG AA contrast ratios, keyboard navigation
4. **Animated**: Smooth transitions (fade in/out, slide)
5. **Responsive**: Adapt to fullscreen, theater mode, etc.

### Settings UI Components
- **Profile Selector**: Dropdown with quick-switch
- **Category Grid**: Visual grid of all trigger categories
- **Customization Panel**: Live preview of banner appearance
- **Action Configurator**: Per-category action settings
- **Theme Switcher**: Light/Dark/System toggle

---

## Build System

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      manifest: 'src/manifest/manifest.v3.ts',
      browser: process.env.TARGET_BROWSER || 'chrome',
      disableAutoLaunch: false,
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        background: 'src/background/index.ts',
        content: 'src/content/index.ts',
      },
    },
  },
});
```

### Cross-Browser Builds
```bash
npm run build:chrome   # Chrome/Edge (MV3)
npm run build:firefox  # Firefox (MV2)
npm run build:safari   # Safari (MV3)
npm run build:all      # All browsers
```

---

## Testing Strategy

### Unit Tests
- Core logic (WarningManager, ProfileManager)
- Provider implementations
- Utility functions

### Integration Tests
- Message passing between contexts
- Storage operations
- API calls

### E2E Tests
- Full user flows (create profile, submit warning, etc.)
- Provider detection on actual streaming sites
- Banner display and interactions

---

## Migration Strategy

### Data Migration
1. Detect existing extension data
2. Map old settings to new profile structure
3. Preserve user preferences and history
4. Clean up old storage keys

### Rollout Plan
1. **Phase 1**: Core rewrite (providers, warning system)
2. **Phase 2**: Multi-profile support
3. **Phase 3**: Enhanced Helper Mode
4. **Phase 4**: UI/UX redesign
5. **Phase 5**: Testing and refinement
6. **Phase 6**: Production release

---

## Performance Considerations

### Optimizations
- Lazy load provider modules (only load for active site)
- Debounce video time checks (250ms is reasonable)
- Cache warnings in memory to reduce API calls
- Use Web Workers for heavy computations
- Minimize DOM queries with element caching

### Bundle Size Targets
- Background script: < 100KB
- Content script: < 150KB per provider
- Popup: < 200KB
- Options: < 300KB

---

## Security & Privacy

### Security Measures
- CSP headers in manifest
- Input sanitization for user submissions
- XSS prevention in banner rendering
- Secure API communication (HTTPS only)

### Privacy Considerations
- All data stored locally (no tracking)
- Anonymous user IDs for submissions
- No telemetry or analytics
- GDPR-compliant data handling

---

## Future Enhancements

### Potential Features
- Import/Export profiles
- Share profiles with others
- Cloud sync across devices
- Machine learning for auto-categorization
- Browser notifications for warnings
- Integration with IMDB/TMDB for better metadata
- Support for more platforms (Twitch, Crunchyroll, etc.)
- Mobile app companion

---

## Development Workflow

### Commands
```bash
npm install              # Install dependencies
npm run dev             # Development mode with HMR
npm run build           # Production build
npm run test            # Run tests
npm run lint            # Lint code
npm run format          # Format code
npm run type-check      # TypeScript type checking
```

### Git Workflow
```bash
git checkout -b feature/provider-system
# Make changes
npm run test && npm run lint
git commit -m "feat: implement provider system"
git push origin feature/provider-system
```

---

## Documentation Requirements

### Code Documentation
- JSDoc comments for all public APIs
- README for each major module
- Architecture decision records (ADRs)

### User Documentation
- Installation guide
- User manual
- FAQ
- Troubleshooting guide
- Privacy policy

---

## Success Metrics

### Technical Metrics
- Build time < 30 seconds
- Extension load time < 500ms
- Memory usage < 50MB per tab
- Zero runtime errors in production

### User Metrics
- User satisfaction score > 4.5/5
- < 1% crash rate
- > 90% warning accuracy (based on votes)
- Active user retention > 70% after 30 days
