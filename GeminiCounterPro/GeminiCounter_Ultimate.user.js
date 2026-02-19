// ==UserScript==
// @name         Gemini Counter Ultimate (v9.2)
// @namespace    http://tampermonkey.net/
// @version      9.2
// @description  模块化架构：可扩展的 Gemini 助手平台 - 原生 UI 集成 + 模块引导 + 计数器 + 热力图 + 配额追踪 + 对话文件夹 (Pure Enhancement)
// @author       Script Weaver
// @match        https://gemini.google.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    console.log("💎 Gemini Assistant v9.2 (Modular - Native UI Integration) Starting...");

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                           CORE LAYER (核心层)                              ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    // --- 🎨 主题配置 ---
    const THEMES = {
        glass: {
            name: "🌌 Glass",
            vars: {
                '--bg': 'rgba(32, 33, 36, 0.85)',
                '--blur': '18px',
                '--saturate': '180%',
                '--border': 'rgba(255, 255, 255, 0.12)',
                '--text-main': '#a8c7fa',
                '--text-sub': '#9aa0a6',
                '--accent': '#8ab4f8',
                '--btn-bg': 'rgba(255, 255, 255, 0.06)',
                '--row-hover': 'rgba(255, 255, 255, 0.08)',
                '--shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                '--header-bg': 'rgba(255, 255, 255, 0.03)',
                '--header-border': 'rgba(255, 255, 255, 0.05)',
                '--detail-bg': 'rgba(0, 0, 0, 0.1)',
                '--overlay-tint': 'rgba(0, 0, 0, 0.6)',
                '--input-bg': 'rgba(255, 255, 255, 0.05)',
                '--divider': 'rgba(255, 255, 255, 0.05)',
                '--badge-bg': 'rgba(255, 255, 255, 0.06)',
                '--scrollbar-thumb': 'rgba(255, 255, 255, 0.15)',
                '--code-bg': 'rgba(0, 0, 0, 0.3)'
            }
        },
        cyber: {
            name: "⚡ Cyber",
            vars: {
                '--bg': 'rgba(10, 10, 10, 0.98)',
                '--blur': '0px',
                '--saturate': '100%',
                '--border': '#00ff41',
                '--text-main': '#00ff41',
                '--text-sub': '#008F11',
                '--accent': '#00ff41',
                '--btn-bg': '#0d0d0d',
                '--row-hover': '#1a1a1a',
                '--shadow': '0 0 15px rgba(0, 255, 65, 0.2)',
                '--header-bg': 'rgba(0, 255, 65, 0.03)',
                '--header-border': 'rgba(0, 255, 65, 0.1)',
                '--detail-bg': 'rgba(0, 0, 0, 0.3)',
                '--overlay-tint': 'rgba(0, 0, 0, 0.7)',
                '--input-bg': '#0d0d0d',
                '--divider': 'rgba(0, 255, 65, 0.08)',
                '--badge-bg': 'rgba(0, 255, 65, 0.08)',
                '--scrollbar-thumb': 'rgba(0, 255, 65, 0.2)',
                '--code-bg': 'rgba(0, 0, 0, 0.5)'
            }
        },
        paper: {
            name: "📄 Paper",
            vars: {
                '--bg': 'rgba(255, 253, 248, 0.92)',
                '--blur': '14px',
                '--saturate': '120%',
                '--border': 'rgba(0, 0, 0, 0.1)',
                '--text-main': '#1a1a1a',
                '--text-sub': '#5f6368',
                '--accent': '#1a73e8',
                '--btn-bg': 'rgba(0, 0, 0, 0.04)',
                '--row-hover': 'rgba(0, 0, 0, 0.06)',
                '--shadow': '0 2px 12px rgba(60, 64, 67, 0.15), 0 1px 4px rgba(60, 64, 67, 0.1)',
                '--header-bg': 'rgba(0, 0, 0, 0.02)',
                '--header-border': 'rgba(0, 0, 0, 0.06)',
                '--detail-bg': 'rgba(0, 0, 0, 0.03)',
                '--overlay-tint': 'rgba(0, 0, 0, 0.35)',
                '--input-bg': 'rgba(0, 0, 0, 0.04)',
                '--divider': 'rgba(0, 0, 0, 0.06)',
                '--badge-bg': 'rgba(0, 0, 0, 0.05)',
                '--scrollbar-thumb': 'rgba(0, 0, 0, 0.15)',
                '--code-bg': 'rgba(0, 0, 0, 0.04)'
            }
        }
    };

    // --- 🔧 全局常量 ---
    const GLOBAL_KEYS = {
        POS: 'gemini_panel_pos',
        REGISTRY: 'gemini_user_registry',
        THEME: 'gemini_current_theme',
        RESET_HOUR: 'gemini_reset_hour',
        QUOTA: 'gemini_quota_limit',
        MODULES: 'gemini_enabled_modules',
        DEBUG: 'gemini_debug_enabled',
        LOG_LEVEL: 'gemini_log_level',
        LOGS: 'gemini_logs_store',
        ONBOARDING: 'gemini_onboarding_seen',
        ONBOARDING_LANG: 'gemini_onboarding_lang'
    };
    const TIMINGS = {
        POLL_INTERVAL: 1500,
        COUNTER_COOLDOWN: 1000,
        OBSERVER_DEBOUNCE: 500,
        TITLE_DEBOUNCE: 300,
        FAB_AUTO_DISMISS: 5000,
        MODEL_MENU_TIMEOUT: 2000,
    };
    const PANEL_ID = 'gemini-monitor-panel-v7';
    const DEFAULT_POS = { top: '20px', left: 'auto', bottom: 'auto', right: '220px' };
    const TEMP_USER = "Guest";
    const LAYERS = {
        PANEL: 2147481000,
        FLOATING: 2147481020,
        MENU: 2147481030,
        OVERLAY: 2147481100,
        MODAL: 2147481110,
        TOOLTIP: 2147481120
    };

    const UIA11y = {
        _states: new WeakMap(),
        _focusableSelector: [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(','),

        getFocusable(root) {
            return Array.from(root.querySelectorAll(this._focusableSelector))
                .filter((el) => {
                    if (!(el instanceof HTMLElement)) return false;
                    if (el.hidden) return false;
                    if (el.getAttribute('aria-hidden') === 'true') return false;
                    const style = window.getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden') return false;
                    return true;
                });
        },

        setupModal(overlay, modal, { close, label, labelledBy, initialFocus } = {}) {
            if (!overlay || !modal || typeof close !== 'function') return;
            const prev = (document.activeElement instanceof HTMLElement) ? document.activeElement : null;

            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.tabIndex = -1;
            if (labelledBy) modal.setAttribute('aria-labelledby', labelledBy);
            if (label) modal.setAttribute('aria-label', label);

            const onKeyDown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    close();
                    return;
                }
                if (e.key !== 'Tab') return;
                const focusable = this.getFocusable(modal);
                if (focusable.length === 0) {
                    e.preventDefault();
                    modal.focus();
                    return;
                }
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            };

            const onOverlayClick = (e) => {
                if (e.target === overlay) close();
            };

            document.addEventListener('keydown', onKeyDown, true);
            overlay.addEventListener('click', onOverlayClick);
            this._states.set(overlay, { onKeyDown, onOverlayClick, prev });

            requestAnimationFrame(() => {
                const target = initialFocus || this.getFocusable(modal)[0] || modal;
                if (target && typeof target.focus === 'function') target.focus();
            });
        },

        closeModal(overlay) {
            if (!overlay) return;
            const state = this._states.get(overlay);
            if (state) {
                document.removeEventListener('keydown', state.onKeyDown, true);
                overlay.removeEventListener('click', state.onOverlayClick);
                if (state.prev && document.contains(state.prev) && typeof state.prev.focus === 'function') {
                    state.prev.focus();
                }
                this._states.delete(overlay);
            }
            overlay.remove();
        }
    };

    // --- 📊 Core 状态 ---
    let currentUser = TEMP_USER;
    let inspectingUser = TEMP_USER;
    let currentTheme = GM_getValue(GLOBAL_KEYS.THEME, 'glass');
    let storageListenerId = null;

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                       MODULE SYSTEM (模块系统)                             ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    /**
     * 模块注册表
     * 每个模块需要实现:
     * - id: 唯一标识
     * - name: 显示名称
     * - description: 功能描述
     * - icon: 图标 emoji
     * - defaultEnabled: 默认是否启用
     * - init(): 初始化函数
     * - destroy(): 销毁函数 (禁用时调用)
     * - onUserChange(user): 用户切换时调用
     * - renderPanel(container): 渲染面板内容
     * - renderSettings(container): 渲染设置项
     */
    const ModuleRegistry = {
        modules: {},
        enabledModules: new Set(),

        register(module) {
            this.modules[module.id] = module;
            Logger.debug('Module registered', { id: module.id });
        },

        init() {
            // 加载启用状态
            const saved = GM_getValue(GLOBAL_KEYS.MODULES, null);
            if (saved) {
                this.enabledModules = new Set(saved);
            } else {
                // 首次运行，启用所有默认模块
                Object.values(this.modules).forEach(m => {
                    if (m.defaultEnabled) this.enabledModules.add(m.id);
                });
                this.save();
            }

            // 初始化已启用的模块
            this.enabledModules.forEach(id => {
                if (this.modules[id]?.init) {
                    try {
                        this.modules[id].init();
                    } catch (e) {
                        Logger.error('Module init failed', { id, error: String(e) });
                    }
                }
            });
        },

        isEnabled(id) {
            return this.enabledModules.has(id);
        },

        toggle(id) {
            if (this.enabledModules.has(id)) {
                this.enabledModules.delete(id);
                if (this.modules[id]?.destroy) {
                    try {
                        this.modules[id].destroy();
                    } catch (e) {
                        Logger.error('Module destroy failed', { id, error: String(e) });
                    }
                }
            } else {
                this.enabledModules.add(id);
                if (this.modules[id]?.init) {
                    try {
                        this.modules[id].init();
                    } catch (e) {
                        Logger.error('Module init failed (toggle)', { id, error: String(e) });
                    }
                }
                // Inject native UI when enabling
                if (typeof this.modules[id]?.injectNativeUI === 'function') {
                    try { this.modules[id].injectNativeUI(); } catch (e) { /* silent */ }
                }
                // Show onboarding on first enable
                const seen = GM_getValue(GLOBAL_KEYS.ONBOARDING, {});
                if (!seen[id] && typeof this.modules[id]?.getOnboarding === 'function') {
                    PanelUI.showOnboarding(id);
                    seen[id] = true;
                    GM_setValue(GLOBAL_KEYS.ONBOARDING, seen);
                }
            }
            this.save();
            Logger.info('Module toggled', { id, enabled: this.enabledModules.has(id) });
        },

        save() {
            GM_setValue(GLOBAL_KEYS.MODULES, Array.from(this.enabledModules));
        },

        notifyUserChange(user) {
            this.enabledModules.forEach(id => {
                if (this.modules[id]?.onUserChange) {
                    try {
                        this.modules[id].onUserChange(user);
                    } catch (e) {
                        Logger.error('Module onUserChange failed', { id, error: String(e) });
                    }
                }
            });
        },

        getAll() {
            return Object.values(this.modules);
        }
    };

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                         CORE UTILITIES (核心工具)                          ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const Core = {
        // --- 用户管理 ---
        registerUser(userId) {
            if (!userId || userId === TEMP_USER || !userId.includes('@')) return;
            let registry = GM_getValue(GLOBAL_KEYS.REGISTRY, []);
            if (!registry.includes(userId)) {
                registry.push(userId);
                GM_setValue(GLOBAL_KEYS.REGISTRY, registry);
            }
        },

        getAllUsers() {
            return GM_getValue(GLOBAL_KEYS.REGISTRY, []);
        },

        detectUser() {
            try {
                const candidates = document.querySelectorAll('a[aria-label*="@"], button[aria-label*="@"], div[aria-label*="帐号"], div[aria-label*="Account"], img[alt*="@"], img[aria-label*="@"]');
                for (let el of candidates) {
                    const label = el.getAttribute('aria-label') || el.getAttribute('alt') || "";
                    const match = label.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
                    if (match && match[1]) return match[1];
                }
            } catch (e) { }
            return null;
        },

        getCurrentUser() { return currentUser; },
        getInspectingUser() { return inspectingUser; },
        setInspectingUser(user) { inspectingUser = user; },
        getTempUser() { return TEMP_USER; },

        // --- 主题管理 ---
        getTheme() { return currentTheme; },
        setTheme(key) {
            if (THEMES[key]) {
                currentTheme = key;
                GM_setValue(GLOBAL_KEYS.THEME, key);
            }
        },
        getThemes() { return THEMES; },
        applyTheme(el, themeKey) {
            if (!el || !THEMES[themeKey]) return;
            const vars = THEMES[themeKey].vars;
            for (const [key, val] of Object.entries(vars)) {
                el.style.setProperty(key, val);
            }
        },

        // --- 存储监听 ---
        setupStorageListener(targetUser, callback) {
            if (storageListenerId) {
                GM_removeValueChangeListener(storageListenerId);
                storageListenerId = null;
            }
            if (!targetUser || targetUser === TEMP_USER) return;

            const storageKey = `gemini_store_${targetUser}`;
            storageListenerId = GM_addValueChangeListener(storageKey, (name, oldVal, newVal, remote) => {
                if (remote && newVal && callback) {
                    callback(newVal);
                }
            });
        },

        // --- 共享工具 ---
        sleep(ms) {
            return new Promise(r => setTimeout(r, ms));
        },

        scanSidebarChats() {
            const items = [];
            document.querySelectorAll('a[href*="/app/"]').forEach(el => {
                const href = el.getAttribute('href') || '';
                const match = href.match(/\/app\/([a-zA-Z0-9\-_]+)/);
                if (match) {
                    let title = '';
                    const textEl = el.querySelector('span, div');
                    if (textEl) title = textEl.textContent.trim();
                    if (!title) title = 'Untitled';
                    items.push({ id: match[1], title, element: el, href });
                }
            });
            return items;
        },

        // --- URL 工具 ---
        getChatId() {
            try {
                const match = window.location.pathname.match(/\/app\/([a-zA-Z0-9\-_]+)/);
                return match ? match[1] : null;
            } catch (e) { return null; }
        },

        // --- 日期工具 ---
        getDayKey(resetHour = 0) {
            const now = new Date();
            if (now.getHours() < resetHour) {
                now.setDate(now.getDate() - 1);
            }
            return this.formatDayKey(now);
        },

        formatDayKey(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        },

        parseDayKey(dayKey) {
            const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey || '');
            if (!m) return new Date(NaN);
            return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        },

        shiftDayKey(dayKey, days) {
            const d = this.parseDayKey(dayKey);
            if (Number.isNaN(d.getTime())) return dayKey;
            d.setDate(d.getDate() + days);
            return this.formatDayKey(d);
        }
    };

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                         LOGGING SYSTEM (日志系统)                         ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    // <LOGGER_MODULE>
function createLogger(options) {
  const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
  const maxEntries = options?.maxEntries ?? 300;
  const maxStore = options?.maxStore ?? 500;
  let level = options?.level ?? "info";
  const store = options?.store ?? { get: () => [], set: () => {} };
  let buffer = Array.isArray(options?.initial)
    ? options.initial.slice()
    : (Array.isArray(store.get()) ? store.get() : []);
  const subscribers = new Set();
  let persistTimer = null;
  const onLevelChange = options?.onLevelChange ?? (() => {});
  const now = options?.now ?? (() => new Date().toISOString());
  const sink = options?.sink ?? (() => {});

  function shouldLog(lvl) {
    return (LEVELS[lvl] ?? 2) <= (LEVELS[level] ?? 2);
  }

  function persist() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      const trimmed = buffer.slice(-maxStore);
      store.set(trimmed);
    }, 0);
  }

  function emit(entry) {
    buffer.push(entry);
    if (buffer.length > maxEntries) buffer.shift();
    persist();
    subscribers.forEach((fn) => {
      try { fn(entry); } catch (_) { /* noop */ }
    });
  }

  function log(lvl, msg, data) {
    const entry = { ts: now(), level: lvl, msg, data };
    if (shouldLog(lvl)) {
      sink(lvl, msg, data);
    }
    emit(entry);
  }

  return {
    log,
    error: (m, d) => log("error", m, d),
    warn: (m, d) => log("warn", m, d),
    info: (m, d) => log("info", m, d),
    debug: (m, d) => log("debug", m, d),
    getLevel: () => level,
    setLevel: (lvl) => { level = lvl; onLevelChange(lvl); log("info", "Log level updated", { level: lvl }); },
    getEntries: () => buffer.slice(),
    clear: () => { buffer = []; store.set([]); log("info", "Logs cleared"); },
    subscribe: (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); },
    export: () => ({ exportedAt: now(), level, entries: buffer.slice() })
  };
}

function filterLogs(entries, opts) {
  const level = opts?.level ?? "all";
  const term = (opts?.term ?? "").toLowerCase();
  return entries.filter((e) => {
    if (level !== "all" && e.level !== level) return false;
    if (!term) return true;
    const dataStr = e.data ? JSON.stringify(e.data) : "";
    return `${e.msg} ${dataStr}`.toLowerCase().includes(term);
  });
}


