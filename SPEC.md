# MindFocus - Technical Specification

> **Source of Truth** — This document defines the complete technical specification for MindFocus. All implementation must match this document. Update this first when requirements change.

---

## 1. Concept & Vision

MindFocus is a productivity-focused Pomodoro timer combined with an interactive mind map visualization. The app helps users track focus sessions across multiple tasks using a visually engaging bubble-based mind map where each task is a floating glass bubble connected by curved SVG bezier lines to a central "Day" bubble. The experience should feel calm yet powerful — an obsidian-dark interface with electric blue accents and golden rotating rings on bubbles.

**Core metaphor:** The mind as a constellation of focused energy — each task is a star connected to the center of your day.

---

## 2. Design Language

### Aesthetic Direction
**Obsidian + Glassmorphism** — Deep, nearly-black backgrounds with 3D translucent glass bubbles that float and pulse gently. The overall feel is premium, focused, and slightly futuristic.

### Color Palette

```css
/* Dark Theme (Default) */
--bg-primary: #0f0f1a         /* Deep obsidian background */
--bg-secondary: #141428        /* Slightly lighter for sidebar */
--bg-card: #1e1e38            /* Card/panel backgrounds */
--text-primary: #e0e0ec       /* Primary text - soft white */
--text-secondary: #7a7a95     /* Secondary/muted text */
--accent-color: #00B0FF        /* Electric blue - primary accent */
--accent-glow: rgba(0, 176, 255, 0.25)     /* Blue glow effect */
--accent-glow-strong: rgba(0, 176, 255, 0.4)
--border-color: rgba(255, 255, 255, 0.06)   /* Subtle borders */
--gradient-day: linear-gradient(135deg, #00B0FF 0%, #0090dd 100%)
--gradient-accent: linear-gradient(135deg, #00B0FF 0%, #00d4aa 100%)

/* Light Theme */
--bg-primary: #f5f5fa         /* Light gray background */
--bg-secondary: #ececf2       /* Sidebar background */
--bg-card: #ffffff             /* Cards */
--text-primary: #1a1a2e        /* Dark text */
--text-secondary: #6b6b85      /* Muted text */
--accent-color: #0090dd       /* Slightly darker blue for contrast */
--accent-glow: rgba(0, 144, 221, 0.15)
--accent-glow-strong: rgba(0, 144, 221, 0.3)
--border-color: rgba(0, 0, 0, 0.08)

/* Golden Ring (Bubble Animation) */
--golden: #FFD700              /* Golden ring color */
--golden-dim: rgba(255, 215, 0, 0.5)  /* Dimmed golden */
```

### Typography
- **Primary Font:** Inter (Google Fonts) — clean, modern sans-serif
- **Monospace (Timer):** JetBrains Mono, SF Mono, Fira Code
- **Fallbacks:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

### Spatial System
- Base unit: 4px
- Component padding: 0.75rem - 1rem
- Section gaps: 1.25rem
- Border radius: 8px (small), 10px (medium), 16px (large)
- Sidebar width: 280px

### Motion Philosophy
- **Bubbles:** `float` animation — 7s ease-in-out infinite, subtle vertical bobbing
- **Golden Ring:** `rotate-ring` — 6s linear infinite, conic-gradient rotation
- **Hover states:** scale(1.12) + translateY(-5px), 0.35s cubic-bezier
- **Modals:** fade + slide, 0.3s ease-out
- **Theme transition:** 0.4s ease for background/color changes

### Visual Assets
- Icons: Emoji-based (🔐 🔥 🗑️ 📥 💾 ▼ ✕)
- No external icon libraries
- SVG-based progress ring for timer
- Curved bezier paths for bubble connections

---

## 3. Layout & Structure

### Page Structure
```
┌──────────────────────────────────────────────────────────┐
│ HEADER (top-bar)                                          │
│  [Logo: signature + title + tagline]  [Auth] [Theme]     │
├──────────────┬───────────────────────────────────────────┤
│ SIDEBAR      │ MAIN CANVAS                               │
│ 280px        │                                           │
│              │    ┌──────┐                                │
│ [Profile]    │    │ DAY  │                                │
│              │    └──────┘                                │
│ [Tasks]      │      \  |  /                               │
│ [+ Add]      │    ○    ○    ○    (task bubbles)          │
│              │                                           │
│ [Presets]    │                                           │
│              │                                           │
│ [Stats]      │                                           │
│              │                                           │
│ [History]    │                                           │
│              │                                           │
│ [Export]     │                                           │
└──────────────┴───────────────────────────────────────────┘
```

### Responsive Strategy
- **< 768px:** Sidebar becomes top horizontal bar, canvas below
- Sidebar max-height: 35vh on mobile
- Canvas min-height: 50vh on mobile
- Timer font scales down from 4rem to 3rem on mobile

---

## 4. Features & Interactions

### 4.1 Authentication
- **Method:** Email/password only (Firebase Auth)
- **Flow:** Click "Iniciar Sesión" → Modal with email/password → Register/Login toggle
- **Session:** Auth state persists via Firebase session
- **UI:** Logged in state shows profile icon button; logged out shows login button

### 4.2 Tasks
- **Create:** "+" button → Modal with name (required), color picker, notes textarea
- **Edit:** Click task bar to expand → view notes and stats
- **Delete:** Trash icon on hover → confirm dialog
- **Select:** Click anywhere on task bar to select for timer
- **Validation:** Name max 60 chars, notes max 500 chars

