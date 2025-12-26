# Architecture Overview

This document explains the high-level architecture of the Trigger Warnings extension and how its components interact.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Popup UI   │  │  Options UI  │  │  Background  │        │
│  │   (Svelte)   │  │   (Svelte)   │  │   Service    │        │
│  │              │  │              │  │   Worker     │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                  │                 │
│         └─────────────────┴──────────────────┘                 │
│                           │                                     │
│                    ┌──────▼──────┐                             │
│                    │   Core API  │                             │
│                    │  (Shared)   │                             │
│                    └──────┬──────┘                             │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                 │
│         │                 │                 │                 │
│    ┌────▼────┐     ┌──────▼──────┐   ┌─────▼──────┐         │
│    │ Storage │     │   Profiles  │   │  Warning   │         │
│    │ Manager │     │   Manager   │   │   System   │         │
│    └─────────┘     └─────────────┘   └─────┬──────┘         │
│                                             │                 │
│  ┌──────────────────────────────────────────▼────────┐       │
│  │              Content Script                       │       │
│  │  (Injected into streaming platform pages)         │       │
│  │                                                    │       │
│  │  ┌──────────────┐  ┌──────────────┐             │       │
│  │  │  Provider    │  │   Warning    │             │       │
│  │  │  (Netflix,   │  │   Manager    │             │       │
│  │  │   YouTube,   │──│              │             │       │
│  │  │   etc.)      │  │              │             │       │
│  │  └──────────────┘  └──────┬───────┘             │       │
│  │                            │                      │       │
│  │  ┌─────────────────────────┴──────────────┐     │       │
│  │  │          UI Components                  │     │       │
│  │  │  ┌─────────┐  ┌──────────┐  ┌────────┐│     │       │
│  │  │  │ Banner  │  │Indicator │  │Overlay ││     │       │
│  │  │  └─────────┘  └──────────┘  └────────┘│     │       │
│  │  └──────────────────────────────────────────┘     │       │
│  │                                                    │       │
│  │  ┌─────────────────────────────────────────┐     │       │
│  │  │    Experimental: Local AI Detection     │     │       │
│  │  │  ┌──────────┐  ┌─────────┐  ┌────────┐│     │       │
│  │  │  │  Visual  │  │  Audio  │  │Subtitle││     │       │
│  │  │  │ Analyzer │  │Analyzer │  │Analyzer││     │       │
│  │  │  └──────────┘  └─────────┘  └────────┘│     │       │
│  │  └─────────────────────────────────────────┘     │       │
│  └────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                           │
                    HTTPS  │
                           │
