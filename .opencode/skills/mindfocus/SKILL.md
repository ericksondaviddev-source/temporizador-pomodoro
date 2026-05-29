# MindFocus - Project-Specific Skill

## Purpose
Specialized instructions for working on the MindFocus Pomodoro timer with mind map visualization.

## Context
MindFocus is a vanilla HTML/CSS/JS project with Firebase authentication and Firestore database. The codebase follows specific patterns that any agent working on this project should understand and follow.

---

## Project Quick Reference

### File Locations
- `index.html` — Structure, modals, sidebar
- `css/style.css` — Dual-theme CSS, glassmorphism, animations
- `js/app.js` — Main logic (~650 lines), state management, Firebase sync
- `js/firebase-config.js` — Firebase initialization

### Key Functions (app.js)

| Function | Purpose | Notes |
|----------|---------|-------|
| `escapeHtml(text)` | XSS sanitization | ALWAYS use before innerHTML with user content |
| `sanitizePresetName(name)` | Sanitize + truncate preset names | Max 50 chars |
| `renderTasks()` | Render task bars to sidebar | Uses escapeHtml |
| `renderBubbles()` | Render mind map bubbles + SVG lines | Uses textContent (safe) |
| `renderPresets()` | Render preset list | Uses sanitizePresetName |
| `startTimer()` / `pauseTimer()` / `resetTimer()` | Pomodoro controls | — |
| `selectTask(taskId)` | Open timer with task | — |
| `addTask(name, color, notes)` | Create new task | Validates lengths |
| `deleteTask(taskId, event)` | Delete with confirmation | — |
| `savePreset(name)` | Save current tasks as preset | Sanitizes inputs |
| `loadPreset(presetId)` | Load preset tasks | Confirms before replacing |
| `updateAuthUI(user)` | Update auth UI state | Shows/hides profile section |
| `saveProfile()` | Save user profile customizations | Updates Firebase + localStorage |
| `toggleTheme()` | Switch dark/light theme | Persists to localStorage |
| `saveSessionToHistory(minutes)` | Record completed session | Saves to localStorage |

### Constants
```javascript
const SIZE_INCREMENT = 1.06;  // Bubble size multiplier (20% smaller than original 1.32)
const DAY_SIZE = 130;          // Day bubble diameter in px
const TOTAL_FOCUS = 2700;      // 45 minutes in seconds
const TOTAL_BREAK = 900;       // 15 minutes in seconds
```

### State Object (appState)
```javascript
appState = {
    tasks: [],              // Array of task objects
    currentTask: null,      // Task selected for timer
    timerInterval: null,    // setInterval reference
    isTimerRunning: false,
    secondsLeft: 2700,      // Current countdown
    TOTAL_FOCUS: 2700,
    isBreak: false,         // true = break mode, false = focus mode
    theme: 'dark',
    currentUser: null,      // Firebase user object
    draggedBubble: null,    // Currently dragged task
    presets: []             // Saved sessions
};
```

### Task Object Structure
```javascript
{
    id: 'generated-id',      // Date.now() + random
    name: 'Task name',        // max 60 chars
    color: '#4CAF50',         // hex color
    notes: 'Description',     // max 500 chars
    totalFocusTime: 0,        // accumulated seconds
    sessionsCompleted: 0,    // number of completed pomodoros
    position: { x: 100, y: 200 }  // bubble position (null = random)
}
```

---

## Security Patterns

### ALWAYS Use These
```javascript
// For any user content in innerHTML:
element.innerHTML = `...${escapeHtml(userContent)}...`;

// For preset names:
name = sanitizePresetName(name);

// For task creation:
name = name.trim().slice(0, 60);
notes = notes.trim().slice(0, 500);

// For Firebase errors:
try {
    await someFirebaseOperation();
} catch (e) {
    console.error('Error description:', e);
    alert('User-friendly message: ' + (e.message || 'Unknown error'));
}
```

