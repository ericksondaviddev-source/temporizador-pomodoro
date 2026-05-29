# MindFocus - Design System

> Visual language, design tokens, and component specifications for MindFocus.

---

## 1. Brand & Visual Identity

### Brand Personality
- **Primary feeling:** Calm focus, deep concentration
- **Metaphor:** A star constellation of focused energy
- **Tone:** Premium, minimal, slightly futuristic
- **Mood:** Dark obsidian with electric blue accents and golden highlights

### Color Usage
| Role | Dark Theme | Light Theme | Usage |
|------|------------|------------|-------|
| Background Primary | `#0f0f1a` | `#f5f5fa` | Main canvas, body |
| Background Secondary | `#141428` | `#ececf2` | Sidebar |
| Background Card | `#1e1e38` | `#ffffff` | Task bars, modals |
| Text Primary | `#e0e0ec` | `#1a1a2e` | Headings, body |
| Text Secondary | `#7a7a95` | `#6b6b85` | Meta, labels |
| Accent | `#00B0FF` | `#0090dd` | CTAs, highlights |
| Golden | `#FFD700` | `#FFD700` | Bubble rings, signature |
| Danger | `#f44336` | `#f44336` | Delete, logout |

---

## 2. Design Tokens

### Spacing Scale (base: 4px)
```
4px  - xs
8px  - sm
12px - md
16px - lg
20px - xl
24px - 2xl
32px - 3xl
```

### Typography Scale
```
0.65rem (10.4px)  - signature, legal
0.7rem  (11.2px)  - tags, badges
0.75rem (12px)    - small meta
0.78rem (12.5px)  - small labels
0.8rem  (12.8px)  - body small, stats
0.85rem (13.6px)  - task names, labels
0.9rem  (14.4px)  - section headers
1.0rem  (16px)    - modal headings
1.1rem  (17.6px)  - large headings
1.25rem (20px)    - logo (old)
1.6rem  (25.6px)  - logo (new)
```

### Border Radius
```
4px   - smallest (inputs)
6px   - small (buttons, items)
8px   - medium (cards)
10px  - large (panels)
16px  - extra large (modals)
50%   - circular (avatars, bubbles)
```

### Shadows
```css
/* Subtle */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

/* Medium (cards) */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);

/* Strong (modals) */
box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);

/* Glow (accent elements) */
box-shadow: 0 0 20px var(--accent-glow);

/* Inset glow (bubbles) */
box-shadow: 0 0 40px rgba(255, 255, 255, 0.05) inset;
```

### Transitions
```css
/* Fast (buttons, hovers) */
transition: all 0.2s ease;

/* Medium (layout changes) */
transition: all 0.3s ease;

/* Slow (theme switch) */
transition: background-color 0.4s ease, color 0.4s ease;

/* Bubbles (transform) */
transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

---

## 3. Component Specifications

### Task Bar (Collapsed)
```
┌─────────────────────────────────────────────────┐
│ ▌ Task Name Here                        🗑️  ▼ │
│   45 min · 3 ses                               │
└─────────────────────────────────────────────────┘
Height: auto (content-based)
Padding: 0.7rem 0.8rem
Border-radius: 10px
Background: var(--bg-card)
Border: 1px solid var(--border-color)
Hover: border-color → accent
```

### Task Bar (Expanded)
```
┌─────────────────────────────────────────────────┐
│ ▌ Task Name Here                        🗑️  ▲ │
│   45 min · 3 ses                               │
├─────────────────────────────────────────────────┤
│ Notes text goes here...                         │
│                                                 │
│ ⏱️ 45 minutos  ✓ 3 sesiones                     │
└─────────────────────────────────────────────────┘
Additional padding-bottom: 0.8rem
Border-top: 1px solid var(--border-color)
```

### Bubble (Task)
```
Size: 96px + (focus_minutes × 2), capped at +120px
Multiplier: SIZE_INCREMENT = 1.06

Example: 45 min focus = 96 + 90 = 186px → 186 × 1.06 ≈ 197px max

Structure:
┌─────────────────┐
│                 │
│   Task Name     │  ← centered, white text, 0.8rem
│                 │
│  ◯ golden ring  │  ← rotating, 5px outside bubble
│                 │
└─────────────────┘

Visual Effects:
- background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.1))
- backdrop-filter: blur(10px)
- border: 1px solid rgba(255, 255, 255, 0.2)
- box-shadow: (varies)
```

### Bubble (Day)
```
Size: 130px × 130px (fixed)

┌────────────────────┐
│                    │
│   Mie 28           │  ← date, 1.1rem bold
│   3 ses · 135 min  │  ← stats, 0.75rem
│                    │
└────────────────────┘

