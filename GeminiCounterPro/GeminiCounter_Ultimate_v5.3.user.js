// ==UserScript==
// @name         Gemini Counter Ultimate (v5.3)
// @namespace    http://tampermonkey.net/
// @version      5.3
// @description  彻底修复TrustedHTML报错(使用replaceChildren) + 新对话即时响应逻辑 + 完整仪表盘功能
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

    console.log("💎 Gemini Counter Pro V17 Starting...");

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
        THEME: 'gemini_current_theme'
    };
    const PANEL_ID = 'gemini-monitor-panel-v17';
    const COOLDOWN = 1000;
    const DEFAULT_POS = { top: 'auto', left: 'auto', bottom: '85px', right: '30px' };
    const TEMP_USER = "Guest"; // 默认显示，直到识别成功

    // --- 📊 状态 ---
    let currentUser = TEMP_USER;
    let inspectingUser = TEMP_USER;
    let currentTheme = GM_getValue(GLOBAL_KEYS.THEME, 'glass');
    let storageListenerId = null; // 监听器 ID

    let state = {
        session: 0,
        total: 0,
        chats: {},
        viewMode: 'session',
        isExpanded: false,
        resetStep: 0
    };
    let lastCountTime = 0;

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
            // 优先找带@的aria-label
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
        // 1. 清理旧监听器
        if (storageListenerId) {
            GM_removeValueChangeListener(storageListenerId);
            storageListenerId = null;
        }

        // Guest 不监听
        if (!targetUser || targetUser === TEMP_USER) return;

        // 2. 注册新监听器
        const storageKey = `gemini_store_${targetUser}`;
        storageListenerId = GM_addValueChangeListener(storageKey, (name, oldVal, newVal, remote) => {
            if (remote && newVal) {
                // 仅当变化来自其他标签页时，更新本地状态
                state.total = newVal.total || 0;
                state.chats = newVal.chats || {};
                // 如果正在查看当前用户，Session 也同步（虽然 Session 是本地概念，但为了多窗口一致性，这里选择同步）
                // 注意：如果希望 Session 严格本地隔离，可以把这行去掉。但为了"Sync"体验，通常是同步的。
                if (targetUser === currentUser) {
                    state.session = newVal.session || 0;
                }
                updateUI();
                if (state.isExpanded) renderDetailsPane();
            }
        });
    }

    function loadDataForView(targetUser) {
        if (!targetUser) return;
        inspectingUser = targetUser;

        // 重新挂载监听器
        setupStorageListener(targetUser);

        // 如果是 Guest，不读库，直接全0
        if (targetUser === TEMP_USER) {
            state.total = 0; state.chats = {}; state.session = 0;
            return;
        }

        const storageKey = `gemini_store_${targetUser}`;
        const savedData = GM_getValue(storageKey, null);
        if (savedData) {
            state.total = savedData.total || 0;
            state.chats = savedData.chats || {};
            // 恢复 session 数据 (如果存在且是当前用户)
            if (targetUser === currentUser) {
                state.session = savedData.session || 0;
            }
        } else {
            state.total = 0; state.chats = {}; state.session = 0;
        }
        updateUI();
    }

    function saveCurrentUserData() {
        if (!currentUser || !currentUser.includes('@')) return;
        const storageKey = `gemini_store_${currentUser}`;
        // 保存 session 数据
        GM_setValue(storageKey, { total: state.total, chats: state.chats, session: state.session });
    }

    function getChatId() {
        try {
            const match = window.location.pathname.match(/\/app\/([a-zA-Z0-9\-_]+)/);
            return match ? match[1] : null; // null 代表 New Chat
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
        `);
    }

    // --- 🏗️ UI 构建 (V17 严格 DOM 模式) ---
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
            subInfo.textContent = 'ID: New Chat';

            const actionBtn = document.createElement('button');
            actionBtn.id = 'g-action-btn';
            actionBtn.className = 'g-btn';
            actionBtn.textContent = 'Reset';
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
            renderDetailsPane(); // 预渲染
            updateUI();

        } catch (e) { console.error("Init error", e); }
    }

    function renderDetailsPane() {
        const pane = document.getElementById('g-details-pane');
        if (!pane) return;

        // 🔥 关键修复：使用 replaceChildren 清空，严禁 innerHTML = ''
        pane.replaceChildren();

        // 1. Stats
        pane.appendChild(createSectionTitle('Statistics'));
        const cid = getChatId();
        pane.appendChild(createRow('Session', 'session', state.session));
        pane.appendChild(createRow('Current Chat', 'chat', cid ? (state.chats[cid] || 0) : 0));
        pane.appendChild(createRow('Total History', 'total', state.total));

        // 2. Profiles
        pane.appendChild(createSectionTitle('Profiles'));
        const users = getAllUsers();
        const sortedUsers = users.sort((a, b) => (a === currentUser ? -1 : b === currentUser ? 1 : a.localeCompare(b)));

        if (sortedUsers.length === 0 && currentUser === TEMP_USER) {
            // 如果还没识别出用户，显示一个占位
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
                    renderDetailsPane(); // 重绘高亮
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

        // 3. Themes
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

        capsule.replaceChildren(); // Safe clear
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

        if (state.viewMode === 'session') {
            val = state.session; sub = "Session (Local)"; btn = "Reset Session";
            if (!isMe) { val = "--"; sub = "Offline"; disableBtn = true; }
        } else if (state.viewMode === 'chat') {
            if (!isMe) {
                val = "--"; sub = "Different Context"; disableBtn = true;
            } else {
                const cid = getChatId();
                // 如果是 null (New Chat)，显示0
                val = cid ? (state.chats[cid] || 0) : 0;
                sub = cid ? `ID: ${cid.slice(0, 8)}...` : 'ID: New Chat';
                btn = "Reset Chat";
            }
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
        if (state.viewMode === 'session') { state.session = 0; state.resetStep = 0; }
        else if (state.viewMode === 'chat') {
            if (state.resetStep === 0) { state.resetStep = 1; updateUI(); return; }
            const cid = getChatId();
            if (cid) state.chats[cid] = 0;
            state.resetStep = 0;
        }
        else if (state.viewMode === 'total') {
            if (state.resetStep === 0) { state.resetStep = 1; updateUI(); return; }
            if (state.resetStep === 1) { state.resetStep = 2; updateUI(); return; }
            state.total = 0; state.chats = {}; state.resetStep = 0;
        }
        saveCurrentUserData();
        updateUI();
        renderDetailsPane();
    }

    // 🌟 核心逻辑：即时响应 + 延迟归档
    function attemptIncrement() {
        const now = Date.now();
        if (now - lastCountTime < COOLDOWN) return;

        // 1. 无论是否有ID，立即增加 Session 和 Total
        state.session++;
        state.total++;
        lastCountTime = now;

        // 暂存状态用于恢复UI
        const viewing = inspectingUser;

        // 2. 检查是否有 ID
        const cid = getChatId();
        if (cid) {
            // 有 ID (旧对话)，直接记录
            if (currentUser !== TEMP_USER) {
                state.chats[cid] = (state.chats[cid] || 0) + 1;
                saveCurrentUserData();
            }
            // 更新 UI
            updateUI();
            // 如果面板展开，刷新列表数值
            if (state.isExpanded) renderDetailsPane();
        } else {
            // 无 ID (新对话)，开启轮询检测 URL 变化
            // UI 已经立即更新了 Session/Total，用户体验是实时的
            updateUI();

            let attempts = 0;
            const maxAttempts = 20; // 10秒超时 (20 * 500ms)
            const poller = setInterval(() => {
                attempts++;
                const newCid = getChatId();

                if (newCid && currentUser !== TEMP_USER) {
                    // 🎉 终于抓到了新 ID！
                    clearInterval(poller);

                    // 把这条消息归档到新 ID
                    state.chats[newCid] = (state.chats[newCid] || 0) + 1;

                    // 保存所有状态 (Chats + Session + Total)
                    saveCurrentUserData();
                    console.log(`✅ New Chat ID detected after ${attempts * 0.5}s:`, newCid);

                    // 刷新 UI (如果当前还在看这个用户)
                    if (inspectingUser === currentUser) {
                        updateUI();
                        if (state.isExpanded) renderDetailsPane();
                    }
                } else if (attempts >= maxAttempts) {
                    // ⏰ 超时了，还是没变 URL
                    clearInterval(poller);
                    // 至少保存一下 Session/Total 的增量
                    saveCurrentUserData();
                    console.warn("⚠️ New Chat ID detection timed out. Count saved to Session/Total only.");
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
        // 如果识别到了新用户
        if (detected && detected !== currentUser) {
            currentUser = detected;
            registerUser(detected);
            // 如果之前是 Guest 或正在看自己，则切换视察对象
            if (inspectingUser === TEMP_USER || inspectingUser === currentUser) {
                inspectingUser = currentUser;
            }
            loadDataForView(inspectingUser);
        }
        // 确保面板存在
        if (!document.getElementById(PANEL_ID)) createPanel();
    }

    injectStyles();
    setInterval(checkUserAndPanel, 1500); // 降低检测频率，不影响交互

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

    function applyPos(el, pos) {
        if (pos.top !== 'auto') el.style.top = pos.top;
        if (pos.left !== 'auto') el.style.left = pos.left;
        if (pos.bottom !== 'auto') el.style.bottom = pos.bottom;
        if (pos.right !== 'auto') el.style.right = pos.right;
    }
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
    GM_registerMenuCommand("🔄 Reset Position", () => { GM_setValue(GLOBAL_KEYS.POS, DEFAULT_POS); location.reload(); });

})();