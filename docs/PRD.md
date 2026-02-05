# LoveLog - Development Documentation (PRD)

> **Version**: 1.0
> **Status**: Approved for Implementation
> **Role**: Live Project Documentation

## 1. Project Overview
**LoveLog** is a private, local-first Progressive Web App (PWA) designed to track intimacy frequency and quality using a modern, "Material You" aesthetic.
**Core Value**: Privacy, Simplicity, and Aesthetic Delight.
**Philosophy**: "Record effortlessly, recall vividly."

## 2. Technical Stack & Architecture
*   **Framework**: Vue 3 (Composition API, `<script setup>`)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS (with custom configuration for Material You tokens)
*   **State Management**: Pinia
*   **Persistence**: IndexedDB (via `idb` library) for large datasets; LocalStorage for lightweight settings.
*   **Charts**: `chart.js` + `vue-chartjs` (Line/Area charts).
*   **Icons**: Material Symbols Rounded (via Google Fonts or SVG plugin).
*   **PWA**: `vite-plugin-pwa` (Manifest, Service Worker, Offline capability).

## 3. Feature Specifications

### 3.1 Core Interaction (The "Logger")
*   **Hero Action**: Large Floating Action Button (FAB) or Main Card on dashboard.
*   **Interaction Modes**:
    1.  **Quick Tap**: Immediate record (Count + Timestamp). Haptic feedback (`navigator.vibrate`) + Ripple effect.
    2.  **Long Press / Menu**: Opens "Rich Record" sheet.
*   **Rich Record Fields**:
    *   `Duration` (Slider 0-120 mins).
    *   `Tags` (Selectable Pills: e.g., "Morning", "Vacation").
    *   `Note` (Text Area for private thoughts).
*   **Optimistic UI**: UI updates instantly; data persistence happens in background.

### 3.2 Dashboard & Visualization ("GitHub Heatmap")
*   **Heatmap Component**:
    *   Horizontal scrolling year view.
    *   **Color Logic**: Saturation/Opacity based on *frequency* count (Level 1-4).
    *   **Interaction**: Tapping a cell opens a Bottom Sheet showing that day's logs with Edit/Delete capabilities.
*   **Stats Panel** (Separate View):
    *   **Cards**: "Total This Year", "Monthly Average", "Current Streak".
    *   **Trend Chart**: Smooth spline area chart showing monthly logs.
    *   **Achievements**: Grid of badges (e.g., "7 Day Streak", "100 Logs").

### 3.3 Data Management (Local First)
*   **Storage Strategy**: All user data resides in user's browser (IndexedDB).
*   **Backfill / History**:
    *   Dedicated Calendar view to select past dates and insert records.
*   **Backup & Sync**:
    *   **Export**: Full JSON dump of database.
    *   **Import**: Restore from JSON (Merge/Overwrite modes).
    *   **Future**: API hooks for self-hosted server sync (Tailscale/HomeLab).

### 3.4 Security & Privacy
*   **App Lock**: Optional 4-digit PIN overlay.
    *   Stored as hashed value in LocalStorage.
    *   Blocks view mounting until unlocked.
*   **Network**: No 3rd party analytics. No remote calls (except Google Fonts/Assets).

### 3.5 UI/UX Design Guidelines (Material You)
*   **Theme Engine**:
    *   **Palette**: dynamic warm tones (Rose/Pink base).
    *   **Dark Mode**: Fully supported, deep gray/black surfaces.
    *   **Tokens**: Surface-1 (base), Surface-2 (cards), Primary (action), On-Primary (text).
*   **Motion (Native Feel)**:
    *   **Page Transitions**: Slide-over (Right-to-Left enter, scale-down exit) + Parallax.
    *   **Micro-interactions**: Scale-95 on press, generic bouncy springs.
    *   **No Reflow**: Layout stable; animations typically GPU-accelerated (transform/opacity).
*   **Mobile Polish**:
    *   `user-select: none` to prevent text selection.
    *   `viewport-fit=cover` for Notches/Dynamic Island.

## 4. Data Structures (TypeScript Interfaces)

```typescript
// Core Entity
export interface LogEntry {
  id: string;             // UUID v4
  timestamp: number;      // Unix Timestamp (ms) - Exact time of action
  dateStr: string;        // YYYY-MM-DD (Indexed for fast Heatmap lookups)
  
  // Rich Data (Optional)
  durationMinutes?: number;
  tags?: string[];
  note?: string;
  rating?: number;        // 1-5 Scale (Future proof)
  
  createdAt: number;
  updatedAt: number;
}

// User Settings
export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  security: {
    pinEnabled: boolean;
    pinHash?: string; // Simple hash check
  };
  gamification: {
    badgesUnlocked: string[]; // IDs of unlocked achievements
  };
  developer: {
    showDebug: boolean;
  };
}
```

## 5. Development Phases

### Phase 1: Setup & Core (Current)
- [ ] Scaffold Vue 3 + Tailwind + PWA.
- [ ] Setup Pinia + IDB.
- [ ] Implement "Add Log" (Simple & Rich).

### Phase 2: Visualization
- [ ] Implement Heatmap Component (CSS Grid/Flex).
- [ ] Implement Dashboard Stats.

### Phase 3: Polish & Security
- [ ] Add Animations (Transitions).
- [ ] Implement PIN Lock.
- [ ] Data Export/Import.