┌──────────────────────────▼───────────────────────────┐
│                  SUPABASE BACKEND                    │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   PostgreSQL     │  │   Realtime       │        │
│  │   Database       │  │   Subscriptions  │        │
│  │                  │  │                  │        │
│  │  - warnings      │  │  - Live updates  │        │
│  │  - votes         │  │  - Broadcasting  │        │
│  │  - content_ids   │  │                  │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   Row-Level      │  │   Edge           │        │
│  │   Security       │  │   Functions      │        │
│  └──────────────────┘  └──────────────────┘        │
└──────────────────────────────────────────────────────┘
```

---

## 🧩 Core Components

### 1. Background Service Worker (`src/background/`)

**Purpose**: Extension lifecycle manager, message router, and periodic task scheduler.

**Responsibilities:**
- Initialize extension on install/update
- Handle cross-component communication (popup ↔ content script)
- Schedule periodic checks for warning updates (using Alarms API)
- Manage global state (e.g., enabled/disabled status)
- Handle browser action clicks

**Key Files:**
- `index.ts` – Entry point
- `messageHandler.ts` – Message routing logic
- `alarmManager.ts` – Scheduled tasks

**Technologies:**
- **Manifest V3**: Service worker (Chrome, Edge, Brave)
- **Manifest V2**: Background script (Firefox fallback)

---

### 2. Content Scripts (`src/content/`)

**Purpose**: Injected into streaming platform pages to monitor playback and display warnings.

**Responsibilities:**
- Detect video player and extract metadata (title, episode, timestamp)
- Fetch warnings for current content
- Monitor playback time and trigger warnings at the right moment
- Render warning UI (banners, indicators, overlays)
- Handle user interactions (voting, skipping)

**Key Files:**
- `index.ts` – Entry point, initializes provider and WarningManager
- `providers/` – Platform-specific adapters (Netflix, YouTube, etc.)
- `banner/`, `indicator/`, `overlay/` – UI components
- `consensus/` – Voting logic
- `watching/` – Playback monitoring

**Technologies:**
- TypeScript, Svelte (for UI components)
- DOM Observers (MutationObserver, IntersectionObserver)
- Browser APIs (chrome.storage, chrome.runtime)

---

### 3. Popup UI (`src/popup/`)

**Purpose**: Main user interface, accessible via extension icon in toolbar.

**Responsibilities:**
- Display current video info (if on a streaming site)
- Show active warnings for current content
- Quick toggles (enable/disable, profile switching)
- "Add Warning" form
- Settings shortcut

**Key Files:**
- `Popup.svelte` – Main component
- `components/` – Subcomponents (WarningList, AddWarningForm, etc.)
- `index.ts` – Mounting logic

**Technologies:**
- Svelte 4, Tailwind CSS
- Browser messaging APIs

---

### 4. Options Page (`src/options/`)

**Purpose**: Full-featured settings interface for configuring the extension.

**Responsibilities:**
- Trigger category selection
- Profile management (create, edit, delete, export, import)
- Warning display customization (style, timing, position)
- Advanced settings (AI detection, auto-skip, debug mode)
- Account management (future)

**Key Files:**
- `Options.svelte` – Main component
- `components/` – Settings panels

**Technologies:**
- Svelte 4, Tailwind CSS

---

### 5. Core Logic (`src/core/`)

**Purpose**: Shared business logic used across popup, options, and content scripts.

#### 5a. Warning System (`src/core/warning-system/`)

**Main class**: `WarningManager`

**Responsibilities:**
- Fetch warnings from API for a given content ID
- Cache warnings locally for performance
- Match warnings to current playback time
- Trigger warning display events
- Handle warning lifecycle (active, dismissed, expired)

**Key Methods:**
```typescript
class WarningManager {
  async loadWarnings(contentId: string): Promise<Warning[]>;
  getActiveWarnings(currentTime: number): Warning[];
  dismissWarning(warningId: string): void;
  onWarningTriggered(callback: (warning: Warning) => void): void;
}
```

#### 5b. API Layer (`src/core/api/`)

**Purpose**: Interface with Supabase backend.

**Responsibilities:**
- Fetch warnings by content ID
- Submit new warnings
- Submit votes (upvote/downvote)
- Fetch content metadata (IMDb IDs, episode info)

**Key Functions:**
```typescript
export async function fetchWarnings(contentId: string): Promise<Warning[]>;
export async function submitWarning(warning: NewWarning): Promise<void>;
export async function voteOnWarning(warningId: string, vote: 'up' | 'down'): Promise<void>;
```

#### 5c. Profile Manager (`src/core/profiles/`)

**Purpose**: Manage user sensitivity profiles.

**Responsibilities:**
- CRUD operations on profiles (create, read, update, delete)
- Store profiles in local storage
- Switch active profile
- Export/import profiles (JSON format)

**Key Methods:**
```typescript
class ProfileManager {
  async getActiveProfile(): Promise<Profile>;
  async setActiveProfile(profileId: string): Promise<void>;
  async createProfile(profile: NewProfile): Promise<Profile>;
  async exportProfile(profileId: string): Promise<string>; // JSON
  async importProfile(json: string): Promise<Profile>;
}
```

---

### 6. Provider System (`src/content/providers/`)

**Purpose**: Abstract interface for different streaming platforms' video players.

**Base Class**: `BaseProvider`

**Responsibilities:**
- Detect video player on page
- Extract video metadata (title, episode, season, content ID)
- Monitor playback state (playing, paused, seeking)
- Get current playback time
- Handle platform-specific quirks

**Implemented Providers:**
- `NetflixProvider`
- `PrimeVideoProvider`
- `HuluProvider`
- `DisneyPlusProvider`
- `MaxProvider`
- `PeacockProvider`
- `YouTubeProvider`

**Interface:**
```typescript
abstract class BaseProvider {
  abstract detectVideo(): boolean;
  abstract getVideoMetadata(): VideoMetadata | null;
  abstract getCurrentTime(): number;
  abstract isPlaying(): boolean;
  abstract onTimeUpdate(callback: (time: number) => void): void;
}
```

**Factory Pattern:**
```typescript
class ProviderFactory {
  static createProvider(hostname: string): BaseProvider | null;
}
```

---

### 7. Experimental AI Detection (`src/_Detection_System/`)

**Purpose**: Local computer vision models for automatic trigger detection.

**Status**: 🧪 Experimental (disabled by default)

**Components:**

#### Visual Analyzer (`visual-analyzer/`)
- **CLIP Model**: Zero-shot image classification
- **YOLO**: Object detection (spiders, weapons, etc.)
- **VLM**: Vision-language model for context understanding

#### Audio Analyzer (`audio-analyzer/`)
- **CLAP**: Audio classification (screams, retching, explosions)
- **Spectrogram analysis**: Frequency pattern matching

#### Subtitle Analyzer (`subtitle-analyzer/`)
- **NLP models**: Detect trigger keywords in subtitles
- **Context analysis**: Avoid false positives (e.g., "violence" in news vs. depiction)

**Technologies:**
- TensorFlow.js (TFJS)
- Transformers.js (Hugging Face models)
- WebGPU backend (for performance)

**Privacy Note**: All processing happens locally. No data is sent externally.

---

## 🔄 Data Flow

### Scenario 1: User Starts Watching a Show

```
1. User navigates to Netflix → /watch/81234567
   ↓
