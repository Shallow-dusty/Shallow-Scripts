# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tampermonkey userscript collection providing message counting functionality for Google Gemini. Four script versions exist with progressively richer features - only one should be enabled at a time.

## Script Versions (by complexity)

| File | Description |
|------|-------------|
| `GeminiCounter_Lite.user.js` | Minimal counter, fixed position, no UI |
| `GeminiCounter_Simple.user.js` | Glass UI, draggable, multi-tab sync, single counter |
| `GeminiCounter_Standard.user.js` | Dashboard with session/chat/lifetime views |
| `GeminiCounter_Ultimate.user.js` | Multi-user isolation, themes, daily quotas, heatmaps (recommended) |

## Architecture

### Core Counting Mechanism
All versions share the same detection pattern:
1. **Keydown listener** - Captures Enter key on textarea/contenteditable (with `isComposing` check for IME)
2. **Click listener** - Detects send button clicks via `aria-label` matching (`Send`/`发送`)
3. **Cooldown** - 1-second debounce prevents double-counting

### Data Storage (Tampermonkey GM APIs)
- `GM_setValue`/`GM_getValue` - Persistent storage per script
- `GM_addValueChangeListener` - Multi-tab real-time sync (Simple/Standard/Ultimate)
- Storage keys prefixed with `gemini_` (Ultimate uses per-user keys: `gemini_store_{email}`)

### CSP Compliance (Critical)
Google Gemini enforces strict Content Security Policy. All DOM must be created via native APIs:
- **Never use** `innerHTML`, template literals for HTML, or string-based DOM construction
- **Always use** `document.createElement()`, `appendChild()`, `replaceChildren()`
- Modal/overlay injection requires inline styles via `element.style.property = value`

### User Detection (Ultimate only)
Extracts Google account email from DOM elements (`img[alt*="@"]`, `button[aria-label*="@"]`) with 2-second timeout fallback to `Guest` mode.

### Daily Reset System (Ultimate)
- Configurable reset hour (0-23)
- Uses `dailyCounts[YYYY-MM-DD]` structure
- `getDayKey(resetHour)` calculates current "day" respecting custom reset time

## Testing

No automated tests. Manual testing required:
1. Install in Tampermonkey
2. Open `https://gemini.google.com/`
3. Verify counter increments on message send
4. Test multi-tab sync by opening duplicate tabs
5. Test panel drag boundaries and position persistence

## Key Implementation Details

- Panel uses `position: fixed; z-index: 2147483647` for overlay priority
- Viewport bounds checking on drag prevents off-screen positioning
- Theme engine (Ultimate) applies CSS custom properties dynamically via `element.style.setProperty()`
- `translate="no"` attribute prevents conflicts with translation extensions
