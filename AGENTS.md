# MindFocus - AI Agent Instructions

## Overview
MindFocus is a Pomodoro timer web app with mind map visualization, Firebase authentication, and cloud database. It's built with vanilla HTML/CSS/JS and deployed on Vercel.

## Tech Stack
- **Frontend:** Vanilla HTML5, CSS3 (no frameworks), JavaScript (ES6+ modules)
- **Backend:** Firebase Auth (email/password), Firestore (cloud database)
- **Hosting:** Vercel
- **Repository:** https://github.com/ericksondaviddev-source/temporizador-pomodoro

## Project Structure
```
/
├── index.html          # Main HTML structure and modals
├── css/
│   └── style.css       # Dual-theme CSS (dark/light), glassmorphism, animations
├── js/
│   ├── app.js          # Main app logic, state management, Firebase sync
│   └── firebase-config.js  # Firebase initialization and exports
├── SPEC.md             # Technical specification (this file is the source of truth)
├── design.md           # Design system, colors, typography, components
└── .env or firebase-config.js  # Contains Firebase credentials (already in repo)
```

## User Preferences (from briefing)
- **Autonomy:** Work autonomously, present results for review
- **Communication:** Detailed explanations with context
- **Style:** Suggest best practices, but respect user decisions

## Critical Context

### Firebase Configuration
```javascript
// Active config in firebase-config.js:
apiKey: "AIzaSyDMbSBJ75nSWrZiOnpb1_afMwNetmJB5Ck"
projectId: "mindfocus-pomodoro"
```

### App State Structure
```javascript
appState = {
    tasks: [],           // { id, name, color, notes, totalFocusTime, sessionsCompleted, position }
    currentTask: null,   // Currently selected task for timer
    timerInterval: null,
    isTimerRunning: false,
    secondsLeft: 2700,   // 45 minutes
    TOTAL_FOCUS: 2700,
    isBreak: false,
    theme: 'dark',
    currentUser: null,   // Firebase user object
    draggedBubble: null,
    presets: []          // { id, name, tasks: [...], createdAt }
}
```

### Pomodoro Flow
- **Focus:** 45 minutes (2700 seconds)
- **Break:** 15 minutes (900 seconds)
- **Session tracking:** When focus completes, `totalFocusTime` and `sessionsCompleted` increment
- **History:** Sessions saved to localStorage with date key

### Bubble Sizing
- Base size: 96px + (minutes * 2), capped at +120px
- `SIZE_INCREMENT = 1.06` (current 20% smaller than original 1.32)
- Day bubble: 130px fixed

### Security Requirements
- ALL user content rendered via `escapeHtml()` function to prevent XSS
- Input validation: task names max 60 chars, notes max 500 chars
- Preset names sanitized and max 50 chars
- Error handling must show alerts to user, no silent `catch(() => null)`

### Theming
```css
/* Dark theme (default) */
--bg-primary: #0f0f1a
--bg-secondary: #141428
--accent-color: #00B0FF
--text-primary: #e0e0ec

/* Light theme */
--bg-primary: #f5f5fa
--bg-secondary: #ececf2
--accent-color: #0090dd
--text-primary: #1a1a2e
```

## Firebase Security Rules
Users can ONLY access their own data. Firestore path: `users/{userId}/tasks/{taskId}`

## Design Principles
1. **Obsidian aesthetic** — Very dark backgrounds, minimal borders, clean typography
2. **3D Glassmorphism bubbles** — backdrop-filter blur, gradient highlights, rotating light ring (golden: #FFD700)
3. **Curved SVG connections** — Quadratic bezier paths from day bubble edge to task bubble edge
4. **Dual theme** — Dark default, light alternative, persisted to localStorage
5. **Floating animation** — Bubbles have subtle float animation (7s ease-in-out infinite)

## When Working on This Project

### DO:
- Run `git status` and `git pull` before starting any work
- Commit with descriptive messages: `feat:`, `fix:`, `refactor:`, `docs:`
- Test changes in browser before committing
- Use `escapeHtml()` for any user content in innerHTML
- Validate input lengths before processing
- Show error messages to users instead of silent failures

### DON'T:
- Don't use frameworks (React, Vue, etc.) — vanilla JS only
- Don't commit secrets beyond what's already in firebase-config.js
- Don't use `innerHTML` with unsanitized user content
- Don't make `catch(() => null)` — always handle or log errors
- Don't change the core Pomodoro timing (45/15 min) without explicit user request
- Don't modify Firebase config without consulting user

### Before Committing:
1. `git status` — check what changed
2. `git diff` — review changes
3. `git pull` — ensure up to date
4. Test in browser
5. Commit with clear message
6. `git push`

## Known Issues / Technical Debt
- No service worker / offline support
- No PWA manifest
- Export functionality requires login (could work offline with localStorage)
- Drag & drop bubbles don't persist positions to Firestore (only localStorage)
- Profile customizations (accent color, default theme) only saved to localStorage, not Firebase user profile

## Environment
- Node.js: Not required (pure frontend)
- Package manager: None (no npm/yarn for production)
- Build: None (Vercel serves static files directly)
- Testing: Manual browser testing

## Deployed URL
https://temporizador-pomodoro-brown.vercel.app