2. Content script loads, detects Netflix
   ↓
3. ProviderFactory creates NetflixProvider
   ↓
4. NetflixProvider extracts metadata:
   - Title: "Stranger Things"
   - Season: 1, Episode: 1
   - IMDb ID: tt4574334
   ↓
5. WarningManager.loadWarnings("tt4574334-s01e01")
   ↓
6. API fetches warnings from Supabase
   ↓
7. Warnings cached locally (chrome.storage.local)
   ↓
8. NetflixProvider.onTimeUpdate(time => ...)
   ↓
9. At time 05:23, WarningManager finds active warning:
   { type: "violence", severity: "moderate", timestamp: 323 }
   ↓
10. Banner component rendered at top of video
    ↓
11. User clicks "Skip" → Video seeks to 05:35 (warning end)
```

### Scenario 2: User Adds a Warning

```
1. User clicks extension icon → "Add Warning"
   ↓
2. Popup opens AddWarningForm
   ↓
3. Form pre-fills current timestamp (from ProviderFactory)
   ↓
4. User selects:
   - Type: "Spiders"
   - Severity: "Mild"
   - Duration: 10 seconds
   ↓
5. Form submits → Background service worker
   ↓
6. Background → API.submitWarning(...)
   ↓
7. Supabase inserts new row:
   {
     content_id: "tt4574334-s01e01",
     type: "spiders",
     timestamp: 123,
     duration: 10,
     severity: "mild",
     votes_up: 0,
     votes_down: 0
   }
   ↓
8. Realtime subscription broadcasts update to all users
   ↓
9. Other users' WarningManagers refresh warnings
```

### Scenario 3: Community Voting

```
1. Warning displayed to User B
   ↓
2. User B clicks ⬆️ (upvote)
   ↓
3. Content script → Background → API.voteOnWarning(warningId, 'up')
   ↓
4. Supabase checks:
   - Has User B voted before? (check by IP hash or fingerprint)
   - If no, increment votes_up
   - If yes, ignore (one vote per user)
   ↓
5. Row-level security (RLS) policy enforces uniqueness
   ↓
6. New vote count: votes_up = 5, votes_down = 1
   ↓
7. Consensus score: (5 - 1) / (5 + 1) = 0.67 (high confidence)
   ↓
