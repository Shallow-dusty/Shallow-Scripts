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

### Modular Architecture (v7.0+)

Ultimate 版本采用模块化架构，支持功能扩展：

```
┌─────────────────────────────────────────────────────────────┐
│                        Main Loop                             │
│  - checkUserAndPanel() every 1.5s                           │
│  - User detection & module notification                      │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Core Layer    │  │ ModuleRegistry  │  │    PanelUI      │
│  - User mgmt    │  │  - register()   │  │  - create()     │
│  - Theme mgmt   │  │  - toggle()     │  │  - update()     │
│  - Storage      │  │  - isEnabled()  │  │  - Settings     │
│  - URL utils    │  │  - notify()     │  │  - Dashboard    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ CounterModule   │  │ FoldersModule   │  │  [Future Mod]   │
│  (default: on)  │  │  (default: off) │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Module Interface

每个模块需实现以下接口：

```javascript
{
  id: 'module-id',           // 唯一标识
  name: '模块名称',           // 显示名称
  description: '功能描述',    // 简短描述
  icon: '📊',                // Emoji 图标
  defaultEnabled: true,      // 默认启用状态

  init(),                    // 初始化 (启用时调用)
  destroy(),                 // 销毁 (禁用时调用)
  onUserChange(user),        // 用户切换通知
}
```

### Core Counting Mechanism
All versions share the same detection pattern:
1. **Keydown listener** - Captures Enter key on textarea/contenteditable (with `isComposing` check for IME)
2. **Click listener** - Detects send button clicks via `aria-label` matching (`Send`/`发送`)
3. **Cooldown** - 1-second debounce prevents double-counting

### Data Storage (Tampermonkey GM APIs)
- `GM_setValue`/`GM_getValue` - Persistent storage per script
- `GM_addValueChangeListener` - Multi-tab real-time sync (Simple/Standard/Ultimate)
- Storage keys prefixed with `gemini_` (Ultimate uses per-user keys: `gemini_store_{email}`)
- Module enabled state: `gemini_enabled_modules` (array of module IDs)

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

### Model & Account Detection (Ultimate v6.6+)
- **Model Detection**: Reads current model via selectors (priority order):
  1. `button.input-area-switch` — primary (Gemini 3 UI, text: Fast/Thinking/Pro)
  2. `[data-test-id="bard-mode-menu-button"]` — fallback (DIV variant)
  3. `.bard-mode-list-button.is-selected` — menu open state
- **MODEL_DETECT_MAP**: 快速/Fast/Flash → flash, 思考/Thinking → thinking, Pro → pro
- **Account Type**: Detects Pro/Ultra badge via `button.gds-pillbox-button` or `button.pillbox-btn`
- **Quota System**: Configurable daily message limit with visual progress bar
- **Model Multipliers**: Flash (0x), Thinking (0.33x), Pro (1x) - currently simplified to raw count

## Testing

### Automated Tests
Reusable modules under `lib/` have unit tests with **100% coverage** enforced:
```bash
npm test          # runs: c8 --100 node --test
```
- Test runner: Node.js built-in `node:test`
- Coverage tool: `c8` (configured in `.c8rc.json`, targets `lib/**/*.js`)
- Tests location: `tests/`

### Logger Module Sync
`lib/debug_logger.js` is the source of truth. Use the sync script to inject it into the userscript:
```bash
node scripts/sync_logger.js
```
This replaces content between `// <LOGGER_MODULE>` and `// </LOGGER_MODULE>` markers in `GeminiCounter_Ultimate.user.js`.

### Manual Testing
For UI and integration testing:
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
