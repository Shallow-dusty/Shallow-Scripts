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
| `GeminiCounter_Ultimate.user.js` | Multi-user isolation, themes, daily quotas, heatmaps, 8 modular extensions (~6100 lines) (recommended) |

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
│  - sleep()      │  │                 │  │  - DetailsPane  │
│  - scanChats()  │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
  ┌──────────┬──────────┬─────┴─────┬──────────┬──────────┐
  ▼          ▼          ▼           ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌──────────┐┌────────┐┌────────┐
│Counter ││Export  ││Folders ││PromptVault││Default ││Batch   │
│Module  ││Module  ││Module  ││Module    ││Model   ││Delete  │
│(on)    ││(off)   ││(off)   ││(off)     ││(off)   ││(off)   │
└────────┘└────────┘└────────┘└──────────┘└────────┘└────────┘
                                  ┌──────────┐┌────────┐
                                  │QuoteReply││UITweaks│
                                  │(off)     ││(off)   │
                                  └──────────┘└────────┘
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

  // 可选方法:
  renderToDetailsPane(container), // 渲染到面板详情区
  renderToSettings(container),    // 渲染到设置面板
  injectNativeUI(),               // 注入原生 UI 元素到 Gemini 界面 (v9.2+)
  removeNativeUI(),               // 清理注入的原生 UI 元素 (v9.2+)
  getOnboarding(),                // 返回 {zh, en} 双语引导内容 (v9.2+)
}
```

### Core Counting Mechanism
All versions share the same detection pattern:
1. **Keydown listener** - Captures Enter key on textarea/contenteditable (with `isComposing` check for IME)
2. **Click listener** - Detects send button clicks:
   - Primary: `button.send-button` class (language-independent)
   - Fallback: `aria-label` matching (`Send`/`发送`)
3. **Cooldown** - 1-second debounce prevents double-counting

### Data Storage (Tampermonkey GM APIs)
- `GM_setValue`/`GM_getValue` - Persistent storage per script
- `GM_addValueChangeListener` - Multi-tab real-time sync (Simple/Standard/Ultimate)
- Storage keys prefixed with `gemini_` (Ultimate uses per-user keys: `gemini_store_{email}`)
- Module enabled state: `gemini_enabled_modules` (array of module IDs)
- Onboarding seen state: `gemini_onboarding_seen` (object `{moduleId: true}`)
- Onboarding language: `gemini_onboarding_lang` (`'zh'` or `'en'`)

### NativeUI Injection Framework (v9.2+)
Modules can inject UI elements into Gemini's native interface via `NativeUI` utility:
- `NativeUI.t(zh, en)` — bilingual text helper based on `navigator.language`
- `NativeUI.getSidebar()` / `getInputArea()` / `getChatHeader()` / `getModelSwitch()` — DOM locators with fallback selectors
- `NativeUI.remove(id)` — cleanup injected elements by ID
- Main loop calls `mod.injectNativeUI?.()` every 1.5s tick for enabled modules
- All injected elements use `gc-` prefix for IDs/classes to avoid conflicts
- `removeNativeUI()` called on module disable/destroy for cleanup

### Module Onboarding System (v9.2+)
- First-time module enable triggers onboarding modal via `PanelUI.showOnboarding(id)`
- Bilingual (zh/en) with language toggle, stored in `gemini_onboarding_lang`
- Seen state persisted in `gemini_onboarding_seen` to prevent repeat display
- Settings panel has `ⓘ` button per module to manually re-trigger onboarding
- Upgrade path: existing enabled modules get deferred onboarding on script load

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
- **MODEL_DETECT_MAP**: EN/ZH/JA/KO covered — Fast/快速/高速/빠른 → flash, Thinking/思考/사고 → thinking, Pro → pro
- **MODEL_CONFIG labels**: 3 Flash (non-thinking), 3 Flash Thinking, 3 Pro
- **Account Type**: Detects Pro/Ultra badge via `button.gds-pillbox-button` or `button.pillbox-btn`
- **Quota System**: Configurable daily message limit with visual progress bar
- **Model Multipliers**: Flash (0x), Thinking (0.33x), Pro (1x) - currently simplified to raw count

### Multi-language Compatibility
- **Send button**: Uses `button.send-button` class (language-independent) as primary, `aria-label` as fallback
- **User detection**: Uses `@` symbol matching (universal in email addresses)
- **Model detection**: Text mapped via `MODEL_DETECT_MAP` — EN/ZH/JA/KO covered; other locales fall back to current model
- **Account type**: "PRO"/"ULTRA" are brand names, likely universal across locales

## Testing

> **Note**: Automated tests (lib/, tests/, c8 coverage) have been migrated to the standalone [gemini-primer-pp](https://github.com/user/gemini-primer-pp) repository.

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