8. Warning remains visible (threshold: 0.3)
```

---

## 🗄️ Data Models

### Warning
```typescript
interface Warning {
  id: string;                    // UUID
  content_id: string;            // "tt1234567-s01e01"
  type: TriggerType;             // "violence", "gore", etc.
  timestamp: number;             // Seconds into video
  duration: number;              // Length of trigger scene
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;          // Optional context
  votes_up: number;
  votes_down: number;
  created_at: string;            // ISO timestamp
}
```

### Profile
```typescript
interface Profile {
  id: string;
  name: string;
  enabled_categories: TriggerType[];
  severity_threshold: 'mild' | 'moderate' | 'severe';
  warning_style: 'banner' | 'indicator' | 'notification';
  lead_time: number;             // Seconds before trigger
  auto_skip: boolean;
}
```

### VideoMetadata
```typescript
interface VideoMetadata {
  title: string;
  platform: 'netflix' | 'hulu' | 'youtube' | ...;
  imdb_id?: string;
  season?: number;
  episode?: number;
  content_id: string;            // Unique identifier
}
```

---

## 🔐 Security Architecture

### Content Security Policy (CSP)
- **Extension pages**: `script-src 'self'` (no inline scripts)
- **Content scripts**: Isolated from page JavaScript (separate context)

### Row-Level Security (Supabase)
- **Read**: Public (anyone can fetch warnings)
- **Write**: Authenticated (requires API key)
- **Vote uniqueness**: Enforced by IP hash + fingerprint

### Local Storage Encryption
- Browser's built-in encryption (protected by OS keychain)
- No plaintext secrets in storage

### Privacy
- **No tracking**: Zero analytics on user behavior
- **No PII**: We don't collect names, emails, or account info
- **Local AI**: TensorFlow.js models run entirely in-browser

---

## 🧪 Testing Strategy

### Unit Tests (`*.test.ts`)
- **Core logic**: WarningManager, ProfileManager, API layer
- **Providers**: Video detection, metadata extraction
- **Utilities**: Timestamp parsing, content ID generation

### Integration Tests
- **End-to-end flows**: User adds warning → Appears for other users
- **Cross-browser**: Chrome, Firefox, Edge compatibility

### Manual Testing
- **Real streaming platforms**: Test on actual Netflix, Hulu, etc.
- **Edge cases**: Mid-roll ads (Hulu), autoplay (YouTube), offline mode

### Tools
- **Vitest**: Test runner
- **jsdom**: DOM simulation
- **Mock Service Worker**: API mocking

---

## 📦 Build Pipeline

```
src/ (TypeScript, Svelte)
  ↓
Vite (bundler)
  ↓
Transpile TS → JS
  ↓
Compile Svelte → JS
  ↓
Inject manifest.json
  ↓
dist/chrome/   (Manifest V3)
dist/firefox/  (Manifest V2)
dist/safari/   (future)
```

**Key transformations:**
- **Firefox**: MV3 → MV2 (service worker → background script)
- **Safari**: Different extension format (not yet implemented)

---

## 🚀 Deployment

### Extension Stores
1. **Build**: `npm run build:chrome` (or `:firefox`)
2. **Package**: Zip `dist/chrome` folder
3. **Upload**: Chrome Web Store Developer Dashboard
4. **Review**: ~1-3 days for approval
5. **Publish**: Available to users

### Backend (Supabase)
- **Hosting**: Fully managed (no deployment needed)
- **Migrations**: SQL scripts in `supabase/migrations/`
- **Edge Functions**: TypeScript functions for custom logic

---

## 🔮 Future Architecture

### Planned Improvements
1. **Microservices**: Split API into separate services (warnings, votes, moderation)
2. **CDN caching**: Cache popular content warnings on edge nodes
3. **GraphQL API**: Replace REST for more efficient queries
4. **WebSockets**: Real-time warning updates (beyond Supabase Realtime)
5. **Offline mode**: IndexedDB for local warning storage

### Scalability
- **Current**: Handles ~10K users, ~100K warnings
- **Target**: 1M+ users, 10M+ warnings
- **Bottlenecks**: Database queries (need indexing), API rate limits

---

## 📚 Further Reading

- [DEVELOPMENT.md](DEVELOPMENT.md) – Local setup and workflow
- [PROVIDERS.md](PROVIDERS.md) – Adding new streaming platforms
- [API.md](API.md) – Backend API documentation
- [BEST_PRACTICES.md](../BEST_PRACTICES.md) – Coding conventions

---

<div align="center">

**Questions about architecture?** [Open a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) 💬

[Back to README](../README.md)

</div>
