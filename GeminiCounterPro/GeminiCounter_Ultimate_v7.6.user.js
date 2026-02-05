// ==UserScript==
// @name         Gemini Counter Ultimate (v7.6)
// @namespace    http://tampermonkey.net/
// @version      7.6
// @description  模块化架构：可扩展的 Gemini 助手平台 - 计数器 + 热力图 + 配额追踪 + 对话文件夹 (Pure Enhancement)
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

    console.log("💎 Gemini Assistant v7.6 (Modular - Pure Enhancement) Starting...");

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
                '--shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
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
                '--shadow': '0 0 15px rgba(0, 255, 65, 0.2)'
            }
        },
        paper: {
            name: "📄 Paper",
            vars: {
                '--bg': 'rgba(250, 250, 250, 0.88)',
                '--blur': '12px',
                '--saturate': '120%',
                '--border': 'rgba(0, 0, 0, 0.08)',
                '--text-main': '#1967d2',
                '--text-sub': '#5f6368',
                '--accent': '#1967d2',
                '--btn-bg': 'rgba(0, 0, 0, 0.04)',
                '--row-hover': 'rgba(0, 0, 0, 0.06)',
                '--shadow': '0 4px 16px rgba(60, 64, 67, 0.12)'
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
        LOGS: 'gemini_logs_store'
    };
    const PANEL_ID = 'gemini-monitor-panel-v7';
    const DEFAULT_POS = { top: '20px', left: 'auto', bottom: 'auto', right: '220px' };
    const TEMP_USER = "Guest";

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
                    this.modules[id].destroy();
                }
            } else {
                this.enabledModules.add(id);
                if (this.modules[id]?.init) {
                    this.modules[id].init();
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
                    this.modules[id].onUserChange(user);
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
            return now.toISOString().slice(0, 10);
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
        COOLDOWN: 1000,
        MODEL_CONFIG: {
            flash: { label: 'Flash', multiplier: 0, color: '#34a853' },
            thinking: { label: 'Thinking', multiplier: 0.33, color: '#fbbc04' },
            pro: { label: 'Pro', multiplier: 1, color: '#ea4335' }
        },
        MODEL_DETECT_MAP: {
            '快速': 'flash', 'Flash': 'flash', 'flash': 'flash',
            '思考': 'thinking', 'Thinking': 'thinking', 'thinking': 'thinking',
            'Pro': 'pro', 'pro': 'pro'
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
            // 清理事件监听器 (实际上很难完全清理，这里只是占位)
            Logger.info('CounterModule destroyed');
        },

        onUserChange(user) {
            this.loadDataForUser(user);
        },

        bindEvents() {
            // 键盘监听
            document.addEventListener('keydown', (e) => {
                if (!ModuleRegistry.isEnabled('counter')) return;
                if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.originalEvent?.isComposing) return;
                const act = document.activeElement;
                if (act && (act.tagName === 'TEXTAREA' || act.getAttribute('contenteditable') === 'true')) {
                    setTimeout(() => this.attemptIncrement(), 50);
                }
            }, true);

            // 点击监听
            document.addEventListener('click', (e) => {
                if (!ModuleRegistry.isEnabled('counter')) return;
                const btn = e.target?.closest ? e.target.closest('button') : null;
                if (btn && !btn.disabled) {
                    const label = btn.getAttribute('aria-label') || '';
                    if (label.includes('Send') || label.includes('发送')) {
                        this.attemptIncrement();
                    }
                }
            }, true);
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
                this.state = { total: 0, totalChatsCreated: 0, chats: {}, dailyCounts: {}, viewMode: 'today', isExpanded: false, resetStep: 0 };
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
                this.state = { total: 0, totalChatsCreated: 0, chats: {}, dailyCounts: {}, viewMode: 'today', isExpanded: false, resetStep: 0 };
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
                this.state.dailyCounts[today] = { messages: 0, chats: 0 };
            }
            return today;
        },

        getTodayMessages() {
            const today = Core.getDayKey(this.resetHour);
            return this.state.dailyCounts[today]?.messages || 0;
        },

        attemptIncrement() {
            const now = Date.now();
            if (now - this.lastCountTime < this.COOLDOWN) return;

            const today = this.ensureTodayEntry();
            this.state.total++;
            this.state.dailyCounts[today].messages++;
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
                const d = new Date(dateStr);
                d.setHours(0, 0, 0, 0);

                if (lastDate) {
                    const diff = (d - lastDate) / (1000 * 60 * 60 * 24);
                    if (diff === 1) temp++;
                    else if (diff > 1) temp = 1;
                } else {
                    temp = 1;
                }
                if (temp > best) best = temp;
                lastDate = d;
            }

            // Current streak
            const todayStr = Core.getDayKey(this.resetHour);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);

            let checkDate = (dailyData[todayStr]?.messages > 0) ? new Date(todayStr) : new Date(yesterdayStr);
            let current = 0;

            while (true) {
                const key = checkDate.toISOString().slice(0, 10);
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
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
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
        dragState: null,

        // --- 生命周期 ---
        init() {
            this.loadData();
            this.injectStyles();
            this.startObserver();
            Logger.info('FoldersModule initialized', { mode: 'pure' });
        },

        destroy() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            // 移除侧边栏的颜色标记
            document.querySelectorAll('.gf-sidebar-dot').forEach(el => el.remove());
            // 移除模态框
            document.querySelectorAll('.gf-modal-overlay').forEach(el => el.remove());
            Logger.info('FoldersModule destroyed');
        },

        onUserChange(user) {
            this.loadData();
            this.markSidebarChats();
            // 刷新详情面板
            if (CounterModule.state.isExpanded) {
                PanelUI.renderDetailsPane();
            }
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
                collapsed: false
            };
            this.data.folderOrder.push(id);
            this.saveData();
            this.markSidebarChats();
            PanelUI.renderDetailsPane();
            return id;
        },

        renameFolder(folderId, newName) {
            if (this.data.folders[folderId]) {
                this.data.folders[folderId].name = newName;
                this.saveData();
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

        // --- 侧边栏扫描 ---
        scanSidebarChats() {
            const items = [];
            document.querySelectorAll('nav a[href*="/app/"]').forEach(el => {
                const href = el.getAttribute('href') || '';
                const match = href.match(/\/app\/([a-zA-Z0-9\-_]+)/);
                if (match) {
                    // 尝试获取聊天标题
                    let title = '';
                    const textEl = el.querySelector('span, div');
                    if (textEl) title = textEl.textContent.trim();
                    if (!title) title = 'Untitled';

                    items.push({
                        id: match[1],
                        title: title,
                        element: el,
                        href: href
                    });
                }
            });
            this.chatCache = items;
            return items;
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
            setTimeout(() => this.markSidebarChats(), 1500);

            // 监听 DOM 变化
            this.observer = new MutationObserver(() => {
                clearTimeout(this._markTimeout);
                this._markTimeout = setTimeout(() => this.markSidebarChats(), 500);
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        // --- 注入样式 ---
        injectStyles() {
            GM_addStyle(`
                /* Folder Modal */
                .gf-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 2147483646;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .gf-modal {
                    width: 280px;
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
                    background: rgba(255, 255, 255, 0.05);
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
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-main, #e8eaed);
                }
                .gf-modal-btn.danger {
                    background: rgba(242, 139, 130, 0.2);
                    color: #f28b82;
                }
                .gf-modal-btn:hover {
                    filter: brightness(1.1);
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
                }
                .gf-chat-row:hover .gf-chat-remove {
                    opacity: 0.6;
                }
                .gf-chat-remove:hover {
                    opacity: 1;
                }

                /* Add folder button in details */
                .gf-add-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 6px;
                    margin-top: 4px;
                    border: 1px dashed rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    background: transparent;
                    color: var(--text-sub, #9aa0a6);
                    font-size: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                }
                .gf-add-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.25);
                    color: var(--text-main, #e8eaed);
                }

                /* Drop highlight for folder rows */
                .gf-drop-highlight {
                    background: rgba(138, 180, 248, 0.15) !important;
                }
            `);
        },

        // --- 渲染到详情面板 ---
        renderToDetailsPane(container) {
            // Section Title
            const title = document.createElement('div');
            title.className = 'section-title';
            title.textContent = 'Folders';
            container.appendChild(title);

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

            // 渲染文件夹列表
            if (this.data.folderOrder.length === 0) {
                const hint = document.createElement('div');
                hint.style.cssText = 'font-size: 10px; color: var(--text-sub); opacity: 0.6; padding: 4px 8px;';
                hint.textContent = 'Drag chats here to organize';
                container.appendChild(hint);
            } else {
                this.data.folderOrder.forEach(folderId => {
                    const folder = this.data.folders[folderId];
                    if (!folder) return;

                    const chats = chatsByFolder[folderId] || [];
                    const folderEl = this.createFolderRow(folderId, folder, chats);
                    container.appendChild(folderEl);
                });
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
        },

        createFolderRow(folderId, folder, chats) {
            const wrapper = document.createElement('div');
            wrapper.className = 'gf-folder-wrapper';

            // Folder header row
            const row = document.createElement('div');
            row.className = `gf-folder-row ${folder.collapsed ? 'collapsed' : ''}`;

            // Color dot
            const dot = document.createElement('div');
            dot.className = 'gf-folder-dot';
            dot.style.background = folder.color;

            // Name
            const label = document.createElement('span');
            label.className = 'gf-folder-label';
            label.textContent = folder.name;

            // Count badge
            const badge = document.createElement('span');
            badge.className = 'gf-folder-badge';
            badge.textContent = chats.length > 0 ? `(${chats.length})` : '';

            // Toggle arrow
            const toggle = document.createElement('span');
            toggle.className = 'gf-folder-toggle';
            toggle.textContent = '▼';

            // Actions
            const actions = document.createElement('div');
            actions.className = 'gf-folder-actions';

            const editBtn = document.createElement('span');
            editBtn.className = 'gf-folder-action';
            editBtn.textContent = '✏️';
            editBtn.title = 'Edit';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                this.showFolderModal(folderId, 'Edit Folder', folder.name, folder.color);
            };

            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'gf-folder-action';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${folder.name}"?`)) {
                    this.deleteFolder(folderId);
                }
            };

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

            // Drag & Drop
            row.ondragover = (e) => {
                e.preventDefault();
                row.classList.add('drop-active');
            };
            row.ondragleave = () => {
                row.classList.remove('drop-active');
            };
            row.ondrop = (e) => {
                e.preventDefault();
                row.classList.remove('drop-active');
                if (this.dragState) {
                    this.moveChatToFolder(this.dragState.chatId, folderId);
                }
            };

            wrapper.appendChild(row);

            // Chat items (if not collapsed)
            if (!folder.collapsed && chats.length > 0) {
                chats.forEach(chat => {
                    const chatRow = document.createElement('div');
                    chatRow.className = 'gf-chat-row';

                    const chatTitle = document.createElement('span');
                    chatTitle.className = 'gf-chat-title';
                    chatTitle.textContent = chat.title.length > 20 ? chat.title.slice(0, 20) + '...' : chat.title;
                    chatTitle.title = chat.title;

                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'gf-chat-remove';
                    removeBtn.textContent = '✕';
                    removeBtn.title = 'Remove from folder';
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.moveChatToFolder(chat.id, null);
                    };

                    chatRow.appendChild(chatTitle);
                    chatRow.appendChild(removeBtn);

                    // Click to navigate (use sidebar link for SPA navigation)
                    chatRow.onclick = (e) => {
                        e.stopPropagation();
                        // 尝试使用侧边栏原有链接进行 SPA 导航
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
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            const modal = document.createElement('div');
            modal.className = 'gf-modal';
            Core.applyTheme(modal, currentTheme);

            const titleEl = document.createElement('div');
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
                const colorBtn = document.createElement('div');
                colorBtn.className = `gf-color-option ${color === selectedColor ? 'selected' : ''}`;
                colorBtn.style.background = color;
                colorBtn.onclick = () => {
                    colorsContainer.querySelectorAll('.gf-color-option').forEach(c => c.classList.remove('selected'));
                    colorBtn.classList.add('selected');
                    selectedColor = color;
                };
                colorsContainer.appendChild(colorBtn);
            });

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'gf-modal-actions';

            if (isEdit) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'gf-modal-btn danger';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => {
                    this.deleteFolder(folderId);
                    overlay.remove();
                };
                actionsDiv.appendChild(deleteBtn);
            }

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'gf-modal-btn secondary';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => overlay.remove();

            const saveBtn = document.createElement('button');
            saveBtn.className = 'gf-modal-btn primary';
            saveBtn.textContent = isEdit ? 'Save' : 'Create';
            saveBtn.onclick = () => {
                const name = input.value.trim() || 'New Folder';
                if (isEdit) {
                    this.renameFolder(folderId, name);
                    this.setFolderColor(folderId, selectedColor);
                } else {
                    this.createFolder(name, selectedColor);
                }
                overlay.remove();
            };

            actionsDiv.appendChild(cancelBtn);
            actionsDiv.appendChild(saveBtn);

            modal.appendChild(titleEl);
            modal.appendChild(input);
            modal.appendChild(colorsContainer);
            modal.appendChild(actionsDiv);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            input.focus();
            input.select();
        }
    };

    // 注册文件夹模块
    ModuleRegistry.register(FoldersModule);

    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║                          PANEL UI (面板界面)                               ║
    // ╚══════════════════════════════════════════════════════════════════════════╝

    const PanelUI = {
        // --- 样式注入 ---
        injectStyles() {
            GM_addStyle(`
                #${PANEL_ID} {
                    --bg: #202124; --text-main: #fff; --text-sub: #ccc; --accent: #8ab4f8;
                    --blur: 18px; --saturate: 180%;
                    position: fixed; z-index: 2147483647; width: 170px;
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
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex; align-items: center; justify-content: space-between; height: 32px;
                }
                .user-capsule {
                    display: flex; align-items: center; gap: 4px;
                    font-size: 10px; color: var(--text-sub);
                    background: rgba(255,255,255,0.05);
                    padding: 2px 8px; border-radius: 12px; border: 1px solid transparent;
                    max-width: 120px; overflow: hidden;
                }
                .acct-badge-inline {
                    font-size: 8px; font-weight: 600; letter-spacing: 0.4px;
                    padding: 1px 5px; border-radius: 10px;
                    background: rgba(255,255,255,0.06);
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
                    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
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
                    border: 1px solid rgba(255,255,255,0.15);
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
                    font-size: 9px; color: var(--text-sub); opacity: 0.6;
                    margin-bottom: 8px; font-family: monospace;
                }

                .gemini-sub-info {
                    font-size: 10px; color: var(--text-sub); margin-bottom: 8px;
                    font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .gemini-details-view {
                    height: 0; opacity: 0; overflow: hidden; background: rgba(0,0,0,0.1);
                    padding: 0 12px;
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .gemini-details-view.expanded { height: auto; opacity: 1; padding: 10px 12px 14px 12px; border-top: 1px solid var(--border); }
                .section-title {
                    font-size: 9px; color: var(--text-sub); opacity: 0.5;
                    margin: 8px 0 4px 0; text-transform: uppercase; letter-spacing: 1px;
                }
                .detail-row {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 4px; font-size: 11px; color: var(--text-sub); cursor: pointer;
                    padding: 5px 8px; border-radius: 6px;
                    transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .detail-row:hover { background: var(--row-hover); color: var(--text-main); }
                .detail-row.active-mode { background: rgba(138, 180, 248, 0.15); color: var(--accent); font-weight: 500; }
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
                    background: rgba(0,0,0,0.6); z-index: 2147483646;
                    display: flex; align-items: center; justify-content: center;
                }
                .settings-modal {
                    width: 300px; max-height: 80vh; overflow-y: auto;
                    background: var(--bg, #202124); border: 1px solid var(--border, rgba(255,255,255,0.1));
                    border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    font-family: 'Google Sans', Roboto, sans-serif;
                }
                .settings-header {
                    padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
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
                    padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
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
                    background: rgba(0,0,0,0.6); z-index: 2147483646;
                    display: flex; align-items: center; justify-content: center;
                }
                .debug-modal {
                    width: 520px; max-width: 95vw; max-height: 85vh; overflow-y: auto;
                    background: var(--bg, #202124); border: 1px solid var(--border, rgba(255,255,255,0.1));
                    border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    font-family: 'Google Sans', Roboto, sans-serif;
                }
                .debug-header {
                    padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
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
                    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px; padding: 8px; max-height: 240px; overflow: auto;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    font-size: 10px; color: var(--text-sub);
                }
                .debug-log-item { padding: 2px 0; border-bottom: 1px dashed rgba(255,255,255,0.05); }
                .debug-log-item:last-child { border-bottom: none; }
                .debug-filter-row { display: flex; gap: 6px; flex-wrap: wrap; }
                .debug-filter-btn {
                    font-size: 10px; padding: 4px 8px; border-radius: 6px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: var(--text-sub); cursor: pointer;
                }
                .debug-filter-btn.active { color: var(--text-main); border-color: var(--accent); }
                .debug-search {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
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
                    padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .module-info { display: flex; align-items: center; gap: 8px; }
                .module-icon { font-size: 16px; }
                .module-text { display: flex; flex-direction: column; }
                .module-name { font-size: 12px; color: var(--text-main, #fff); }
                .module-desc { font-size: 9px; color: var(--text-sub, #9aa0a6); opacity: 0.7; }
                .toggle-switch {
                    position: relative; width: 36px; height: 20px;
                    background: rgba(255,255,255,0.1); border-radius: 10px;
                    cursor: pointer; transition: background 0.2s;
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
                    background: rgba(0,0,0,0.85); z-index: 2147483645;
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(5px);
                }
                .dash-modal {
                    width: 800px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
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
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
                    border-radius: 16px; padding: 20px; text-align: center;
                    transition: transform 0.2s;
                }
                .metric-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.06); }
                .metric-val { font-size: 32px; color: var(--text-main); font-weight: 300; margin-bottom: 4px; }
                .metric-label { font-size: 12px; color: var(--text-sub); text-transform: uppercase; letter-spacing: 1px; }

                /* Heatmap */
                .heatmap-container {
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
                    border-radius: 16px; padding: 24px; overflow-x: auto;
                }
                .heatmap-title { font-size: 14px; color: var(--text-main); margin-bottom: 16px; display: flex; justify-content: space-between; }
                .heatmap-grid { display: flex; gap: 4px; }
                .heatmap-col { display: flex; flex-direction: column; gap: 4px; }
                .heatmap-cell {
                    width: 12px; height: 12px; border-radius: 2px;
                    background: rgba(255,255,255,0.1); position: relative;
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
                    pointer-events: none; z-index: 2147483647; opacity: 0; transition: opacity 0.1s;
                    transform: translate(-50%, -100%); margin-top: -8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                }
                .g-tooltip.visible { opacity: 1; }

                /* Level Colors */
                .l-0 { background: rgba(255,255,255,0.05); }
                .l-1 { background: rgba(138, 180, 248, 0.2); }
                .l-2 { background: rgba(138, 180, 248, 0.4); }
                .l-3 { background: rgba(138, 180, 248, 0.7); }
                .l-4 { background: rgba(138, 180, 248, 1.0); }
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
                const toggle = document.createElement('span');
                toggle.className = 'gemini-toggle-btn';
                toggle.textContent = '☰';
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
                    row.onclick = (e) => {
                        e.stopPropagation();
                        Core.setInspectingUser(uid);
                        cm.loadDataForUser(uid);
                        cm.state.viewMode = 'total';
                        this.renderDetailsPane();
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

            // Folders (if enabled)
            if (ModuleRegistry.isEnabled('folders')) {
                FoldersModule.renderToDetailsPane(pane);
            }

            // Themes
            pane.appendChild(this.createSectionTitle('Themes'));
            const themes = Core.getThemes();
            Object.keys(themes).forEach(key => {
                const row = document.createElement('div');
                row.className = `detail-row ${currentTheme === key ? 'active-mode' : ''}`;
                row.textContent = themes[key].name;
                row.onclick = (e) => {
                    e.stopPropagation();
                    Core.setTheme(key);
                    currentTheme = key;
                    const panel = document.getElementById(PANEL_ID);
                    Core.applyTheme(panel, key);
                    this.renderDetailsPane();
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
                const pct = Math.min((used / cm.quotaLimit) * 100, 100);
                quotaFill.style.width = pct + '%';
                if (pct < 60) quotaFill.style.background = '#34a853';
                else if (pct < 85) quotaFill.style.background = '#fbbc04';
                else quotaFill.style.background = '#ea4335';
                quotaLabel.textContent = `${used} / ${cm.quotaLimit} msgs`;
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
            const savedLeft = parseFloat(pos.left);
            const savedTop = parseFloat(pos.top);

            if ((savedLeft && savedLeft > winW - 50) || (savedTop && savedTop > winH - 50)) {
                if (pos.left !== 'auto' && pos.top !== 'auto') {
                    console.warn(`💎 Panel off-screen detected. Resetting.`);
                    pos = DEFAULT_POS;
                    GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS);
                }
            }
            el.style.top = pos.top;
            el.style.left = pos.left;
            el.style.bottom = pos.bottom;
            el.style.right = pos.right;
        },

        makeDraggable(el, handle) {
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
            document.addEventListener('mousemove', (e) => {
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
            });
            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                handle.style.cursor = 'grab';
                GM_setValue(GLOBAL_KEYS.POS, { top: el.style.top, left: el.style.left, bottom: 'auto', right: 'auto' });
            });
        },

        // --- Settings Modal ---
        openSettingsModal() {
            const SETTINGS_MODAL_ID = 'gemini-settings-modal';
            if (document.getElementById(SETTINGS_MODAL_ID)) return;

            const overlay = document.createElement('div');
            overlay.id = SETTINGS_MODAL_ID;
            overlay.className = 'settings-overlay';
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            const modal = document.createElement('div');
            modal.className = 'settings-modal';
            Core.applyTheme(modal, currentTheme);

            // Header
            const header = document.createElement('div');
            header.className = 'settings-header';
            const title = document.createElement('h3');
            title.textContent = '⚙️ Settings';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'settings-close';
            closeBtn.textContent = '✕';
            closeBtn.onclick = () => overlay.remove();
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
                row.className = 'module-toggle-row';

                const info = document.createElement('div');
                info.className = 'module-info';
                const icon = document.createElement('span');
                icon.className = 'module-icon';
                icon.textContent = mod.icon;
                const textDiv = document.createElement('div');
                textDiv.className = 'module-text';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'module-name';
                nameSpan.textContent = mod.name;
                const descSpan = document.createElement('span');
                descSpan.className = 'module-desc';
                descSpan.textContent = mod.description;
                textDiv.appendChild(nameSpan);
                textDiv.appendChild(descSpan);
                info.appendChild(icon);
                info.appendChild(textDiv);

                const toggle = document.createElement('div');
                toggle.className = `toggle-switch ${ModuleRegistry.isEnabled(mod.id) ? 'on' : ''}`;
                toggle.onclick = () => {
                    ModuleRegistry.toggle(mod.id);
                    toggle.classList.toggle('on');
                    // 刷新详情面板以显示/隐藏 Folders 区域
                    if (mod.id === 'folders' && CounterModule.state.isExpanded) {
                        PanelUI.renderDetailsPane();
                    }
                };

                row.appendChild(info);
                row.appendChild(toggle);
                extSection.appendChild(row);
            });
            body.appendChild(extSection);

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
                a.download = `gemini-counter-${Core.getCurrentUser().split('@')[0]}-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
            };
            dataSection.appendChild(exportBtn);

            const resetPosBtn = document.createElement('button');
            resetPosBtn.className = 'settings-btn';
            resetPosBtn.textContent = '📍 Reset Panel Position';
            resetPosBtn.onclick = () => {
                GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS);
                overlay.remove();
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
            const debugToggle = document.createElement('div');
            debugToggle.className = `toggle-switch ${isDebugEnabled() ? 'on' : ''}`;
            debugToggle.onclick = () => {
                const enabled = !isDebugEnabled();
                setDebugEnabled(enabled);
                debugToggle.classList.toggle('on');
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
            version.textContent = 'Gemini Assistant v7.6 (Modular)';
            body.appendChild(version);

            modal.appendChild(header);
            modal.appendChild(body);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
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
                overlay.remove();
            };
            overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

            const modal = document.createElement('div');
            modal.className = 'debug-modal';
            Core.applyTheme(modal, currentTheme);

            const header = document.createElement('div');
            header.className = 'debug-header';
            const title = document.createElement('h3');
            title.textContent = '🧰 Debug Panel';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'debug-close';
            closeBtn.textContent = '✕';
            closeBtn.onclick = () => closeModal();
            header.appendChild(title);
            header.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'debug-body';

            const info = document.createElement('div');
            info.className = 'debug-kv';

            const infoLine = (label, value) => {
                const div = document.createElement('div');
                div.innerHTML = `<strong>${label}:</strong> ${value}`;
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
        },

        // --- Dashboard Modal ---
        openDashboard() {
            const exist = document.getElementById('gemini-dashboard-overlay');
            if (exist) return;

            const cm = CounterModule;
            const overlay = document.createElement('div');
            overlay.id = 'gemini-dashboard-overlay';
            overlay.className = 'dash-overlay';
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            const modal = document.createElement('div');
            modal.className = 'dash-modal';
            Core.applyTheme(modal, currentTheme);

            // Header
            const header = document.createElement('div');
            header.className = 'dash-header';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'dash-title';
            titleDiv.textContent = '📊 Analytics ';
            const userSpan = document.createElement('span');
            userSpan.style.fontSize = '12px';
            userSpan.style.opacity = '0.5';
            userSpan.style.marginTop = '8px';
            userSpan.textContent = Core.getCurrentUser().split('@')[0];
            titleDiv.appendChild(userSpan);

            const close = document.createElement('div');
            close.className = 'dash-close';
            close.textContent = '×';
            close.onclick = () => overlay.remove();

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
                    const key = iterDate.toISOString().slice(0, 10);
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

            modal.appendChild(content);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

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
    }

    // --- 初始化 ---
    PanelUI.injectStyles();
    ModuleRegistry.init();
    setInterval(checkUserAndPanel, 1500);

    // 窗口聚焦自动同步
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && inspectingUser) {
            CounterModule.loadDataForUser(inspectingUser);
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