// </LOGGER_MODULE>

    const Logger = createLogger({
        level: GM_getValue(GLOBAL_KEYS.LOG_LEVEL, 'info'),
        store: {
            get: () => GM_getValue(GLOBAL_KEYS.LOGS, []),
            set: (v) => GM_setValue(GLOBAL_KEYS.LOGS, v)
        },
        onLevelChange: (lvl) => GM_setValue(GLOBAL_KEYS.LOG_LEVEL, lvl),
        sink: (lvl, msg, data) => {
            const fn = (lvl === 'error') ? console.error
                : (lvl === 'warn') ? console.warn
                    : (lvl === 'debug') ? console.debug
                        : console.log;
            fn(`[Gemini] ${msg}`, data || '');
        }
    });

    function isDebugEnabled() {
        return GM_getValue(GLOBAL_KEYS.DEBUG, false);
    }

    function setDebugEnabled(v) {
        GM_setValue(GLOBAL_KEYS.DEBUG, v);
    }

    Logger.info('Logger initialized', { level: Logger.getLevel() });

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                      COUNTER MODULE (计数器模块)                           ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const CounterModule = {
        id: 'counter',
        name: '消息计数器',
        description: '统计消息数量、热力图、配额追踪',
        icon: '📊',
        defaultEnabled: true,

        // --- 模块私有常量 ---
        COOLDOWN: TIMINGS.COUNTER_COOLDOWN,
        MODEL_CONFIG: {
            flash: { label: '3 Flash', multiplier: 0, color: '#34a853' },
            thinking: { label: '3 Flash Thinking', multiplier: 0.33, color: '#fbbc04' },
            pro: { label: '3 Pro', multiplier: 1, color: '#ea4335' }
        },
        MODEL_DETECT_MAP: {
            // EN
            'Fast': 'flash', 'Flash': 'flash', 'flash': 'flash',
            'Thinking': 'thinking', 'thinking': 'thinking',
            'Pro': 'pro', 'pro': 'pro',
            // ZH
            '快速': 'flash', '思考': 'thinking',
            // JA
            '高速': 'flash',
            // KO
            '빠른': 'flash', '사고': 'thinking'
        },

        // --- 模块私有状态 ---
        resetHour: 0,
        quotaLimit: 50,
        currentModel: 'flash',
        accountType: 'free',
        lastDisplayedVal: -1,
        lastCountTime: 0,

        state: {
            total: 0,
            totalChatsCreated: 0,
            chats: {},
            dailyCounts: {},
            viewMode: 'today',
            isExpanded: false,
            resetStep: 0
        },

        // --- 生命周期 ---
        init() {
            this.resetHour = GM_getValue(GLOBAL_KEYS.RESET_HOUR, 0);
            this.quotaLimit = GM_getValue(GLOBAL_KEYS.QUOTA, 50);
            this.bindEvents();
            Logger.info('CounterModule initialized');
        },

        destroy() {
            if (this._boundKeyHandler) {
                document.removeEventListener('keydown', this._boundKeyHandler, true);
                this._boundKeyHandler = null;
            }
            if (this._boundClickHandler) {
                document.removeEventListener('click', this._boundClickHandler, true);
                this._boundClickHandler = null;
            }
            Logger.info('CounterModule destroyed');
        },

        onUserChange(user) {
            this.loadDataForUser(user);
        },

        _boundKeyHandler: null,
        _boundClickHandler: null,

        bindEvents() {
            if (this._boundKeyHandler && this._boundClickHandler) return; // Prevent double binding
            if (this._boundKeyHandler) {
                document.removeEventListener('keydown', this._boundKeyHandler, true);
                this._boundKeyHandler = null;
            }
            if (this._boundClickHandler) {
                document.removeEventListener('click', this._boundClickHandler, true);
                this._boundClickHandler = null;
            }

            // 键盘监听
            this._boundKeyHandler = (e) => {
                if (!ModuleRegistry.isEnabled('counter')) return;
                if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.originalEvent?.isComposing) return;
                const act = document.activeElement;
                if (act && (act.tagName === 'TEXTAREA' || act.getAttribute('contenteditable') === 'true')) {
                    setTimeout(() => this.attemptIncrement(), 50);
                }
            };

            // 点击监听
            this._boundClickHandler = (e) => {
                if (!ModuleRegistry.isEnabled('counter')) return;
                const btn = e.target?.closest ? e.target.closest('button') : null;
                if (btn && !btn.disabled) {
                    if (btn.classList.contains('send-button')) {
                        this.attemptIncrement();
                        return;
                    }
                    const label = btn.getAttribute('aria-label') || '';
                    if (label.includes('Send') || label.includes('发送')) {
                        this.attemptIncrement();
                    }
                }
            };

            document.addEventListener('keydown', this._boundKeyHandler, true);
            document.addEventListener('click', this._boundClickHandler, true);
        },

        // --- 数据管理 ---
        loadDataForUser(targetUser) {
            if (!targetUser) return;

            Core.setupStorageListener(targetUser, (newVal) => {
                this.state.total = newVal.total || 0;
                this.state.totalChatsCreated = newVal.totalChatsCreated || 0;
                this.state.chats = newVal.chats || {};
                this.state.dailyCounts = newVal.dailyCounts || {};
                PanelUI.update();
            });

            if (targetUser === TEMP_USER) {
                Object.assign(this.state, { total: 0, totalChatsCreated: 0, chats: {}, dailyCounts: {}, viewMode: 'today', isExpanded: false, resetStep: 0 });
                return;
            }

            const storageKey = `gemini_store_${targetUser}`;
            const savedData = GM_getValue(storageKey, null);
            if (savedData) {
                this.state.total = savedData.total || 0;
                this.state.totalChatsCreated = savedData.totalChatsCreated || 0;
                this.state.chats = savedData.chats || {};
                this.state.dailyCounts = savedData.dailyCounts || {};
                // 兼容旧版数据迁移
                if (savedData.session && Object.keys(this.state.dailyCounts).length === 0) {
                    const today = Core.getDayKey(this.resetHour);
                    this.state.dailyCounts[today] = { messages: savedData.session, chats: 0 };
                }
            } else {
                Object.assign(this.state, { total: 0, totalChatsCreated: 0, chats: {}, dailyCounts: {}, viewMode: 'today', isExpanded: false, resetStep: 0 });
            }
            Logger.debug('Loaded user data', {
                user: targetUser,
                total: this.state.total,
                totalChatsCreated: this.state.totalChatsCreated,
                days: Object.keys(this.state.dailyCounts).length
            });
        },

        saveData() {
            const user = Core.getCurrentUser();
            if (!user || !user.includes('@')) return;
            const storageKey = `gemini_store_${user}`;
            GM_setValue(storageKey, {
                total: this.state.total,
                totalChatsCreated: this.state.totalChatsCreated,
                chats: this.state.chats,
                dailyCounts: this.state.dailyCounts
            });
        },

        // --- 计数逻辑 ---
        ensureTodayEntry() {
            const today = Core.getDayKey(this.resetHour);
            if (!this.state.dailyCounts[today]) {
                this.state.dailyCounts[today] = { messages: 0, chats: 0, byModel: { flash: 0, thinking: 0, pro: 0 } };
            }
            // Backfill byModel for entries created by older versions
            if (!this.state.dailyCounts[today].byModel) {
                this.state.dailyCounts[today].byModel = { flash: 0, thinking: 0, pro: 0 };
            }
            return today;
        },

        getTodayMessages() {
            const today = Core.getDayKey(this.resetHour);
            return this.state.dailyCounts[today]?.messages || 0;
        },

        getTodayByModel() {
            const today = Core.getDayKey(this.resetHour);
            return this.state.dailyCounts[today]?.byModel || { flash: 0, thinking: 0, pro: 0 };
        },

        getWeightedQuota() {
            const bm = this.getTodayByModel();
            return Object.keys(bm).reduce((sum, key) => {
                const mult = this.MODEL_CONFIG[key]?.multiplier ?? 1;
                return sum + (bm[key] * mult);
            }, 0);
        },

        attemptIncrement() {
            const now = Date.now();
            if (now - this.lastCountTime < this.COOLDOWN) return;

            const today = this.ensureTodayEntry();
            this.state.total++;
            this.state.dailyCounts[today].messages++;
            // Track model usage
            const model = this.currentModel || 'flash';
            if (this.state.dailyCounts[today].byModel) {
                this.state.dailyCounts[today].byModel[model] = (this.state.dailyCounts[today].byModel[model] || 0) + 1;
            }
            this.lastCountTime = now;

            const cid = Core.getChatId();

            if (cid) {
                if (!this.state.chats[cid]) {
                    this.state.totalChatsCreated++;
                    this.state.dailyCounts[today].chats++;
                }
                this.state.chats[cid] = (this.state.chats[cid] || 0) + 1;
                this.saveData();
                PanelUI.update();
            } else {
                this.saveData();
                PanelUI.update();
                // 新对话轮询
                let attempts = 0;
                const poller = setInterval(() => {
                    attempts++;
                    const newCid = Core.getChatId();
                    if (newCid) {
                        clearInterval(poller);
                        if (!this.state.chats[newCid]) {
                            this.state.totalChatsCreated++;
                            const todayKey = this.ensureTodayEntry();
                            this.state.dailyCounts[todayKey].chats++;
                        }
                        this.state.chats[newCid] = (this.state.chats[newCid] || 0) + 1;
                        this.saveData();
                        PanelUI.update();
                    } else if (attempts >= 20) {
                        clearInterval(poller);
                        this.saveData();
                    }
                }, 500);
            }
        },

        // --- 模型检测 ---
        detectModel() {
            try {
                const modeBtn = document.querySelector('button.input-area-switch');
                if (modeBtn) {
                    const text = modeBtn.textContent.trim();
                    const key = this.MODEL_DETECT_MAP[text];
                    if (key) return key;
                }
                const pillLabel = document.querySelector('[data-test-id="bard-mode-menu-button"]');
                if (pillLabel) {
                    const text = pillLabel.textContent.trim().split(/\s/)[0];
                    const key = this.MODEL_DETECT_MAP[text];
                    if (key) return key;
                }
                const selected = document.querySelector('.bard-mode-list-button.is-selected');
                if (selected) {
                    const text = selected.textContent.trim().split(/\s/)[0];
                    const key = this.MODEL_DETECT_MAP[text];
                    if (key) return key;
                }
            } catch (e) { }
            return this.currentModel;
        },

        detectAccountType() {
            try {
                const pillboxBtn = document.querySelector('button.gds-pillbox-button, button.pillbox-btn');
                if (pillboxBtn) {
                    const text = pillboxBtn.textContent.trim().toUpperCase();
                    if (text === 'ULTRA' || text.includes('ULTRA')) return 'ultra';
                    if (text === 'PRO' || text.includes('PRO')) return 'pro';
                }
                return 'free';
            } catch (e) { }
            return this.accountType;
        },

        // --- 统计算法 ---
        calculateStreaks() {
            const dailyData = this.state.dailyCounts;
            const dates = Object.keys(dailyData).sort();
            if (dates.length === 0) return { current: 0, best: 0 };

            let best = 0, temp = 0, lastDate = null;

            for (let dateStr of dates) {
                if (dailyData[dateStr].messages === 0) continue;
                const d = Core.parseDayKey(dateStr);
                if (Number.isNaN(d.getTime())) continue;
                d.setHours(0, 0, 0, 0);

                if (lastDate) {
                    const diff = (d - lastDate) / (1000 * 60 * 60 * 24);
                    if (Math.round(diff) === 1) temp++;
                    else if (diff > 1) temp = 1;
                } else {
                    temp = 1;
                }
                if (temp > best) best = temp;
                lastDate = d;
            }

            // Current streak (timezone-safe: use local date formatting)
            const todayStr = Core.getDayKey(this.resetHour);
            const yesterdayStr = Core.shiftDayKey(todayStr, -1);
            const startStr = (dailyData[todayStr]?.messages > 0) ? todayStr : yesterdayStr;

            let checkDate = Core.parseDayKey(startStr);
            if (Number.isNaN(checkDate.getTime())) return { current: 0, best };
            checkDate.setHours(0, 0, 0, 0);
            let current = 0;

            while (true) {
                const key = Core.formatDayKey(checkDate);
                if (dailyData[key] && dailyData[key].messages > 0) {
                    current++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }

            return { current, best };
        },

        getLast7DaysData() {
            const result = [];
            const todayKey = Core.getDayKey(this.resetHour);
            for (let i = 6; i >= 0; i--) {
                const key = Core.shiftDayKey(todayKey, -i);
                const d = Core.parseDayKey(key);
                result.push({
                    date: key,
                    label: `${d.getMonth() + 1}/${d.getDate()}`,
                    messages: this.state.dailyCounts[key]?.messages || 0
                });
            }
            return result;
        },

        // --- Reset 逻辑 ---
        handleReset() {
            const user = Core.getCurrentUser();
            if (Core.getInspectingUser() !== user) return;

            if (this.state.resetStep === 0) {
                this.state.resetStep = 1;
                PanelUI.update();
                return;
            }

            if (this.state.viewMode === 'today') {
                const today = Core.getDayKey(this.resetHour);
                if (this.state.dailyCounts[today]) {
                    this.state.dailyCounts[today].messages = 0;
                    this.state.dailyCounts[today].byModel = { flash: 0, thinking: 0, pro: 0 };
                }
            } else if (this.state.viewMode === 'chat') {
                const cid = Core.getChatId();
                if (cid) this.state.chats[cid] = 0;
            } else if (this.state.viewMode === 'total') {
                if (this.state.resetStep === 1) {
                    this.state.resetStep = 2;
                    PanelUI.update();
                    return;
                }
                this.state.total = 0;
                this.state.chats = {};
                this.state.dailyCounts = {};
                this.state.totalChatsCreated = 0;
            }

            this.state.resetStep = 0;
            this.saveData();
            PanelUI.update();
        }
    };

    // 注册计数器模块
    ModuleRegistry.register(CounterModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                      EXPORT MODULE (导出模块)                              ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const ExportModule = {
        id: 'export',
        name: '数据导出',
        description: 'JSON / CSV / Markdown 多格式导出',
        icon: '📤',
        defaultEnabled: true,

        init() {
            Logger.info('ExportModule initialized');
        },
        destroy() {
            this.removeNativeUI();
            Logger.info('ExportModule destroyed');
        },
        onUserChange() { /* no-op */ },

        // --- Native UI: Export button next to chat title ---
        injectNativeUI() {
            const NATIVE_ID = 'gc-export-native';
            if (document.getElementById(NATIVE_ID)) return;

            const titleEl = NativeUI.getChatHeader();
            if (!titleEl) return;
            const parent = titleEl.parentElement;
            if (!parent) return;

            const btn = document.createElement('button');
            btn.id = NATIVE_ID;
            btn.type = 'button';
            btn.className = 'gc-native-btn';
            btn.textContent = '\uD83D\uDCE4';
            btn.title = 'Export conversation';
            btn.setAttribute('aria-label', 'Export conversation data');
            btn.onclick = (e) => {
                e.stopPropagation();
                this._toggleExportMenu(btn);
            };

            const pos = getComputedStyle(parent).position;
            if (pos === 'static' || pos === '') parent.style.position = 'relative';
            parent.appendChild(btn);
        },

        removeNativeUI() {
            NativeUI.remove('gc-export-native');
            NativeUI.remove('gc-export-menu');
            if (this._menuAbort) { this._menuAbort.abort(); this._menuAbort = null; }
        },

        _toggleExportMenu(anchorBtn) {
            const MENU_ID = 'gc-export-menu';
            const existing = document.getElementById(MENU_ID);
            if (existing) { existing.remove(); return; }

            const menu = document.createElement('div');
            menu.id = MENU_ID;
            menu.className = 'gc-dropdown-menu';
            menu.setAttribute('role', 'menu');
            menu.style.cssText = 'position:absolute;top:100%;right:0;margin-top:4px;';

            const items = [
                { label: '\uD83D\uDCC4 JSON', action: () => this.exportJSON() },
                { label: '\uD83D\uDCCA CSV', action: () => this.exportCSV() },
                { label: '\uD83D\uDCDD Markdown', action: () => this.exportMarkdown() }
            ];

            items.forEach(item => {
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'gc-dropdown-item';
                el.setAttribute('role', 'menuitem');
                el.textContent = item.label;
                el.onclick = (e) => {
                    e.stopPropagation();
                    menu.remove();
                    item.action();
                };
                menu.appendChild(el);
            });

            anchorBtn.parentElement.appendChild(menu);
            const mRect = menu.getBoundingClientRect();
            if (mRect.left < 8) {
                menu.style.left = '0';
                menu.style.right = 'auto';
            } else if (mRect.right > window.innerWidth - 8) {
                menu.style.right = '0';
            }

            // Close on outside click (with AbortController for cleanup)
            if (this._menuAbort) this._menuAbort.abort();
            this._menuAbort = new AbortController();
            const signal = this._menuAbort.signal;
            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!menu.contains(e.target) && e.target !== anchorBtn) {
                        menu.remove();
                        if (this._menuAbort) { this._menuAbort.abort(); this._menuAbort = null; }
                    }
                }, { capture: true, signal });
            }, 0);
        },

        // --- Export helpers ---
        _download(content, filename, type) {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        },

        _getFilePrefix() {
            const user = Core.getCurrentUser().split('@')[0];
            const date = Core.formatDayKey(new Date());
            return `gemini-counter-${user}-${date}`;
        },

        exportJSON() {
            const cm = CounterModule;
            const data = {
                total: cm.state.total,
                totalChatsCreated: cm.state.totalChatsCreated,
                chats: cm.state.chats,
                dailyCounts: cm.state.dailyCounts,
                exportedAt: new Date().toISOString()
            };
            this._download(JSON.stringify(data, null, 2), `${this._getFilePrefix()}.json`, 'application/json');
        },

        // <EXPORT_MODULE>
        exportCSV() {
            const cm = CounterModule;
            const header = 'Date,Messages,Chats,Flash,Thinking,Pro,Weighted';
            const rows = [];
            const sorted = Object.entries(cm.state.dailyCounts || {}).sort(([a], [b]) => a.localeCompare(b));
            let sumMsg = 0, sumChats = 0, sumF = 0, sumT = 0, sumP = 0, sumW = 0;
            for (const [date, entry] of sorted) {
                const msg = entry.messages || 0;
                const ch = entry.chats || 0;
                const bm = entry.byModel || { flash: 0, thinking: 0, pro: 0 };
                const f = bm.flash || 0, t = bm.thinking || 0, p = bm.pro || 0;
                const w = Object.keys(bm).reduce((s, k) => s + (bm[k] || 0) * (cm.MODEL_CONFIG[k]?.multiplier ?? 1), 0);
                const wStr = w % 1 === 0 ? String(w) : w.toFixed(2);
                rows.push(`${date},${msg},${ch},${f},${t},${p},${wStr}`);
                sumMsg += msg; sumChats += ch; sumF += f; sumT += t; sumP += p; sumW += w;
            }
            const swStr = sumW % 1 === 0 ? String(sumW) : sumW.toFixed(2);
            rows.push(`TOTAL,${sumMsg},${sumChats},${sumF},${sumT},${sumP},${swStr}`);
            this._download(header + '\n' + rows.join('\n') + '\n', `${this._getFilePrefix()}.csv`, 'text/csv');
        },

        exportMarkdown() {
            const cm = CounterModule;
            const user = Core.getCurrentUser();
            const now = Core.formatDayKey(new Date());
            const streaks = cm.calculateStreaks ? cm.calculateStreaks() : {};
            const lines = [];
            lines.push('# Gemini Usage Report');
            lines.push('');
            lines.push(`**User:** ${user} | **Exported:** ${now}`);
            lines.push('');
            lines.push('## Summary');
            lines.push('');
            lines.push('| Metric | Value |');
            lines.push('|--------|-------|');
            lines.push(`| Total Messages | ${cm.state.total} |`);
            lines.push(`| Chats Created | ${cm.state.totalChatsCreated} |`);
            if (streaks.current !== undefined) lines.push(`| Current Streak | ${streaks.current} days |`);
            if (streaks.best !== undefined) lines.push(`| Best Streak | ${streaks.best} days |`);
            lines.push('');
            const sorted = Object.entries(cm.state.dailyCounts || {}).sort(([a], [b]) => a.localeCompare(b));
            const last30 = sorted.slice(-30);
            if (last30.length > 0) {
                lines.push('## Daily Breakdown (Last 30 Days)');
                lines.push('');
                lines.push('| Date | Messages | Flash | Thinking | Pro | Weighted |');
                lines.push('|------|----------|-------|----------|-----|----------|');
                for (const [date, entry] of last30) {
                    const msg = entry.messages || 0;
                    const bm = entry.byModel || { flash: 0, thinking: 0, pro: 0 };
                    const f = bm.flash || 0, t = bm.thinking || 0, p = bm.pro || 0;
                    const w = Object.keys(bm).reduce((s, k) => s + (bm[k] || 0) * (cm.MODEL_CONFIG[k]?.multiplier ?? 1), 0);
                    const wStr = w % 1 === 0 ? String(w) : w.toFixed(1);
                    lines.push(`| ${date} | ${msg} | ${f} | ${t} | ${p} | ${wStr} |`);
                }
                lines.push('');
            }
            lines.push('---');
            lines.push('');
            lines.push('*Generated by Gemini Counter Pro*');
            lines.push('');
            this._download(lines.join('\n'), `${this._getFilePrefix()}.md`, 'text/markdown');
        },
        // </EXPORT_MODULE>

        getOnboarding() {
            return {
                zh: {
                    rant: '2026 年了，Google 最引以为傲的 AI 产品居然不支持导出对话。你跟 Gemini 讨论了三天的架构方案，结果想保存一份？不好意思，请手动复制粘贴 300 条消息。产品经理是不是觉得用户的对话像阅后即焚的 Snapchat？',
                    features: '在聊天标题旁添加 \uD83D\uDCE4 导出按钮，一键导出当前对话为 JSON/CSV/Markdown 文件。',
                    guide: '1. 打开任意对话 \u2192 2. 点击标题右侧的 \uD83D\uDCE4 按钮 \u2192 3. 选择导出格式 \u2192 4. 文件自动下载'
                },
                en: {
                    rant: "It's 2026. Google's flagship AI product doesn't let you export conversations. You spent three days discussing architecture with Gemini and want to save it? Sorry, please manually copy-paste 300 messages. Does the PM think conversations are Snapchats?",
                    features: 'Adds a \uD83D\uDCE4 export button next to the chat title. One-click export to JSON/CSV/Markdown.',
                    guide: '1. Open any conversation \u2192 2. Click \uD83D\uDCE4 next to the title \u2192 3. Pick a format \u2192 4. File downloads automatically'
                }
            };
        },

        // Render export buttons section in settings modal
        renderExportButtons(container) {
            const jsonBtn = document.createElement('button');
            jsonBtn.className = 'settings-btn';
            jsonBtn.textContent = '📤 Export JSON';
            jsonBtn.onclick = () => this.exportJSON();
            container.appendChild(jsonBtn);

            const csvBtn = document.createElement('button');
            csvBtn.className = 'settings-btn';
            csvBtn.textContent = '📊 Export CSV';
            csvBtn.onclick = () => this.exportCSV();
            container.appendChild(csvBtn);

            const mdBtn = document.createElement('button');
            mdBtn.className = 'settings-btn';
            mdBtn.textContent = '📝 Export Markdown';
            mdBtn.onclick = () => this.exportMarkdown();
            container.appendChild(mdBtn);
        }
    };

    ModuleRegistry.register(ExportModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                      FOLDERS MODULE (文件夹模块)                           ║
    // ║          Option C: Pure Enhancement - 不修改原有布局，仅添加标记            ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const FoldersModule = {
        id: 'folders',
        name: '对话文件夹',
        description: '整理对话到自定义文件夹',
        icon: '📁',
        defaultEnabled: false,

        // --- 模块私有常量 ---
        STORAGE_KEY: 'gemini_folders_data',
        FOLDER_COLORS: ['#8ab4f8', '#81c995', '#f28b82', '#fdd663', '#d7aefb', '#78d9ec', '#fcad70', '#c58af9'],

        // --- 模块私有状态 ---
        data: {
            folders: {},        // { folderId: { name, color, collapsed } }
            chatToFolder: {},   // { chatId: folderId }
            folderOrder: []     // [folderId, folderId, ...]
        },
        observer: null,
        chatCache: [],          // 缓存扫描到的聊天项
        dragState: null,        // Chat drag state: { chatId, chatTitle }
        folderDragState: null,  // Folder reorder state: { folderId }
        uncategorizedCollapsed: false,
        _searchQuery: '',
        _batchMode: false,
        _batchSelected: new Set(),
        _activeFilter: null,

        // --- 生命周期 ---
        init() {
            this.loadData();
            this.injectStyles();
            this.startObserver();
            Logger.info('FoldersModule initialized', { mode: 'pure' });
        },

        destroy() {
            // 清理注入的样式
            if (this._styleEl) { this._styleEl.remove(); this._styleEl = null; }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            // 移除侧边栏的颜色标记
            document.querySelectorAll('.gf-sidebar-dot').forEach(el => el.remove());
            // 移除模态框
            document.querySelectorAll('.gf-modal-overlay').forEach(el => el.remove());

            // 清理拖拽属性和事件
            if (this.chatCache) {
                this.chatCache.forEach(chat => {
                    if (chat.element) {
                        chat.element.removeAttribute('draggable');
                        chat.element.ondragstart = null;
                        chat.element.ondragend = null;
                        chat.element.style.opacity = '';
                    }
                });
            }
            // 清理所有高亮
            document.querySelectorAll('.gf-drop-highlight').forEach(el => {
                el.classList.remove('gf-drop-highlight');
            });

            this.removeNativeUI();
            Logger.info('FoldersModule destroyed');
        },

        onUserChange(user) {
            this.loadData();
            this.markSidebarChats();
            this._activeFilter = null;
            this.removeNativeUI();
            // 刷新详情面板
            if (CounterModule.state.isExpanded) {
                PanelUI.renderDetailsPane();
            }
        },

        // --- 原生 UI 注入 ---
        injectNativeUI() {
            const FILTER_ID = 'gc-folder-filter';
            if (document.getElementById(FILTER_ID)) return;

            const sidebar = NativeUI.getSidebar();
            if (!sidebar) return;

            const filterBar = document.createElement('div');
            filterBar.id = FILTER_ID;
            filterBar.style.cssText = 'display:flex;gap:4px;padding:6px 12px;overflow-x:auto;border-bottom:1px solid rgba(255,255,255,0.08);align-items:center;flex-shrink:0;scrollbar-width:none;height:auto;max-height:36px;align-self:start;';

            this._renderFilterTabs(filterBar);
            const overflowC = sidebar.querySelector('.overflow-container') || sidebar;
            overflowC.prepend(filterBar);
        },

        removeNativeUI() {
            NativeUI.remove('gc-folder-filter');
            // 恢复所有被隐藏的对话项
            const chats = Core.scanSidebarChats();
            chats.forEach(chat => {
                if (chat.element) chat.element.style.display = '';
            });
            this._activeFilter = null;
        },

        _renderFilterTabs(container) {
            container.replaceChildren();
            const folders = this.data.folderOrder
                .map(id => ({ id, ...this.data.folders[id] }))
                .filter(f => f.name);

            // "全部" 标签
            const allTab = this._createFilterTab('全部', null, '#8ab4f8');
            container.appendChild(allTab);

            // 各文件夹标签
            folders.forEach(folder => {
                const tab = this._createFilterTab(folder.name, folder.id, folder.color);
                container.appendChild(tab);
            });
        },

        _createFilterTab(label, folderId, color) {
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'gc-native-btn';
            const isActive = this._activeFilter === folderId;
            tab.style.cssText = `padding:3px 10px;border-radius:14px;font-size:12px;white-space:nowrap;cursor:pointer;border:1px solid ${color || '#8ab4f8'}40;background:${isActive ? (color || '#8ab4f8') + '30' : 'transparent'};color:${isActive ? (color || '#8ab4f8') : '#aaa'};font-weight:${isActive ? '600' : '400'};transition:all 0.15s;`;
            tab.textContent = label;
            tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            tab.setAttribute('aria-label', `Filter by ${label}`);
            tab.onclick = (e) => {
                e.stopPropagation();
                this._activeFilter = folderId;
                this._applyFilter(folderId);
                // 刷新标签栏高亮
                const bar = document.getElementById('gc-folder-filter');
                if (bar) this._renderFilterTabs(bar);
            };
            return tab;
        },

        _applyFilter(folderId) {
            const chats = Core.scanSidebarChats();
            chats.forEach(chat => {
                if (!folderId) {
                    chat.element.style.display = '';
                } else {
                    const assignment = this.data.chatToFolder[chat.id];
                    chat.element.style.display = (assignment === folderId) ? '' : 'none';
                }
            });
        },

        _refreshFilterBar() {
            const bar = document.getElementById('gc-folder-filter');
            if (bar) this._renderFilterTabs(bar);
        },

        // --- 数据管理 ---
        loadData() {
            const user = Core.getCurrentUser();
            const key = user && user !== TEMP_USER ? `${this.STORAGE_KEY}_${user}` : this.STORAGE_KEY;
            const saved = GM_getValue(key, null);
            if (saved) {
                this.data = {
                    folders: saved.folders || {},
                    chatToFolder: saved.chatToFolder || {},
                    folderOrder: saved.folderOrder || Object.keys(saved.folders || {})
                };
            } else {
                this.data = { folders: {}, chatToFolder: {}, folderOrder: [] };
            }
        },

        saveData() {
            const user = Core.getCurrentUser();
            const key = user && user !== TEMP_USER ? `${this.STORAGE_KEY}_${user}` : this.STORAGE_KEY;
            GM_setValue(key, this.data);
        },

        // --- 文件夹 CRUD ---
        createFolder(name, color) {
            const id = 'folder_' + Date.now();
            this.data.folders[id] = {
                name: name || 'New Folder',
                color: color || this.FOLDER_COLORS[Object.keys(this.data.folders).length % this.FOLDER_COLORS.length],
                collapsed: false,
                rules: []  // Auto-classification rules: [{ type: 'keyword', value: 'string' }]
            };
            this.data.folderOrder.push(id);
            this.saveData();
            this.markSidebarChats();
            this._refreshFilterBar();
            PanelUI.renderDetailsPane();
            return id;
        },

        renameFolder(folderId, newName) {
            if (this.data.folders[folderId]) {
                this.data.folders[folderId].name = newName;
                this.saveData();
                this._refreshFilterBar();
                PanelUI.renderDetailsPane();
            }
        },

        deleteFolder(folderId) {
            if (!this.data.folders[folderId]) return;
            // 移除文件夹内的聊天映射
            Object.keys(this.data.chatToFolder).forEach(chatId => {
                if (this.data.chatToFolder[chatId] === folderId) {
                    delete this.data.chatToFolder[chatId];
                }
            });
            delete this.data.folders[folderId];
            this.data.folderOrder = this.data.folderOrder.filter(id => id !== folderId);
            this.saveData();
            this.markSidebarChats();
            this._refreshFilterBar();
            PanelUI.renderDetailsPane();
        },

        toggleFolderCollapse(folderId) {
            if (this.data.folders[folderId]) {
                this.data.folders[folderId].collapsed = !this.data.folders[folderId].collapsed;
                this.saveData();
                PanelUI.renderDetailsPane();
            }
        },

        setFolderColor(folderId, color) {
            if (this.data.folders[folderId]) {
                this.data.folders[folderId].color = color;
                this.saveData();
                this.markSidebarChats();
                this._refreshFilterBar();
                PanelUI.renderDetailsPane();
            }
        },

        toggleFolderPin(folderId) {
            if (this.data.folders[folderId]) {
                this.data.folders[folderId].pinned = !this.data.folders[folderId].pinned;
                this.saveData();
                PanelUI.renderDetailsPane();
            }
        },

        moveChatToFolder(chatId, folderId) {
            if (folderId === null) {
                delete this.data.chatToFolder[chatId];
            } else {
                this.data.chatToFolder[chatId] = folderId;
            }
            this.saveData();
            this.markSidebarChats();
            PanelUI.renderDetailsPane();
        },

        reorderFolder(draggedId, targetId, position) {
            const order = this.data.folderOrder.filter(id => id !== draggedId);
            const targetIdx = order.indexOf(targetId);
            if (targetIdx === -1) return;
            const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;
            order.splice(insertIdx, 0, draggedId);
            this.data.folderOrder = order;
            this.saveData();
            PanelUI.renderDetailsPane();
        },

        batchMoveToFolder(targetFolderId) {
            this._batchSelected.forEach(chatId => {
                if (targetFolderId === null) {
                    delete this.data.chatToFolder[chatId];
                } else {
                    this.data.chatToFolder[chatId] = targetFolderId;
                }
            });
            this._batchSelected.clear();
            this._batchMode = false;
            this.saveData();
            this.markSidebarChats();
            PanelUI.renderDetailsPane();
        },

        getFolderStats(folderId) {
            const chatIds = Object.entries(this.data.chatToFolder)
                .filter(([, fid]) => fid === folderId)
                .map(([cid]) => cid);
            return { chatCount: chatIds.length };
        },

        setFolderRules(folderId, rules) {
            if (this.data.folders[folderId]) {
                this.data.folders[folderId].rules = rules;
                this.saveData();
            }
        },

        autoClassify() {
            let classified = 0;
            this.scanSidebarChats();
            this.chatCache.forEach(chat => {
                // Skip already assigned
                if (this.data.chatToFolder[chat.id]) return;
                const title = chat.title.toLowerCase();
                for (const folderId of this.data.folderOrder) {
                    const folder = this.data.folders[folderId];
                    if (!folder || !folder.rules || folder.rules.length === 0) continue;
                    const matched = folder.rules.some(rule => {
                        if (rule.type === 'keyword' && rule.value) {
                            return title.includes(rule.value.toLowerCase());
                        }
                        if (rule.type === 'regex' && rule.value) {
                            try {
                                const regex = new RegExp(rule.value, 'i');
                                const testStr = chat.title.substring(0, 500);
                                return regex.test(testStr);
                            }
                            catch { return false; }
                        }
                        return false;
                    });
                    if (matched) {
                        this.data.chatToFolder[chat.id] = folderId;
                        classified++;
                        break; // First match wins
                    }
                }
            });
            if (classified > 0) {
                this.saveData();
                this.markSidebarChats();
                PanelUI.renderDetailsPane();
                Logger.info(`Auto-classified ${classified} chats`);
            }
            return classified;
        },

        // --- 侧边栏扫描 ---
        scanSidebarChats() {
            this.chatCache = Core.scanSidebarChats();
            return this.chatCache;
        },

        // --- 仅在侧边栏聊天项上添加颜色标记 (6px dot) ---
        markSidebarChats() {
            // 移除旧标记
            document.querySelectorAll('.gf-sidebar-dot').forEach(el => el.remove());

            // 扫描聊天列表
            const chats = this.scanSidebarChats();

            chats.forEach(chat => {
                const folderId = this.data.chatToFolder[chat.id];
                if (folderId && this.data.folders[folderId]) {
                    const folder = this.data.folders[folderId];
                    // 创建小圆点
                    const dot = document.createElement('span');
                    dot.className = 'gf-sidebar-dot';
                    dot.style.cssText = `
                        display: inline-block;
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: ${folder.color};
                        margin-right: 6px;
                        flex-shrink: 0;
                        vertical-align: middle;
                    `;
                    dot.title = folder.name;
                    // 插入到链接开头
                    chat.element.insertBefore(dot, chat.element.firstChild);
                }
            });

            // 设置拖拽
            this.enableSidebarDrag();
        },

        // --- 在侧边栏启用拖拽（拖到我们的面板） ---
        enableSidebarDrag() {
            const chats = this.chatCache;
            chats.forEach(chat => {
                chat.element.setAttribute('draggable', 'true');
                chat.element.ondragstart = (e) => {
                    this.dragState = { chatId: chat.id, chatTitle: chat.title };
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', chat.id);
                    // 视觉反馈
                    chat.element.style.opacity = '0.5';
                };
                chat.element.ondragend = () => {
                    chat.element.style.opacity = '';
                    this.dragState = null;
                    // 移除所有高亮
                    document.querySelectorAll('.gf-drop-highlight').forEach(el => {
                        el.classList.remove('gf-drop-highlight');
                    });
                };
            });
        },

        // --- DOM 观察 ---
        startObserver() {
            // 延迟初始化
            setTimeout(() => this.markSidebarChats(), TIMINGS.POLL_INTERVAL);

            // 监听 DOM 变化 (尽量缩小到侧边栏，降级到 body)
            this.observer = new MutationObserver(() => {
                clearTimeout(this._markTimeout);
                this._markTimeout = setTimeout(() => this.markSidebarChats(), TIMINGS.OBSERVER_DEBOUNCE);
            });

            const sidebar = document.querySelector('bard-sidenav-container, nav, [role="navigation"]');
            const target = sidebar || document.body;
            this.observer.observe(target, {
                childList: true,
                subtree: true
            });
        },

        _styleEl: null,

        // --- 注入样式 ---
        injectStyles() {
            if (this._styleEl) return;
            this._styleEl = GM_addStyle(`
                /* Folder Modal */
                .gf-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: var(--overlay-tint, rgba(0, 0, 0, 0.6));
                    z-index: ${LAYERS.OVERLAY};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .gf-modal {
                    width: min(92vw, 360px);
                    background: var(--bg, #202124);
                    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                }
                .gf-modal-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: var(--text-main, #e8eaed);
                    margin-bottom: 16px;
                }
                .gf-modal-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
                    border-radius: 8px;
                    background: var(--input-bg, rgba(255, 255, 255, 0.05));
                    color: var(--text-main, #e8eaed);
                    font-size: 14px;
                    margin-bottom: 12px;
                    box-sizing: border-box;
                }
                .gf-modal-input:focus {
                    outline: none;
                    border-color: var(--accent, #8ab4f8);
                }
                .gf-modal-colors {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 16px;
                }
                .gf-color-option {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: transform 0.2s, border-color 0.2s;
                    padding: 0;
                }
                .gf-color-option:hover {
                    transform: scale(1.1);
                }
                .gf-color-option.selected {
                    border-color: #fff;
                }
                .gf-modal-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }
                .gf-modal-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .gf-modal-btn.primary {
                    background: var(--accent, #8ab4f8);
                    color: #000;
                }
                .gf-modal-btn.secondary {
                    background: var(--btn-bg, rgba(255, 255, 255, 0.1));
                    color: var(--text-main, #e8eaed);
                }
                .gf-modal-btn.danger {
                    background: rgba(242, 139, 130, 0.2);
                    color: #f28b82;
                }
                .gf-modal-btn:hover {
                    filter: brightness(1.1);
                }
                .gf-modal-input:focus-visible,
                .gf-color-option:focus-visible,
                .gf-modal-btn:focus-visible {
                    outline: 2px solid var(--accent, #8ab4f8);
                    outline-offset: 2px;
                }

                /* Folder row in details pane */
                .gf-folder-row {
                    display: flex;
                    align-items: center;
                    padding: 6px 8px;
                    margin: 2px 0;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .gf-folder-row:hover {
                    background: var(--row-hover, rgba(255, 255, 255, 0.08));
                }
                .gf-folder-row.drop-active {
                    background: rgba(138, 180, 248, 0.2) !important;
                    outline: 2px dashed rgba(138, 180, 248, 0.5);
                }
                .gf-folder-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 3px;
                    margin-right: 8px;
                    flex-shrink: 0;
                }
                .gf-folder-label {
                    flex: 1;
                    font-size: 11px;
                    color: var(--text-main, #e8eaed);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .gf-folder-badge {
                    font-size: 9px;
                    color: var(--text-sub, #9aa0a6);
                    margin-left: 4px;
                }
                .gf-folder-toggle {
                    font-size: 8px;
                    color: var(--text-sub, #9aa0a6);
                    margin-left: 4px;
                    transition: transform 0.2s;
                }
                .gf-folder-row.collapsed .gf-folder-toggle {
                    transform: rotate(-90deg);
                }
                .gf-folder-actions {
                    display: none;
                    gap: 2px;
                    margin-left: 4px;
                }
                .gf-folder-row:hover .gf-folder-actions {
                    display: flex;
                }
                .gf-folder-action {
                    font-size: 10px;
                    padding: 2px;
                    cursor: pointer;
                    opacity: 0.6;
                    background: transparent;
                    border: none;
                    color: inherit;
                }
                .gf-folder-action:hover {
                    opacity: 1;
                }

                /* Chat item in folder */
                .gf-chat-row {
                    display: flex;
                    align-items: center;
                    padding: 4px 8px 4px 20px;
                    margin: 1px 0;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.2s;
                    font-size: 10px;
                    color: var(--text-sub, #9aa0a6);
                }
                .gf-chat-row:hover {
                    background: var(--row-hover, rgba(255, 255, 255, 0.08));
                    color: var(--text-main, #e8eaed);
                }
                .gf-chat-title {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .gf-chat-remove {
                    font-size: 9px;
                    opacity: 0;
                    cursor: pointer;
                    padding: 2px;
                    background: transparent;
                    border: none;
                    color: inherit;
                }
                .gf-chat-row:hover .gf-chat-remove {
                    opacity: 0.6;
                }
                .gf-chat-remove:hover {
                    opacity: 1;
                }
                .gf-folder-action:focus-visible,
                .gf-chat-remove:focus-visible {
                    outline: 2px solid var(--accent, #8ab4f8);
                    outline-offset: 1px;
                }

                /* Add folder button in details */
                .gf-add-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 6px;
                    margin-top: 4px;
                    border: 1px dashed var(--divider, rgba(255, 255, 255, 0.15));
                    border-radius: 6px;
                    background: transparent;
                    color: var(--text-sub, #9aa0a6);
                    font-size: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                }
                .gf-add-btn:hover {
                    background: var(--input-bg, rgba(255, 255, 255, 0.05));
                    border-color: var(--border, rgba(255, 255, 255, 0.25));
                    color: var(--text-main, #e8eaed);
                }

                /* Drop highlight for folder rows */
                .gf-drop-highlight {
                    background: rgba(138, 180, 248, 0.15) !important;
                }

                /* Folder drag reorder */
                .gf-folder-row[draggable="true"] {
                    cursor: grab;
                }
                .gf-folder-row.dragging {
                    opacity: 0.4;
                }
                .gf-folder-row.drag-above {
                    border-top: 2px solid var(--accent, #8ab4f8);
                }
                .gf-folder-row.drag-below {
                    border-bottom: 2px solid var(--accent, #8ab4f8);
                }

                /* Uncategorized section */
                .gf-uncategorized-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 8px;
                    margin-top: 6px;
                    font-size: 10px;
                    color: var(--text-sub, #9aa0a6);
                    opacity: 0.7;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: background 0.2s;
                }
                .gf-uncategorized-header:hover {
                    background: var(--row-hover, rgba(255, 255, 255, 0.08));
                    opacity: 1;
                }

                /* Batch mode */
                .gf-batch-bar {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    margin-bottom: 4px;
                    font-size: 10px;
                    color: var(--text-sub, #9aa0a6);
                }
                .gf-batch-bar button {
                    font-size: 9px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid var(--divider, rgba(255,255,255,0.1));
                    background: var(--btn-bg, rgba(255,255,255,0.05));
                    color: var(--text-sub, #9aa0a6);
                    cursor: pointer;
                }
                .gf-batch-bar button:hover {
                    color: var(--text-main, #fff);
                }
                .gf-chat-row.batch-selected {
                    background: rgba(138, 180, 248, 0.15);
                }
                .gf-batch-check {
                    width: 12px; height: 12px;
                    border: 1px solid var(--text-sub, #9aa0a6);
                    border-radius: 3px;
                    margin-right: 6px;
                    flex-shrink: 0;
                    cursor: pointer;
                    background: transparent;
                    padding: 0;
                    appearance: none;
                }
                .gf-batch-check.checked {
                    background: var(--accent, #8ab4f8);
                    border-color: var(--accent, #8ab4f8);
                }
            `);
        },

        getOnboarding() {
            return {
                zh: {
                    rant: '你的 Gemini 侧边栏现在是什么样？200 个无序对话，按时间排列，连搜索都没有。想找上周那个关于 Kubernetes 部署的对话？祝你好运，慢慢翻吧。Google Keep 有标签，Gmail 有标签，Google Drive 有文件夹，但 Gemini 就是没有。一致性？不存在的。',
                    features: '侧边栏顶部添加文件夹筛选栏，支持按分组过滤对话。对话项显示彩色文件夹标记，支持拖拽分配。',
                    guide: '1. 在浮动面板的 📁 标签页创建文件夹\n2. 拖拽对话到文件夹\n3. 点击侧边栏顶部的文件夹标签筛选'
                },
                en: {
                    rant: "Your Gemini sidebar right now: 200 unorganized conversations sorted by time with no search. Want to find last week's Kubernetes deployment chat? Good luck scrolling. Google Keep has labels, Gmail has labels, Drive has folders, but Gemini has nothing. Consistency? Never heard of it.",
                    features: 'Adds a folder filter bar at the top of the sidebar. Filter conversations by group. Chat items show colored folder dots, with drag-and-drop assignment.',
                    guide: '1. Create folders in the 📁 tab of the floating panel\n2. Drag conversations into folders\n3. Click folder tabs at the top of the sidebar to filter'
                }
            };
        },

        // --- 渲染到详情面板 ---
        renderToDetailsPane(container) {
            // Section Title
            const title = document.createElement('div');
            title.className = 'section-title';
            title.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
            const titleText = document.createElement('span');
            titleText.textContent = 'Folders';
            const batchToggle = document.createElement('button');
            batchToggle.type = 'button';
            batchToggle.style.cssText = 'font-size: 9px; cursor: pointer; opacity: 0.6; background: transparent; border: none; color: inherit; padding: 0;';
            batchToggle.textContent = this._batchMode ? '✕ Cancel' : '☑ Select';
            batchToggle.setAttribute('aria-label', this._batchMode ? 'Cancel batch mode' : 'Enable batch mode');
            batchToggle.onclick = (e) => {
                e.stopPropagation();
                this._batchMode = !this._batchMode;
                this._batchSelected.clear();
                PanelUI.renderDetailsPane();
            };
            title.appendChild(titleText);
            title.appendChild(batchToggle);
            container.appendChild(title);

            // Batch action bar
            if (this._batchMode && this._batchSelected.size > 0) {
                const batchBar = document.createElement('div');
                batchBar.className = 'gf-batch-bar';
                const countLabel = document.createElement('span');
                countLabel.textContent = `${this._batchSelected.size} selected`;
                batchBar.appendChild(countLabel);

                // Move to folder buttons
                this.data.folderOrder.forEach(fid => {
                    const f = this.data.folders[fid];
                    if (!f) return;
                    const btn = document.createElement('button');
                    btn.textContent = `→ ${f.name}`;
                    btn.onclick = () => this.batchMoveToFolder(fid);
                    batchBar.appendChild(btn);
                });
                const unassignBtn = document.createElement('button');
                unassignBtn.textContent = '→ None';
                unassignBtn.onclick = () => this.batchMoveToFolder(null);
                batchBar.appendChild(unassignBtn);
                container.appendChild(batchBar);
            }

            // Search bar
            const searchWrap = document.createElement('div');
            searchWrap.style.cssText = 'margin-bottom: 6px;';
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = '🔍 Search chats...';
            searchInput.style.cssText = 'width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: 1px solid var(--divider, rgba(255,255,255,0.1)); background: var(--input-bg, rgba(255,255,255,0.05)); color: var(--text-main, #fff); box-sizing: border-box;';
            searchInput.value = this._searchQuery || '';
            searchInput.oninput = (e) => {
                this._searchQuery = e.target.value;
                PanelUI.renderDetailsPane();
            };
            searchWrap.appendChild(searchInput);
            container.appendChild(searchWrap);

            const query = (this._searchQuery || '').toLowerCase().trim();

            // 扫描当前聊天
            this.scanSidebarChats();

            // 按文件夹分组
            const chatsByFolder = {};
            this.chatCache.forEach(chat => {
                const fid = this.data.chatToFolder[chat.id];
                if (fid && this.data.folders[fid]) {
                    if (!chatsByFolder[fid]) chatsByFolder[fid] = [];
                    chatsByFolder[fid].push(chat);
                }
            });

            // Sort folder order: pinned first, then original order
            const sortedFolderOrder = [...this.data.folderOrder].sort((a, b) => {
                const aPinned = this.data.folders[a]?.pinned ? 1 : 0;
                const bPinned = this.data.folders[b]?.pinned ? 1 : 0;
                return bPinned - aPinned;
            });

            // 渲染文件夹列表
            if (this.data.folderOrder.length === 0) {
                const hint = document.createElement('div');
                hint.style.cssText = 'font-size: 10px; color: var(--text-sub); opacity: 0.6; padding: 4px 8px;';
                hint.textContent = 'Drag chats here to organize';
                container.appendChild(hint);
            } else {
                sortedFolderOrder.forEach(folderId => {
                    const folder = this.data.folders[folderId];
                    if (!folder) return;

                    let chats = chatsByFolder[folderId] || [];
                    // Apply search filter
                    if (query) {
                        chats = chats.filter(c => c.title.toLowerCase().includes(query));
                        // Also match folder name
                        if (!folder.name.toLowerCase().includes(query) && chats.length === 0) return;
                    }
                    const folderEl = this.createFolderRow(folderId, folder, chats);
                    container.appendChild(folderEl);
                });
            }

            // Uncategorized chats section
            const assignedChatIds = new Set(
                Object.entries(this.data.chatToFolder)
                    .filter(([, fid]) => this.data.folders[fid])
                    .map(([cid]) => cid)
            );
            let uncategorized = this.chatCache.filter(chat => !assignedChatIds.has(chat.id));
            if (query) {
                uncategorized = uncategorized.filter(c => c.title.toLowerCase().includes(query));
            }

            if (uncategorized.length > 0) {
                const uncatHeader = document.createElement('div');
                uncatHeader.className = 'gf-uncategorized-header';
                const uncatToggle = document.createElement('span');
                uncatToggle.textContent = this.uncategorizedCollapsed ? '▶' : '▼';
                uncatToggle.style.fontSize = '8px';
                const uncatLabel = document.createElement('span');
                uncatLabel.textContent = `Uncategorized (${uncategorized.length})`;
                uncatHeader.appendChild(uncatToggle);
                uncatHeader.appendChild(uncatLabel);
                uncatHeader.onclick = (e) => {
                    e.stopPropagation();
                    this.uncategorizedCollapsed = !this.uncategorizedCollapsed;
                    PanelUI.renderDetailsPane();
                };
                container.appendChild(uncatHeader);

                if (!this.uncategorizedCollapsed) {
                    uncategorized.forEach(chat => {
                        const chatRow = document.createElement('div');
                        chatRow.className = 'gf-chat-row' + (this._batchSelected.has(chat.id) ? ' batch-selected' : '');

                        if (this._batchMode) {
                            const check = document.createElement('button');
                            check.type = 'button';
                            check.className = 'gf-batch-check' + (this._batchSelected.has(chat.id) ? ' checked' : '');
                            check.setAttribute('aria-label', `Select ${chat.title}`);
                            check.setAttribute('aria-pressed', this._batchSelected.has(chat.id) ? 'true' : 'false');
                            check.onclick = (e) => {
                                e.stopPropagation();
                                if (this._batchSelected.has(chat.id)) {
                                    this._batchSelected.delete(chat.id);
                                } else {
                                    this._batchSelected.add(chat.id);
                                }
                                check.setAttribute('aria-pressed', this._batchSelected.has(chat.id) ? 'true' : 'false');
                                PanelUI.renderDetailsPane();
                            };
                            chatRow.appendChild(check);
                        }

                        if (!this._batchMode) {
                            chatRow.setAttribute('draggable', 'true');
                            chatRow.ondragstart = (e) => {
                                this.dragState = { chatId: chat.id, chatTitle: chat.title };
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', chat.id);
                                chatRow.style.opacity = '0.5';
                            };
                            chatRow.ondragend = () => {
                                chatRow.style.opacity = '';
                                this.dragState = null;
                            };
                        }

                        const chatTitle = document.createElement('span');
                        chatTitle.className = 'gf-chat-title';
                        chatTitle.textContent = chat.title.length > 20 ? chat.title.slice(0, 20) + '...' : chat.title;
                        chatTitle.title = chat.title;
                        chatRow.appendChild(chatTitle);

                        chatRow.onclick = (e) => {
                            e.stopPropagation();
                            if (this._batchMode) {
                                if (this._batchSelected.has(chat.id)) {
                                    this._batchSelected.delete(chat.id);
                                } else {
                                    this._batchSelected.add(chat.id);
                                }
                                PanelUI.renderDetailsPane();
                                return;
                            }
                            if (chat.element && chat.element.click) {
                                chat.element.click();
                            } else {
                                window.location.href = chat.href;
                            }
                        };

                        container.appendChild(chatRow);
                    });
                }
            }

            // Add folder button
            const addBtn = document.createElement('button');
            addBtn.className = 'gf-add-btn';
            addBtn.textContent = '+ New Folder';
            addBtn.onclick = (e) => {
                e.stopPropagation();
                this.showFolderModal(null, 'Create Folder', '', this.FOLDER_COLORS[0]);
            };
            container.appendChild(addBtn);

            // Auto-classify button (only if rules exist)
            const hasRules = this.data.folderOrder.some(fid => {
                const f = this.data.folders[fid];
                return f && f.rules && f.rules.length > 0;
            });
            if (hasRules) {
                const classifyBtn = document.createElement('button');
                classifyBtn.className = 'gf-add-btn';
                classifyBtn.style.borderStyle = 'solid';
                classifyBtn.textContent = '🤖 Auto Classify';
                classifyBtn.onclick = (e) => {
                    e.stopPropagation();
                    const count = this.autoClassify();
                    classifyBtn.textContent = count > 0 ? `✓ Classified ${count} chats` : '✓ Nothing to classify';
                    setTimeout(() => { classifyBtn.textContent = '🤖 Auto Classify'; }, 2000);
                };
                container.appendChild(classifyBtn);
            }
        },

        createFolderRow(folderId, folder, chats) {
            const wrapper = document.createElement('div');
            wrapper.className = 'gf-folder-wrapper';

            // Folder header row
            const row = document.createElement('div');
            row.className = `gf-folder-row ${folder.collapsed ? 'collapsed' : ''}`;
            row.setAttribute('draggable', 'true');
            row.dataset.folderId = folderId;

            // Folder drag reorder
            row.ondragstart = (e) => {
                // Only start folder drag if not dragging a chat
                if (this.dragState) return;
                this.folderDragState = { folderId };
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', 'folder:' + folderId);
                row.classList.add('dragging');
            };
            row.ondragend = () => {
                row.classList.remove('dragging');
                this.folderDragState = null;
                document.querySelectorAll('.gf-folder-row').forEach(el => {
                    el.classList.remove('drag-above', 'drag-below');
                });
            };

            // Color dot
            const dot = document.createElement('div');
            dot.className = 'gf-folder-dot';
            dot.style.background = folder.color;

            // Name
            const label = document.createElement('span');
            label.className = 'gf-folder-label';
            label.textContent = (folder.pinned ? '📌 ' : '') + folder.name;

            // Count badge with stats tooltip
            const stats = this.getFolderStats(folderId);
            const badge = document.createElement('span');
            badge.className = 'gf-folder-badge';
            badge.textContent = chats.length > 0 ? `(${chats.length})` : '';
            badge.title = `Total assigned: ${stats.chatCount} | Visible: ${chats.length}`;

            // Toggle arrow
            const toggle = document.createElement('span');
            toggle.className = 'gf-folder-toggle';
            toggle.textContent = '▼';

            // Actions
            const actions = document.createElement('div');
            actions.className = 'gf-folder-actions';

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'gf-folder-action';
            editBtn.textContent = '✏️';
            editBtn.title = 'Edit';
            editBtn.setAttribute('aria-label', `Edit folder ${folder.name}`);
            editBtn.onclick = (e) => {
                e.stopPropagation();
                this.showFolderModal(folderId, 'Edit Folder', folder.name, folder.color);
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'gf-folder-action';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Delete';
            deleteBtn.setAttribute('aria-label', `Delete folder ${folder.name}`);
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${folder.name}"?`)) {
                    this.deleteFolder(folderId);
                }
            };

            const pinBtn = document.createElement('button');
            pinBtn.type = 'button';
            pinBtn.className = 'gf-folder-action';
            pinBtn.textContent = folder.pinned ? '📌' : '📍';
            pinBtn.title = folder.pinned ? 'Unpin' : 'Pin to top';
            pinBtn.setAttribute('aria-label', folder.pinned ? `Unpin folder ${folder.name}` : `Pin folder ${folder.name}`);
            pinBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleFolderPin(folderId);
            };

            actions.appendChild(pinBtn);
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            row.appendChild(dot);
            row.appendChild(label);
            row.appendChild(badge);
            row.appendChild(actions);
            row.appendChild(toggle);

            // Click to toggle collapse
            row.onclick = (e) => {
                if (e.target.closest('.gf-folder-actions')) return;
                e.stopPropagation();
                this.toggleFolderCollapse(folderId);
            };

            // Drag & Drop (chat into folder + folder reorder)
            row.ondragover = (e) => {
                e.preventDefault();
                if (this.folderDragState && this.folderDragState.folderId !== folderId) {
                    // Folder reorder: show position indicator
                    const rect = row.getBoundingClientRect();
                    const mid = rect.top + rect.height / 2;
                    row.classList.remove('drag-above', 'drag-below', 'drop-active');
                    if (e.clientY < mid) {
                        row.classList.add('drag-above');
                    } else {
                        row.classList.add('drag-below');
                    }
                } else if (this.dragState) {
                    // Chat drop into folder
                    row.classList.add('drop-active');
                }
            };
            row.ondragleave = () => {
                row.classList.remove('drop-active', 'drag-above', 'drag-below');
            };
            row.ondrop = (e) => {
                e.preventDefault();
                const wasAbove = row.classList.contains('drag-above');
                row.classList.remove('drop-active', 'drag-above', 'drag-below');
                if (this.folderDragState && this.folderDragState.folderId !== folderId) {
                    // Folder reorder
                    this.reorderFolder(this.folderDragState.folderId, folderId, wasAbove ? 'before' : 'after');
                } else if (this.dragState) {
                    // Chat drop
                    this.moveChatToFolder(this.dragState.chatId, folderId);
                }
            };

            wrapper.appendChild(row);

            // Chat items (if not collapsed)
            if (!folder.collapsed && chats.length > 0) {
                chats.forEach(chat => {
                    const chatRow = document.createElement('div');
                    chatRow.className = 'gf-chat-row' + (this._batchSelected.has(chat.id) ? ' batch-selected' : '');

                    if (this._batchMode) {
                        const check = document.createElement('button');
                        check.type = 'button';
                        check.className = 'gf-batch-check' + (this._batchSelected.has(chat.id) ? ' checked' : '');
                        check.setAttribute('aria-label', `Select ${chat.title}`);
                        check.setAttribute('aria-pressed', this._batchSelected.has(chat.id) ? 'true' : 'false');
                        check.onclick = (e) => {
                            e.stopPropagation();
                            if (this._batchSelected.has(chat.id)) {
                                this._batchSelected.delete(chat.id);
                            } else {
                                this._batchSelected.add(chat.id);
                            }
                            check.setAttribute('aria-pressed', this._batchSelected.has(chat.id) ? 'true' : 'false');
                            PanelUI.renderDetailsPane();
                        };
                        chatRow.appendChild(check);
                    }

                    const chatTitle = document.createElement('span');
                    chatTitle.className = 'gf-chat-title';
                    chatTitle.textContent = chat.title.length > 20 ? chat.title.slice(0, 20) + '...' : chat.title;
                    chatTitle.title = chat.title;

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'gf-chat-remove';
                    removeBtn.textContent = '✕';
                    removeBtn.title = 'Remove from folder';
                    removeBtn.setAttribute('aria-label', `Remove ${chat.title} from folder`);
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.moveChatToFolder(chat.id, null);
                    };

                    chatRow.appendChild(chatTitle);
                    if (!this._batchMode) chatRow.appendChild(removeBtn);

                    // Click to navigate or select in batch mode
                    chatRow.onclick = (e) => {
                        e.stopPropagation();
                        if (this._batchMode) {
                            if (this._batchSelected.has(chat.id)) {
                                this._batchSelected.delete(chat.id);
                            } else {
                                this._batchSelected.add(chat.id);
                            }
                            PanelUI.renderDetailsPane();
                            return;
                        }
                        if (chat.element && chat.element.click) {
                            chat.element.click();
                        } else {
                            window.location.href = chat.href;
                        }
                    };

                    wrapper.appendChild(chatRow);
                });
            }

            return wrapper;
        },

        // --- 模态框 ---
        showFolderModal(folderId, title, currentName, currentColor) {
            const isEdit = folderId !== null;

            const overlay = document.createElement('div');
            overlay.className = 'gf-modal-overlay';
            const closeModal = () => UIA11y.closeModal(overlay);

            const modal = document.createElement('div');
            modal.className = 'gf-modal';
            Core.applyTheme(modal, currentTheme);

            const titleEl = document.createElement('div');
            titleEl.id = 'gf-modal-title';
            titleEl.className = 'gf-modal-title';
            titleEl.textContent = title;

            const input = document.createElement('input');
            input.className = 'gf-modal-input';
            input.type = 'text';
            input.placeholder = 'Folder name';
            input.value = currentName;

            const colorsContainer = document.createElement('div');
            colorsContainer.className = 'gf-modal-colors';

            let selectedColor = currentColor;
            this.FOLDER_COLORS.forEach(color => {
                const colorBtn = document.createElement('button');
                colorBtn.type = 'button';
                colorBtn.className = `gf-color-option ${color === selectedColor ? 'selected' : ''}`;
                colorBtn.style.background = color;
                colorBtn.setAttribute('aria-label', `Select color ${color}`);
                colorBtn.onclick = () => {
                    colorsContainer.querySelectorAll('.gf-color-option').forEach(c => c.classList.remove('selected'));
                    colorBtn.classList.add('selected');
                    selectedColor = color;
                    hexInput.value = color;
                };
                colorsContainer.appendChild(colorBtn);
            });

            // Custom hex color input
            const hexWrap = document.createElement('div');
            hexWrap.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 16px;';
            const hexLabel = document.createElement('span');
            hexLabel.style.cssText = 'font-size: 11px; color: var(--text-sub, #9aa0a6);';
            hexLabel.textContent = 'Custom:';
            const hexInput = document.createElement('input');
            hexInput.type = 'text';
            hexInput.value = currentColor;
            hexInput.placeholder = '#ff6600';
            hexInput.style.cssText = 'flex: 1; padding: 6px 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--border, rgba(255,255,255,0.1)); background: var(--input-bg, rgba(255,255,255,0.05)); color: var(--text-main, #e8eaed); font-family: monospace; box-sizing: border-box;';
            hexInput.oninput = () => {
                const val = hexInput.value.trim();
                if (/^#[0-9a-fA-F]{3,8}$/.test(val)) {
                    selectedColor = val;
                    colorsContainer.querySelectorAll('.gf-color-option').forEach(c => c.classList.remove('selected'));
                }
            };
            hexWrap.appendChild(hexLabel);
            hexWrap.appendChild(hexInput);

            // Rules section (edit mode only)
            let rulesData = [];
            let rulesContainer = null;
            if (isEdit) {
                rulesData = [...(this.data.folders[folderId].rules || [])];

                const rulesSection = document.createElement('div');
                rulesSection.style.cssText = 'margin-bottom: 16px;';
                const rulesLabel = document.createElement('div');
                rulesLabel.style.cssText = 'font-size: 11px; color: var(--text-sub, #9aa0a6); margin-bottom: 6px;';
                rulesLabel.textContent = 'Auto-classify rules (keyword or /regex/):';
                rulesSection.appendChild(rulesLabel);

                rulesContainer = document.createElement('div');
                rulesContainer.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

                const renderRules = () => {
                    rulesContainer.replaceChildren();
                    rulesData.forEach((rule, idx) => {
                        const ruleRow = document.createElement('div');
                        ruleRow.style.cssText = 'display: flex; gap: 4px; align-items: center;';
                        const ruleInput = document.createElement('input');
                        ruleInput.type = 'text';
                        ruleInput.value = rule.type === 'regex' ? `/${rule.value}/` : rule.value;
                        ruleInput.style.cssText = 'flex: 1; padding: 4px 8px; font-size: 11px; border-radius: 4px; border: 1px solid var(--border, rgba(255,255,255,0.1)); background: var(--input-bg, rgba(255,255,255,0.05)); color: var(--text-main, #e8eaed); box-sizing: border-box;';
                        ruleInput.oninput = () => {
                            const val = ruleInput.value.trim();
                            const regexMatch = val.match(/^\/(.+)\/$/);
                            if (regexMatch) {
                                rulesData[idx] = { type: 'regex', value: regexMatch[1] };
                            } else {
                                rulesData[idx] = { type: 'keyword', value: val };
                            }
                        };
                        const delBtn = document.createElement('button');
                        delBtn.type = 'button';
                        delBtn.textContent = '✕';
                        delBtn.style.cssText = 'cursor: pointer; font-size: 12px; color: var(--text-sub); opacity: 0.6; background: transparent; border: none; padding: 2px 4px;';
                        delBtn.setAttribute('aria-label', 'Delete rule');
                        delBtn.onclick = () => { rulesData.splice(idx, 1); renderRules(); };
                        ruleRow.appendChild(ruleInput);
                        ruleRow.appendChild(delBtn);
                        rulesContainer.appendChild(ruleRow);
                    });
                };
                renderRules();

                const addRuleBtn = document.createElement('button');
                addRuleBtn.type = 'button';
                addRuleBtn.style.cssText = 'font-size: 10px; padding: 4px 8px; border-radius: 4px; border: 1px dashed var(--divider, rgba(255,255,255,0.15)); background: transparent; color: var(--text-sub, #9aa0a6); cursor: pointer; margin-top: 4px;';
                addRuleBtn.textContent = '+ Add Rule';
                addRuleBtn.onclick = () => { rulesData.push({ type: 'keyword', value: '' }); renderRules(); };

                rulesSection.appendChild(rulesContainer);
                rulesSection.appendChild(addRuleBtn);
                modal.rulesSection = rulesSection;
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'gf-modal-actions';

            if (isEdit) {
                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'gf-modal-btn danger';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => {
                    this.deleteFolder(folderId);
                    closeModal();
                };
                actionsDiv.appendChild(deleteBtn);
            }

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'gf-modal-btn secondary';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => closeModal();

            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'gf-modal-btn primary';
            saveBtn.textContent = isEdit ? 'Save' : 'Create';
            saveBtn.onclick = () => {
                const name = input.value.trim() || 'New Folder';
                if (isEdit) {
                    this.renameFolder(folderId, name);
                    this.setFolderColor(folderId, selectedColor);
                    this.setFolderRules(folderId, rulesData.filter(r => r.value));
                } else {
                    this.createFolder(name, selectedColor);
                }
                closeModal();
            };

            actionsDiv.appendChild(cancelBtn);
            actionsDiv.appendChild(saveBtn);

            modal.appendChild(titleEl);
            modal.appendChild(input);
            modal.appendChild(colorsContainer);
            modal.appendChild(hexWrap);
            if (modal.rulesSection) modal.appendChild(modal.rulesSection);
            modal.appendChild(actionsDiv);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            UIA11y.setupModal(overlay, modal, {
                close: closeModal,
                labelledBy: titleEl.id,
                initialFocus: input
            });

            input.focus();
            input.select();
        }
    };

    // 注册文件夹模块
    ModuleRegistry.register(FoldersModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                  PROMPT VAULT MODULE (提示词金库)                          ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const PromptVaultModule = {
        id: 'prompt-vault',
        name: '提示词金库',
        description: '保存和快速插入常用 Prompt 模板',
        icon: '💎',
        defaultEnabled: false,

        STORAGE_KEY: 'gemini_prompt_vault',
        _prompts: [],

        _getStorageKey() {
            const user = Core.getCurrentUser();
            return user && user.includes('@') ? `${this.STORAGE_KEY}_${user}` : this.STORAGE_KEY;
        },

        init() {
            this._prompts = GM_getValue(this._getStorageKey(), []);
            Logger.info('PromptVaultModule initialized', { count: this._prompts.length });
        },
        destroy() {
            const fab = document.getElementById('gv-fab');
            if (fab) fab.remove();
            this.removeNativeUI();
        },
        onUserChange() {
            this._prompts = GM_getValue(this._getStorageKey(), []);
            PanelUI.renderDetailsPane();
        },

        // --- Native UI: Quick menu button near input area ---
        injectNativeUI() {
            const NATIVE_ID = 'gc-vault-native';
            if (document.getElementById(NATIVE_ID)) return;

            const trailing = document.querySelector('.trailing-actions-wrapper');
            if (!trailing) return;

            const btn = document.createElement('button');
            btn.id = NATIVE_ID;
            btn.type = 'button';
            btn.className = 'gc-native-btn';
            btn.textContent = '\uD83D\uDC8E';
            btn.title = 'Prompt Vault';
            btn.setAttribute('aria-label', 'Open Prompt Vault quick menu');
            btn.style.cssText = 'background:transparent;border:none;cursor:pointer;font-size:16px;padding:4px 6px;border-radius:50%;transition:background 0.2s;line-height:1;display:flex;align-items:center;';
            btn.onmouseenter = () => { btn.style.background = 'rgba(128,128,128,0.2)'; };
            btn.onmouseleave = () => { btn.style.background = 'transparent'; };
            btn.onclick = (e) => {
                e.stopPropagation();
                this._toggleQuickMenu(btn);
            };

            trailing.insertBefore(btn, trailing.firstChild);
        },

        removeNativeUI() {
            NativeUI.remove('gc-vault-native');
            NativeUI.remove('gc-vault-menu');
            if (this._menuAbort) { this._menuAbort.abort(); this._menuAbort = null; }
        },

        _toggleQuickMenu(anchorBtn) {
            const MENU_ID = 'gc-vault-menu';
            const existing = document.getElementById(MENU_ID);
            if (existing) { existing.remove(); return; }

            const menu = document.createElement('div');
            menu.id = MENU_ID;
            menu.className = 'gc-dropdown-menu';
            menu.setAttribute('role', 'menu');
            menu.style.cssText = 'position:fixed;bottom:60px;max-height:300px;overflow-y:auto;min-width:200px;';

            // Position near the button
            const rect = anchorBtn.getBoundingClientRect();
            menu.style.left = rect.left + 'px';
            menu.style.bottom = (window.innerHeight - rect.top + 4) + 'px';

            if (this._prompts.length === 0) {
                const empty = document.createElement('button');
                empty.type = 'button';
                empty.className = 'gc-dropdown-item';
                empty.style.cssText = 'color:#9aa0a6;font-size:12px;';
                empty.textContent = '\u8FD8\u6CA1\u6709\u4FDD\u5B58\u7684\u63D0\u793A\u8BCD';
                empty.disabled = true;
                menu.appendChild(empty);
            } else {
                // Group by category, show max 8
                const categories = {};
                this._prompts.forEach(p => {
                    const cat = p.category || 'General';
                    if (!categories[cat]) categories[cat] = [];
                    categories[cat].push(p);
                });

                let count = 0;
                Object.entries(categories).forEach(([catName, prompts]) => {
                    if (count >= 8) return;
                    const catLabel = document.createElement('div');
                    catLabel.style.cssText = 'padding:4px 16px;font-size:9px;color:#9aa0a6;text-transform:uppercase;letter-spacing:0.5px;';
                    catLabel.textContent = catName;
                    menu.appendChild(catLabel);

                    prompts.forEach(p => {
                        if (count >= 8) return;
                        const item = document.createElement('button');
                        item.type = 'button';
                        item.className = 'gc-dropdown-item';
                        item.style.fontSize = '12px';
                        item.setAttribute('role', 'menuitem');
                        item.textContent = p.name;
                        item.title = p.content.substring(0, 80);
                        item.onclick = (e) => {
                            e.stopPropagation();
                            menu.remove();
                            this.insertPrompt(p.content);
                        };
                        menu.appendChild(item);
                        count++;
                    });
                });
            }

            // "Manage prompts" link at bottom
            const divider = document.createElement('div');
            divider.style.cssText = 'border-top:1px solid rgba(255,255,255,0.08);margin:4px 0;';
            menu.appendChild(divider);
            const manageLink = document.createElement('button');
            manageLink.type = 'button';
            manageLink.className = 'gc-dropdown-item';
            manageLink.style.cssText = 'font-size:11px;color:#8ab4f8;';
            manageLink.setAttribute('role', 'menuitem');
            manageLink.textContent = NativeUI.t('管理提示词...', 'Manage prompts...');
            manageLink.onclick = (e) => {
                e.stopPropagation();
                menu.remove();
                // Open panel details pane to Prompt Vault tab
                const cm = CounterModule;
                if (!cm.state.isExpanded) {
                    PanelUI.toggleDetails();
                }
            };
            menu.appendChild(manageLink);

            document.body.appendChild(menu);
            // Keep quick menu within viewport on small screens.
            const mRect = menu.getBoundingClientRect();
            if (mRect.right > window.innerWidth - 8) {
                menu.style.left = Math.max(8, window.innerWidth - mRect.width - 8) + 'px';
            }
            if (mRect.left < 8) {
                menu.style.left = '8px';
            }
            if (mRect.top < 8) {
                menu.style.top = (rect.bottom + 4) + 'px';
                menu.style.bottom = 'auto';
            }

            // Close on outside click (with AbortController for cleanup)
            if (this._menuAbort) this._menuAbort.abort();
            this._menuAbort = new AbortController();
            const signal = this._menuAbort.signal;
            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!menu.contains(e.target) && e.target !== anchorBtn) {
                        menu.remove();
                        if (this._menuAbort) { this._menuAbort.abort(); this._menuAbort = null; }
                    }
                }, { capture: true, signal });
            }, 0);
        },

        _save() {
            GM_setValue(this._getStorageKey(), this._prompts);
        },

        addPrompt(name, content, category) {
            this._prompts.push({
                id: 'p_' + Date.now(),
                name: name || 'Untitled',
                content: content || '',
                category: category || 'General',
                createdAt: new Date().toISOString()
            });
            this._save();
        },

        deletePrompt(id) {
            this._prompts = this._prompts.filter(p => p.id !== id);
            this._save();
        },

        updatePrompt(id, updates) {
            const p = this._prompts.find(p => p.id === id);
            if (p) Object.assign(p, updates);
            this._save();
        },

        insertPrompt(content) {
            const editor = document.querySelector('div.ql-editor[contenteditable="true"]');
            if (editor) {
                editor.focus();
                const p = document.createElement('p');
                p.textContent = content;
                editor.appendChild(p);
                // Trigger input event for Gemini to detect
                editor.dispatchEvent(new Event('input', { bubbles: true }));
                // Update usage stats
                const prompt = this._prompts.find(pr => pr.content === content);
                if (prompt) {
                    prompt.usedCount = (prompt.usedCount || 0) + 1;
                    prompt.lastUsedAt = new Date().toISOString();
                    this._save();
                }
                Logger.info('Prompt inserted');
            }
        },

        getOnboarding() {
            return {
                zh: {
                    rant: '每次打开 Gemini 都要重新敲一遍"你是一个资深架构师..."，Google 觉得你的手指不需要休息。ChatGPT 2023 年就有 Custom Instructions 了，Gemini 表示：我们不一样，我们让用户每次都从零开始，这叫"新鲜感"。',
                    features: '输入框旁添加 💎 按钮，点击弹出提示词快捷菜单，一键插入常用提示词。支持分类管理、编辑、使用统计。',
                    guide: '1. 点击输入框旁的 💎 → 2. 选择提示词插入 → 3. 如需管理提示词，点击菜单底部"管理提示词"'
                },
                en: {
                    rant: "Every time you open Gemini you retype 'You are a senior architect...' because Google thinks your fingers need exercise. ChatGPT had Custom Instructions in 2023. Gemini says: we're different, we let users start from scratch every time. It's called 'freshness'.",
                    features: 'Adds a 💎 button near the input box. Click to open a prompt quick menu and insert saved prompts with one click. Supports categories, editing, and usage stats.',
                    guide: '1. Click 💎 near the input box → 2. Select a prompt to insert → 3. To manage prompts, click "Manage prompts" at the bottom'
                }
            };
        },

        renderToDetailsPane(container) {
            const title = document.createElement('div');
            title.className = 'section-title';
            title.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
            const titleText = document.createElement('span');
            titleText.textContent = 'Prompt Vault';
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.style.cssText = 'font-size: 12px; cursor: pointer; opacity: 0.6; background: transparent; border: none; color: inherit; padding: 0 2px;';
            addBtn.textContent = '+';
            addBtn.title = 'Add new prompt';
            addBtn.setAttribute('aria-label', 'Add new prompt');
            addBtn.onclick = (e) => {
                e.stopPropagation();
                this.showPromptEditor(null);
            };
            title.appendChild(titleText);
            title.appendChild(addBtn);
            container.appendChild(title);

            if (this._prompts.length === 0) {
                const hint = document.createElement('div');
                hint.style.cssText = 'font-size: 10px; color: var(--text-sub); opacity: 0.6; padding: 4px 8px;';
                hint.textContent = 'No saved prompts. Click + to add.';
                container.appendChild(hint);
                return;
            }

            // Group by category
            const categories = {};
            this._prompts.forEach(p => {
                const cat = p.category || 'General';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(p);
            });

            Object.entries(categories).forEach(([catName, prompts]) => {
                const catLabel = document.createElement('div');
                catLabel.style.cssText = 'font-size: 9px; color: var(--text-sub); opacity: 0.5; padding: 4px 8px 2px; text-transform: uppercase; letter-spacing: 0.5px;';
                catLabel.textContent = catName;
                container.appendChild(catLabel);

                prompts.forEach(p => {
                    const row = document.createElement('div');
                    row.className = 'detail-row';
                    row.title = p.content.length > 100 ? p.content.slice(0, 100) + '...' : p.content;

                    const nameEl = document.createElement('span');
                    nameEl.style.cssText = 'flex: 1; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
                    nameEl.textContent = p.name;

                    const actions = document.createElement('div');
                    actions.style.cssText = 'display: flex; gap: 4px; opacity: 0;';
                    row.onmouseenter = () => actions.style.opacity = '1';
                    row.onmouseleave = () => actions.style.opacity = '0';

                    const insertBtn = document.createElement('button');
                    insertBtn.type = 'button';
                    insertBtn.style.cssText = 'cursor: pointer; font-size: 10px; background: transparent; border: none; color: inherit; padding: 0 2px;';
                    insertBtn.textContent = '📋';
                    insertBtn.title = 'Insert into chat';
                    insertBtn.setAttribute('aria-label', `Insert prompt ${p.name}`);
                    insertBtn.onclick = (e) => { e.stopPropagation(); this.insertPrompt(p.content); };

                    const editBtn = document.createElement('button');
                    editBtn.type = 'button';
                    editBtn.style.cssText = 'cursor: pointer; font-size: 10px; background: transparent; border: none; color: inherit; padding: 0 2px;';
                    editBtn.textContent = '✏️';
                    editBtn.setAttribute('aria-label', `Edit prompt ${p.name}`);
                    editBtn.onclick = (e) => { e.stopPropagation(); this.showPromptEditor(p); };

                    const delBtn = document.createElement('button');
                    delBtn.type = 'button';
                    delBtn.style.cssText = 'cursor: pointer; font-size: 10px; background: transparent; border: none; color: inherit; padding: 0 2px;';
                    delBtn.textContent = '🗑️';
                    delBtn.setAttribute('aria-label', `Delete prompt ${p.name}`);
                    delBtn.onclick = (e) => { e.stopPropagation(); this.deletePrompt(p.id); PanelUI.renderDetailsPane(); };

                    actions.appendChild(insertBtn);
                    actions.appendChild(editBtn);
                    actions.appendChild(delBtn);
                    row.appendChild(nameEl);
                    row.appendChild(actions);

                    // Click to insert
                    row.onclick = (e) => { e.stopPropagation(); this.insertPrompt(p.content); };

                    container.appendChild(row);
                });
            });
        },

        showPromptEditor(existing) {
            const overlay = document.createElement('div');
            overlay.className = 'settings-overlay';
            const closeModal = () => UIA11y.closeModal(overlay);

            const modal = document.createElement('div');
            modal.className = 'settings-modal';
            Core.applyTheme(modal, currentTheme);

            const header = document.createElement('div');
            header.className = 'settings-header';
            const h3 = document.createElement('h3');
            h3.id = 'pv-editor-title';
            h3.textContent = existing ? 'Edit Prompt' : 'New Prompt';
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'settings-close';
            closeBtn.textContent = '\u2715';
            closeBtn.setAttribute('aria-label', 'Close prompt editor');
            closeBtn.onclick = () => closeModal();
            header.appendChild(h3);
            header.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'settings-body';

            const nameInput = document.createElement('input');
            nameInput.className = 'settings-select';
            nameInput.style.cssText = 'width: 100%; margin-bottom: 8px; padding: 8px; box-sizing: border-box;';
            nameInput.placeholder = 'Prompt name';
            nameInput.value = existing ? existing.name : '';

            const catInput = document.createElement('input');
            catInput.className = 'settings-select';
            catInput.style.cssText = 'width: 100%; margin-bottom: 8px; padding: 8px; box-sizing: border-box;';
            catInput.placeholder = 'Category (e.g. Coding, Writing)';
            catInput.value = existing ? existing.category : 'General';

            const contentArea = document.createElement('textarea');
            contentArea.style.cssText = 'width: 100%; height: 120px; padding: 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--border, rgba(255,255,255,0.1)); background: var(--input-bg, rgba(255,255,255,0.05)); color: var(--text-main, #fff); resize: vertical; box-sizing: border-box; font-family: inherit;';
            contentArea.placeholder = 'Enter your prompt template...';
            contentArea.value = existing ? existing.content : '';

            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'settings-btn';
            saveBtn.style.cssText = 'background: var(--accent, #8ab4f8); color: #000; font-weight: 500; margin-top: 8px;';
            saveBtn.textContent = existing ? 'Save' : 'Create';
            saveBtn.onclick = () => {
                const name = nameInput.value.trim() || 'Untitled';
                const content = contentArea.value.trim();
                const category = catInput.value.trim() || 'General';
                if (!content) return;
                if (existing) {
                    this.updatePrompt(existing.id, { name, content, category });
                } else {
                    this.addPrompt(name, content, category);
                }
                closeModal();
                PanelUI.renderDetailsPane();
            };

            body.appendChild(nameInput);
            body.appendChild(catInput);
            body.appendChild(contentArea);
            body.appendChild(saveBtn);
            modal.appendChild(header);
            modal.appendChild(body);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            UIA11y.setupModal(overlay, modal, {
                close: closeModal,
                labelledBy: h3.id,
                initialFocus: nameInput
            });
            nameInput.focus();
        }
    };

    ModuleRegistry.register(PromptVaultModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                    DEFAULT MODEL MODULE (默认模型模块)                       ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const DefaultModelModule = {
        id: 'default-model',
        name: '默认模型',
        description: '新对话自动选择首选模型',
        icon: '🤖',
        defaultEnabled: false,

        STORAGE_KEY: 'gemini_default_model',
        _preferredModel: 'pro',
        _lastUrl: '',
        _pollTimer: null,
        _switching: false,

        init() {
            this._preferredModel = GM_getValue(this.STORAGE_KEY, 'pro');
            this._lastUrl = location.href;
            this._startUrlWatcher();
            Logger.info('DefaultModelModule initialized', { preferred: this._preferredModel });
        },

        destroy() {
            if (this._pollTimer) {
                clearInterval(this._pollTimer);
                this._pollTimer = null;
            }
            this._switching = false;
            this.removeNativeUI();
        },

        onUserChange() {},

        // --- 原生 UI 注入 ---
        injectNativeUI() {
            const LOCK_ID = 'gc-model-lock';
            if (document.getElementById(LOCK_ID)) return;

            const modelBtn = NativeUI.getModelSwitch();
            if (!modelBtn) return;

            const lock = document.createElement('span');
            lock.id = LOCK_ID;
            lock.textContent = '🔒';
            lock.title = '已锁定: ' + (this._preferredModel === 'flash' ? 'Fast' : this._preferredModel === 'thinking' ? 'Thinking' : 'Pro');
            lock.style.cssText = 'font-size:10px;opacity:0.6;margin-left:4px;cursor:default;user-select:none;';
            modelBtn.parentElement.appendChild(lock);
        },

        removeNativeUI() {
            NativeUI.remove('gc-model-lock');
        },

        setPreferredModel(model) {
            this._preferredModel = model;
            GM_setValue(this.STORAGE_KEY, model);
            // 刷新锁定指示器
            this.removeNativeUI();
            this.injectNativeUI();
            Logger.info('Default model set', { model });
        },

        _isNewChat() {
            const url = location.href;
            return (url.includes('/app') && !url.includes('/app/')) ||
                   url.endsWith('/app') ||
                   (url.match(/\/app\?[^/]*$/) !== null);
        },

        _startUrlWatcher() {
            this._pollTimer = setInterval(() => {
                const currentUrl = location.href;
                if (currentUrl !== this._lastUrl) {
                    const wasChat = this._lastUrl.includes('/app/');
                    this._lastUrl = currentUrl;
                    if (this._isNewChat() || (!wasChat && this._isNewChat())) {
                        this._attemptModelSwitch();
                    }
                }
            }, 800);
        },

        async _attemptModelSwitch() {
            if (this._switching) return;
            this._switching = true;
            try {
                await this._waitForElement('button.input-area-switch, [data-test-id="bard-mode-menu-button"]', 5000);
                const currentModel = this._detectCurrentModel();
                if (currentModel === this._preferredModel) {
                    Logger.info('Already on preferred model', { model: currentModel });
                    return;
                }
                const modeBtn = document.querySelector('button.input-area-switch') ||
                                document.querySelector('[data-test-id="bard-mode-menu-button"]');
                if (!modeBtn) return;
                modeBtn.click();
                await this._waitForElement('[data-test-id^="bard-mode-option-"]', TIMINGS.MODEL_MENU_TIMEOUT);

                const modelMap = { flash: 'fast', thinking: 'thinking', pro: 'pro' };
                const testId = 'bard-mode-option-' + (modelMap[this._preferredModel] || this._preferredModel);
                const option = document.querySelector('[data-test-id="' + testId + '"]');
                if (option) {
                    option.click();
                    Logger.info('Model switched', { from: currentModel, to: this._preferredModel });
                } else {
                    document.body.click();
                    Logger.warn('Model option not found', { testId });
                }
            } catch (e) {
                Logger.warn('Model switch failed', { error: e.message });
            } finally {
                this._switching = false;
            }
        },

        _detectCurrentModel() {
            const map = CounterModule.MODEL_DETECT_MAP;
            const modeBtn = document.querySelector('button.input-area-switch');
            if (modeBtn) {
                const text = modeBtn.textContent.trim();
                if (map[text]) return map[text];
            }
            const pill = document.querySelector('[data-test-id="bard-mode-menu-button"]');
            if (pill) {
                const text = pill.textContent.trim().split(/\s/)[0];
                if (map[text]) return map[text];
            }
            return 'flash';
        },

        _waitForElement(selector, timeout) {
            return new Promise((resolve, reject) => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                const start = Date.now();
                const check = setInterval(() => {
                    const found = document.querySelector(selector);
                    if (found) { clearInterval(check); resolve(found); }
                    else if (Date.now() - start > timeout) { clearInterval(check); reject(new Error('timeout')); }
                }, 200);
            });
        },

        _sleep(ms) {
            return Core.sleep(ms);
        },

        getOnboarding() {
            return {
                zh: {
                    rant: 'Gemini 每次新建对话都默认选 Flash。你明明想用 Pro，但它偏要你每次手动切。这就像一个咖啡店，你天天来点美式，但服务员每次都问"先生，来杯速溶咖啡吧？"。Google，求求你记住用户的选择，这不难对吧？',
                    features: '自动将新对话切换到你的首选模型。模型选择按钮旁显示 🔒 锁定标记。',
                    guide: '1. 在设置中选择首选模型 (Fast/Thinking/Pro)\n2. 新建对话时自动切换\n3. 看到 🔒 表示已锁定'
                },
                en: {
                    rant: "Gemini defaults to Flash for every new chat. You want Pro, but it insists on asking every time. It's like a coffee shop where you come daily for an americano, but the barista says 'instant coffee today, sir?' Google, please just remember the user's choice. It's not hard.",
                    features: 'Automatically switches new conversations to your preferred model. Shows a 🔒 lock indicator next to the model switch button.',
                    guide: '1. Select your preferred model in Settings (Fast/Thinking/Pro)\n2. New chats auto-switch to it\n3. The 🔒 icon confirms the lock is active'
                }
            };
        },

        renderToSettings(container) {
            const row = document.createElement('div');
            row.className = 'settings-row';
            const label = document.createElement('span');
            label.textContent = '🤖 首选模型';
            const select = document.createElement('select');
            select.style.cssText = 'background:var(--input-bg,rgba(255,255,255,0.1));color:var(--text-main);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:13px;';
            const models = [
                { value: 'flash', label: '3 Fast (Flash)' },
                { value: 'thinking', label: '3 Flash Thinking' },
                { value: 'pro', label: '3 Pro' }
            ];
            models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.value;
                opt.textContent = m.label;
                if (m.value === this._preferredModel) opt.selected = true;
                select.appendChild(opt);
            });
            select.addEventListener('change', () => {
                this.setPreferredModel(select.value);
            });
            row.appendChild(label);
            row.appendChild(select);
            container.appendChild(row);
        }
    };

    ModuleRegistry.register(DefaultModelModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                    BATCH DELETE MODULE (批量删除模块)                        ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const BatchDeleteModule = {
        id: 'batch-delete',
        name: '批量删除',
        description: '在面板中批量选择并删除对话',
        icon: '🗑️',
        defaultEnabled: false,

        _selected: new Set(),
        _deleting: false,
        _progress: { current: 0, total: 0 },
        _batchMode: false,

        init() {
            this._selected = new Set();
            this._batchMode = false;
            Logger.info('BatchDeleteModule initialized');
        },

        destroy() {
            this._selected.clear();
            this._deleting = false;
            this._batchMode = false;
            this.removeNativeUI();
        },

        onUserChange() {
            this._selected.clear();
            this._batchMode = false;
        },

        // --- Native UI: Sidebar batch toolbar ---
        injectNativeUI() {
            const TOOLBAR_ID = 'gc-batch-toolbar';
            if (document.getElementById(TOOLBAR_ID)) return;

            const sidebar = NativeUI.getSidebar();
            if (!sidebar) return;

            const toolbar = document.createElement('div');
            toolbar.id = TOOLBAR_ID;
            toolbar.style.cssText = 'padding:4px 12px;border-bottom:1px solid rgba(255,255,255,0.06);height:auto;max-height:40px;align-self:start;';

            if (this._batchMode) {
                this._renderBatchToolbar(toolbar);
            } else {
                const enterBtn = document.createElement('button');
                enterBtn.style.cssText = 'background:transparent;border:1px solid rgba(255,255,255,0.1);color:#9aa0a6;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;width:100%;';
                enterBtn.textContent = NativeUI.t('🗑️ 批量管理', '🗑️ Batch Manage');
                enterBtn.onmouseenter = () => { enterBtn.style.color = '#e8eaed'; };
                enterBtn.onmouseleave = () => { enterBtn.style.color = '#9aa0a6'; };
                enterBtn.onclick = () => {
                    this._batchMode = true;
                    this._refreshNativeUI();
                };
                toolbar.appendChild(enterBtn);
            }

            // Insert into overflow-container (avoid CSS Grid issues on parent)
            const overflowC = sidebar.querySelector('.overflow-container') || sidebar;
            const folderFilter = document.getElementById('gc-folder-filter');
            if (folderFilter && folderFilter.parentElement === overflowC) {
                overflowC.insertBefore(toolbar, folderFilter.nextSibling);
            } else {
                overflowC.prepend(toolbar);
            }
        },

        removeNativeUI() {
            NativeUI.remove('gc-batch-toolbar');
            // Remove all injected checkboxes
            document.querySelectorAll('.gc-batch-check').forEach(el => el.remove());
            this._batchMode = false;
        },

        _refreshNativeUI() {
            NativeUI.remove('gc-batch-toolbar');
            document.querySelectorAll('.gc-batch-check').forEach(el => el.remove());
            this.injectNativeUI();
            if (this._batchMode) this._injectCheckboxes();
        },

        _renderBatchToolbar(toolbar) {
            toolbar.style.cssText = 'padding:4px 12px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:6px;height:auto;max-height:40px;overflow:hidden;';

            const selectAllBtn = document.createElement('button');
            selectAllBtn.style.cssText = 'background:transparent;border:1px solid rgba(255,255,255,0.1);color:#9aa0a6;border-radius:6px;padding:2px 8px;font-size:10px;cursor:pointer;';
            selectAllBtn.textContent = NativeUI.t('全选', 'Select All');
            selectAllBtn.onclick = () => {
                const chats = this._scanChats();
                chats.forEach(c => this._selected.add(c.id));
                this._refreshNativeUI();
            };

            const cancelBtn = document.createElement('button');
            cancelBtn.style.cssText = 'background:transparent;border:1px solid rgba(255,255,255,0.1);color:#9aa0a6;border-radius:6px;padding:2px 8px;font-size:10px;cursor:pointer;';
            cancelBtn.textContent = NativeUI.t('取消', 'Cancel');
            cancelBtn.onclick = () => {
                this._batchMode = false;
                this._selected.clear();
                this._refreshNativeUI();
            };

            const countLabel = document.createElement('span');
            countLabel.style.cssText = 'font-size:10px;color:#8ab4f8;flex:1;text-align:center;';
            countLabel.textContent = NativeUI.t('已选 ' + this._selected.size + ' 个', this._selected.size + ' selected');

            toolbar.appendChild(selectAllBtn);
            toolbar.appendChild(cancelBtn);
            toolbar.appendChild(countLabel);

            if (this._selected.size > 0) {
                const deleteBtn = document.createElement('button');
                deleteBtn.style.cssText = 'background:#ea4335;color:#fff;border:none;border-radius:6px;padding:2px 10px;font-size:10px;cursor:pointer;';
                deleteBtn.textContent = NativeUI.t('🗑️ 删除', '🗑️ Delete');
                deleteBtn.onclick = () => {
                    if (confirm(NativeUI.t('确认删除选中的 ' + this._selected.size + ' 个对话？', 'Delete ' + this._selected.size + ' selected conversation(s)?'))) {
                        this._batchDelete();
                    }
                };
                toolbar.appendChild(deleteBtn);
            }
        },

        _injectCheckboxes() {
            const chats = Core.scanSidebarChats();
            chats.forEach(chat => {
                if (chat.element.querySelector('.gc-batch-check')) return;
                const check = document.createElement('button');
                check.type = 'button';
                check.className = 'gc-batch-check';
                const isChecked = this._selected.has(chat.id);
                check.style.cssText = 'width:16px;height:16px;border-radius:3px;border:2px solid ' + (isChecked ? '#8ab4f8' : '#5f6368') + ';background:' + (isChecked ? '#8ab4f8' : 'transparent') + ';flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:10px;color:#fff;cursor:pointer;margin-right:6px;vertical-align:middle;padding:0;appearance:none;';
                check.textContent = isChecked ? '\u2713' : '';
                check.setAttribute('aria-label', `Select conversation ${chat.title}`);
                check.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
                check.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this._selected.has(chat.id)) {
                        this._selected.delete(chat.id);
                    } else {
                        this._selected.add(chat.id);
                    }
                    check.setAttribute('aria-pressed', this._selected.has(chat.id) ? 'true' : 'false');
                    this._refreshNativeUI();
                };
                chat.element.insertBefore(check, chat.element.firstChild);
            });
        },

        _scanChats() {
            return Core.scanSidebarChats();
        },

        async _deleteChat(chatElement) {
            try {
                // Step 1: Hover to reveal three-dot menu
                chatElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                await this._sleep(300);

                // Step 2: Find the three-dot/more button (appears on hover)
                const menuBtn = chatElement.querySelector('button[aria-label*="more" i], button[aria-label*="More" i], button[aria-label*="options" i], button[aria-label*="Options" i], button[data-test-id*="menu"], mat-icon[data-mat-icon-name="more_vert"]');
                if (!menuBtn) {
                    // Try parent-level search
                    const parent = chatElement.closest('mat-list-item, [role="listitem"]') || chatElement.parentElement;
                    const altBtn = parent?.querySelector('button[aria-label*="more" i], button[aria-label*="More" i]');
                    if (altBtn) {
                        altBtn.click();
                    } else {
                        throw new Error('Menu button not found');
                    }
                } else {
                    const clickTarget = menuBtn.closest('button') || menuBtn;
                    clickTarget.click();
                }
                await this._sleep(400);

                // Step 3: Find "Delete" option in the opened menu
                const menuItems = document.querySelectorAll('[role="menuitem"], mat-menu-item, button.mat-mdc-menu-item');
                let deleteBtn = null;
                menuItems.forEach(item => {
                    const text = item.textContent.trim().toLowerCase();
                    if (text.includes('delete') || text.includes('删除')) {
                        deleteBtn = item;
                    }
                });

                if (!deleteBtn) throw new Error('Delete option not found');
                deleteBtn.click();
                await this._sleep(400);

                // Step 4: Confirm in dialog
                const confirmBtns = document.querySelectorAll('button.confirm-button, button[data-test-id*="confirm"], mat-dialog-actions button, .mdc-dialog__actions button');
                let confirmed = false;
                confirmBtns.forEach(btn => {
                    const text = btn.textContent.trim().toLowerCase();
                    if (text.includes('delete') || text.includes('删除') || text.includes('confirm') || text.includes('确认')) {
                        btn.click();
                        confirmed = true;
                    }
                });
                if (!confirmed) {
                    throw new Error('Confirm button not found');
                }
                await this._sleep(300);
                return true;
            } catch (e) {
                Logger.warn('Delete failed', { error: e.message });
                // Close any open menu
                document.body.click();
                await this._sleep(200);
                return false;
            }
        },

        async _batchDelete() {
            if (this._deleting || this._selected.size === 0) return;
            this._deleting = true;
            this._progress = { current: 0, total: this._selected.size };

            const chats = this._scanChats();
            const toDelete = chats.filter(c => this._selected.has(c.id));
            let deleted = 0;
            let failed = 0;

            for (const chat of toDelete) {
                this._progress.current++;
                PanelUI.renderDetailsPane();
                const ok = await this._deleteChat(chat.element);
                if (ok) {
                    deleted++;
                    this._selected.delete(chat.id);
                } else {
                    failed++;
                }
                await this._sleep(500);
            }

            this._deleting = false;
            this._selected.clear();
            Logger.info('Batch delete complete', { deleted, failed });
            PanelUI.renderDetailsPane();
        },

        _sleep(ms) {
            return Core.sleep(ms);
        },

        renderToDetailsPane(container) {
            const section = document.createElement('div');
            section.className = 'gf-section';

            // Header
            const header = document.createElement('div');
            header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
            const title = document.createElement('div');
            title.style.cssText = 'font-weight:600;font-size:13px;color:var(--text-main);';
            title.textContent = '🗑️ Batch Delete';
            header.appendChild(title);

            if (this._deleting) {
                const progress = document.createElement('span');
                progress.style.cssText = 'font-size:11px;color:var(--accent);';
                progress.textContent = 'Deleting ' + this._progress.current + '/' + this._progress.total + '...';
                header.appendChild(progress);
            } else if (this._selected.size > 0) {
                const deleteBtn = document.createElement('button');
                deleteBtn.style.cssText = 'background:#ea4335;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;';
                deleteBtn.textContent = 'Delete ' + this._selected.size + ' chats';
                deleteBtn.onclick = () => {
                    if (confirm('确认删除选中的 ' + this._selected.size + ' 个对话？此操作不可撤销。')) {
                        this._batchDelete();
                    }
                };
                header.appendChild(deleteBtn);
            }
            section.appendChild(header);

            // Chat list with checkboxes
            const chats = this._scanChats();
            if (chats.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'font-size:12px;color:var(--text-sub);text-align:center;padding:12px;';
                empty.textContent = '侧栏中未发现对话项';
                section.appendChild(empty);
            } else {
                const list = document.createElement('div');
                list.style.cssText = 'max-height:200px;overflow-y:auto;';
                chats.forEach(chat => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:12px;color:var(--text-main);';
                    row.onmouseenter = () => { row.style.background = 'var(--row-hover)'; };
                    row.onmouseleave = () => { row.style.background = ''; };

                    const check = document.createElement('div');
                    const isChecked = this._selected.has(chat.id);
                    check.style.cssText = 'width:16px;height:16px;border-radius:3px;border:2px solid ' + (isChecked ? 'var(--accent)' : 'var(--text-sub)') + ';background:' + (isChecked ? 'var(--accent)' : 'transparent') + ';flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;';
                    check.textContent = isChecked ? '✓' : '';

                    const label = document.createElement('span');
                    label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;';
                    label.textContent = chat.title;

                    row.onclick = () => {
                        if (this._selected.has(chat.id)) {
                            this._selected.delete(chat.id);
                        } else {
                            this._selected.add(chat.id);
                        }
                        PanelUI.renderDetailsPane();
                    };

                    row.appendChild(check);
                    row.appendChild(label);
                    list.appendChild(row);
                });
                section.appendChild(list);
            }

            // Select all / Deselect all buttons
            if (chats.length > 0 && !this._deleting) {
                const actions = document.createElement('div');
                actions.style.cssText = 'display:flex;gap:8px;margin-top:6px;';
                const selectAll = document.createElement('button');
                selectAll.style.cssText = 'background:var(--btn-bg);color:var(--text-main);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer;';
                selectAll.textContent = 'Select All';
                selectAll.onclick = () => {
                    chats.forEach(c => this._selected.add(c.id));
                    PanelUI.renderDetailsPane();
                };
                const deselectAll = document.createElement('button');
                deselectAll.style.cssText = 'background:var(--btn-bg);color:var(--text-main);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer;';
                deselectAll.textContent = 'Deselect All';
                deselectAll.onclick = () => {
                    this._selected.clear();
                    PanelUI.renderDetailsPane();
                };
                actions.appendChild(selectAll);
                actions.appendChild(deselectAll);
                section.appendChild(actions);
            }

            container.appendChild(section);
        },

        getOnboarding() {
            return {
                zh: {
                    rant: 'Gemini 的删除对话功能：打开菜单 → 点删除 → 确认 → 等待。一个对话要 4 次点击。你有 50 个测试对话要清理？那就点 200 次吧，Google 工程师显然没有清理过自己的对话列表。也可能他们写了个内部工具，只是懒得给你用。',
                    features: '在侧边栏添加批量管理工具栏。激活后每个对话出现复选框，勾选后一键批量删除。支持全选/反选。',
                    guide: '1. 点击侧边栏的"🗑️ 批量管理" → 2. 勾选要删除的对话 → 3. 点击"删除" → 4. 确认'
                },
                en: {
                    rant: "Deleting a Gemini conversation: open menu → click delete → confirm → wait. 4 clicks per conversation. Have 50 test chats to clean up? That's 200 clicks. Google engineers clearly never clean up their own conversation lists. Or maybe they have an internal tool, they just can't be bothered to give it to you.",
                    features: 'Adds a batch management toolbar to the sidebar. When activated, checkboxes appear on each conversation for one-click batch deletion. Supports select all/deselect.',
                    guide: '1. Click "🗑️ Batch Manage" in the sidebar → 2. Check conversations to delete → 3. Click "Delete" → 4. Confirm'
                }
            };
        }
    };

    ModuleRegistry.register(BatchDeleteModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                    QUOTE REPLY MODULE (引用回复模块)                        ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const QuoteReplyModule = {
        id: 'quote-reply',
        name: '引用回复',
        description: '选中文本后快速插入引用到输入框',
        icon: '💬',
        defaultEnabled: false,

        _fab: null,
        _boundMouseUp: null,
        _boundMouseDown: null,

        init() {
            this._boundMouseUp = this._onMouseUp.bind(this);
            this._boundMouseDown = this._onMouseDown.bind(this);
            document.addEventListener('mouseup', this._boundMouseUp, true);
            document.addEventListener('mousedown', this._boundMouseDown, true);
            Logger.info('QuoteReplyModule initialized');
        },

        destroy() {
            if (this._boundMouseUp) {
                document.removeEventListener('mouseup', this._boundMouseUp, true);
                this._boundMouseUp = null;
            }
            if (this._boundMouseDown) {
                document.removeEventListener('mousedown', this._boundMouseDown, true);
                this._boundMouseDown = null;
            }
            this._removeFab();
        },

        onUserChange() {},

        _onMouseDown(e) {
            // If clicking the FAB itself, don't remove it
            if (this._fab && this._fab.contains(e.target)) return;
            this._removeFab();
        },

        _onMouseUp(e) {
            // Delay slightly to let browser finalize selection
            setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                    return;
                }

                // Only show for text within the main chat area (not our panel)
                const range = sel.getRangeAt(0);
                const container = range.commonAncestorContainer;
                const el = container.nodeType === 3 ? container.parentElement : container;
                if (!el) return;

                // Skip if selection is in our panel or in the editor
                if (el.closest('#' + PANEL_ID)) return;
                if (el.closest('.ql-editor')) return;

                const text = sel.toString().trim();
                if (!text || text.length < 2) return;

                this._showFab(e.clientX, e.clientY, text);
            }, 50);
        },

        _showFab(x, y, text) {
            this._removeFab();

            const fab = document.createElement('button');
            fab.type = 'button';
            fab.setAttribute('aria-label', 'Quote selected text');
            fab.style.cssText = [
                'position:fixed',
                `z-index:${LAYERS.FLOATING}`,
                'background:var(--accent, #8ab4f8)',
                'color:#fff',
                'padding:4px 10px',
                'border-radius:14px',
                'font-size:12px',
                'font-weight:600',
                'cursor:pointer',
                'box-shadow:0 2px 8px rgba(0,0,0,0.3)',
                'user-select:none',
                'transition:opacity 0.15s, transform 0.15s',
                'opacity:0',
                'transform:scale(0.9)',
                'border:none'
            ].join(';');
            fab.textContent = '💬 Quote';

            // Position near cursor, clamped to viewport
            const fabW = 80;
            const fabH = 28;
            let left = Math.min(x + 8, window.innerWidth - fabW - 10);
            let top = Math.max(y - fabH - 8, 10);
            fab.style.left = left + 'px';
            fab.style.top = top + 'px';

            fab.onclick = (e) => {
                e.stopPropagation();
                this._insertQuote(text);
                this._removeFab();
            };

            document.body.appendChild(fab);
            this._fab = fab;

            // Animate in
            requestAnimationFrame(() => {
                fab.style.opacity = '1';
                fab.style.transform = 'scale(1)';
            });

            // Auto-dismiss after timeout
            setTimeout(() => {
                if (this._fab === fab) this._removeFab();
            }, TIMINGS.FAB_AUTO_DISMISS);
        },

        _removeFab() {
            if (this._fab) {
                this._fab.remove();
                this._fab = null;
            }
        },

        _insertQuote(text) {
            const editor = document.querySelector('div.ql-editor[contenteditable="true"]');
            if (!editor) {
                Logger.warn('QuoteReply: editor not found');
                return;
            }

            // Format as blockquote: each line prefixed with >
            const quoted = text.split('\n').map(line => '> ' + line).join('\n');
            const fullText = quoted + '\n\n';

            // Check if editor is empty (has only placeholder)
            const isBlank = editor.classList.contains('ql-blank') ||
                            (editor.textContent.trim() === '' && editor.children.length <= 1);

            if (isBlank) {
                editor.replaceChildren();
                editor.classList.remove('ql-blank');
            }

            // Insert quoted text as paragraphs
            const lines = fullText.split('\n');
            lines.forEach(line => {
                const p = document.createElement('p');
                if (line === '') {
                    p.appendChild(document.createElement('br'));
                } else {
                    p.textContent = line;
                }
                editor.appendChild(p);
            });

            // Dispatch input event to notify Gemini's framework
            editor.dispatchEvent(new Event('input', { bubbles: true }));
            editor.focus();

            // Place cursor at end
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);

            Logger.info('Quote inserted', { length: text.length });
        }
    };

    ModuleRegistry.register(QuoteReplyModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                    UI TWEAKS MODULE (UI 自定义模块)                         ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const UITweaksModule = {
        id: 'ui-tweaks',
        name: 'UI 自定义',
        description: 'Tab 标题 / 快捷键 / 布局调整',
        icon: '🎨',
        defaultEnabled: false,

        STORAGE_KEY: 'gemini_ui_tweaks',
        _styleEl: null,
        _titleObserver: null,
        _keyHandler: null,

        features: {
            tabTitle: { enabled: false, label: 'Tab 标题同步对话名' },
            ctrlEnter: { enabled: false, label: 'Ctrl+Enter 才发送' },
            chatWidth: { enabled: false, label: '聊天区宽度', value: 900 },
            sidebarWidth: { enabled: false, label: '侧栏宽度', value: 280 },
            hideGems: { enabled: false, label: '隐藏 Gems 入口' }
        },

        init() {
            const saved = GM_getValue(this.STORAGE_KEY, null);
            if (saved) {
                Object.keys(saved).forEach(k => {
                    if (this.features[k]) {
                        this.features[k].enabled = saved[k].enabled;
                        if (saved[k].value !== undefined) this.features[k].value = saved[k].value;
                    }
                });
            }
            this._applyAll();
            Logger.info('UITweaksModule initialized', { features: Object.keys(this.features).filter(k => this.features[k].enabled) });
        },

        destroy() {
            if (this._styleEl) { this._styleEl.remove(); this._styleEl = null; }
            if (this._titleObserver) { this._titleObserver.disconnect(); this._titleObserver = null; }
            if (this._titleDebounce) { clearTimeout(this._titleDebounce); this._titleDebounce = null; }
            if (this._keyHandler) {
                document.removeEventListener('keydown', this._keyHandler, true);
                this._keyHandler = null;
            }
            // Restore title
            document.title = 'Google Gemini';
            this.removeNativeUI();
        },

        onUserChange() {},

        // --- 原生 UI 注入 ---
        injectNativeUI() {
            const IND_ID = 'gc-tweaks-indicator';
            if (document.getElementById(IND_ID)) return;

            const inputArea = NativeUI.getInputArea();
            if (!inputArea) return;

            const dots = document.createElement('div');
            dots.id = IND_ID;
            dots.style.cssText = 'display:flex;gap:3px;position:absolute;bottom:4px;right:4px;pointer-events:none;z-index:1;';
            dots.title = this._getStatusText();

            const keys = ['ctrlEnter', 'tabTitle', 'chatWidth'];
            keys.forEach(key => {
                const dot = document.createElement('div');
                const on = this.features[key]?.enabled;
                dot.style.cssText = 'width:4px;height:4px;border-radius:50%;background:' + (on ? '#8ab4f8' : '#555') + ';transition:background 0.2s;';
                dots.appendChild(dot);
            });

            const pos = getComputedStyle(inputArea).position;
            if (pos === 'static' || pos === '') inputArea.style.position = 'relative';
            inputArea.appendChild(dots);
        },

        removeNativeUI() {
            NativeUI.remove('gc-tweaks-indicator');
        },

        _getStatusText() {
            const items = [];
            if (this.features.ctrlEnter.enabled) items.push('Ctrl+Enter: ON');
            if (this.features.tabTitle.enabled) items.push('Tab Title: ON');
            if (this.features.chatWidth.enabled) items.push('Chat Width: ' + this.features.chatWidth.value + 'px');
            if (this.features.sidebarWidth.enabled) items.push('Sidebar: ' + this.features.sidebarWidth.value + 'px');
            if (this.features.hideGems.enabled) items.push('Hide Gems: ON');
            return items.length > 0 ? items.join(' | ') : 'All tweaks off';
        },

        _save() {
            GM_setValue(this.STORAGE_KEY, this.features);
        },

        _applyAll() {
            this._applyCSS();
            this._applyTabTitle();
            this._applyCtrlEnter();
        },

        _applyCSS() {
            if (this._styleEl) this._styleEl.remove();
            const rules = [];

            if (this.features.chatWidth.enabled) {
                const w = this.features.chatWidth.value || 900;
                rules.push('main .conversation-container, main .chat-window { max-width: ' + w + 'px !important; }');
            }
            if (this.features.sidebarWidth.enabled) {
                const w = this.features.sidebarWidth.value || 280;
                rules.push('bard-sidenav { width: ' + w + 'px !important; min-width: ' + w + 'px !important; }');
            }
            if (this.features.hideGems.enabled) {
                rules.push('a[href*="/gems/"] { display: none !important; }');
            }

            if (rules.length > 0) {
                const style = document.createElement('style');
                style.textContent = rules.join('\n');
                document.head.appendChild(style);
                this._styleEl = style;
            }
        },

        _applyTabTitle() {
            if (this._titleObserver) { this._titleObserver.disconnect(); this._titleObserver = null; }
            if (this._titleDebounce) { clearTimeout(this._titleDebounce); this._titleDebounce = null; }
            if (!this.features.tabTitle.enabled) return;

            const updateTitle = () => {
                const heading = document.querySelector('h1.conversation-title, [data-test-id="conversation-title"]');
                if (heading && heading.textContent.trim()) {
                    const text = heading.textContent.trim();
                    if (text !== 'Conversation with Gemini' && text !== document.title) {
                        document.title = text + ' - Gemini';
                    }
                } else {
                    // Try extracting from first user message
                    const firstMsg = document.querySelector('.user-query-text, .query-text');
                    if (firstMsg && firstMsg.textContent.trim()) {
                        const t = firstMsg.textContent.trim().substring(0, 50);
                        if (document.title === 'Google Gemini') {
                            document.title = t + '... - Gemini';
                        }
                    }
                }
            };

            const debouncedUpdate = () => {
                if (this._titleDebounce) clearTimeout(this._titleDebounce);
                this._titleDebounce = setTimeout(updateTitle, TIMINGS.TITLE_DEBOUNCE);
            };

            // Initial update
            updateTitle();

            // Watch for DOM changes — use debounced callback to avoid performance issues
            this._titleObserver = new MutationObserver(debouncedUpdate);
            // Try to observe a narrower container first
            const chatContainer = document.querySelector('main, .chat-container, [role="main"]');
            const target = chatContainer || document.body;
            this._titleObserver.observe(target, { childList: true, subtree: true, characterData: true });
        },

        _applyCtrlEnter() {
            if (this._keyHandler) {
                document.removeEventListener('keydown', this._keyHandler, true);
                this._keyHandler = null;
            }
            if (!this.features.ctrlEnter.enabled) return;

            this._keyHandler = (e) => {
                if (e.key !== 'Enter') return;
                const target = e.target;
                // Only intercept in the editor
                if (!target.closest('.ql-editor, [contenteditable="true"]')) return;
                if (e.isComposing) return; // IME

                if (!e.ctrlKey && !e.metaKey) {
                    // Plain Enter - block send, allow browser default (newline in contenteditable)
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                } else {
                    // Ctrl+Enter or Meta+Enter - trigger send
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    const sendBtn = document.querySelector('button.send-button, button[aria-label*="Send"]');
                    if (sendBtn && !sendBtn.disabled) {
                        sendBtn.click();
                    }
                }
            };
            document.addEventListener('keydown', this._keyHandler, true);
        },

        toggleFeature(key) {
            if (!this.features[key]) return;
            this.features[key].enabled = !this.features[key].enabled;
            this._save();
            this._applyAll();
            this.removeNativeUI();
            this.injectNativeUI();
        },

        setFeatureValue(key, value) {
            if (!this.features[key]) return;
            this.features[key].value = value;
            this._save();
            this._applyAll();
        },

        getOnboarding() {
            return {
                zh: {
                    rant: 'Gemini 不支持 Ctrl+Enter 发送，Enter 直接发送意味着你永远不能在消息里换行——除非你知道 Shift+Enter 这个隐藏快捷键。浏览器标签页标题永远显示"Gemini"，开了 10 个对话标签？全是 Gemini - Gemini - Gemini。Google 的 UX 团队是不是觉得用户只用一个标签页？',
                    features: '三个微调开关：Ctrl+Enter 发送、标签页显示对话标题、布局优化。输入框旁 3 个小圆点显示当前状态。',
                    guide: '1. 在设置中开启需要的调整项\n2. 输入框右下角的小圆点指示哪些调整已生效\n3. 亮蓝色=已启用'
                },
                en: {
                    rant: "Gemini doesn't support Ctrl+Enter to send. Enter sends immediately, meaning you can never add newlines — unless you know the secret Shift+Enter shortcut. Browser tab title always shows 'Gemini' — open 10 chat tabs? All 'Gemini - Gemini - Gemini'. Does the UX team think users only use one tab?",
                    features: 'Three micro-tweaks: Ctrl+Enter to send, tab title shows conversation name, layout adjustments. Three tiny dots near the input area show current status.',
                    guide: '1. Enable desired tweaks in Settings\n2. Dots at the bottom-right of the input area indicate active tweaks\n3. Blue = enabled'
                }
            };
        },

        renderToSettings(container) {
            Object.keys(this.features).forEach(key => {
                const feat = this.features[key];
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 0;';

                const labelEl = document.createElement('span');
                labelEl.style.cssText = 'font-size:13px;color:var(--text-main);';
                labelEl.textContent = feat.label;
                row.appendChild(labelEl);

                const rightSide = document.createElement('div');
                rightSide.style.cssText = 'display:flex;align-items:center;gap:8px;';

                // Value input for features that have values
                if (feat.value !== undefined) {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.value = feat.value;
                    input.style.cssText = 'width:60px;background:var(--input-bg,rgba(255,255,255,0.1));color:var(--text-main);border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:12px;text-align:center;';
                    input.onchange = () => {
                        const v = parseInt(input.value, 10);
                        if (v > 0) this.setFeatureValue(key, v);
                    };
                    const unit = document.createElement('span');
                    unit.style.cssText = 'font-size:11px;color:var(--text-sub);';
                    unit.textContent = 'px';
                    rightSide.appendChild(input);
                    rightSide.appendChild(unit);
                }

                // Toggle switch
                const toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'toggle-switch ' + (feat.enabled ? 'on' : '');
                toggle.setAttribute('aria-label', feat.label);
                toggle.setAttribute('aria-pressed', feat.enabled ? 'true' : 'false');
                toggle.onclick = () => {
                    this.toggleFeature(key);
                    toggle.classList.toggle('on');
                    const on = toggle.classList.contains('on');
                    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
                };
                rightSide.appendChild(toggle);

                row.appendChild(rightSide);
                container.appendChild(row);
            });
        }
    };

    ModuleRegistry.register(UITweaksModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                    NATIVE UI INJECTION (原生 UI 注入框架)                    ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const NativeUI = {
        isZH: navigator.language.startsWith('zh'),
        t(zh, en) { return this.isZH ? zh : en; },

        _findFirst(selectors) {
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) return el;
            }
            return null;
        },

        remove(id) {
            const el = document.getElementById(id);
            if (el) el.remove();
        },

        getSidebar() {
            return this._findFirst([
                '.sidenav-with-history-container',
                'bard-sidenav',
                'nav[role="navigation"]'
            ]);
        },

        getInputArea() {
            return this._findFirst([
                'input-area-v2',
                '.input-area-container',
                '.bottom-container'
            ]);
        },

        getChatHeader() {
            return this._findFirst([
                '.conversation-title-container',
                'span.conversation-title',
                'h1.conversation-title',
                '[data-test-id="conversation-title"]'
            ]);
        },

        getModelSwitch() {
            return this._findFirst([
                'button.input-area-switch',
                '[data-test-id="bard-mode-menu-button"]'
            ]);
        },

        // Called every tick from main loop
        tick() {
            ModuleRegistry.enabledModules.forEach(id => {
                const mod = ModuleRegistry.modules[id];
                if (typeof mod?.injectNativeUI === 'function') {
                    try { mod.injectNativeUI(); } catch (e) { /* silent */ }
                }
            });
        }
    };

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                          PANEL UI (面板界面)                               ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const PanelUI = {
        _activeTab: 'stats',
        // --- 样式注入 ---
        injectStyles() {
            GM_addStyle(`
                #${PANEL_ID} {
                    --bg: #202124; --text-main: #fff; --text-sub: #ccc; --accent: #8ab4f8;
                    --blur: 18px; --saturate: 180%;
                    position: fixed; z-index: ${LAYERS.PANEL};
                    width: clamp(170px, 22vw, 240px);
                    min-width: 170px;
                    background: var(--bg);
                    backdrop-filter: blur(var(--blur)) saturate(var(--saturate));
                    -webkit-backdrop-filter: blur(var(--blur)) saturate(var(--saturate));
                    border: 1px solid var(--border); border-radius: 16px;
                    box-shadow: var(--shadow);
                    font-family: 'Google Sans', Roboto, sans-serif;
                    overflow: hidden; user-select: none;
                    display: flex; flex-direction: column;
                    transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .gemini-header {
                    padding: 8px 14px; cursor: grab;
                    background: var(--header-bg, rgba(255, 255, 255, 0.03));
                    border-bottom: 1px solid var(--header-border, rgba(255, 255, 255, 0.05));
                    display: flex; align-items: center; justify-content: space-between; height: 32px;
                }
                .user-capsule {
                    display: flex; align-items: center; gap: 4px;
                    font-size: 11px; color: var(--text-sub);
                    background: var(--badge-bg, rgba(255,255,255,0.05));
                    padding: 2px 8px; border-radius: 12px; border: 1px solid transparent;
                    max-width: 120px; overflow: hidden;
                }
                .acct-badge-inline {
                    font-size: 8px; font-weight: 600; letter-spacing: 0.4px;
                    padding: 1px 5px; border-radius: 10px;
                    background: var(--badge-bg, rgba(255,255,255,0.06));
                    color: var(--text-sub);
                    text-transform: uppercase;
                    flex-shrink: 0;
                }
                .acct-badge-inline[data-tier="pro"] {
                    background: rgba(138,180,248,0.2);
                    color: #8ab4f8;
                }
                .acct-badge-inline[data-tier="ultra"] {
                    background: rgba(251,188,4,0.2);
                    color: #fbbc04;
                }
                .user-capsule.viewing-other { border-color: #fdbd00; color: #fdbd00; }
                .user-avatar-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
                .gemini-toggle-btn { cursor: pointer; font-size: 14px; opacity: 0.6; color: var(--text-sub);
                    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    background: transparent; border: none; padding: 0; }
                .gemini-toggle-btn:hover { opacity: 1; color: var(--accent); }
                .gemini-main-view { padding: 12px 14px 14px; text-align: center; }
                .gemini-big-num {
                    font-size: 40px; font-weight: 400; color: var(--text-main); line-height: 1;
                    margin-bottom: 4px; text-shadow: 0 0 20px rgba(128, 128, 128, 0.1);
                    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .gemini-big-num.bump {
                    animation: numBump 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes numBump {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.15); }
                    100% { transform: scale(1); }
                }

                /* --- 模型 & 配额 --- */
                .gemini-model-row {
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                    margin-bottom: 6px;
                }
                .model-badge {
                    font-size: 9px; font-weight: 700; letter-spacing: 0.6px;
                    padding: 2px 7px; border-radius: 6px;
                    line-height: 1.4;
                    border: 1px solid var(--divider, rgba(255,255,255,0.15));
                }
                .quota-bar-wrap {
                    margin: 6px 0 8px; height: 4px; border-radius: 2px;
                    background: var(--btn-bg); overflow: hidden;
                    position: relative;
                }
                .quota-bar-fill {
                    height: 100%; border-radius: 2px;
                    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .quota-label {
                    font-size: 10px; color: var(--text-sub); opacity: 0.8;
                    margin-bottom: 8px; font-family: monospace;
                }

                .gemini-sub-info {
                    font-size: 11px; color: var(--text-sub); margin-bottom: 8px;
                    font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .gemini-details-view {
                    height: 0; opacity: 0; overflow: hidden; background: var(--detail-bg, rgba(0,0,0,0.1));
                    padding: 0 12px;
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .gemini-details-view.expanded { height: auto; opacity: 1; padding: 10px 12px 14px 12px; border-top: 1px solid var(--border); max-height: 420px; overflow-y: auto; }
                .section-title {
                    font-size: 10px; color: var(--text-sub); opacity: 0.72;
                    margin: 10px 0 6px 0; text-transform: uppercase; letter-spacing: 0.8px;
                }
                .detail-row {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 4px; font-size: 12px; color: var(--text-sub); cursor: pointer;
                    padding: 5px 8px; border-radius: 6px;
                    transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .detail-row:hover { background: var(--row-hover); color: var(--text-main); }
                .detail-row.active-mode { background: rgba(138, 180, 248, 0.15); color: var(--accent); font-weight: 500; }
                .detail-row:focus-visible { outline: 2px solid var(--accent, #8ab4f8); outline-offset: 1px; }
                .user-row { justify-content: flex-start; gap: 6px; }
                .user-row.is-me { border-left: 2px solid var(--accent); }
                .user-indicator { font-size: 8px; padding: 1px 4px; border-radius: 4px; background: var(--accent); color: #000; }
                .g-btn {
                    background: var(--btn-bg); border: 1px solid transparent;
                    color: var(--text-sub); border-radius: 6px; padding: 6px 0; font-size: 11px;
                    cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); width: 100%;
                }
                .g-btn:hover { background: var(--row-hover); color: var(--text-main); }
                .g-btn.danger-1 { color: #f28b82; border-color: #f28b82; }
                .g-btn.danger-2 { background: #f28b82; color: #202124; font-weight: bold; }
                .g-btn.disabled { opacity: 0.5; cursor: not-allowed; }

                /* Settings Modal */
                .settings-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: var(--overlay-tint, rgba(0,0,0,0.6)); z-index: ${LAYERS.OVERLAY};
                    display: flex; align-items: center; justify-content: center;
                    padding: 12px;
                }
                .settings-modal {
                    width: min(94vw, 460px); max-height: 85vh; overflow-y: auto;
                    background: var(--bg, #202124); border: 1px solid var(--border, rgba(255,255,255,0.1));
                    border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    font-family: 'Google Sans', Roboto, sans-serif;
                }
                .settings-header {
                    padding: 12px 16px; border-bottom: 1px solid var(--divider, rgba(255,255,255,0.1));
                    display: flex; justify-content: space-between; align-items: center;
                }
                .settings-header h3 { margin: 0; font-size: 14px; color: var(--text-main, #fff); font-weight: 500; }
                .settings-close { cursor: pointer; font-size: 18px; color: var(--text-sub, #9aa0a6); }
                .settings-close:hover { color: var(--accent, #8ab4f8); }
                .settings-body { padding: 12px 16px; }
                .settings-section { margin-bottom: 16px; }
                .settings-section-title { font-size: 10px; color: var(--text-sub, #9aa0a6); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .settings-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 8px 0; border-bottom: 1px solid var(--divider, rgba(255,255,255,0.05));
                }
                .settings-row:last-child { border-bottom: none; }
                .settings-label { font-size: 12px; color: var(--text-main, #fff); }
                .settings-select {
                    background: var(--btn-bg, rgba(255,255,255,0.05)); border: 1px solid var(--border, rgba(255,255,255,0.1));
                    color: var(--text-main, #fff); border-radius: 6px; padding: 4px 8px; font-size: 11px;
                }
                .settings-btn {
                    background: var(--btn-bg, rgba(255,255,255,0.05)); border: 1px solid transparent;
                    color: var(--text-sub, #9aa0a6); border-radius: 6px; padding: 8px 12px; font-size: 11px;
                    cursor: pointer; transition: all 0.2s; width: 100%; margin-top: 4px;
                }
                .settings-btn:hover { background: var(--row-hover, rgba(255,255,255,0.05)); color: var(--text-main, #fff); }
                .settings-btn.danger { color: #f28b82; border-color: #f28b82; }
                .settings-version { font-size: 10px; color: var(--text-sub, #9aa0a6); text-align: center; padding: 8px; opacity: 0.6; }

                /* Debug Modal */
                .debug-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: var(--overlay-tint, rgba(0,0,0,0.6)); z-index: ${LAYERS.OVERLAY};
                    display: flex; align-items: center; justify-content: center;
                    padding: 12px;
                }
                .debug-modal {
                    width: min(96vw, 720px); max-height: 85vh; overflow-y: auto;
                    background: var(--bg, #202124); border: 1px solid var(--border, rgba(255,255,255,0.1));
                    border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    font-family: 'Google Sans', Roboto, sans-serif;
                }
                .debug-header {
                    padding: 12px 16px; border-bottom: 1px solid var(--divider, rgba(255,255,255,0.1));
                    display: flex; justify-content: space-between; align-items: center;
                }
                .debug-header h3 { margin: 0; font-size: 14px; color: var(--text-main, #fff); font-weight: 500; }
                .debug-close { cursor: pointer; font-size: 18px; color: var(--text-sub, #9aa0a6); }
                .debug-close:hover { color: var(--accent, #8ab4f8); }
                .debug-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
                .debug-kv { font-size: 11px; color: var(--text-sub); line-height: 1.6; }
                .debug-kv strong { color: var(--text-main); font-weight: 500; }
                .debug-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                .debug-log-list {
                    background: var(--code-bg, rgba(0,0,0,0.3)); border: 1px solid var(--divider, rgba(255,255,255,0.08));
                    border-radius: 8px; padding: 8px; max-height: 240px; overflow: auto;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    font-size: 10px; color: var(--text-sub);
                }
                .debug-log-item { padding: 2px 0; border-bottom: 1px dashed var(--divider, rgba(255,255,255,0.05)); }
                .debug-log-item:last-child { border-bottom: none; }
                .debug-filter-row { display: flex; gap: 6px; flex-wrap: wrap; }
                .debug-filter-btn {
                    font-size: 10px; padding: 4px 8px; border-radius: 6px;
                    border: 1px solid var(--divider, rgba(255,255,255,0.1));
                    background: var(--input-bg, rgba(255,255,255,0.05));
                    color: var(--text-sub); cursor: pointer;
                }
                .debug-filter-btn.active { color: var(--text-main); border-color: var(--accent); }
                .debug-search {
                    background: var(--code-bg, rgba(0,0,0,0.3));
                    border: 1px solid var(--divider, rgba(255,255,255,0.1));
                    color: var(--text-main); border-radius: 6px; padding: 4px 8px;
                    font-size: 10px; width: 100%;
                }
                .debug-level { font-weight: 700; letter-spacing: 0.3px; }
                .debug-level.error { color: #f28b82; }
                .debug-level.warn { color: #fbbc04; }
                .debug-level.info { color: #8ab4f8; }
                .debug-level.debug { color: #81c995; }

                /* Module Toggle */
                .module-toggle-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 10px 0; border-bottom: 1px solid var(--divider, rgba(255,255,255,0.05));
                }
                .module-info { display: flex; align-items: center; gap: 8px; }
                .module-icon { font-size: 16px; }
                .module-text { display: flex; flex-direction: column; }
                .module-name { font-size: 12px; color: var(--text-main, #fff); }
                .module-desc { font-size: 10px; color: var(--text-sub, #9aa0a6); opacity: 0.85; }
                .toggle-switch {
                    position: relative; width: 36px; height: 20px;
                    background: var(--btn-bg, rgba(255,255,255,0.1)); border-radius: 10px;
                    cursor: pointer; transition: background 0.2s;
                    border: 1px solid var(--divider, rgba(255,255,255,0.12));
                    padding: 0;
                    appearance: none;
                }
                .toggle-switch.on { background: var(--accent, #8ab4f8); }
                .toggle-switch::after {
                    content: ''; position: absolute; top: 2px; left: 2px;
                    width: 16px; height: 16px; background: #fff; border-radius: 50%;
                    transition: transform 0.2s;
                }
                .toggle-switch.on::after { transform: translateX(16px); }

                /* --- Dashboard Styles --- */
                .dash-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: var(--overlay-tint, rgba(0,0,0,0.85)); z-index: ${LAYERS.OVERLAY};
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(5px);
                    padding: 12px;
                }
                .dash-modal {
                    width: min(96vw, 980px); max-width: 96vw; max-height: 90vh; overflow-y: auto;
                    background: var(--bg); border: 1px solid var(--border);
                    border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                    display: flex; flex-direction: column;
                }
                .dash-header {
                    padding: 24px 32px; border-bottom: 1px solid var(--border);
                    display: flex; justify-content: space-between; align-items: center;
                }
                .dash-title { font-size: 24px; font-weight: 300; color: var(--text-main); display: flex; align-items: center; gap: 12px; }
                .dash-close { font-size: 28px; color: var(--text-sub); cursor: pointer; transition: 0.2s; }
                .dash-close:hover { color: var(--accent); transform: scale(1.1); }

                .dash-content { padding: 32px; display: flex; flex-direction: column; gap: 32px; }

                /* Metric Cards */
                .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
                .metric-card {
                    background: var(--input-bg, rgba(255,255,255,0.03)); border: 1px solid var(--border);
                    border-radius: 16px; padding: 20px; text-align: center;
                    transition: transform 0.2s;
                }
                .metric-card:hover { transform: translateY(-2px); background: var(--row-hover, rgba(255,255,255,0.06)); }
                .metric-val { font-size: 32px; color: var(--text-main); font-weight: 300; margin-bottom: 4px; }
                .metric-label { font-size: 12px; color: var(--text-sub); text-transform: uppercase; letter-spacing: 1px; }

                /* Heatmap */
                .heatmap-container {
                    background: var(--input-bg, rgba(255,255,255,0.03)); border: 1px solid var(--border);
                    border-radius: 16px; padding: 24px; overflow-x: auto;
                }
                .heatmap-title { font-size: 14px; color: var(--text-main); margin-bottom: 16px; display: flex; justify-content: space-between; }
                .heatmap-grid { display: flex; gap: 4px; }
                .heatmap-col { display: flex; flex-direction: column; gap: 4px; }
                .heatmap-cell {
                    width: 12px; height: 12px; border-radius: 2px;
                    background: var(--btn-bg, rgba(255,255,255,0.1)); position: relative;
                }
                .heatmap-cell:hover { transform: scale(1.4); z-index: 10; border: 1px solid #fff; }
                .heatmap-legend { display: flex; gap: 4px; align-items: center; font-size: 10px; color: var(--text-sub); }
                .legend-item { width: 10px; height: 10px; border-radius: 2px; }

                .heatmap-wrapper { display: flex; gap: 8px; }
                .heatmap-week-labels { display: flex; flex-direction: column; gap: 4px; padding-top: 18px; }
                .week-label { height: 12px; font-size: 9px; line-height: 12px; color: var(--text-sub); opacity: 0.7; }

                .heatmap-main { display: flex; flex-direction: column; }
                .heatmap-months { display: flex; gap: 4px; margin-bottom: 6px; height: 12px; }
                .month-label { width: 12px; font-size: 9px; color: var(--text-sub); overflow: visible; white-space: nowrap; }

                /* Custom Tooltip */
                .g-tooltip {
                    position: fixed; background: rgba(0,0,0,0.9); border: 1px solid var(--border);
                    color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px;
                    pointer-events: none; z-index: ${LAYERS.TOOLTIP}; opacity: 0; transition: opacity 0.1s;
                    transform: translate(-50%, -100%); margin-top: -8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                }
                .g-tooltip.visible { opacity: 1; }

                /* Level Colors */
                .l-0 { background: var(--btn-bg, rgba(255,255,255,0.05)); }
                .l-1 { background: rgba(138, 180, 248, 0.2); }
                .l-2 { background: rgba(138, 180, 248, 0.4); }
                .l-3 { background: rgba(138, 180, 248, 0.7); }
                .l-4 { background: rgba(138, 180, 248, 1.0); }

                /* Details Pane Tab Bar */
                .details-tab-bar {
                    display: flex; gap: 2px; padding: 0 0 8px 0;
                    border-bottom: 1px solid var(--divider, rgba(255,255,255,0.05));
                    margin-bottom: 8px;
                }
                .details-tab {
                    flex: 1; padding: 6px 4px; text-align: center;
                    font-size: 12px; cursor: pointer; border-radius: 6px;
                    color: var(--text-sub); transition: all 0.2s;
                    background: transparent;
                    border: 1px solid transparent;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    min-height: 30px;
                }
                .details-tab:hover { background: var(--row-hover); color: var(--text-main); }
                .details-tab.active {
                    background: var(--accent); color: #000; font-weight: 600;
                }
                .details-tab .tab-label {
                    font-size: 11px;
                    max-width: 64px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* Module Toggle Compact */
                .module-toggle-compact {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 6px 0; border-bottom: 1px solid var(--divider, rgba(255,255,255,0.05));
                }
                .module-compact-label {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 11px; color: var(--text-main);
                }
                .module-compact-label .module-icon { font-size: 14px; }

                /* Onboarding Modal */
                .onboarding-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: var(--overlay-tint, rgba(0,0,0,0.7)); z-index: ${LAYERS.OVERLAY};
                    display: flex; align-items: center; justify-content: center;
                    padding: 12px;
                }
                .onboarding-modal {
                    width: min(94vw, 520px); max-width: 94vw; max-height: 84vh; overflow-y: auto;
                    background: var(--bg, #202124); border: 1px solid var(--border, rgba(255,255,255,0.1));
                    border-radius: 20px; box-shadow: 0 12px 48px rgba(0,0,0,0.6);
                    font-family: 'Google Sans', Roboto, sans-serif;
                }
                .onboarding-header {
                    padding: 16px 20px; border-bottom: 1px solid var(--divider, rgba(255,255,255,0.08));
                    display: flex; justify-content: space-between; align-items: center;
                }
                .onboarding-header h3 { margin: 0; font-size: 16px; color: var(--text-main, #fff); font-weight: 500; }
                .onboarding-close { cursor: pointer; font-size: 18px; color: var(--text-sub, #9aa0a6); }
                .onboarding-close:hover { color: var(--accent, #8ab4f8); }
                .onboarding-body { padding: 16px 20px; }
                .onboarding-section { margin-bottom: 16px; }
                .onboarding-section-title {
                    font-size: 13px; font-weight: 600; color: var(--accent, #8ab4f8);
                    margin-bottom: 6px;
                }
                .onboarding-text {
                    font-size: 12px; color: var(--text-sub, #9aa0a6); line-height: 1.6;
                    white-space: pre-line;
                }
                .onboarding-footer {
                    padding: 12px 20px; border-top: 1px solid var(--divider, rgba(255,255,255,0.08));
                    display: flex; justify-content: space-between; align-items: center;
                }
                .onboarding-lang-btn {
                    background: var(--btn-bg, rgba(255,255,255,0.06)); border: 1px solid var(--border);
                    color: var(--text-sub); border-radius: 8px; padding: 4px 10px;
                    font-size: 11px; cursor: pointer;
                }
                .onboarding-lang-btn:hover { color: var(--text-main); }
                .onboarding-start-btn {
                    background: var(--accent, #8ab4f8); color: #000; border: none;
                    border-radius: 8px; padding: 6px 16px; font-size: 12px;
                    font-weight: 600; cursor: pointer;
                }
                .onboarding-start-btn:hover { opacity: 0.9; }
                .onboarding-info-btn {
                    font-size: 11px; color: var(--text-sub, #9aa0a6); cursor: pointer;
                    opacity: 0.5; margin-left: 4px;
                    background: transparent;
                    border: none;
                    padding: 0 2px;
                }
                .onboarding-info-btn:hover { opacity: 1; color: var(--accent, #8ab4f8); }

                /* Native UI shared styles */
                .gc-native-btn {
                    background: transparent; border: none; cursor: pointer;
                    font-size: 16px; padding: 4px 6px; border-radius: 50%;
                    transition: background 0.2s;
                    line-height: 1;
                }
                .gc-native-btn:hover { background: rgba(128,128,128,0.2); }
                .gc-dropdown-menu {
                    position: absolute; z-index: ${LAYERS.MENU};
                    background: var(--bg, #303134); border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
                    padding: 4px 0; min-width: 160px; max-width: min(92vw, 360px);
                    font-family: 'Google Sans', Roboto, sans-serif;
                }
                .gc-dropdown-item {
                    padding: 8px 16px; font-size: 13px; color: #e8eaed;
                    cursor: pointer; display: flex; align-items: center; gap: 8px;
                    width: 100%;
                    text-align: left;
                    border: none;
                    background: transparent;
                }
                .gc-dropdown-item:hover { background: rgba(255,255,255,0.08); }
                .settings-close, .debug-close, .dash-close, .onboarding-close {
                    background: transparent;
                    border: none;
                    color: inherit;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    padding: 0;
                    line-height: 1;
                }
                button:focus-visible,
                .details-tab:focus-visible,
                .toggle-switch:focus-visible,
                .settings-close:focus-visible,
                .debug-close:focus-visible,
                .dash-close:focus-visible,
                .onboarding-close:focus-visible,
                .gc-native-btn:focus-visible {
                    outline: 2px solid var(--accent, #8ab4f8);
                    outline-offset: 2px;
                }
                @media (max-width: 960px) {
                    #${PANEL_ID} {
                        width: min(90vw, 320px);
                        max-width: 320px;
                    }
                    .gemini-main-view { padding: 10px 12px 12px; }
                    .gemini-big-num { font-size: 34px; }
                    .gemini-details-view.expanded { max-height: 52vh; }
                    .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .dash-content { padding: 20px; gap: 22px; }
                    .dash-header { padding: 18px 20px; }
                    .heatmap-container { padding: 16px; }
                }
                @media (max-width: 640px) {
                    .details-tab .tab-label { display: none; }
                    .details-tab { min-height: 34px; }
                    .settings-body { padding: 10px 12px; }
                    .dash-title { font-size: 18px; }
                    .metric-val { font-size: 26px; }
                    .module-desc { font-size: 10px; opacity: 0.85; }
                }
            `);
        },

        // --- 面板创建 ---
        create() {
            try {
                const container = document.createElement('div');
                container.id = PANEL_ID;
                container.className = 'notranslate';
                container.setAttribute('translate', 'no');
                this.applyPos(container, GM_getValue(GLOBAL_KEYS.POS, DEFAULT_POS));
                Core.applyTheme(container, currentTheme);

                // Header
                const header = document.createElement('div');
                header.className = 'gemini-header';
                const userCapsule = document.createElement('div');
                userCapsule.id = 'g-user-capsule';
                userCapsule.className = 'user-capsule';
                const toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'gemini-toggle-btn';
                toggle.textContent = '☰';
                toggle.setAttribute('aria-label', 'Toggle details panel');
                toggle.onmousedown = (e) => e.stopPropagation();
                toggle.onclick = () => this.toggleDetails();
                header.appendChild(userCapsule);
                header.appendChild(toggle);

                // Main View
                const mainView = document.createElement('div');
                mainView.className = 'gemini-main-view';

                const bigDisplay = document.createElement('div');
                bigDisplay.id = 'g-big-display';
                bigDisplay.className = 'gemini-big-num';
                bigDisplay.textContent = '0';

                const modelRow = document.createElement('div');
                modelRow.id = 'g-model-row';
                modelRow.className = 'gemini-model-row';

                const modelBadge = document.createElement('span');
                modelBadge.id = 'g-model-badge';
                modelBadge.className = 'model-badge';

                modelRow.appendChild(modelBadge);

                const subInfo = document.createElement('div');
                subInfo.id = 'g-sub-info';
                subInfo.className = 'gemini-sub-info';
                subInfo.textContent = 'Today';

                const quotaWrap = document.createElement('div');
                quotaWrap.id = 'g-quota-wrap';
                quotaWrap.className = 'quota-bar-wrap';
                const quotaFill = document.createElement('div');
                quotaFill.id = 'g-quota-fill';
                quotaFill.className = 'quota-bar-fill';
                quotaWrap.appendChild(quotaFill);

                const quotaLabel = document.createElement('div');
                quotaLabel.id = 'g-quota-label';
                quotaLabel.className = 'quota-label';

                const actionBtn = document.createElement('button');
                actionBtn.id = 'g-action-btn';
                actionBtn.className = 'g-btn';
                actionBtn.textContent = 'Reset Today';
                actionBtn.onclick = () => CounterModule.handleReset();
                actionBtn.onmousedown = (e) => e.stopPropagation();

                mainView.appendChild(bigDisplay);
                mainView.appendChild(modelRow);
                mainView.appendChild(subInfo);
                mainView.appendChild(quotaWrap);
                mainView.appendChild(quotaLabel);
                mainView.appendChild(actionBtn);

                // Details Pane
                const details = document.createElement('div');
                details.id = 'g-details-pane';
                details.className = 'gemini-details-view';

                container.appendChild(header);
                container.appendChild(mainView);
                container.appendChild(details);
                document.body.appendChild(container);

                this.makeDraggable(container, header);
                this.renderDetailsPane();
                this.update();

            } catch (e) {
                console.error("Panel init error", e);
            }
        },

        // --- 详情面板渲染 ---
        renderDetailsPane() {
            const pane = document.getElementById('g-details-pane');
            if (!pane) return;
            pane.replaceChildren();

            // Collect available tabs (stats is always present)
            const tabLabelMap = {
                stats: NativeUI.t('统计', 'Stats'),
                folders: NativeUI.t('文件夹', 'Folders'),
                'prompt-vault': NativeUI.t('提示词', 'Vault'),
                'batch-delete': NativeUI.t('批删', 'Batch')
            };
            const tabs = [{ id: 'stats', icon: '📊', label: tabLabelMap.stats }];
            const tabModules = ['folders', 'prompt-vault', 'batch-delete'];
            tabModules.forEach(id => {
                const mod = ModuleRegistry.modules[id];
                if (mod && ModuleRegistry.isEnabled(id) && typeof mod.renderToDetailsPane === 'function') {
                    tabs.push({ id, icon: mod.icon, label: tabLabelMap[id] || mod.name });
                }
            });

            // Fallback to stats if active tab was disabled
            if (!tabs.find(t => t.id === this._activeTab)) this._activeTab = 'stats';

            // Only render tab bar when >1 tab
            if (tabs.length > 1) {
                const tabBar = document.createElement('div');
                tabBar.className = 'details-tab-bar';
                tabBar.setAttribute('role', 'tablist');
                tabs.forEach(t => {
                    const tab = document.createElement('button');
                    tab.type = 'button';
                    tab.className = `details-tab ${t.id === this._activeTab ? 'active' : ''}`;
                    tab.title = t.label;
                    tab.setAttribute('role', 'tab');
                    tab.setAttribute('aria-selected', t.id === this._activeTab ? 'true' : 'false');
                    const icon = document.createElement('span');
                    icon.className = 'tab-icon';
                    icon.textContent = t.icon;
                    const label = document.createElement('span');
                    label.className = 'tab-label';
                    label.textContent = t.label;
                    tab.appendChild(icon);
                    tab.appendChild(label);
                    tab.onclick = (e) => {
                        e.stopPropagation();
                        this._activeTab = t.id;
                        this.renderDetailsPane();
                    };
                    tabBar.appendChild(tab);
                });
                pane.appendChild(tabBar);
            }

            // Render content for active tab
            if (this._activeTab === 'stats') {
                this._renderStatsTab(pane);
            } else {
                const mod = ModuleRegistry.modules[this._activeTab];
                if (mod && typeof mod.renderToDetailsPane === 'function') {
                    mod.renderToDetailsPane(pane);
                }
            }
        },

        // --- Stats tab content (original Statistics + Profiles + Themes + Actions) ---
        _renderStatsTab(pane) {
            const cm = CounterModule;
            const user = Core.getCurrentUser();
            const inspecting = Core.getInspectingUser();

            // Statistics
            pane.appendChild(this.createSectionTitle('Statistics'));
            const cid = Core.getChatId();
            pane.appendChild(this.createRow('Today', 'today', cm.getTodayMessages()));
            pane.appendChild(this.createRow('Current Chat', 'chat', cid ? (cm.state.chats[cid] || 0) : 0));
            pane.appendChild(this.createRow('Chats Created', 'chatsCreated', cm.state.totalChatsCreated));
            pane.appendChild(this.createRow('Lifetime', 'total', cm.state.total));

            // Model Breakdown (today)
            const byModel = cm.getTodayByModel();
            const hasModelData = byModel.flash || byModel.thinking || byModel.pro;
            if (hasModelData) {
                const modelRow = document.createElement('div');
                modelRow.className = 'detail-row model-breakdown';
                modelRow.style.cssText = 'display: flex; gap: 10px; font-size: 10px; padding: 4px 8px; color: var(--text-sub);';
                const models = [
                    { key: 'flash', label: 'Flash', color: '#34a853' },
                    { key: 'thinking', label: 'Think', color: '#fbbc04' },
                    { key: 'pro', label: 'Pro', color: '#ea4335' }
                ];
                models.forEach(m => {
                    const span = document.createElement('span');
                    span.style.cssText = 'display: flex; align-items: center; gap: 3px;';
                    const dot = document.createElement('span');
                    dot.style.cssText = `width: 6px; height: 6px; border-radius: 50%; background: ${m.color}; display: inline-block;`;
                    const num = document.createElement('span');
                    num.textContent = byModel[m.key] || 0;
                    span.appendChild(dot);
                    span.appendChild(num);
                    modelRow.appendChild(span);
                });
                pane.appendChild(modelRow);
            }

            // Profiles
            pane.appendChild(this.createSectionTitle('Profiles'));
            const users = Core.getAllUsers();
            const sortedUsers = users.sort((a, b) => (a === user ? -1 : b === user ? 1 : a.localeCompare(b)));

            if (sortedUsers.length === 0 && user === TEMP_USER) {
                const row = document.createElement('div');
                row.className = 'detail-row';
                row.textContent = 'Waiting for login...';
                pane.appendChild(row);
            } else {
                sortedUsers.forEach(uid => {
                    const row = document.createElement('div');
                    row.className = `detail-row user-row ${uid === user ? 'is-me' : ''} ${uid === inspecting ? 'active-mode' : ''}`;
                    row.setAttribute('role', 'button');
                    row.tabIndex = 0;
                    row.onclick = (e) => {
                        e.stopPropagation();
                        Core.setInspectingUser(uid);
                        cm.loadDataForUser(uid);
                        cm.state.viewMode = 'total';
                        this.renderDetailsPane();
                    };
                    row.onkeydown = (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            row.click();
                        }
                    };
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = uid.split('@')[0];
                    row.appendChild(nameSpan);
                    if (uid === user) {
                        const meBadge = document.createElement('span');
                        meBadge.className = 'user-indicator';
                        meBadge.textContent = 'ME';
                        row.appendChild(meBadge);
                    }
                    pane.appendChild(row);
                });
            }

            // Themes
            pane.appendChild(this.createSectionTitle('Themes'));
            const themes = Core.getThemes();
            Object.keys(themes).forEach(key => {
                const row = document.createElement('div');
                row.className = `detail-row ${currentTheme === key ? 'active-mode' : ''}`;
                row.textContent = themes[key].name;
                row.setAttribute('role', 'button');
                row.tabIndex = 0;
                row.onclick = (e) => {
                    e.stopPropagation();
                    Core.setTheme(key);
                    currentTheme = key;
                    const panel = document.getElementById(PANEL_ID);
                    Core.applyTheme(panel, key);
                    this.renderDetailsPane();
                };
                row.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        row.click();
                    }
                };
                pane.appendChild(row);
            });

            // Actions
            pane.appendChild(this.createSectionTitle(''));
            const actionsRow = document.createElement('div');
            actionsRow.style.display = 'flex';
            actionsRow.style.gap = '8px';

            const statsBtn = document.createElement('button');
            statsBtn.className = 'g-btn';
            statsBtn.textContent = '📊 Stats';
            statsBtn.style.flex = '1';
            statsBtn.onclick = (e) => { e.stopPropagation(); this.openDashboard(); };

            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'g-btn';
            settingsBtn.textContent = '⚙️';
            settingsBtn.style.width = '32px';
            settingsBtn.title = "Settings";
            settingsBtn.onclick = (e) => { e.stopPropagation(); this.openSettingsModal(); };

            actionsRow.appendChild(statsBtn);
            actionsRow.appendChild(settingsBtn);
            pane.appendChild(actionsRow);
        },

        createSectionTitle(text) {
            const div = document.createElement('div');
            div.className = 'section-title';
            div.textContent = text;
            return div;
        },

        createRow(label, mode, val) {
            const cm = CounterModule;
            const user = Core.getCurrentUser();
            const inspecting = Core.getInspectingUser();

            const row = document.createElement('div');
            row.className = `detail-row ${cm.state.viewMode === mode && inspecting === user ? 'active-mode' : ''}`;
            row.setAttribute('role', 'button');
            row.tabIndex = 0;
            const labelSpan = document.createElement('span');
            labelSpan.textContent = label;
            const valSpan = document.createElement('span');
            valSpan.className = 'detail-val';
            valSpan.textContent = val;
            row.appendChild(labelSpan);
            row.appendChild(valSpan);
            row.onclick = (e) => {
                e.stopPropagation();
                if (inspecting !== user) {
                    Core.setInspectingUser(user);
                    cm.loadDataForUser(user);
                }
                cm.state.viewMode = mode;
                cm.state.resetStep = 0;
                this.update();
                this.renderDetailsPane();
            };
            row.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    row.click();
                }
            };
            return row;
        },

        // --- UI 更新 ---
        update() {
            const cm = CounterModule;
            const user = Core.getCurrentUser();
            const inspecting = Core.getInspectingUser();

            const bigDisplay = document.getElementById('g-big-display');
            const subInfo = document.getElementById('g-sub-info');
            const actionBtn = document.getElementById('g-action-btn');
            const capsule = document.getElementById('g-user-capsule');
            const modelBadge = document.getElementById('g-model-badge');
            const quotaFill = document.getElementById('g-quota-fill');
            const quotaLabel = document.getElementById('g-quota-label');
            if (!bigDisplay) return;

            // Capsule
            const isMe = inspecting === user;
            const displayName = inspecting === TEMP_USER ? 'Guest' : inspecting.split('@')[0];

            capsule.replaceChildren();
            const dot = document.createElement('div');
            dot.className = 'user-avatar-dot';
            const name = document.createElement('span');
            name.textContent = displayName;
            name.style.overflow = 'hidden';
            name.style.textOverflow = 'ellipsis';
            name.style.whiteSpace = 'nowrap';
            capsule.appendChild(dot);
            capsule.appendChild(name);

            // Account badge inline (next to username)
            if (cm.accountType && cm.accountType !== 'free') {
                const acctBadgeInline = document.createElement('span');
                acctBadgeInline.className = 'acct-badge-inline';
                acctBadgeInline.dataset.tier = cm.accountType;
                const acctLabels = { free: 'Free', pro: 'Pro', ultra: 'Ultra' };
                acctBadgeInline.textContent = acctLabels[cm.accountType] || 'Free';
                acctBadgeInline.title = 'Account Tier';
                capsule.appendChild(acctBadgeInline);
            }

            if (!isMe) {
                capsule.classList.add('viewing-other');
                capsule.title = "Viewing other user (Read Only)";
            } else {
                capsule.classList.remove('viewing-other');
                capsule.title = "Active User";
            }

            // Model & Account badges
            if (modelBadge) {
                const mc = cm.MODEL_CONFIG[cm.currentModel];
                modelBadge.textContent = mc.label;
                modelBadge.style.background = mc.color;
                modelBadge.style.color = cm.currentModel === 'flash' ? '#000' : '#fff';
            }

            let val = 0, sub = "", btn = "Reset";
            let disableBtn = !isMe;

            if (cm.state.viewMode === 'today') {
                val = cm.getTodayMessages();
                sub = `Today (Reset @${cm.resetHour}:00)`;
                btn = "Reset Today";
                if (!isMe) { sub = `Today (${inspecting.split('@')[0]})`; }
            } else if (cm.state.viewMode === 'chat') {
                if (!isMe) {
                    val = "--"; sub = "Different Context"; disableBtn = true;
                } else {
                    const cid = Core.getChatId();
                    val = cid ? (cm.state.chats[cid] || 0) : 0;
                    sub = cid ? `ID: ${cid.slice(0, 8)}...` : 'ID: New Chat';
                    btn = "Reset Chat";
                }
            } else if (cm.state.viewMode === 'chatsCreated') {
                val = cm.state.totalChatsCreated;
                sub = "Chats Created";
                btn = "View Only";
                disableBtn = true;
            } else if (cm.state.viewMode === 'total') {
                val = cm.state.total;
                sub = "Lifetime History";
                btn = "Clear History";
            }

            // Bump animation
            const numericVal = typeof val === 'number' ? val : -1;
            if (numericVal !== cm.lastDisplayedVal && cm.lastDisplayedVal !== -1 && numericVal > cm.lastDisplayedVal) {
                bigDisplay.classList.remove('bump');
                void bigDisplay.offsetWidth;
                bigDisplay.classList.add('bump');
            }
            cm.lastDisplayedVal = numericVal;

            bigDisplay.textContent = val;
            subInfo.textContent = sub;

            // Quota bar
            if (quotaFill && quotaLabel) {
                const used = cm.getTodayMessages();
                const weighted = cm.getWeightedQuota();
                const pct = Math.min((weighted / cm.quotaLimit) * 100, 100);
                quotaFill.style.width = pct + '%';
                if (pct < 60) quotaFill.style.background = '#34a853';
                else if (pct < 85) quotaFill.style.background = '#fbbc04';
                else quotaFill.style.background = '#ea4335';
                const weightedStr = weighted % 1 === 0 ? String(weighted) : weighted.toFixed(1);
                quotaLabel.textContent = `${used} msgs (${weightedStr} weighted) / ${cm.quotaLimit}`;
            }

            // Action button
            if (disableBtn) {
                actionBtn.textContent = "View Only";
                actionBtn.className = 'g-btn disabled';
                actionBtn.disabled = true;
            } else {
                actionBtn.disabled = false;
                if (cm.state.resetStep === 0) {
                    actionBtn.textContent = btn;
                    actionBtn.className = 'g-btn';
                } else {
                    actionBtn.textContent = cm.state.resetStep === 1 ? "Sure?" : "Really?";
                    actionBtn.className = `g-btn danger-${cm.state.resetStep}`;
                }
            }
        },

        toggleDetails() {
            const cm = CounterModule;
            cm.state.isExpanded = !cm.state.isExpanded;
            const pane = document.getElementById('g-details-pane');
            if (pane) {
                if (cm.state.isExpanded) {
                    pane.classList.add('expanded');
                    this.renderDetailsPane();
                } else {
                    pane.classList.remove('expanded');
                    cm.state.resetStep = 0;
                }
                this.update();
            }
        },

        // --- 位置管理 ---
        applyPos(el, pos) {
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const savedLeft = parseFloat(pos.left) || 0;
            const savedTop = parseFloat(pos.top) || 0;
            const savedRight = parseFloat(pos.right);
            const estimatedPanelWidth = Math.min(Math.max(winW * 0.22, 170), 240);

            // Mobile-first fallback so panel doesn't start off-screen on narrow viewports.
            if (winW <= 768) {
                pos = { top: '12px', left: 'auto', bottom: 'auto', right: '12px' };
            }

            if (pos.left !== 'auto' && pos.top !== 'auto' &&
                (savedLeft > winW - 50 || savedTop > winH - 50)) {
                console.warn(`💎 Panel off-screen detected. Resetting.`);
                pos = DEFAULT_POS;
                GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS);
            }
            if (pos.right !== 'auto' && !Number.isNaN(savedRight) && (savedRight + estimatedPanelWidth > winW - 8)) {
                pos = { ...pos, left: 'auto', right: '12px' };
            }
            el.style.top = pos.top;
            el.style.left = pos.left;
            el.style.bottom = pos.bottom;
            el.style.right = pos.right;
        },

        makeDraggable(el, handle) {
            // Clean up previous drag listeners if any
            if (this._dragMove) document.removeEventListener('mousemove', this._dragMove);
            if (this._dragUp) document.removeEventListener('mouseup', this._dragUp);

            let isDragging = false, startX, startY, iLeft, iTop;
            handle.onmousedown = (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = el.getBoundingClientRect();
                iLeft = rect.left;
                iTop = rect.top;
                el.style.bottom = 'auto';
                el.style.right = 'auto';
                el.style.left = iLeft + 'px';
                el.style.top = iTop + 'px';
                handle.style.cursor = 'grabbing';
            };
            this._dragMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                let nL = iLeft + e.clientX - startX;
                let nT = iTop + e.clientY - startY;
                if (nT < 10) nT = 10;
                if (nL < 0) nL = 0;
                if (nL + el.offsetWidth > window.innerWidth) nL = window.innerWidth - el.offsetWidth;
                if (nT + el.offsetHeight > window.innerHeight) nT = window.innerHeight - el.offsetHeight;
                el.style.left = nL + 'px';
                el.style.top = nT + 'px';
            };
            this._dragUp = () => {
                if (!isDragging) return;
                isDragging = false;
                handle.style.cursor = 'grab';
                GM_setValue(GLOBAL_KEYS.POS, { top: el.style.top, left: el.style.left, bottom: 'auto', right: 'auto' });
            };
            document.addEventListener('mousemove', this._dragMove);
            document.addEventListener('mouseup', this._dragUp);
        },

        // --- Settings Modal ---
        openSettingsModal() {
            const SETTINGS_MODAL_ID = 'gemini-settings-modal';
            if (document.getElementById(SETTINGS_MODAL_ID)) return;

            const overlay = document.createElement('div');
            overlay.id = SETTINGS_MODAL_ID;
            overlay.className = 'settings-overlay';
            const closeModal = () => UIA11y.closeModal(overlay);

            const modal = document.createElement('div');
            modal.className = 'settings-modal';
            Core.applyTheme(modal, currentTheme);

            // Header
            const header = document.createElement('div');
            header.className = 'settings-header';
            const title = document.createElement('h3');
            title.id = 'gc-settings-title';
            title.textContent = '⚙️ Settings';
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'settings-close';
            closeBtn.textContent = '✕';
            closeBtn.setAttribute('aria-label', 'Close settings');
            closeBtn.onclick = () => closeModal();
            header.appendChild(title);
            header.appendChild(closeBtn);

            // Body
            const body = document.createElement('div');
            body.className = 'settings-body';

            // === Feature Extensions Section (新增) ===
            const extSection = document.createElement('div');
            extSection.className = 'settings-section';
            const extTitle = document.createElement('div');
            extTitle.className = 'settings-section-title';
            extTitle.textContent = '📦 Feature Extensions';
            extSection.appendChild(extTitle);

            ModuleRegistry.getAll().forEach(mod => {
                const row = document.createElement('div');
                row.className = 'module-toggle-compact';
                row.title = mod.description;

                const label = document.createElement('div');
                label.className = 'module-compact-label';
                const icon = document.createElement('span');
                icon.className = 'module-icon';
                icon.textContent = mod.icon;
                const name = document.createElement('span');
                name.textContent = mod.name;
                label.appendChild(icon);
                label.appendChild(name);

                const rightSide = document.createElement('div');
                rightSide.style.cssText = 'display:flex;align-items:center;gap:6px;';

                // ⓘ info button for onboarding
                if (typeof mod.getOnboarding === 'function') {
                    const infoBtn = document.createElement('button');
                    infoBtn.type = 'button';
                    infoBtn.className = 'onboarding-info-btn';
                    infoBtn.textContent = '\u24D8';
                    infoBtn.title = 'Show guide';
                    infoBtn.setAttribute('aria-label', `Show guide for ${mod.name}`);
                    infoBtn.onclick = (e) => {
                        e.stopPropagation();
                        PanelUI.showOnboarding(mod.id);
                    };
                    rightSide.appendChild(infoBtn);
                }

                const toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = `toggle-switch ${ModuleRegistry.isEnabled(mod.id) ? 'on' : ''}`;
                toggle.setAttribute('aria-label', `${mod.name} module`);
                toggle.setAttribute('aria-pressed', ModuleRegistry.isEnabled(mod.id) ? 'true' : 'false');
                toggle.onclick = () => {
                    ModuleRegistry.toggle(mod.id);
                    toggle.classList.toggle('on');
                    const on = toggle.classList.contains('on');
                    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
                    // 刷新详情面板以显示/隐藏模块区域
                    if (CounterModule.state.isExpanded) {
                        PanelUI.renderDetailsPane();
                    }
                };
                rightSide.appendChild(toggle);

                row.appendChild(label);
                row.appendChild(rightSide);
                extSection.appendChild(row);
            });
            body.appendChild(extSection);

            // === Module-specific Settings (已启用模块的配置) ===
            ModuleRegistry.getAll().forEach(mod => {
                if (ModuleRegistry.isEnabled(mod.id) && typeof mod.renderToSettings === 'function') {
                    const modSection = document.createElement('div');
                    modSection.className = 'settings-section';
                    const modTitle = document.createElement('div');
                    modTitle.className = 'settings-section-title';
                    modTitle.textContent = mod.icon + ' ' + mod.name + ' Settings';
                    modSection.appendChild(modTitle);
                    mod.renderToSettings(modSection);
                    body.appendChild(modSection);
                }
            });

            // === Counter Settings Section ===
            const cm = CounterModule;

            const resetSection = document.createElement('div');
            resetSection.className = 'settings-section';
            const resetTitle = document.createElement('div');
            resetTitle.className = 'settings-section-title';
            resetTitle.textContent = 'Daily Reset';
            resetSection.appendChild(resetTitle);

            const resetRow = document.createElement('div');
            resetRow.className = 'settings-row';
            const resetLabel = document.createElement('span');
            resetLabel.className = 'settings-label';
            resetLabel.textContent = 'Reset Hour';
            const resetSelect = document.createElement('select');
            resetSelect.className = 'settings-select';
            for (let h = 0; h < 24; h++) {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = `${h.toString().padStart(2, '0')}:00`;
                if (h === cm.resetHour) opt.selected = true;
                resetSelect.appendChild(opt);
            }
            resetSelect.onchange = () => {
                cm.resetHour = parseInt(resetSelect.value, 10);
                GM_setValue(GLOBAL_KEYS.RESET_HOUR, cm.resetHour);
                this.update();
            };
            resetRow.appendChild(resetLabel);
            resetRow.appendChild(resetSelect);
            resetSection.appendChild(resetRow);
            body.appendChild(resetSection);

            // Quota Section
            const quotaSection = document.createElement('div');
            quotaSection.className = 'settings-section';
            const quotaTitle = document.createElement('div');
            quotaTitle.className = 'settings-section-title';
            quotaTitle.textContent = 'Daily Quota';
            quotaSection.appendChild(quotaTitle);

            const quotaRow = document.createElement('div');
            quotaRow.className = 'settings-row';
            const quotaLabelEl = document.createElement('span');
            quotaLabelEl.className = 'settings-label';
            quotaLabelEl.textContent = 'Message Limit';
            const quotaInput = document.createElement('input');
            quotaInput.type = 'number';
            quotaInput.min = '1';
            quotaInput.max = '999';
            quotaInput.value = cm.quotaLimit;
            quotaInput.className = 'settings-select';
            quotaInput.style.width = '60px';
            quotaInput.style.textAlign = 'center';
            quotaInput.onchange = () => {
                const v = parseInt(quotaInput.value, 10);
                if (v > 0 && v <= 999) {
                    cm.quotaLimit = v;
                    GM_setValue(GLOBAL_KEYS.QUOTA, v);
                    this.update();
                }
            };
            quotaRow.appendChild(quotaLabelEl);
            quotaRow.appendChild(quotaInput);
            quotaSection.appendChild(quotaRow);
            body.appendChild(quotaSection);

            // Usage Chart Section
            const chartSection = document.createElement('div');
            chartSection.className = 'settings-section';
            const chartTitle = document.createElement('div');
            chartTitle.className = 'settings-section-title';
            chartTitle.textContent = 'Usage History (Last 7 Days)';
            chartSection.appendChild(chartTitle);

            const chartContainer = document.createElement('div');
            chartContainer.style.cssText = 'background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-top: 4px;';

            const data = cm.getLast7DaysData();
            const svgWidth = 268, svgHeight = 80, padding = 20;
            const maxVal = Math.max(...data.map(d => d.messages), 1);

            const points = data.map((d, i) => ({
                x: padding + i * ((svgWidth - 2 * padding) / 6),
                y: svgHeight - padding - (d.messages / maxVal) * (svgHeight - 2 * padding),
                val: d.messages,
                label: d.label
            }));

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', svgWidth);
            svg.setAttribute('height', svgHeight + 20);
            svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight + 20}`);

            const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const areaD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                + ` L ${points[6].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;
            areaPath.setAttribute('d', areaD);
            areaPath.setAttribute('fill', 'rgba(138, 180, 248, 0.2)');
            svg.appendChild(areaPath);

            const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            linePath.setAttribute('d', lineD);
            linePath.setAttribute('fill', 'none');
            linePath.setAttribute('stroke', 'var(--accent, #8ab4f8)');
            linePath.setAttribute('stroke-width', '2');
            linePath.setAttribute('stroke-linecap', 'round');
            linePath.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(linePath);

            points.forEach((p) => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', p.x);
                circle.setAttribute('cy', p.y);
                circle.setAttribute('r', '3');
                circle.setAttribute('fill', 'var(--accent, #8ab4f8)');
                svg.appendChild(circle);

                if (p.val > 0) {
                    const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    valText.setAttribute('x', p.x);
                    valText.setAttribute('y', p.y - 6);
                    valText.setAttribute('text-anchor', 'middle');
                    valText.setAttribute('font-size', '8');
                    valText.setAttribute('fill', 'var(--text-sub, #9aa0a6)');
                    valText.textContent = p.val;
                    svg.appendChild(valText);
                }

                const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                dateText.setAttribute('x', p.x);
                dateText.setAttribute('y', svgHeight + 10);
                dateText.setAttribute('text-anchor', 'middle');
                dateText.setAttribute('font-size', '8');
                dateText.setAttribute('fill', 'var(--text-sub, #9aa0a6)');
                dateText.textContent = p.label;
                svg.appendChild(dateText);
            });

            chartContainer.appendChild(svg);
            chartSection.appendChild(chartContainer);
            body.appendChild(chartSection);

            // Data Section
            const dataSection = document.createElement('div');
            dataSection.className = 'settings-section';
            const dataTitle = document.createElement('div');
            dataTitle.className = 'settings-section-title';
            dataTitle.textContent = 'Data';
            dataSection.appendChild(dataTitle);

            // Export buttons (delegated to ExportModule when enabled)
            if (ModuleRegistry.isEnabled('export')) {
                ExportModule.renderExportButtons(dataSection);
            } else {
                const exportBtn = document.createElement('button');
                exportBtn.className = 'settings-btn';
                exportBtn.textContent = '📤 Export Data (JSON)';
                exportBtn.onclick = () => {
                    const exportData = {
                        total: cm.state.total,
                        totalChatsCreated: cm.state.totalChatsCreated,
                        chats: cm.state.chats,
                        dailyCounts: cm.state.dailyCounts,
                        exportedAt: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `gemini-counter-${Core.getCurrentUser().split('@')[0]}-${Core.formatDayKey(new Date())}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                };
                dataSection.appendChild(exportBtn);
            }

            const calibrateBtn = document.createElement('button');
            calibrateBtn.className = 'settings-btn';
            calibrateBtn.textContent = '🔧 Calibrate Data';
            calibrateBtn.onclick = () => this.openCalibrationModal();
            dataSection.appendChild(calibrateBtn);

            const resetPosBtn = document.createElement('button');
            resetPosBtn.type = 'button';
            resetPosBtn.className = 'settings-btn';
            resetPosBtn.textContent = '📍 Reset Panel Position';
            resetPosBtn.onclick = () => {
                GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS);
                closeModal();
                location.reload();
            };
            dataSection.appendChild(resetPosBtn);
            body.appendChild(dataSection);

            // Debug Section
            const debugSection = document.createElement('div');
            debugSection.className = 'settings-section';
            const debugTitle = document.createElement('div');
            debugTitle.className = 'settings-section-title';
            debugTitle.textContent = 'Debug';
            debugSection.appendChild(debugTitle);

            const debugToggleRow = document.createElement('div');
            debugToggleRow.className = 'settings-row';
            const debugLabel = document.createElement('span');
            debugLabel.className = 'settings-label';
            debugLabel.textContent = 'Enable Debug';
            const debugToggle = document.createElement('button');
            debugToggle.type = 'button';
            debugToggle.className = `toggle-switch ${isDebugEnabled() ? 'on' : ''}`;
            debugToggle.setAttribute('aria-label', 'Enable debug mode');
            debugToggle.setAttribute('aria-pressed', isDebugEnabled() ? 'true' : 'false');
            debugToggle.onclick = () => {
                const enabled = !isDebugEnabled();
                setDebugEnabled(enabled);
                debugToggle.classList.toggle('on');
                debugToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
                Logger.info('Debug mode toggled', { enabled });
            };
            debugToggleRow.appendChild(debugLabel);
            debugToggleRow.appendChild(debugToggle);
            debugSection.appendChild(debugToggleRow);

            const logLevelRow = document.createElement('div');
            logLevelRow.className = 'settings-row';
            const logLevelLabel = document.createElement('span');
            logLevelLabel.className = 'settings-label';
            logLevelLabel.textContent = 'Log Level';
            const logSelect = document.createElement('select');
            logSelect.className = 'settings-select';
            ['error', 'warn', 'info', 'debug'].forEach(lvl => {
                const opt = document.createElement('option');
                opt.value = lvl;
                opt.textContent = lvl.toUpperCase();
                if (lvl === Logger.getLevel()) opt.selected = true;
                logSelect.appendChild(opt);
            });
            logSelect.onchange = () => Logger.setLevel(logSelect.value);
            logLevelRow.appendChild(logLevelLabel);
            logLevelRow.appendChild(logSelect);
            debugSection.appendChild(logLevelRow);

            const debugPanelBtn = document.createElement('button');
            debugPanelBtn.className = 'settings-btn';
            debugPanelBtn.textContent = '🧰 Open Debug Panel';
            debugPanelBtn.onclick = () => this.openDebugModal();
            debugSection.appendChild(debugPanelBtn);

            body.appendChild(debugSection);

            // Version
            const version = document.createElement('div');
            version.className = 'settings-version';
            version.textContent = 'Gemini Assistant v9.2 (Native UI)';
            body.appendChild(version);

            modal.appendChild(header);
            modal.appendChild(body);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            UIA11y.setupModal(overlay, modal, {
                close: closeModal,
                labelledBy: title.id,
                initialFocus: resetSelect
            });
        },

        // --- Onboarding Modal ---
        showOnboarding(moduleId) {
            const mod = ModuleRegistry.modules[moduleId];
            if (!mod || typeof mod.getOnboarding !== 'function') return;

            const content = mod.getOnboarding();
            if (!content) return;

            let lang = GM_getValue(GLOBAL_KEYS.ONBOARDING_LANG, 'zh');
            const MODAL_ID = 'gemini-onboarding-modal';
            const existing = document.getElementById(MODAL_ID);
            if (existing) UIA11y.closeModal(existing);

            const overlay = document.createElement('div');
            overlay.id = MODAL_ID;
            overlay.className = 'onboarding-overlay';
            const closeModal = () => UIA11y.closeModal(overlay);

            const modal = document.createElement('div');
            modal.className = 'onboarding-modal';
            Core.applyTheme(modal, currentTheme);

            const renderContent = () => {
                modal.replaceChildren();
                const t = content[lang] || content.zh || content.en;

                // Header
                const header = document.createElement('div');
                header.className = 'onboarding-header';
                const title = document.createElement('h3');
                title.id = 'gc-onboarding-title';
                title.textContent = mod.icon + ' ' + mod.name;
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'onboarding-close';
                closeBtn.textContent = '\u2715';
                closeBtn.setAttribute('aria-label', 'Close onboarding');
                closeBtn.onclick = () => closeModal();
                header.appendChild(title);
                header.appendChild(closeBtn);
                modal.appendChild(header);

                // Body
                const body = document.createElement('div');
                body.className = 'onboarding-body';

                // Rant section
                if (t.rant) {
                    const sec1 = document.createElement('div');
                    sec1.className = 'onboarding-section';
                    const h1 = document.createElement('div');
                    h1.className = 'onboarding-section-title';
                    h1.textContent = lang === 'zh' ? '\uD83D\uDCA2 \u4E3A\u4EC0\u4E48\u9700\u8981\u8FD9\u4E2A\uFF1F' : '\uD83D\uDCA2 Why does this exist?';
                    const p1 = document.createElement('div');
                    p1.className = 'onboarding-text';
                    p1.textContent = t.rant;
                    sec1.appendChild(h1);
                    sec1.appendChild(p1);
                    body.appendChild(sec1);
                }

                // Features section
                if (t.features) {
                    const sec2 = document.createElement('div');
                    sec2.className = 'onboarding-section';
                    const h2 = document.createElement('div');
                    h2.className = 'onboarding-section-title';
                    h2.textContent = lang === 'zh' ? '\u2728 \u5B83\u80FD\u505A\u4EC0\u4E48\uFF1F' : '\u2728 What does it do?';
                    const p2 = document.createElement('div');
                    p2.className = 'onboarding-text';
                    p2.textContent = t.features;
                    sec2.appendChild(h2);
                    sec2.appendChild(p2);
                    body.appendChild(sec2);
                }

                // Guide section
                if (t.guide) {
                    const sec3 = document.createElement('div');
                    sec3.className = 'onboarding-section';
                    const h3el = document.createElement('div');
                    h3el.className = 'onboarding-section-title';
                    h3el.textContent = lang === 'zh' ? '\uD83C\uDFAF \u5982\u4F55\u4F7F\u7528\uFF1F' : '\uD83C\uDFAF How to use?';
                    const p3 = document.createElement('div');
                    p3.className = 'onboarding-text';
                    p3.textContent = t.guide;
                    sec3.appendChild(h3el);
                    sec3.appendChild(p3);
                    body.appendChild(sec3);
                }

                modal.appendChild(body);

                // Footer
                const footer = document.createElement('div');
                footer.className = 'onboarding-footer';
                const langBtn = document.createElement('button');
                langBtn.className = 'onboarding-lang-btn';
                langBtn.textContent = lang === 'zh' ? '\uD83C\uDF10 EN' : '\uD83C\uDF10 \u4E2D';
                langBtn.onclick = () => {
                    lang = lang === 'zh' ? 'en' : 'zh';
                    GM_setValue(GLOBAL_KEYS.ONBOARDING_LANG, lang);
                    renderContent();
                };
                const startBtn = document.createElement('button');
                startBtn.type = 'button';
                startBtn.className = 'onboarding-start-btn';
                startBtn.textContent = lang === 'zh' ? '\u5F00\u59CB\u4F7F\u7528 \u2192' : 'Get Started \u2192';
                startBtn.onclick = () => closeModal();
                footer.appendChild(langBtn);
                footer.appendChild(startBtn);
                modal.appendChild(footer);
            };

            renderContent();
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            UIA11y.setupModal(overlay, modal, {
                close: closeModal,
                labelledBy: 'gc-onboarding-title'
            });
        },

        // --- Debug Modal ---
        openDebugModal() {
            const DEBUG_MODAL_ID = 'gemini-debug-modal';
            if (document.getElementById(DEBUG_MODAL_ID)) return;

            const overlay = document.createElement('div');
            overlay.id = DEBUG_MODAL_ID;
            overlay.className = 'debug-overlay';
            let unsubscribe = null;
            const closeModal = () => {
                if (unsubscribe) unsubscribe();
                UIA11y.closeModal(overlay);
            };

            const modal = document.createElement('div');
            modal.className = 'debug-modal';
            Core.applyTheme(modal, currentTheme);

            const header = document.createElement('div');
            header.className = 'debug-header';
            const title = document.createElement('h3');
            title.id = 'gc-debug-title';
            title.textContent = '🧰 Debug Panel';
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'debug-close';
            closeBtn.textContent = '✕';
            closeBtn.setAttribute('aria-label', 'Close debug panel');
            closeBtn.onclick = () => closeModal();
            header.appendChild(title);
            header.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'debug-body';

            const info = document.createElement('div');
            info.className = 'debug-kv';

            const infoLine = (label, value) => {
                const div = document.createElement('div');
                const strong = document.createElement('strong');
                strong.textContent = label + ':';
                div.appendChild(strong);
                div.appendChild(document.createTextNode(' ' + value));
                return div;
            };

            const detected = Core.detectUser();
            const current = Core.getCurrentUser();
            const inspecting = Core.getInspectingUser();
            const effective = detected || current;
            const storageKey = (effective && effective.includes('@')) ? `gemini_store_${effective}` : 'N/A';

            info.appendChild(infoLine('Detected', detected || 'null'));
            info.appendChild(infoLine('Current', current));
            info.appendChild(infoLine('Inspecting', inspecting));
            info.appendChild(infoLine('Storage Key', storageKey));
            info.appendChild(infoLine('Debug Enabled', String(isDebugEnabled())));
            info.appendChild(infoLine('Log Level', Logger.getLevel()));

            const filterRow = document.createElement('div');
            filterRow.className = 'debug-filter-row';
            const filters = ['all', 'error', 'warn', 'info', 'debug'];
            let activeFilter = 'all';
            let searchTerm = '';

            const mkFilterBtn = (label) => {
                const b = document.createElement('button');
                b.className = 'debug-filter-btn';
                b.textContent = label.toUpperCase();
                b.onclick = () => {
                    activeFilter = label;
                    Array.from(filterRow.children).forEach(el => el.classList.remove('active'));
                    b.classList.add('active');
                    renderLogs();
                };
                return b;
            };
            filters.forEach((f, i) => {
                const btn = mkFilterBtn(f);
                if (i === 0) btn.classList.add('active');
                filterRow.appendChild(btn);
            });

            const search = document.createElement('input');
            search.className = 'debug-search';
            search.placeholder = 'Search logs...';
            search.oninput = () => {
                searchTerm = search.value.trim().toLowerCase();
                renderLogs();
            };

            const actions = document.createElement('div');
            actions.className = 'debug-actions';

            const mkBtn = (label, onClick) => {
                const b = document.createElement('button');
                b.className = 'settings-btn';
                b.textContent = label;
                b.onclick = onClick;
                return b;
            };

            actions.appendChild(mkBtn('Show Detected User', () => debugShowDetectedUser()));
            actions.appendChild(mkBtn('Dump Storage Keys', () => debugDumpStorageKeys()));
            actions.appendChild(mkBtn('Dump Gemini Storage', () => debugDumpGeminiStores()));
            actions.appendChild(mkBtn('Export Legacy Data', () => debugExportLegacyData()));
            actions.appendChild(mkBtn('Export All Storage', () => debugExportAllStorage()));
            actions.appendChild(mkBtn('Export Logs', () => debugExportLogs()));
            actions.appendChild(mkBtn('Clear Logs', () => Logger.clear()));

            const logList = document.createElement('div');
            logList.className = 'debug-log-list';

            const renderLogs = () => {
                logList.replaceChildren();
                let entries = filterLogs(Logger.getEntries(), { level: activeFilter, term: searchTerm }).slice(-120);
                if (entries.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'debug-log-item';
                    empty.textContent = 'No logs yet.';
                    logList.appendChild(empty);
                    return;
                }
                entries.forEach(e => {
                    const item = document.createElement('div');
                    item.className = 'debug-log-item';
                    const meta = `${e.ts}`;
                    const lvl = document.createElement('span');
                    lvl.className = `debug-level ${e.level}`;
                    lvl.textContent = `[${e.level.toUpperCase()}]`;
                    const data = e.data ? ` ${JSON.stringify(e.data)}` : '';
                    item.textContent = `${meta} `;
                    item.appendChild(lvl);
                    item.appendChild(document.createTextNode(` ${e.msg}${data}`));
                    logList.appendChild(item);
                });
            };

            renderLogs();
            unsubscribe = Logger.subscribe(renderLogs);

            body.appendChild(info);
            body.appendChild(filterRow);
            body.appendChild(search);
            body.appendChild(actions);
            body.appendChild(logList);

            modal.appendChild(header);
            modal.appendChild(body);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            UIA11y.setupModal(overlay, modal, {
                close: closeModal,
                labelledBy: title.id
            });
        },

        // --- Calibration Modal ---
        openCalibrationModal() {
            const MODAL_ID = 'gemini-calibrate-modal';
            if (document.getElementById(MODAL_ID)) return;

            const cm = CounterModule;
            const todayKey = Core.getDayKey(cm.resetHour);

            const overlay = document.createElement('div');
            overlay.id = MODAL_ID;
            overlay.className = 'settings-overlay';
            const closeModal = () => UIA11y.closeModal(overlay);

            const modal = document.createElement('div');
            modal.className = 'settings-modal';
            Core.applyTheme(modal, currentTheme);

            // Header
            const header = document.createElement('div');
            header.className = 'settings-header';
            const title = document.createElement('h3');
            title.id = 'gc-calibrate-title';
            title.textContent = 'Calibrate Data';
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'settings-close';
            closeBtn.textContent = '\u2715';
            closeBtn.setAttribute('aria-label', 'Close calibration');
            closeBtn.onclick = () => closeModal();
            header.appendChild(title);
            header.appendChild(closeBtn);

            // Body
            const body = document.createElement('div');
            body.className = 'settings-body';

            const mkField = (label, value) => {
                const row = document.createElement('div');
                row.className = 'settings-row';
                const lbl = document.createElement('span');
                lbl.className = 'settings-label';
                lbl.textContent = label;
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.value = value;
                input.className = 'settings-select';
                input.style.width = '80px';
                input.style.textAlign = 'center';
                row.appendChild(lbl);
                row.appendChild(input);
                return { row, input };
            };

            const section = document.createElement('div');
            section.className = 'settings-section';
            const sTitle = document.createElement('div');
            sTitle.className = 'settings-section-title';
            sTitle.textContent = 'Adjust Values';
            section.appendChild(sTitle);

            const todayField = mkField('Today Messages', cm.state.dailyCounts[todayKey]?.messages || 0);
            const totalField = mkField('Lifetime Total', cm.state.total);
            const chatsField = mkField('Chats Created', cm.state.totalChatsCreated);
            section.appendChild(todayField.row);
            section.appendChild(totalField.row);
            section.appendChild(chatsField.row);
            body.appendChild(section);

            // Current Chat field (only if in a chat)
            let chatField = null;
            const currentCid = Core.getChatId();
            if (currentCid) {
                const chatSection = document.createElement('div');
                chatSection.className = 'settings-section';
                const chatTitle = document.createElement('div');
                chatTitle.className = 'settings-section-title';
                chatTitle.textContent = 'Current Chat';
                chatSection.appendChild(chatTitle);
                chatField = mkField('Chat Messages', cm.state.chats[currentCid] || 0);
                chatSection.appendChild(chatField.row);

                const chatIdHint = document.createElement('div');
                chatIdHint.style.cssText = 'font-size: 9px; color: var(--text-sub); opacity: 0.5; margin-top: 2px;';
                chatIdHint.textContent = 'ID: ' + currentCid.slice(0, 12) + '...';
                chatSection.appendChild(chatIdHint);
                body.appendChild(chatSection);
            }

            // Apply button
            const applyBtn = document.createElement('button');
            applyBtn.className = 'settings-btn';
            applyBtn.textContent = 'Apply Calibration';
            applyBtn.style.marginTop = '12px';
            applyBtn.style.background = 'rgba(138, 180, 248, 0.2)';
            applyBtn.style.color = 'var(--accent, #8ab4f8)';
            applyBtn.style.fontWeight = '500';
            applyBtn.onclick = () => {
                const newToday = parseInt(todayField.input.value, 10) || 0;
                const newTotal = parseInt(totalField.input.value, 10) || 0;
                const newChats = parseInt(chatsField.input.value, 10) || 0;

                cm.ensureTodayEntry();
                cm.state.dailyCounts[todayKey].messages = newToday;
                cm.state.total = newTotal;
                cm.state.totalChatsCreated = newChats;

                if (chatField && currentCid) {
                    const newChatVal = parseInt(chatField.input.value, 10) || 0;
                    cm.state.chats[currentCid] = newChatVal;
                }

                cm.saveData();
                PanelUI.update();
                if (cm.state.isExpanded) PanelUI.renderDetailsPane();

                Logger.info('Data calibrated', {
                    today: newToday, total: newTotal, chats: newChats,
                    chatId: currentCid || null
                });
                closeModal();
            };
            body.appendChild(applyBtn);

            const note = document.createElement('div');
            note.className = 'settings-version';
            note.textContent = 'Manually adjust counter values';
            body.appendChild(note);

            modal.appendChild(header);
            modal.appendChild(body);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            UIA11y.setupModal(overlay, modal, {
                close: closeModal,
                labelledBy: title.id,
                initialFocus: todayField.input
            });
        },

        // --- Dashboard Modal ---
        openDashboard() {
            const exist = document.getElementById('gemini-dashboard-overlay');
            if (exist) return;

            const cm = CounterModule;
            const overlay = document.createElement('div');
            overlay.id = 'gemini-dashboard-overlay';
            overlay.className = 'dash-overlay';
            const closeModal = () => {
                const tip = document.getElementById('g-heatmap-tooltip');
                if (tip) tip.remove();
                UIA11y.closeModal(overlay);
            };

            const modal = document.createElement('div');
            modal.className = 'dash-modal';
            Core.applyTheme(modal, currentTheme);

            // Header
            const header = document.createElement('div');
            header.className = 'dash-header';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'dash-title';
            titleDiv.id = 'gc-dashboard-title';
            titleDiv.textContent = '📊 Analytics ';
            const userSpan = document.createElement('span');
            userSpan.style.fontSize = '12px';
            userSpan.style.opacity = '0.5';
            userSpan.style.marginTop = '8px';
            userSpan.textContent = Core.getCurrentUser().split('@')[0];
            titleDiv.appendChild(userSpan);

            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'dash-close';
            close.textContent = '×';
            close.setAttribute('aria-label', 'Close analytics');
            close.onclick = () => closeModal();

            header.appendChild(titleDiv);
            header.appendChild(close);
            modal.appendChild(header);

            // Content
            const content = document.createElement('div');
            content.className = 'dash-content';

            // Metric Cards
            const streaks = cm.calculateStreaks();
            const grid = document.createElement('div');
            grid.className = 'metric-grid';

            const metrics = [
                { label: 'Total Messages', val: cm.state.total.toLocaleString() },
                { label: 'Chats Created', val: cm.state.totalChatsCreated.toLocaleString() },
                { label: 'Current Streak', val: streaks.current + ' Days' },
                { label: 'Best Streak', val: streaks.best + ' Days' },
            ];

            metrics.forEach(m => {
                const card = document.createElement('div');
                card.className = 'metric-card';
                const valDiv = document.createElement('div');
                valDiv.className = 'metric-val';
                valDiv.textContent = m.val;
                const labelDiv = document.createElement('div');
                labelDiv.className = 'metric-label';
                labelDiv.textContent = m.label;
                card.appendChild(valDiv);
                card.appendChild(labelDiv);
                grid.appendChild(card);
            });
            content.appendChild(grid);

            // Heatmap
            const hmContainer = document.createElement('div');
            hmContainer.className = 'heatmap-container';

            const hmHeader = document.createElement('div');
            hmHeader.className = 'heatmap-title';
            const titleSpan = document.createElement('span');
            titleSpan.textContent = 'Activity (Last 365 Days)';

            const legend = document.createElement('div');
            legend.className = 'heatmap-legend';
            legend.appendChild(document.createTextNode('Less '));
            ['l-0', 'l-1', 'l-3', 'l-4'].forEach(cls => {
                const item = document.createElement('div');
                item.className = `legend-item ${cls}`;
                legend.appendChild(item);
            });
            legend.appendChild(document.createTextNode(' More'));

            hmHeader.appendChild(titleSpan);
            hmHeader.appendChild(legend);
            hmContainer.appendChild(hmHeader);

            const hmWrapper = document.createElement('div');
            hmWrapper.className = 'heatmap-wrapper';

            // Week Labels
            const weekCol = document.createElement('div');
            weekCol.className = 'heatmap-week-labels';
            ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(d => {
                const label = document.createElement('div');
                label.className = 'week-label';
                label.textContent = d;
                weekCol.appendChild(label);
            });
            hmWrapper.appendChild(weekCol);

            const hmMain = document.createElement('div');
            hmMain.className = 'heatmap-main';

            const monthRow = document.createElement('div');
            monthRow.className = 'heatmap-months';

            const hmGrid = document.createElement('div');
            hmGrid.className = 'heatmap-grid';

            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setDate(today.getDate() - 365);

            let maxVal = 0;
            Object.values(cm.state.dailyCounts).forEach(v => { if (v.messages > maxVal) maxVal = v.messages; });
            if (maxVal < 10) maxVal = 10;

            let tooltip = document.getElementById('g-heatmap-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'g-heatmap-tooltip';
                tooltip.className = 'g-tooltip';
                document.body.appendChild(tooltip);
            }

            let iterDate = new Date(oneYearAgo);
            iterDate.setDate(iterDate.getDate() - iterDate.getDay());
            let lastMonth = -1;

            for (let week = 0; week < 53; week++) {
                const currentMonth = iterDate.getMonth();
                const mLabel = document.createElement('div');
                mLabel.className = 'month-label';

                if (currentMonth !== lastMonth) {
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    mLabel.textContent = monthNames[currentMonth];
                    lastMonth = currentMonth;
                }
                monthRow.appendChild(mLabel);

                const col = document.createElement('div');
                col.className = 'heatmap-col';
                for (let day = 0; day < 7; day++) {
                    const key = Core.formatDayKey(iterDate);
                    const count = cm.state.dailyCounts[key]?.messages || 0;

                    const cell = document.createElement('div');
                    cell.className = 'heatmap-cell';

                    let level = 'l-0';
                    if (count > 0) {
                        const ratio = count / maxVal;
                        if (ratio > 0.75) level = 'l-4';
                        else if (ratio > 0.5) level = 'l-3';
                        else if (ratio > 0.25) level = 'l-2';
                        else level = 'l-1';
                    }
                    cell.classList.add(level);

                    cell.onmouseenter = (e) => {
                        tooltip.textContent = '';
                        const b = document.createElement('div');
                        b.style.fontWeight = 'bold';
                        b.textContent = key;
                        const sp = document.createElement('div');
                        sp.textContent = `${count} messages`;
                        tooltip.appendChild(b);
                        tooltip.appendChild(sp);
                        tooltip.classList.add('visible');
                        const rect = cell.getBoundingClientRect();
                        let left = rect.left + rect.width / 2;
                        let top = rect.top;
                        tooltip.style.left = left + 'px';
                        tooltip.style.top = top + 'px';
                        const ttRect = tooltip.getBoundingClientRect();
                        if (ttRect.right > window.innerWidth) tooltip.style.left = (window.innerWidth - ttRect.width / 2 - 10) + 'px';
                        if (ttRect.left < 0) tooltip.style.left = (ttRect.width / 2 + 10) + 'px';
                    };
                    cell.onmouseleave = () => tooltip.classList.remove('visible');

                    col.appendChild(cell);
                    iterDate.setDate(iterDate.getDate() + 1);

                    if (iterDate > today && day === today.getDay()) break;
                }
                hmGrid.appendChild(col);
                if (iterDate > today) break;
            }

            hmMain.appendChild(monthRow);
            hmMain.appendChild(hmGrid);
            hmWrapper.appendChild(hmMain);

            hmContainer.appendChild(hmWrapper);
            content.appendChild(hmContainer);

            // Model Distribution Chart
            const allByModel = { flash: 0, thinking: 0, pro: 0 };
            Object.values(cm.state.dailyCounts).forEach(entry => {
                if (entry.byModel) {
                    allByModel.flash += entry.byModel.flash || 0;
                    allByModel.thinking += entry.byModel.thinking || 0;
                    allByModel.pro += entry.byModel.pro || 0;
                }
            });
            const modelTotal = allByModel.flash + allByModel.thinking + allByModel.pro;

            if (modelTotal > 0) {
                const modelContainer = document.createElement('div');
                modelContainer.className = 'heatmap-container';

                const modelTitle = document.createElement('div');
                modelTitle.className = 'heatmap-title';
                const modelTitleSpan = document.createElement('span');
                modelTitleSpan.textContent = 'Model Usage Distribution';
                modelTitle.appendChild(modelTitleSpan);
                modelContainer.appendChild(modelTitle);

                const modelColors = { flash: '#81c995', thinking: '#fdd663', pro: '#f28b82' };
                const models = [
                    { key: 'flash', label: '3 Flash', count: allByModel.flash },
                    { key: 'thinking', label: '3 Flash Thinking', count: allByModel.thinking },
                    { key: 'pro', label: '3 Pro', count: allByModel.pro }
                ];

                models.forEach(m => {
                    const pct = (m.count / modelTotal * 100).toFixed(1);
                    const barRow = document.createElement('div');
                    barRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

                    const labelEl = document.createElement('div');
                    labelEl.style.cssText = 'font-size: 11px; color: var(--text-sub); width: 110px; flex-shrink: 0;';
                    labelEl.textContent = m.label;

                    const barBg = document.createElement('div');
                    barBg.style.cssText = 'flex: 1; height: 16px; background: var(--btn-bg, rgba(255,255,255,0.05)); border-radius: 4px; overflow: hidden;';
                    const barFill = document.createElement('div');
                    barFill.style.cssText = `height: 100%; width: ${pct}%; background: ${modelColors[m.key]}; border-radius: 4px; transition: width 0.4s;`;
                    barBg.appendChild(barFill);

                    const valEl = document.createElement('div');
                    valEl.style.cssText = 'font-size: 11px; color: var(--text-main); width: 70px; text-align: right; flex-shrink: 0; font-family: monospace;';
                    valEl.textContent = `${m.count} (${pct}%)`;

                    barRow.appendChild(labelEl);
                    barRow.appendChild(barBg);
                    barRow.appendChild(valEl);
                    modelContainer.appendChild(barRow);
                });

                // Weighted summary
                const weightedTotal = Object.keys(allByModel).reduce((sum, k) => sum + (allByModel[k] || 0) * (CounterModule.MODEL_CONFIG[k]?.multiplier ?? 1), 0);
                const wStr = weightedTotal % 1 === 0 ? String(weightedTotal) : weightedTotal.toFixed(1);
                const weightedRow = document.createElement('div');
                weightedRow.style.cssText = 'font-size: 11px; color: var(--text-sub); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--divider, rgba(255,255,255,0.05));';
                weightedRow.textContent = `Total Weighted: ${wStr} | Raw Messages: ${modelTotal}`;
                modelContainer.appendChild(weightedRow);

                content.appendChild(modelContainer);
            }

            modal.appendChild(content);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            UIA11y.setupModal(overlay, modal, {
                close: closeModal,
                labelledBy: titleDiv.id
            });

            setTimeout(() => { hmContainer.scrollLeft = hmContainer.scrollWidth; }, 0);
        }
    };

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                           MAIN LOOP (主循环)                               ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    let lastDetectedUser = null;

    function checkUserAndPanel() {
        const detected = Core.detectUser();
        if (detected !== lastDetectedUser) {
            Logger.debug('User detection changed', { detected });
            lastDetectedUser = detected;
        }
        if (detected && detected !== currentUser) {
            // 状态合并策略
            let guestState = null;
            if (currentUser === TEMP_USER && ModuleRegistry.isEnabled('counter')) {
                guestState = JSON.parse(JSON.stringify(CounterModule.state));
            }

            currentUser = detected;
            Core.registerUser(detected);
            Logger.info('User switched', { currentUser: detected });

            if (inspectingUser === TEMP_USER || inspectingUser === currentUser) {
                inspectingUser = currentUser;
            }

            // 通知所有模块
            ModuleRegistry.notifyUserChange(inspectingUser);

            // 合并 Guest 数据
            if (guestState && (guestState.total > 0 || Object.keys(guestState.chats).length > 0)) {
                const cm = CounterModule;
                cm.state.total += guestState.total;
                cm.state.totalChatsCreated += guestState.totalChatsCreated;
                for (const [day, counts] of Object.entries(guestState.dailyCounts)) {
                    if (!cm.state.dailyCounts[day]) {
                        cm.state.dailyCounts[day] = counts;
                    } else {
                        cm.state.dailyCounts[day].messages += counts.messages;
                        cm.state.dailyCounts[day].chats += counts.chats;
                        // Merge byModel counts
                        if (counts.byModel) {
                            if (!cm.state.dailyCounts[day].byModel) {
                                cm.state.dailyCounts[day].byModel = { flash: 0, thinking: 0, pro: 0 };
                            }
                            cm.state.dailyCounts[day].byModel.flash += counts.byModel.flash || 0;
                            cm.state.dailyCounts[day].byModel.thinking += counts.byModel.thinking || 0;
                            cm.state.dailyCounts[day].byModel.pro += counts.byModel.pro || 0;
                        }
                    }
                }
                for (const [cid, count] of Object.entries(guestState.chats)) {
                    cm.state.chats[cid] = (cm.state.chats[cid] || 0) + count;
                }
                console.log(`💎 Merged ${guestState.total} messages from Guest session to ${currentUser}`);
                cm.saveData();
            }
        }

        // 检测模型和账户类型
        if (ModuleRegistry.isEnabled('counter')) {
            const cm = CounterModule;
            const newModel = cm.detectModel();
            const newAcct = cm.detectAccountType();
            const modelChanged = newModel !== cm.currentModel;
            const acctChanged = newAcct !== cm.accountType;
            cm.currentModel = newModel;
            cm.accountType = newAcct;

            if (!document.getElementById(PANEL_ID)) {
                PanelUI.create();
            } else if (modelChanged || acctChanged) {
                PanelUI.update();
            }
        }

        // Tick native UI injections for enabled modules
        NativeUI.tick();
    }

    // --- 初始化 ---
    PanelUI.injectStyles();
    ModuleRegistry.init();

    // Upgrade onboarding: show for already-enabled modules that haven't been seen
    // Uses a sequential queue so modals don't stack on top of each other
    {
        const seen = GM_getValue(GLOBAL_KEYS.ONBOARDING, {});
        const queue = [];
        ModuleRegistry.enabledModules.forEach(id => {
            const mod = ModuleRegistry.modules[id];
            if (!seen[id] && typeof mod?.getOnboarding === 'function') {
                queue.push(id);
                seen[id] = true;
            }
        });
        if (queue.length > 0) {
            GM_setValue(GLOBAL_KEYS.ONBOARDING, seen);
            let i = 0;
            function showNext() {
                if (i >= queue.length) return;
                const id = queue[i++];
                PanelUI.showOnboarding(id);
                // Wait for user to dismiss before showing next (poll for overlay removal)
                const check = setInterval(() => {
                    if (!document.querySelector('.onboarding-overlay')) {
                        clearInterval(check);
                        setTimeout(showNext, 500);
                    }
                }, 300);
            }
            setTimeout(showNext, 2000);
        }
    }

    let pollTimer = setInterval(checkUserAndPanel, TIMINGS.POLL_INTERVAL);

    // 窗口聚焦/隐藏 — 暂停轮询 + 自动同步
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // 恢复轮询
            if (!pollTimer) pollTimer = setInterval(checkUserAndPanel, TIMINGS.POLL_INTERVAL);
            // 同步数据
            if (inspectingUser && ModuleRegistry.isEnabled('counter')) {
                CounterModule.loadDataForUser(inspectingUser);
            }
        } else {
            // 标签页隐藏时暂停轮询
            if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        }
    });

    function debugDumpStorageKeys() {
        try {
            const keys = (typeof GM_listValues === 'function' ? GM_listValues() : []).slice().sort();
            const geminiKeys = keys.filter(k => k.startsWith('gemini_') || k.startsWith('gemini_store_'));
            console.group('💎 Gemini Debug: Storage Keys');
            console.log('All keys:', keys);
            console.log('Gemini keys:', geminiKeys);
            console.groupEnd();
            Logger.info('Debug: dumped storage keys', { count: keys.length });
        } catch (e) {
            Logger.warn('Debug: failed to list storage keys', { error: String(e) });
        }
    }

    function debugShowDetectedUser() {
        try {
            const detected = Core.detectUser();
            const current = Core.getCurrentUser();
            const effective = detected || current;
            const storageKey = (effective && effective.includes('@')) ? `gemini_store_${effective}` : null;
            console.group('💎 Gemini Debug: User');
            console.log('detected:', detected);
            console.log('currentUser:', current);
            console.log('effectiveUser:', effective);
            console.log('storageKey:', storageKey);
            console.groupEnd();
            Logger.info('Debug: show detected user', { detected, current, effective });
        } catch (e) {
            Logger.warn('Debug: failed to show detected user', { error: String(e) });
        }
    }

    function debugExportAllStorage() {
        try {
            const keys = (typeof GM_listValues === 'function' ? GM_listValues() : []).slice().sort();
            const data = {};
            keys.forEach(k => {
                try { data[k] = GM_getValue(k); } catch (e) { data[k] = { error: String(e) }; }
            });
            const payload = {
                exportedAt: new Date().toISOString(),
                keys: keys,
                data: data
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gemini_storage_export.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            console.log('💎 Storage export saved: gemini_storage_export.json');
            Logger.info('Debug: export all storage');
        } catch (e) {
            Logger.warn('Debug: failed to export storage', { error: String(e) });
        }
    }

    function debugExportLegacyData() {
        try {
            const legacyKeys = [
                'gemini_count_chats_map',
                'gemini_count_session',
                'gemini_count_total',
                'gemini_interaction_count',
                'gemini_view_mode',
                'gemini_panel_position',
                'gemini_panel_pos_v64',
                'gemini_panel_pos'
            ];
            const data = {};
            legacyKeys.forEach(k => {
                try { data[k] = GM_getValue(k); } catch (e) { data[k] = { error: String(e) }; }
            });
            const payload = {
                exportedAt: new Date().toISOString(),
                legacyKeys: legacyKeys,
                data: data
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gemini_legacy_export.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            console.log('💎 Legacy export saved: gemini_legacy_export.json');
            Logger.info('Debug: export legacy data');
        } catch (e) {
            Logger.warn('Debug: failed to export legacy data', { error: String(e) });
        }
    }

    function debugExportLogs() {
        try {
            const payload = Logger.export();
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gemini_logs_export.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            Logger.info('Debug: export logs');
        } catch (e) {
            Logger.warn('Debug: failed to export logs', { error: String(e) });
        }
    }

    function debugDumpGeminiStores() {
        try {
            const keys = (typeof GM_listValues === 'function' ? GM_listValues() : []).slice().sort();
            const targets = keys.filter(k => k.startsWith('gemini_store_') || k.startsWith('gemini_folders_data') || k.startsWith('gemini_'));
            console.group('💎 Gemini Debug: Storage Dump');
            targets.forEach(k => {
                try { console.log(k, GM_getValue(k)); } catch (err) { console.warn('Failed to read', k, err); }
            });
            console.groupEnd();
        } catch (e) {
            Logger.warn('Debug: failed to dump storage', { error: String(e) });
        }
    }

    // 油猴菜单命令
    GM_registerMenuCommand("🧰 Debug: Show Detected User", () => {
        debugShowDetectedUser();
    });

    GM_registerMenuCommand("🧰 Debug: Dump Storage Keys", () => {
        debugDumpStorageKeys();
    });

    GM_registerMenuCommand("🧰 Debug: Export All Storage", () => {
        debugExportAllStorage();
    });

    GM_registerMenuCommand("🧰 Debug: Export Legacy Data", () => {
        debugExportLegacyData();
    });

    GM_registerMenuCommand("🧰 Debug: Export Logs", () => {
        debugExportLogs();
    });

    GM_registerMenuCommand("🧰 Debug: Dump Gemini Storage", () => {
        debugDumpGeminiStores();
    });

    GM_registerMenuCommand("🔄 Reset Position", () => {
        GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS);
        location.reload();
    });

})();