### NEVER Do These
```javascript
// BAD - XSS vulnerability
element.innerHTML = `Welcome ${userName}`;

// GOOD - Sanitized
element.innerHTML = `Welcome ${escapeHtml(userName)}`;

// BAD - Silent error
.catch(() => null)

// GOOD - Logged and surfaced
.catch(e => { console.error(e); alert('Error: ' + e.message); });
```

---

## Firebase Structure

### Firestore Collections
```
users/{userId}/tasks/{taskId}
```

### Task Document
```javascript
{
    name: string,
    color: string,
    notes: string,
    totalFocusTime: number,
    sessionsCompleted: number,
    position: { x: number, y: number } | null,
    userId: string,
    createdAt: ISO string,
    updatedAt: ISO string
}
```

### Security Rules (verify in Firebase Console)
```
match /users/{userId}/tasks/{taskId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Common Tasks

### Adding a new UI element
1. Add HTML to index.html
2. Add CSS to style.css (follow existing patterns, use CSS variables)
3. Add event listener in app.js INIT section
4. Test in browser

### Modifying timer duration
1. Change `TOTAL_FOCUS` constant in app.js
2. Change 45 to actual minutes in index.html timer display (or make it dynamic)

### Adding a new modal
1. Add HTML in index.html after existing modals
2. Add CSS in style.css
3. Add elements reference in elements object
4. Add open/close logic in INIT section

### Debugging Firebase issues
1. Check browser console for errors
2. Verify Firebase config in firebase-config.js
3. Check Firestore rules in Firebase Console
4. Test with incognito/private window

---

## Testing Checklist
Before any commit, verify:
- [ ] `escapeHtml()` used for all user content in innerHTML
- [ ] Input validation (max lengths) working
- [ ] Theme toggle persists across refresh
- [ ] Task creation with special chars (`<script>` etc.) doesn't execute
- [ ] Timer starts, pauses, resets correctly
- [ ] Break mode switches after focus completion
- [ ] History updates after session completion
- [ ] Preset save/load works
- [ ] Export generates valid CSV/MD
- [ ] No `catch(() => null)` remaining
- [ ] Browser console has no errors

---

## Git Workflow
```bash
# Before starting work
git status
git pull

# After making changes
git add -A
git commit -m "feat: description of changes"
git push

# Commit message prefixes
feat:  - New feature
fix:   - Bug fix
refactor: - Code refactoring
docs:  - Documentation changes
style: - Formatting, no code change
test:  - Adding tests
```

---

## File: js/app.js

### Section Structure (line numbers approx)
```
1-20     Imports and state
21-75    DOM element references
76-90    Helper functions (formatTime, generateId, etc.)
91-120   Sound functions (playClick, playGong)
121-160  Authentication (Firebase auth functions)
161-200  Firestore operations
201-260  Presets (save, load, delete, render)
261-310  History and export (getHistoryData, exportData)
311-370  Render functions (renderTasks, renderBubbles)
371-460  Timer logic (start, pause, reset, finished)
461-540  Event handlers and main functions
541-650  INIT section (event listeners, startup)
```

---

## Design Tokens Reference

```css
/* Key CSS variables */
--bg-primary: #0f0f1a      /* Dark mode main bg */
--bg-secondary: #141428    /* Sidebar */
--accent-color: #00B0FF    /* Electric blue */
--text-primary: #e0e0ec    /* Main text */
--text-secondary: #7a7a95 /* Muted text */
--golden: #FFD700          /* Golden ring on bubbles */

/* Typography */
font-family: 'Inter', sans-serif
font-family: 'JetBrains Mono' for timer

/* Animations */
float: 7s ease-in-out infinite (bubbles)
rotate-ring: 6s linear infinite (golden ring)
pulse-day: 4s ease-in-out infinite (day bubble)
```

---

## Contact Points
- Repository: https://github.com/ericksondaviddev-source/temporizador-pomodoro
- Deployed: https://temporizador-pomodoro-brown.vercel.app
- Firebase Project: mindfocus-pomodoro