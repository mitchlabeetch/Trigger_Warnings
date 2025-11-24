# Trigger Warnings Browser Extension

> Modern, cross-platform trigger warning system for streaming platforms

## 🚀 Status: In Development (v2.0.0 Rewrite)

This is a **complete architectural rewrite** of the Trigger Warnings extension, transitioning from a Netflix-only implementation to a modern, modular, multi-platform solution.

See **[PROGRESS_REPORT.md](./PROGRESS_REPORT.md)** for detailed progress and **[ARCHITECTURE.md](./ARCHITECTURE.md)** for complete technical documentation.

---

## ✨ Features

### Current (v2.0.0 - In Progress)
- ✅ **Multi-Platform Support**: Netflix, Prime Video, YouTube (+ Hulu, Disney+, Max, Peacock coming soon)
- ✅ **Multi-Profile System**: Create unlimited profiles with different settings
- ✅ **27 Trigger Categories**: Comprehensive content warnings
- ✅ **Advanced Customization**: Position, appearance, timing, spoiler-free mode
- ✅ **Modular Architecture**: Easy to add new streaming platforms
- ✅ **Type-Safe TypeScript**: Full type safety throughout
- 🚧 **Helper Mode**: Community feedback system (confirm, refute, submit warnings)
- 🚧 **Modern UI**: Svelte-based interface with smooth animations
- 🚧 **Theme Support**: Light, Dark, and System modes

### Legacy (v0.9.x)
- Netflix-only support
- Single settings configuration
- Basic warning display
- Community submissions

---

## 🏗️ Architecture

### Technology Stack
- **TypeScript**: Type-safe development
- **Svelte**: Reactive UI framework
- **Vite**: Modern build system
- **Supabase**: PostgreSQL backend
- **Tailwind CSS**: Utility-first styling
- **Manifest V3**: Modern extension API

### Modular Provider System
Each streaming platform is a self-contained provider module:
- Media detection (what's playing)
- Video element detection
- Injection point identification
- Event handling (play, pause, seek)

```typescript
interface IStreamingProvider {
  initialize(): Promise<void>;
  getCurrentMedia(): Promise<MediaInfo | null>;
  getVideoElement(): HTMLVideoElement | null;
  getInjectionPoint(): HTMLElement | null;
  // ... event handlers
}
```

---

## 📁 Project Structure

```
src/
├── content/
│   ├── providers/          # ✅ Streaming service integrations
│   └── banner/             # 🚧 Warning banner UI
├── core/
│   ├── warning-system/     # ✅ Core warning logic
│   ├── profiles/           # ✅ Multi-profile management
│   ├── storage/            # ✅ Browser storage adapter
│   └── api/                # ✅ Supabase client
├── shared/
│   ├── types/              # ✅ TypeScript definitions
│   └── constants/          # ✅ Categories, defaults
├── popup/                  # 🚧 Extension popup
├── options/                # 🚧 Settings page
└── background/             # 🚧 Service worker
```

---

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup
```bash
# Install dependencies
npm install

# Development mode (Chrome)
npm run dev:chrome

# Development mode (Firefox)
npm run dev:firefox

# Build for production
npm run build

# Build for all browsers
npm run build:all

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
```

### Load Extension (Development)
1. Build the extension: `npm run build:chrome`
2. Open Chrome: `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

---

## 📊 Trigger Categories (27 Total)

### High Severity
Violence, Sexual Assault, Self-Harm, Suicide, Gore, Torture, Murder, Child Abuse, Domestic Violence, Racial Violence, LGBTQ+ Phobia, Animal Cruelty, Dead Bodies/Body Horror, Flashing Lights, Cannibalism

### Medium Severity
Blood, Sex/Nudity, Eating Disorders, Drugs, Medical Procedures, Children Screaming, Religious Trauma, Detonations/Bombs, Natural Disasters

### Low Severity
Profanity, Spiders/Snakes, Vomit, Jump Scares

---

## 🎨 Multi-Profile System

Create unlimited profiles with individual settings:

```typescript
interface Profile {
  name: string;
  enabledCategories: TriggerCategory[];
  categoryActions: Record<Category, 'warn' | 'mute' | 'hide' | 'mute-and-hide'>;
  display: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    fontSize: number;
    backgroundColor: string;
    transparency: number;
    duration: number;
    spoilerFreeMode: boolean;
  };
  leadTime: number;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}