### 4.3 Pomodoro Timer
- **Focus Duration:** 45 minutes (2700 seconds)
- **Break Duration:** 15 minutes (900 seconds)
- **Start:** Begins countdown when "Iniciar" clicked
- **Pause:** Freezes countdown, can resume
- **Reset:** Returns to initial state for current mode
- **Complete Focus:** Alert + switch to break mode + save to history
- **Complete Break:** Alert + switch to focus mode
- **Visual:** SVG circular progress ring, MM:SS display in monospace font

### 4.4 Mind Map Bubbles
- **Day Bubble:** Center of canvas, 130px, shows date and daily stats
- **Task Bubbles:**
  - Base size: 96px + (focus_minutes × 2), capped at +120px
  - SIZE_INCREMENT = 1.06 (current 20% reduction)
  - 3D glassmorphism effect with backdrop-filter blur
  - Golden rotating ring on hover
  - Floating animation
- **Connections:** Curved quadratic bezier SVG paths from day bubble edge to task bubble edge, colored to match task
- **Drag & Drop:** Bubbles can be repositioned by dragging (position saved to localStorage)

### 4.5 Sessions/Presets
- **Save:** Click 💾 → Modal to name session → saved to localStorage
- **Load:** Click preset in list → confirm dialog → replaces current tasks
- **Delete:** ✕ button on hover → removes from localStorage
- **Data stored:** Task names (sanitized), colors, notes

### 4.6 Profile Section
- **Visible:** Only when logged in
- **Customizations:**
  - Display name (max 60 chars)
  - Accent color (color picker)
  - Default theme (dark/light)
- **Save:** "Guardar Cambios" button → updates Firebase profile + localStorage

### 4.7 Statistics & History
- **Today's Stats:** Sessions count + total focus minutes
- **Weekly History:** Bar chart for last 7 days (localStorage)
- **Export:** CSV or Markdown download (requires login for Firebase data)

### 4.8 Theme Toggle
- **Switch:** Click theme button in header
- **Themes:** Dark (default) / Light
- **Persistence:** localStorage key `mindfocus-theme`
- **Transition:** 0.4s smooth color transition

### 4.9 Error Handling
- All Firebase errors logged and shown to user via alert()
- No silent `catch(() => null)` — all errors are surfaced
- XSS prevented via `escapeHtml()` function

---

## 5. Component Inventory

### Header (top-bar)
- Logo container with signature, title, tagline (centered)
- Auth section: login button OR user info (profile icon + logout)
- Theme toggle button
- Border-bottom with subtle border-color

### Sidebar
- **Profile Section:** Avatar, name, email, customization inputs (conditional)
- **Task List:** Expandable task bars with color indicator, name, meta
- **Presets Section:** Save button + list of saved presets
- **Stats Container:** Today's sessions and minutes
- **History Chart:** 7-day bar chart
- **Export Button:** Triggers CSV/MD download

### Task Bar
- **States:** Collapsed (default), Expanded (showing notes/stats)
- **Hover:** Reveal delete button, border highlights
- **Header:** Color strip, name, meta (minutes, sessions), expand arrow, actions
- **Details:** Notes text, stats row

### Bubble (Task)
- **Default:** 3D glass effect, floating animation, task name centered
- **Hover:** Scale up, glow intensifies, golden ring visible
- **Dragging:** Reduced opacity (0.5)

### Bubble (Day)
- **Size:** 130px fixed
- **Content:** Formatted date, daily sessions/minutes
- **Animation:** Gentle pulse (4s ease-in-out)

### Modals
- **Task Modal:** Form with name, color, notes inputs
- **Auth Modal:** Email/password form with register/login toggle
- **Timer Modal:** Circular progress, time display, control buttons
- **Preset Modal:** Simple name input for saving sessions

---

## 6. Technical Approach

### Architecture
Pure client-side vanilla JS with ES6 modules. No build step, no frameworks.

### File Structure
```
js/
├── app.js              # Main application logic
│   ├── State management (appState object)
│   ├── Event listeners
│   ├── Render functions (tasks, bubbles, history, presets)
│   ├── Timer logic
│   ├── Firebase sync
│   └── Helper utilities (escapeHtml, formatTime, etc.)
└── firebase-config.js  # Firebase initialization and exports
```

### State Management
Single global `appState` object containing all application state. State is mutated by functions and UI is re-rendered accordingly.

### Firebase Integration
- **Auth:** Email/password via Firebase Auth
- **Database:** Firestore collection `users/{userId}/tasks/{taskId}`
- **Sync:** Tasks sync to cloud when user is logged in
- **Offline:** localStorage as fallback for presets and history

### Security
- All user-generated content sanitized with `escapeHtml()` before innerHTML
- Input validation: 60-char task names, 500-char notes, 50-char preset names
- Firebase security rules enforce user-specific data access
- No secrets in code beyond Firebase config (intentionally public)

### Browser APIs Used
- localStorage (theme, presets, history)
- AudioContext (click/gong sounds)
- Drag and Drop API (bubble repositioning)
- Web Animations API / CSS animations
- BackdropFilter (glassmorphism effect)

### Deployment
- **Platform:** Vercel
- **Build:** None required (static files served directly)
- **URL:** https://temporizador-pomodoro-brown.vercel.app

---

## 7. Open Questions & Future Considerations

- [ ] PWA manifest and service worker for offline support
- [ ] Push notifications for timer completion
- [ ] Sound customization options
- [ ] Task categories/folders
- [ ] Sharing presets between users
- [ ] Analytics dashboard with charts
- [ ] Custom bubble shapes or icons
- [ ] Multiple timers (parallel Pomodoros)