Animation: pulse-day (4s ease-in-out infinite)
```

### Modal (Base)
```
Width: 90% max, max-width 420px
Padding: 2rem
Border-radius: 16px
Background: var(--bg-card)
Border: 1px solid var(--border-color)
Shadow: 0 25px 60px rgba(0, 0, 0, 0.5)

Animation: modalAppear (0.3s ease-out)
Entry: opacity 0→1, translateY -15px→0, scale 0.95→1
```

### Timer Modal
```
Width: 90% max, max-width 360px
Progress Ring: 200px × 200px
Circle radius: 90px
Stroke width: 8px
Timer font: 4rem, JetBrains Mono

Color: accent-color with drop-shadow glow
Background: var(--timer-bg) with backdrop-filter blur
```

### Sidebar Panel
```
Background: var(--bg-card)
Border: 1px solid var(--border-color)
Border-radius: 10px
Padding: 0.8rem
Margin-bottom: 1.25rem
```

### Button (Primary)
```
Padding: 0.85rem 1.4rem
Background: var(--gradient-accent)
Color: #fff
Border: none
Border-radius: 8px
Font: 0.9rem, weight 600

Hover: translateY(-2px), stronger shadow
Active: translateY(0)
```

### Button (Secondary)
```
Padding: 0.7rem 1.4rem
Background: transparent
Color: var(--text-primary)
Border: 1px solid var(--border-color)
Border-radius: 8px
Font: 0.85rem, weight 600

Hover: background → accent-color, color → #fff, border → accent
```

---

## 4. Animation Specifications

### Float (Bubbles)
```css
@keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-12px) rotate(1deg); }
    50% { transform: translateY(-6px) rotate(-0.5deg); }
    75% { transform: translateY(-10px) rotate(0.5deg); }
}
/* Duration: 7s | Timing: ease-in-out | Iteration: infinite */
```

### Rotate Ring (Golden)
```css
@keyframes rotate-ring {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
/* Duration: 6s | Timing: linear | Iteration: infinite */
```

### Pulse Day
```css
@keyframes pulse-day {
    0%, 100% {
        box-shadow: 0 0 0 4px var(--accent-glow),
                    0 10px 40px rgba(0, 0, 0, 0.4),
                    0 0 60px rgba(0, 176, 255, 0.2) inset;
    }
    50% {
        box-shadow: 0 0 0 8px rgba(0, 176, 255, 0.15),
                    0 15px 50px rgba(0, 0, 0, 0.5),
                    0 0 80px rgba(0, 176, 255, 0.3) inset;
    }
}
/* Duration: 4s | Timing: ease-in-out | Iteration: infinite */
```

---

## 5. Theming

### CSS Variable Architecture
```css
/* Layer 1: Primitive (raw values) */
--color-blue-500: #00B0FF;

/* Layer 2: Semantic (intent-based) */
--accent-color: var(--color-blue-500);

/* Layer 3: Component (scoped) */
.sidebar { background: var(--bg-secondary); }
```

### Dark Theme (Default)
```css
--bg-primary: #0f0f1a
--bg-secondary: #141428
--bg-card: #1e1e38
--text-primary: #e0e0ec
--text-secondary: #7a7a95
--accent-color: #00B0FF
--border-color: rgba(255, 255, 255, 0.06)
```

### Light Theme
```css
--bg-primary: #f5f5fa
--bg-secondary: #ececf2
--bg-card: #ffffff
--text-primary: #1a1a2e
--text-secondary: #6b6b85
--accent-color: #0090dd
--border-color: rgba(0, 0, 0, 0.08)
```

---

## 6. Iconography

All icons are emoji-based for simplicity:

| Icon | Emoji | Usage |
|------|-------|-------|
| Lock | 🔐 | Login button |
| Logout | 🚪 | Logout button |
| Add | + | Add task button |
| Delete | 🗑️ | Delete task |
| Expand | ▼/▲ | Expand/collapse |
| Save | 💾 | Save preset |
| Export | 📥 | Export data |
| Theme | 🌙/☀️ | Toggle theme |
| Profile | 👤 | Profile button |

---

## 7. Responsive Breakpoints

```css
/* Mobile first - below 768px is mobile layout */
@media (max-width: 768px) {
    /* Stack sidebar on top */
    /* Reduce timer font to 3rem */
    /* Sidebar max-height: 35vh */
    /* Canvas min-height: 50vh */
}
```

No other breakpoints defined — desktop is the default layout.

---

## 8. Accessibility

- All interactive elements have focus states
- Buttons use semantic `<button>` elements
- Color contrast ratios meet WCAG AA for text
- No reliance on color alone for information
- Animations respect prefers-reduced-motion
- Theme toggle button has aria-label