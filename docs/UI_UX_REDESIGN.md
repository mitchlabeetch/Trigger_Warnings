# 🎨 UI/UX Redesign Plan - Trigger Warnings Extension

Complete redesign based on the modern, beautiful aesthetics established in the landing page.

---

## Design Principles

### 1. **Visual Language**

**Colors** (from landing page):
```css
--primary: #667eea (Purple-blue)
--primary-dark: #5568d3
--secondary: #764ba2 (Deep purple)
--accent: #f093fb (Pink)
--text-dark: #1a202c
--text-light: #4a5568
--bg-light: #f7fafc
--bg-white: #ffffff
--success: #48bb78 (Green)
--warning: #ed8936 (Orange)
--danger: #f56565 (Red)
```

**Gradients**:
```css
--gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
--gradient-3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
```

**Typography**:
- Font family: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- Headings: 800 weight, tight line-height
- Body: 400 weight, 1.6 line-height
- Small text: 0.85rem

### 2. **Animation Philosophy**

- Smooth transitions (0.3s ease)
- Micro-interactions on hover
- Count-up animations for stats
- Fade-in effects for content
- Scale animations for emphasis
- Minimal motion for accessibility

### 3. **Glassmorphism**

```css
background: rgba(255,255,255,0.2);
backdrop-filter: blur(10px);
border: 1px solid rgba(255,255,255,0.3);
```

### 4. **Spacing & Layout**

- 8px base unit
- Generous padding (20-40px)
- Rounded corners (8-16px)
- Card-based design
- Clear visual hierarchy

---

## Component Redesigns

### 🔸 **1. Popup UI (src/popup/Popup.svelte)**

Current state: Basic functional UI
Target state: Modern, gradient-based, card layout

#### Header Section
```svelte
<div class="popup-header">
  <div class="logo">
    <img src="/icons/icon-48.png" alt="Trigger Warnings" />
  </div>
  <h1 class="gradient-text">Trigger Warnings</h1>
  <div class="status-badge">
    {#if currentVideoId}
      <span class="status-indicator active"></span>
      <span>Active on {platformName}</span>
    {:else}
      <span class="status-indicator inactive"></span>
      <span>Not on streaming site</span>
    {/if}
  </div>
</div>
```

**Styles**:
```css
.popup-header {
  background: var(--gradient-1);
  color: white;
  padding: 24px;
  text-align: center;
  border-radius: 0 0 16px 16px;
}

.gradient-text {
  background: linear-gradient(135deg, white, rgba(255,255,255,0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.5rem;
  font-weight: 800;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  margin-top: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.active {
  background: #48bb78;
}

.status-indicator.inactive {
  background: #cbd5e0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### Profile Selector
```svelte
<div class="profile-section">
  <label class="section-label">Active Profile</label>
  <div class="profile-selector">
    <select
      bind:value={activeProfile?.id}
      on:change={(e) => switchProfile(e.target.value)}
      class="profile-dropdown"
    >
      {#each allProfiles as profile}
        <option value={profile.id}>{profile.name}</option>
      {/each}
    </select>
    <button on:click={openCreateProfile} class="btn-icon">
      <span>+</span>
    </button>
  </div>
</div>
```

**Styles**:
```css
.profile-section {
  padding: 20px;
  background: white;
}

.section-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.profile-selector {
  display: flex;
  gap: 12px;
}

.profile-dropdown {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  background: white;
}

.profile-dropdown:hover {
  border-color: var(--primary);
}

.profile-dropdown:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--gradient-1);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
```

#### Quick Actions
```svelte
<div class="quick-actions">
  <button on:click={openSubmitForm} class="action-card">
    <div class="action-icon">📝</div>
    <div class="action-text">
      <div class="action-title">Submit Warning</div>
      <div class="action-subtitle">Report trigger in current video</div>
    </div>
  </button>

  <button on:click={openOptions} class="action-card">
    <div class="action-icon">⚙️</div>
    <div class="action-text">
      <div class="action-title">Settings</div>
      <div class="action-subtitle">Customize categories & display</div>
    </div>
  </button>
</div>
```

**Styles**:
```css
.quick-actions {
  padding: 20px;
  display: grid;
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 2px solid #f7fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.action-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

.action-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-1);
  border-radius: 12px;
  flex-shrink: 0;
}

.action-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-dark);
  margin-bottom: 2px;
}

