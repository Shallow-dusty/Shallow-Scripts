// ==UserScript==
// @name         Gemini Counter Ultimate (v6.0)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  终极版：历史曲线图 + 设置面板 + 每日配额 + 累计对话数 + 多窗口同步 + 主题系统
// @author       Script Weaver
// @match        https://gemini.google.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    console.log("💎 Gemini Counter Ultimate v6.0 Starting...");

    // --- 🎨 主题配置 ---
    const THEMES = {
        glass: {
            name: "🌌 Glass",
            vars: {
                '--bg': 'rgba(32, 33, 36, 0.95)',
                '--blur': '12px',
                '--border': 'rgba(255, 255, 255, 0.1)',
                '--text-main': '#a8c7fa',
                '--text-sub': '#9aa0a6',
                '--accent': '#8ab4f8',
                '--btn-bg': 'rgba(255, 255, 255, 0.05)',
                '--row-hover': 'rgba(255, 255, 255, 0.05)',
                '--shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
            }
        },
        cyber: {
            name: "⚡ Cyber",
            vars: {
                '--bg': 'rgba(10, 10, 10, 0.98)',
                '--blur': '0px',
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
                '--bg': 'rgba(255, 255, 255, 0.95)',
                '--blur': '8px',
                '--border': '#dadce0',
                '--text-main': '#1a73e8',
                '--text-sub': '#5f6368',
                '--accent': '#1a73e8',
                '--btn-bg': '#f1f3f4',
                '--row-hover': '#f8f9fa',
                '--shadow': '0 4px 12px rgba(60, 64, 67, 0.15)'
            }
        }
    };

    // --- 🔧 常量 ---
    const GLOBAL_KEYS = {
        POS: 'gemini_panel_pos',
        REGISTRY: 'gemini_user_registry',
        THEME: 'gemini_current_theme',
        RESET_HOUR: 'gemini_reset_hour'
    };
    const PANEL_ID = 'gemini-monitor-panel-v55';
    const COOLDOWN = 1000;
    const DEFAULT_POS = { top: 'auto', left: 'auto', bottom: '85px', right: '30px' };
    const TEMP_USER = "Guest";

    // --- 📊 状态 ---
    let currentUser = TEMP_USER;
    let inspectingUser = TEMP_USER;
    let currentTheme = GM_getValue(GLOBAL_KEYS.THEME, 'glass');
    let resetHour = GM_getValue(GLOBAL_KEYS.RESET_HOUR, 0); // 默认凌晨0点重置
    let storageListenerId = null;

    let state = {
        total: 0,                  // 历史总消息数
        totalChatsCreated: 0,      // 累计创建对话数
        chats: {},                 // 每个对话的消息数 { chatId: count }
        dailyCounts: {},           // 每日统计 { "YYYY-MM-DD": { messages: N, chats: N } }
        viewMode: 'today',         // 默认显示今日 (替代原 session)
        isExpanded: false,
        resetStep: 0
    };
    let lastCountTime = 0;

    // --- 🕐 每日计算辅助 ---
    function getDayKey(resetHour = 0) {
        const now = new Date();
        // 如果当前小时 < resetHour，则算作"昨天"
        if (now.getHours() < resetHour) {
            now.setDate(now.getDate() - 1);
        }
        return now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    }

    function ensureTodayEntry() {
        const today = getDayKey(resetHour);
        if (!state.dailyCounts[today]) {
            state.dailyCounts[today] = { messages: 0, chats: 0 };
        }
        return today;
    }

    function getTodayMessages() {
        const today = getDayKey(resetHour);
        return state.dailyCounts[today]?.messages || 0;
    }

    function getTodayChats() {
        const today = getDayKey(resetHour);
        return state.dailyCounts[today]?.chats || 0;
    }

    // 获取过去 7 天的数据 (用于曲线图)
    function getLast7DaysData() {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            result.push({
                date: key,
                label: `${d.getMonth() + 1}/${d.getDate()}`,
                messages: state.dailyCounts[key]?.messages || 0,
                chats: state.dailyCounts[key]?.chats || 0
            });
        }
        return result;
    }

    // --- 🛠️ 核心功能 ---
    function registerUser(userId) {
        if (!userId || userId === TEMP_USER || !userId.includes('@')) return;
        let registry = GM_getValue(GLOBAL_KEYS.REGISTRY, []);
        if (!registry.includes(userId)) {
            registry.push(userId);
            GM_setValue(GLOBAL_KEYS.REGISTRY, registry);
        }
    }
    function getAllUsers() { return GM_getValue(GLOBAL_KEYS.REGISTRY, []); }

    function detectUser() {
        try {
            const candidates = document.querySelectorAll('a[aria-label*="@"], button[aria-label*="@"], div[aria-label*="帐号"], div[aria-label*="Account"]');
            for (let el of candidates) {
                const label = el.getAttribute('aria-label') || "";
                const match = label.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
                if (match && match[1]) return match[1];
            }
        } catch (e) { }
        return null;
    }

    function setupStorageListener(targetUser) {
        if (storageListenerId) {
            GM_removeValueChangeListener(storageListenerId);
            storageListenerId = null;
        }
        if (!targetUser || targetUser === TEMP_USER) return;

        const storageKey = `gemini_store_${targetUser}`;
        storageListenerId = GM_addValueChangeListener(storageKey, (name, oldVal, newVal, remote) => {
            if (remote && newVal) {
                state.total = newVal.total || 0;
                state.totalChatsCreated = newVal.totalChatsCreated || 0;
                state.chats = newVal.chats || {};
                state.dailyCounts = newVal.dailyCounts || {};
                updateUI();
                if (state.isExpanded) renderDetailsPane();
            }
        });
    }

    function loadDataForView(targetUser) {
        if (!targetUser) return;
        inspectingUser = targetUser;
        setupStorageListener(targetUser);

        if (targetUser === TEMP_USER) {
            state.total = 0; state.totalChatsCreated = 0; state.chats = {}; state.dailyCounts = {};
            return;
        }

        const storageKey = `gemini_store_${targetUser}`;
        const savedData = GM_getValue(storageKey, null);
        if (savedData) {
            state.total = savedData.total || 0;
            state.totalChatsCreated = savedData.totalChatsCreated || 0;
            state.chats = savedData.chats || {};
            state.dailyCounts = savedData.dailyCounts || {};
            // 兼容旧版数据: 如果有 session 但没有 dailyCounts，迁移
            if (savedData.session && Object.keys(state.dailyCounts).length === 0) {
                const today = getDayKey(resetHour);
                state.dailyCounts[today] = { messages: savedData.session, chats: 0 };
            }
        } else {
            state.total = 0; state.totalChatsCreated = 0; state.chats = {}; state.dailyCounts = {};
        }
        updateUI();
    }

    function saveCurrentUserData() {
        if (!currentUser || !currentUser.includes('@')) return;
        const storageKey = `gemini_store_${currentUser}`;
        GM_setValue(storageKey, {
            total: state.total,
            totalChatsCreated: state.totalChatsCreated,
            chats: state.chats,
            dailyCounts: state.dailyCounts
        });
    }

    function getChatId() {
        try {
            const match = window.location.pathname.match(/\/app\/([a-zA-Z0-9\-_]+)/);
            return match ? match[1] : null;
        } catch (e) { return null; }
    }

    // --- 🎨 样式 ---
    function injectStyles() {
        GM_addStyle(`
            #${PANEL_ID} {
                --bg: #202124; --text-main: #fff; --text-sub: #ccc; --accent: #8ab4f8;
                position: fixed; z-index: 2147483647; width: 170px;
                background: var(--bg);
                backdrop-filter: blur(var(--blur)); -webkit-backdrop-filter: blur(var(--blur));
                border: 1px solid var(--border); border-radius: 16px;
                box-shadow: var(--shadow);
                font-family: 'Google Sans', Roboto, sans-serif;
                overflow: hidden; user-select: none;
                display: flex; flex-direction: column;
                transition: height 0.3s, background 0.3s;
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
            }
            .user-capsule.viewing-other { border-color: #fdbd00; color: #fdbd00; }
            .user-avatar-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
            .gemini-toggle-btn { cursor: pointer; font-size: 14px; opacity: 0.6; color: var(--text-sub); }
            .gemini-toggle-btn:hover { opacity: 1; color: var(--accent); }
            .gemini-main-view { padding: 16px 14px; text-align: center; }
            .gemini-big-num {
                font-size: 40px; font-weight: 400; color: var(--text-main); line-height: 1;
                margin-bottom: 6px; text-shadow: 0 0 20px rgba(128, 128, 128, 0.1);
            }
            .gemini-sub-info {
                font-size: 10px; color: var(--text-sub); margin-bottom: 12px;
                font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .gemini-details-view {
                height: 0; opacity: 0; overflow: hidden; background: rgba(0,0,0,0.1);
                padding: 0 12px; transition: all 0.3s ease;
            }
            .gemini-details-view.expanded { height: auto; opacity: 1; padding: 10px 12px 14px 12px; border-top: 1px solid var(--border); }
            .section-title {
                font-size: 9px; color: var(--text-sub); opacity: 0.5;
                margin: 8px 0 4px 0; text-transform: uppercase; letter-spacing: 1px;
            }
            .detail-row {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 4px; font-size: 11px; color: var(--text-sub); cursor: pointer;
                padding: 5px 8px; border-radius: 6px; transition: background 0.2s;
            }
            .detail-row:hover { background: var(--row-hover); color: var(--text-main); }
            .detail-row.active-mode { background: rgba(138, 180, 248, 0.15); color: var(--accent); font-weight: 500; }
            .user-row { justify-content: flex-start; gap: 6px; }
            .user-row.is-me { border-left: 2px solid var(--accent); }
            .user-indicator { font-size: 8px; padding: 1px 4px; border-radius: 4px; background: var(--accent); color: #000; }
            .g-btn {
                background: var(--btn-bg); border: 1px solid transparent;
                color: var(--text-sub); border-radius: 6px; padding: 6px 0; font-size: 11px;
                cursor: pointer; transition: all 0.2s; width: 100%;
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
                width: 280px; max-height: 80vh; overflow-y: auto;
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
        `);
    }

    // --- 🏗️ UI 构建 ---
    function createPanel() {
        try {
            const container = document.createElement('div');
            container.id = PANEL_ID;
            container.className = 'notranslate';
            container.setAttribute('translate', 'no');
            applyPos(container, GM_getValue(GLOBAL_KEYS.POS, DEFAULT_POS));
            applyTheme(container, currentTheme);

            const header = document.createElement('div');
            header.className = 'gemini-header';
            const userCapsule = document.createElement('div');
            userCapsule.id = 'g-user-capsule';
            userCapsule.className = 'user-capsule';
            const toggle = document.createElement('span');
            toggle.className = 'gemini-toggle-btn';
            toggle.textContent = '☰';
            toggle.onmousedown = (e) => e.stopPropagation();
            toggle.onclick = () => toggleDetails();
            header.appendChild(userCapsule);
            header.appendChild(toggle);

            const mainView = document.createElement('div');
            mainView.className = 'gemini-main-view';
            const bigDisplay = document.createElement('div');
            bigDisplay.id = 'g-big-display';
            bigDisplay.className = 'gemini-big-num';
            bigDisplay.textContent = '0';

            const subInfo = document.createElement('div');
            subInfo.id = 'g-sub-info';
            subInfo.className = 'gemini-sub-info';
            subInfo.textContent = 'Today';

            const actionBtn = document.createElement('button');
            actionBtn.id = 'g-action-btn';
            actionBtn.className = 'g-btn';
            actionBtn.textContent = 'Reset Today';
            actionBtn.onclick = handleReset;
            actionBtn.onmousedown = (e) => e.stopPropagation();

            mainView.appendChild(bigDisplay);
            mainView.appendChild(subInfo);
            mainView.appendChild(actionBtn);

            const details = document.createElement('div');
            details.id = 'g-details-pane';
            details.className = 'gemini-details-view';

            container.appendChild(header);
            container.appendChild(mainView);
            container.appendChild(details);
            document.body.appendChild(container);

            makeDraggable(container, header);
            renderDetailsPane(); 
            updateUI(); 

        } catch (e) { console.error("Init error", e); }
    }

    function renderDetailsPane() {
        const pane = document.getElementById('g-details-pane');
        if (!pane) return;
        pane.replaceChildren();

        // Stats
        pane.appendChild(createSectionTitle('Statistics'));
        const cid = getChatId();
        pane.appendChild(createRow('Today', 'today', getTodayMessages()));
        pane.appendChild(createRow('Current Chat', 'chat', cid ? (state.chats[cid] || 0) : 0));
        pane.appendChild(createRow('Chats Created', 'chatsCreated', state.totalChatsCreated));
        pane.appendChild(createRow('Lifetime', 'total', state.total));

        // Profiles
        pane.appendChild(createSectionTitle('Profiles'));
        const users = getAllUsers();
        const sortedUsers = users.sort((a, b) => (a === currentUser ? -1 : b === currentUser ? 1 : a.localeCompare(b)));

        if (sortedUsers.length === 0 && currentUser === TEMP_USER) {
            const row = document.createElement('div');
            row.className = 'detail-row';
            row.textContent = 'Waiting for login...';
            pane.appendChild(row);
        } else {
            sortedUsers.forEach(uid => {
                const row = document.createElement('div');
                row.className = `detail-row user-row ${uid === currentUser ? 'is-me' : ''} ${uid === inspectingUser ? 'active-mode' : ''}`;
                row.onclick = (e) => {
                    e.stopPropagation();
                    inspectingUser = uid;
                    loadDataForView(uid);
                    state.viewMode = 'total';
                    renderDetailsPane();
                };
                const nameSpan = document.createElement('span');
                nameSpan.textContent = uid.split('@')[0];
                row.appendChild(nameSpan);
                if (uid === currentUser) {
                    const meBadge = document.createElement('span');
                    meBadge.className = 'user-indicator';
                    meBadge.textContent = 'ME';
                    row.appendChild(meBadge);
                }
                pane.appendChild(row);
            });
        }

        // Themes
        pane.appendChild(createSectionTitle('Themes'));
        Object.keys(THEMES).forEach(key => {
            const row = document.createElement('div');
            row.className = `detail-row ${currentTheme === key ? 'active-mode' : ''}`;
            row.textContent = THEMES[key].name;
            row.onclick = (e) => {
                e.stopPropagation();
                currentTheme = key;
                GM_setValue(GLOBAL_KEYS.THEME, key);
                const panel = document.getElementById(PANEL_ID);
                applyTheme(panel, key);
                renderDetailsPane();
            };
            pane.appendChild(row);
        });

        // Settings Button
        pane.appendChild(createSectionTitle(''));
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'g-btn';
        settingsBtn.textContent = '⚙️ Settings';
        settingsBtn.onclick = (e) => { e.stopPropagation(); openSettingsModal(); };
        settingsBtn.onmousedown = (e) => e.stopPropagation();
        pane.appendChild(settingsBtn);
    }

    function createSectionTitle(text) {
        const div = document.createElement('div');
        div.className = 'section-title';
        div.textContent = text;
        return div;
    }
    function createRow(label, mode, val) {
        const row = document.createElement('div');
        row.className = `detail-row ${state.viewMode === mode && inspectingUser === currentUser ? 'active-mode' : ''}`;
        const labelSpan = document.createElement('span'); labelSpan.textContent = label;
        const valSpan = document.createElement('span'); valSpan.className = 'detail-val'; valSpan.textContent = val;
        row.appendChild(labelSpan); row.appendChild(valSpan);
        row.onclick = (e) => {
            e.stopPropagation();
            if (inspectingUser !== currentUser) { inspectingUser = currentUser; loadDataForView(currentUser); }
            state.viewMode = mode; updateUI(); renderDetailsPane();
        };
        return row;
    }

    function applyTheme(el, themeKey) {
        if (!el || !THEMES[themeKey]) return;
        const vars = THEMES[themeKey].vars;
        for (const [key, val] of Object.entries(vars)) el.style.setProperty(key, val);
    }

    function updateUI() {
        const bigDisplay = document.getElementById('g-big-display');
        const subInfo = document.getElementById('g-sub-info');
        const actionBtn = document.getElementById('g-action-btn');
        const capsule = document.getElementById('g-user-capsule');
        if (!bigDisplay) return;

        // Capsule
        const isMe = inspectingUser === currentUser;
        const displayName = inspectingUser === TEMP_USER ? 'Guest' : inspectingUser.split('@')[0];

        capsule.replaceChildren(); 
        const dot = document.createElement('div');
        dot.className = 'user-avatar-dot';
        const name = document.createElement('span');
        name.textContent = displayName;
        capsule.appendChild(dot);
        capsule.appendChild(name);

        if (!isMe) {
            capsule.classList.add('viewing-other');
            capsule.title = "Viewing other user (Read Only)";
        } else {
            capsule.classList.remove('viewing-other');
            capsule.title = "Active User";
        }

        let val = 0, sub = "", btn = "Reset";
        let disableBtn = !isMe;

        if (state.viewMode === 'today') {
            val = getTodayMessages();
            sub = `Today (Reset @${resetHour}:00)`;
            btn = "Reset Today";
            if (!isMe) { val = getTodayMessages(); sub = `Today (${inspectingUser.split('@')[0]})`; }
        } else if (state.viewMode === 'chat') {
            if (!isMe) {
                val = "--"; sub = "Different Context"; disableBtn = true;
            } else {
                const cid = getChatId();
                val = cid ? (state.chats[cid] || 0) : 0;
                sub = cid ? `ID: ${cid.slice(0, 8)}...` : 'ID: New Chat';
                btn = "Reset Chat";
            }
        } else if (state.viewMode === 'chatsCreated') {
            val = state.totalChatsCreated;
            sub = "Chats Created";
            btn = "View Only";
            disableBtn = true; // 历史累计，不可重置
        } else if (state.viewMode === 'total') {
            val = state.total; sub = "Lifetime History"; btn = "Clear History";
        }

        bigDisplay.textContent = val;
        subInfo.textContent = sub;

        if (disableBtn) {
            actionBtn.textContent = "View Only";
            actionBtn.className = 'g-btn disabled';
            actionBtn.disabled = true;
        } else {
            actionBtn.disabled = false;
            if (state.resetStep === 0) {
                actionBtn.textContent = btn;
                actionBtn.className = 'g-btn';
            } else {
                actionBtn.textContent = state.resetStep === 1 ? "Sure?" : "Really?";
                actionBtn.className = `g-btn danger-${state.resetStep}`;
            }
        }
    }

    function handleReset() {
        if (inspectingUser !== currentUser) return;
        if (state.viewMode === 'today') {
            const today = getDayKey(resetHour);
            if (state.dailyCounts[today]) {
                state.dailyCounts[today].messages = 0;
            }
            state.resetStep = 0;
        } else if (state.viewMode === 'chat') {
            if (state.resetStep === 0) { state.resetStep = 1; updateUI(); return; }
            const cid = getChatId();
            if (cid) state.chats[cid] = 0;
            state.resetStep = 0;
        } else if (state.viewMode === 'total') {
            if (state.resetStep === 0) { state.resetStep = 1; updateUI(); return; }
            if (state.resetStep === 1) { state.resetStep = 2; updateUI(); return; }
            state.total = 0; state.chats = {}; state.dailyCounts = {}; state.totalChatsCreated = 0;
            state.resetStep = 0;
        }
        saveCurrentUserData();
        updateUI();
        renderDetailsPane();
    }

    function attemptIncrement() {
        const now = Date.now();
        if (now - lastCountTime < COOLDOWN) return;

        const today = ensureTodayEntry();

        // 增加消息计数
        state.total++;
        state.dailyCounts[today].messages++;
        lastCountTime = now;

        const cid = getChatId();
        
        if (cid) {
            // 检测是否为新对话
            if (!state.chats[cid]) {
                state.totalChatsCreated++;
                state.dailyCounts[today].chats++;
            }
            state.chats[cid] = (state.chats[cid] || 0) + 1;
            saveCurrentUserData();
            updateUI();
            if (state.isExpanded) renderDetailsPane();
        } else {
            // 新对话，开启轮询
            saveCurrentUserData();
            updateUI();
            let attempts = 0;
            const maxAttempts = 20;
            const poller = setInterval(() => {
                attempts++;
                const newCid = getChatId();
                if (newCid && currentUser !== TEMP_USER) {
                    clearInterval(poller);
                    // 检测是否为新对话
                    if (!state.chats[newCid]) {
                        state.totalChatsCreated++;
                        const todayKey = ensureTodayEntry();
                        state.dailyCounts[todayKey].chats++;
                    }
                    state.chats[newCid] = (state.chats[newCid] || 0) + 1;
                    saveCurrentUserData();
                    if (inspectingUser === currentUser) {
                        updateUI();
                        if (state.isExpanded) renderDetailsPane();
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(poller);
                    saveCurrentUserData();
                }
            }, 500);
        }
    }

    function toggleDetails() {
        state.isExpanded = !state.isExpanded;
        const pane = document.getElementById('g-details-pane');
        if (pane) {
            if (state.isExpanded) { pane.classList.add('expanded'); renderDetailsPane(); }
            else { pane.classList.remove('expanded'); state.resetStep = 0; }
            updateUI();
        }
    }

    function checkUserAndPanel() {
        const detected = detectUser();
        if (detected && detected !== currentUser) {
            currentUser = detected;
            registerUser(detected);
            if (inspectingUser === TEMP_USER || inspectingUser === currentUser) {
                inspectingUser = currentUser;
            }
            loadDataForView(inspectingUser);
        }
        if (!document.getElementById(PANEL_ID)) createPanel();
    }

    // 🔥 Adaptive Viewport Check
    function applyPos(el, pos) {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const savedLeft = parseFloat(pos.left);
        const savedTop = parseFloat(pos.top);

        if ((savedLeft && savedLeft > winW - 50) || (savedTop && savedTop > winH - 50)) {
            console.warn("💎 Panel off-screen detected. Resetting.");
            el.style.top = 'auto';
            el.style.left = 'auto';
            el.style.bottom = DEFAULT_POS.bottom;
            el.style.right = DEFAULT_POS.right;
            GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS);
        } else {
            if (pos.top !== 'auto') el.style.top = pos.top;
            if (pos.left !== 'auto') el.style.left = pos.left;
            if (pos.bottom !== 'auto') el.style.bottom = pos.bottom;
            if (pos.right !== 'auto') el.style.right = pos.right;
        }
    }

    injectStyles();
    setInterval(checkUserAndPanel, 1500);

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.originalEvent?.isComposing) return;
        const act = document.activeElement;
        if (act && (act.tagName === 'TEXTAREA' || act.getAttribute('contenteditable') === 'true')) {
            setTimeout(attemptIncrement, 50);
        }
    }, true);

    document.addEventListener('click', (e) => {
        const btn = e.target?.closest ? e.target.closest('button') : null;
        if (btn && !btn.disabled) {
            const label = btn.getAttribute('aria-label') || '';
            if (label.includes('Send') || label.includes('发送')) attemptIncrement();
        }
    }, true);

    function makeDraggable(el, handle) {
        let isDragging = false, startX, startY, iLeft, iTop;
        handle.onmousedown = (e) => {
            isDragging = true; startX = e.clientX; startY = e.clientY;
            const rect = el.getBoundingClientRect();
            iLeft = rect.left; iTop = rect.top;
            el.style.bottom = 'auto'; el.style.right = 'auto';
            el.style.left = iLeft + 'px'; el.style.top = iTop + 'px';
            handle.style.cursor = 'grabbing';
        };
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            let nL = iLeft + e.clientX - startX, nT = iTop + e.clientY - startY;
            if (nT < 10) nT = 10; if (nL < 0) nL = 0;
            if (nL + el.offsetWidth > window.innerWidth) nL = window.innerWidth - el.offsetWidth;
            if (nT + el.offsetHeight > window.innerHeight) nT = window.innerHeight - el.offsetHeight;
            el.style.left = nL + 'px'; el.style.top = nT + 'px';
        });
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false; handle.style.cursor = 'grab';
            GM_setValue(GLOBAL_KEYS.POS, { top: el.style.top, left: el.style.left, bottom: 'auto', right: 'auto' });
        });
    }

    // --- ⚙️ Settings Modal ---
    const SETTINGS_MODAL_ID = 'gemini-settings-modal';

    function openSettingsModal() {
        if (document.getElementById(SETTINGS_MODAL_ID)) return; // Already open

        const overlay = document.createElement('div');
        overlay.id = SETTINGS_MODAL_ID;
        overlay.className = 'settings-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) closeSettingsModal(); };

        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        applyTheme(modal, currentTheme);

        // Header
        const header = document.createElement('div');
        header.className = 'settings-header';
        const title = document.createElement('h3');
        title.textContent = '⚙️ Settings';
        const closeBtn = document.createElement('span');
        closeBtn.className = 'settings-close';
        closeBtn.textContent = '✕';
        closeBtn.onclick = closeSettingsModal;
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'settings-body';

        // Section: Daily Reset
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
            if (h === resetHour) opt.selected = true;
            resetSelect.appendChild(opt);
        }
        resetSelect.onchange = () => {
            resetHour = parseInt(resetSelect.value, 10);
            GM_setValue(GLOBAL_KEYS.RESET_HOUR, resetHour);
            updateUI();
        };
        resetRow.appendChild(resetLabel);
        resetRow.appendChild(resetSelect);
        resetSection.appendChild(resetRow);
        body.appendChild(resetSection);

        // Section: Usage History Chart
        const chartSection = document.createElement('div');
        chartSection.className = 'settings-section';
        const chartTitle = document.createElement('div');
        chartTitle.className = 'settings-section-title';
        chartTitle.textContent = 'Usage History (Last 7 Days)';
        chartSection.appendChild(chartTitle);

        // SVG Chart
        const chartContainer = document.createElement('div');
        chartContainer.style.cssText = 'background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-top: 4px;';
        
        const data = getLast7DaysData();
        const svgWidth = 248, svgHeight = 80, padding = 20;
        const maxVal = Math.max(...data.map(d => d.messages), 1);
        
        // Calculate points
        const points = data.map((d, i) => ({
            x: padding + i * ((svgWidth - 2 * padding) / 6),
            y: svgHeight - padding - (d.messages / maxVal) * (svgHeight - 2 * padding),
            val: d.messages,
            label: d.label
        }));
        
        // Build SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', svgWidth);
        svg.setAttribute('height', svgHeight + 20);
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight + 20}`);
        
        // Area fill
        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const areaD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') 
            + ` L ${points[6].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;
        areaPath.setAttribute('d', areaD);
        areaPath.setAttribute('fill', 'rgba(138, 180, 248, 0.2)');
        svg.appendChild(areaPath);
        
        // Line
        const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        linePath.setAttribute('d', lineD);
        linePath.setAttribute('fill', 'none');
        linePath.setAttribute('stroke', 'var(--accent, #8ab4f8)');
        linePath.setAttribute('stroke-width', '2');
        linePath.setAttribute('stroke-linecap', 'round');
        linePath.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(linePath);
        
        // Data points and labels
        points.forEach((p, i) => {
            // Circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', '3');
            circle.setAttribute('fill', 'var(--accent, #8ab4f8)');
            svg.appendChild(circle);
            
            // Value label (on hover area)
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
            
            // X-axis date label
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

        // Section: Data
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
            const data = {
                total: state.total,
                totalChatsCreated: state.totalChatsCreated,
                chats: state.chats,
                dailyCounts: state.dailyCounts,
                exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gemini-counter-${currentUser.split('@')[0]}-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
        dataSection.appendChild(exportBtn);

        // Reset Position Button
        const resetPosBtn = document.createElement('button');
        resetPosBtn.className = 'settings-btn';
        resetPosBtn.textContent = '📍 Reset Panel Position';
        resetPosBtn.onclick = () => {
            GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS);
            closeSettingsModal();
            location.reload();
        };
        dataSection.appendChild(resetPosBtn);

        body.appendChild(dataSection);

        // Version
        const version = document.createElement('div');
        version.className = 'settings-version';
        version.textContent = 'Gemini Counter Ultimate v6.0';
        body.appendChild(version);

        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function closeSettingsModal() {
        const modal = document.getElementById(SETTINGS_MODAL_ID);
        if (modal) modal.remove();
    }

    // 油猴菜单命令 (保留作为备用入口)
    GM_registerMenuCommand("🔄 Reset Position", () => { GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS); location.reload(); });

})();