```

**Use Cases:**
- Personal profile: Your triggers
- Family profile: Kid-safe settings
- Partner profile: Their triggers
- Sensitive content: All warnings enabled

---

## 🔌 Supported Platforms

| Platform | Status | Provider |
|----------|--------|----------|
| Netflix | ✅ Complete | `NetflixProvider` |
| Prime Video | ✅ Complete | `PrimeVideoProvider` |
| YouTube | ✅ Complete | `YouTubeProvider` |
| Hulu | ✅ Complete | `HuluProvider` |
| Disney+ | ✅ Complete | `DisneyPlusProvider` |
| Max (HBO) | ✅ Complete | `MaxProvider` |
| Peacock | ✅ Complete | `PeacockProvider` |

**All 7 major streaming platforms now supported!**

---

## 🤝 Community Features (Helper Mode)

### User Actions
1. **Confirm** (👍): Validate accurate warnings
2. **Refute** (👎): Flag inaccurate warnings
3. **Submit**: Add missing warnings with timestamps

### Auto-Moderation
- **Auto-Approve**: 3+ upvotes
- **Auto-Reject**: -5 or lower score
- **Manual Review**: Everything else

---

## 📝 Development Progress

See **[PROGRESS_REPORT.md](./PROGRESS_REPORT.md)** for:
- Completed features
- Remaining work
- Time estimates
- Architecture decisions

### Quick Status
- ✅ **Foundation**: Types, architecture, core logic (40% complete)
- 🚧 **UI Components**: Banner, popup, options (0% complete)
- 🚧 **Additional Providers**: Hulu, Disney+, Max, Peacock (0% complete)
- 🚧 **Testing**: Unit tests, integration tests (0% complete)

---

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- [x] Project setup
- [x] Type definitions
- [x] Provider system (Netflix, Prime, YouTube)
- [x] Storage & profiles
- [x] Warning system
- [ ] Background script
- [ ] Content script
- [ ] Banner UI
- [ ] Basic testing

### Phase 2: Full Features
- [ ] Popup UI
- [ ] Options page
- [ ] Remaining providers
- [ ] Theme system
- [ ] Helper Mode UI

### Phase 3: Polish
- [ ] Database schema updates
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Production release

---

## 🔒 Privacy

- **No Tracking**: Zero analytics or telemetry
- **Local Storage**: All settings stored locally
- **Anonymous Submissions**: No personal data collected
- **Open Source**: Transparent codebase

---

## 📜 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 🐛 Issues & Feedback

Report issues at: [GitHub Issues](https://github.com/lightmyfireadmin/triggerwarnings/issues)

---

## 👥 Credits

- **Original Author**: MitchB
- **Rewrite Architecture**: Claude (Anthropic)
- **Community**: All trigger warning contributors

---

## 🌟 Key Improvements (v2.0 vs v0.9)

| Feature | v0.9 (Old) | v2.0 (New) |
|---------|------------|------------|
| Platforms | Netflix only | 7+ platforms |
| Profiles | Single settings | Unlimited profiles |
| Technology | Vanilla JS | TypeScript + Svelte |
| Build System | Webpack | Vite |
| Architecture | Monolithic | Modular |
| Customization | Basic | Advanced |
| Theme Support | None | Light/Dark/System |
| Import/Export | No | Yes |
| Type Safety | No | Full TypeScript |
| Testing | None | Vitest |

---

**Note**: This is an active rewrite. Some features are still in development. See PROGRESS_REPORT.md for current status.