.action-subtitle {
  font-size: 0.85rem;
  color: var(--text-light);
}
```

#### Current Video Detection
```svelte
{#if currentVideoId}
  <div class="current-video">
    <div class="video-indicator">
      <span class="pulse-dot"></span>
      <span class="video-text">Watching: {platformName}</span>
    </div>
    <div class="video-id">Video ID: {currentVideoId}</div>
  </div>
{/if}
```

**Styles**:
```css
.current-video {
  margin: 0 20px 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f093fb22, #f5576c22);
  border-radius: 12px;
  border-left: 4px solid var(--accent);
}

.video-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.video-id {
  font-size: 0.8rem;
  color: var(--text-light);
  font-family: monospace;
}
```

---

### 🔸 **2. Options Page (src/options/Options.svelte)**

Current state: Tabbed interface with categories/settings/stats
Target state: Modern dashboard with cards, animations, stats visualization

#### Header
```svelte
<div class="options-header">
  <div class="container">
    <div class="header-content">
      <div class="logo-section">
        <img src="/icons/icon-128.png" alt="Trigger Warnings" />
        <div>
          <h1>Trigger Warnings</h1>
          <p class="subtitle">Customize your protection preferences</p>
        </div>
      </div>
      <div class="profile-quick-switch">
        <select class="profile-select-header">
          {#each profiles as profile}
            <option>{profile.name}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>
</div>
```

**Styles**:
```css
.options-header {
  background: var(--gradient-1);
  color: white;
  padding: 32px 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-section img {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
}

.logo-section h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
}

.subtitle {
  opacity: 0.9;
  font-size: 1rem;
  margin: 4px 0 0;
}
```

#### Tab Navigation
```svelte
<div class="tab-nav">
  <div class="container">
    <button
      class="tab"
      class:active={activeTab === 'categories'}
      on:click={() => activeTab = 'categories'}
    >
      <span class="tab-icon">🏷️</span>
      <span>Categories</span>
      <span class="tab-count">{activeCategories.length} enabled</span>
    </button>

    <button
      class="tab"
      class:active={activeTab === 'settings'}
      on:click={() => activeTab = 'settings'}
    >
      <span class="tab-icon">⚙️</span>
      <span>Settings</span>
    </button>

    <button
      class="tab"
      class:active={activeTab === 'stats'}
      on:click={() => activeTab = 'stats'}
    >
      <span class="tab-icon">📊</span>
      <span>Statistics</span>
    </button>
  </div>
</div>
```

**Styles**:
```css
.tab-nav {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-nav .container {
  display: flex;
  gap: 8px;
  padding: 0 20px;
}

.tab {
  flex: 1;
  padding: 16px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-light);
  font-weight: 600;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab:hover {
  background: rgba(102, 126, 234, 0.05);
  color: var(--primary);
}

.tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-count {
  background: rgba(102, 126, 234, 0.1);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}
```

#### Categories Tab - Card Grid
```svelte
<div class="categories-grid">
  {#each CATEGORIES as category}
    <div class="category-card" class:enabled={isEnabled(category)}>
      <div class="category-header">
        <span class="category-icon">{category.icon}</span>
        <h3 class="category-name">{category.name}</h3>
      </div>

      <p class="category-description">{category.description}</p>

      <div class="category-actions">
        <label class="toggle-switch">
          <input
            type="checkbox"
            checked={isEnabled(category)}
            on:change={() => toggleCategory(category)}
          />
          <span class="toggle-slider"></span>
        </label>

        <select class="action-select" disabled={!isEnabled(category)}>
          <option value="warn">Warn</option>
          <option value="mute">Mute</option>
          <option value="hide">Hide</option>
          <option value="mute-hide">Mute & Hide</option>
        </select>
      </div>
    </div>
  {/each}
</div>
```

**Styles**:
```css
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 32px 20px;
}

.category-card {
  background: white;
  border: 2px solid #f7fafc;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--gradient-1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.category-card.enabled::before {
  opacity: 1;
}

.category-card:hover {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.category-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
}

.category-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

.category-description {
  font-size: 0.9rem;
  color: var(--text-light);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.category-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #cbd5e0;
  border-radius: 28px;
  transition: 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--gradient-1);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.action-select {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.action-select:focus {
  outline: none;
  border-color: var(--primary);
}
```

#### Settings Tab - Card Layout
```svelte
<div class="settings-grid">
  <div class="settings-card">
    <h3 class="settings-title">
      <span class="settings-icon">🎨</span>
      Display Settings
    </h3>

    <div class="setting-row">
      <label class="setting-label">Position</label>
      <select class="setting-input">
        <option>Top Right</option>
        <option>Top Left</option>
        <option>Bottom Right</option>
        <option>Bottom Left</option>
      </select>
    </div>

    <div class="setting-row">
      <label class="setting-label">Font Size</label>
      <input type="range" min="12" max="24" class="setting-slider" />
    </div>

    <div class="setting-row">
      <label class="setting-label">Opacity</label>
      <input type="range" min="0" max="100" class="setting-slider" />
    </div>
  </div>

  <div class="settings-card">
    <h3 class="settings-title">
      <span class="settings-icon">⏰</span>
      Timing Settings
    </h3>

    <div class="setting-row">
      <label class="setting-label">Lead Time (seconds)</label>
      <input type="number" min="0" max="30" class="setting-input" />
    </div>

    <div class="setting-row">
      <label class="setting-label">Duration (seconds)</label>
      <input type="number" min="1" max="60" class="setting-input" />
    </div>
  </div>
</div>
```

**Styles**:
```css
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  padding: 32px 20px;
}

.settings-card {
  background: white;
  border: 2px solid #f7fafc;
  border-radius: 16px;
  padding: 32px;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 24px 0;
}

.settings-icon {
  font-size: 1.8rem;
}

.setting-row {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.setting-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.setting-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.setting-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gradient-1);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}
```

---

### 🔸 **3. Warning Banners (src/content/banner/Banner.svelte)**

Current state: Functional overlay
Target state: Elegant, animated, non-intrusive

```svelte
<div
  class="warning-banner"
  class:minimized={isMinimized}
  style="
    top: {position.top};
    right: {position.right};
    opacity: {opacity};
  "
>
  <div class="banner-glow"></div>

  <div class="banner-content">
    <div class="banner-header">
      <span class="banner-icon">{categoryIcon}</span>
      <div class="banner-info">
        <div class="banner-category">{categoryName}</div>
        <div class="banner-time">in {timeRemaining}s</div>
      </div>
      <button on:click={minimize} class="banner-minimize">
        {isMinimized ? '▼' : '▲'}
      </button>
    </div>

    {#if !isMinimized}
      <div class="banner-description">{description}</div>

      <div class="banner-actions">
        <button on:click={voteUp} class="banner-btn vote-up">
          <span>👍</span>
          <span>{upvotes}</span>
        </button>

        <button on:click={voteDown} class="banner-btn vote-down">
          <span>👎</span>
          <span>{downvotes}</span>
        </button>

        <button on:click={ignore} class="banner-btn ignore">
          Ignore
        </button>
      </div>
    {/if}
  </div>
</div>
```

**Styles**:
```css
.warning-banner {
  position: fixed;
  z-index: 999999;
  min-width: 300px;
  max-width: 400px;
  background: rgba(26, 32, 44, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  animation: bannerSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

@keyframes bannerSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.banner-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(102, 126, 234, 0.15) 0%,
    transparent 70%
  );
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.banner-content {
  position: relative;
  z-index: 1;
  color: white;
}

.banner-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.banner-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.banner-info {
  flex: 1;
}

.banner-category {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.banner-time {
  font-size: 0.85rem;
  opacity: 0.8;
}

.banner-minimize {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banner-minimize:hover {
  background: rgba(255,255,255,0.2);
}

.banner-description {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 16px;
  line-height: 1.5;
}

.banner-actions {
  display: flex;
  gap: 8px;
}

.banner-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.banner-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.05);
}

.banner-btn.vote-up:hover {
  background: rgba(72, 187, 120, 0.3);
  border-color: rgba(72, 187, 120, 0.5);
}

.banner-btn.vote-down:hover {
  background: rgba(245, 101, 101, 0.3);
  border-color: rgba(245, 101, 101, 0.5);
}

.warning-banner.minimized {
  min-width: auto;
  max-width: 200px;
  padding: 12px;
}
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
- [ ] Create shared CSS variables file
- [ ] Update global styles with new colors/fonts
- [ ] Create reusable Svelte components (Button, Card, Toggle, etc.)

### Phase 2: Popup Redesign (Week 2)
- [ ] Redesign header with gradient
- [ ] Implement new profile selector
- [ ] Add quick actions cards
- [ ] Add current video indicator

### Phase 3: Options Page (Week 3)
- [ ] Redesign header and navigation
- [ ] Implement category cards grid
- [ ] Create settings cards layout
- [ ] Add animations and transitions

### Phase 4: Warning Banners (Week 4)
- [ ] Redesign banner component
- [ ] Add glassmorphism effects
- [ ] Implement minimize/expand
- [ ] Add vote animations

### Phase 5: Polish (Week 5)
- [ ] Add loading states
- [ ] Implement error states
- [ ] Add accessibility features
- [ ] Test on all platforms
- [ ] Performance optimization

---

## Technical Considerations

### 1. **Tailwind Configuration**

Update `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#5568d3',
        },
        secondary: '#764ba2',
        accent: '#f093fb',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(102, 126, 234, 0.4)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(102, 126, 234, 0)' },
        },
      },
    },
  },
};
```

### 2. **Svelte Transitions**

```svelte
<script>
  import { fade, fly, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
</script>

<div in:fly="{{ y: 20, duration: 400, easing: cubicOut }}">
  <!-- Content -->
</div>
```

### 3. **Dark Mode Support**

```css
@media (prefers-color-scheme: dark) {
  :root {
    --text-dark: #f7fafc;
    --text-light: #cbd5e0;
    --bg-light: #1a202c;
    --bg-white: #2d3748;
  }
}
```

---

## Testing Checklist

- [ ] All animations run smoothly (60fps)
- [ ] Colors meet WCAG AA contrast standards
- [ ] Touch targets are at least 44x44px
- [ ] Works on Chrome, Edge, Brave
- [ ] Popup fits in 400x600px window
- [ ] Options page responsive to window resize
- [ ] Warning banners don't block video controls
- [ ] All interactive elements keyboard-accessible
- [ ] Screen reader friendly

---

## Resources

- **Figma Design File**: (To be created)
- **Color Palette**: See "Design Principles" section
- **Icon Set**: Use system emoji + custom SVGs
- **Inspiration**: Landing page design

---

**Next Steps**: Begin Phase 1 by creating the shared CSS variables and reusable components.
