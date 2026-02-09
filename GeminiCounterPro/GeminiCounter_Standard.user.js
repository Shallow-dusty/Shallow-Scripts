// ==UserScript==
// @name         Gemini Counter Standard (v3.1)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  标准版：支持会话/当前窗口/历史总数切换，单账户逻辑，无主题系统。
// @author       Script Weaver
// @match        https://gemini.google.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const KEYS = { SESSION: 'g_sess', TOTAL: 'g_tot', CHATS: 'g_chats', POS: 'g_pos' };
    const PANEL_ID = 'g-panel-std';

    let state = {
        session: GM_getValue(KEYS.SESSION, 0),
        total: GM_getValue(KEYS.TOTAL, 0),
        chats: GM_getValue(KEYS.CHATS, {}),
        mode: 'session',
        expanded: false,
        step: 0
    };

    // 基础样式 (固定 Glass 风格)
    GM_addStyle(`
        #${PANEL_ID} {
            position: fixed; z-index: 99999; width: 150px;
            background: rgba(32, 33, 36, 0.95); backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
            font-family: sans-serif; color: #e8eaed;
            display: flex; flex-direction: column; overflow: hidden;
        }
        .g-head { padding: 8px 12px; background: rgba(255,255,255,0.05); cursor: grab; display: flex; justify-content: space-between; }
        .g-main { padding: 15px; text-align: center; }
        .g-num { font-size: 36px; color: #a8c7fa; }
        .g-sub { font-size: 10px; color: #999; margin-bottom: 10px; }
        .g-btn { width: 100%; background: #333; border: none; color: #ccc; padding: 5px; cursor: pointer; border-radius: 4px; }
        .g-btn:hover { background: #444; color: #fff; }
        .g-list { height: 0; overflow: hidden; background: rgba(0,0,0,0.2); transition: height 0.3s; }
        .g-list.open { height: auto; padding: 10px; }
        .g-row { display: flex; justify-content: space-between; font-size: 11px; padding: 4px; cursor: pointer; }
        .g-row:hover { background: rgba(255,255,255,0.05); }
        .g-row.active { color: #a8c7fa; font-weight: bold; }
    `);

    function getChatId() {
        const m = location.pathname.match(/\/app\/([a-zA-Z0-9\-_]+)/);
        return m ? m[1] : null;
    }

    function createPanel() {
        const p = document.createElement('div'); p.id = PANEL_ID;
        const pos = GM_getValue(KEYS.POS, { bottom: '85px', right: '30px' });
        
        // Fix: Viewport Overflow Check
        const winW = window.innerWidth, winH = window.innerHeight;
        const l = parseFloat(pos.left), t = parseFloat(pos.top);
        if ((l && l > winW - 50) || (t && t > winH - 50)) {
           p.style.top = 'auto'; p.style.left = 'auto'; p.style.bottom = '85px'; p.style.right = '30px';
           GM_setValue(KEYS.POS, { bottom: '85px', right: '30px' });
        } else {
           Object.assign(p.style, pos);
        }

        const head = document.createElement('div'); head.className = 'g-head';
        const headLabel = document.createElement('span'); headLabel.textContent = 'STATS';
        const headToggle = document.createElement('span'); headToggle.textContent = '☰'; headToggle.style.cursor = 'pointer';
        headToggle.onclick = (e) => { e.stopPropagation(); toggle(); };
        head.append(headLabel, headToggle);

        const main = document.createElement('div'); main.className = 'g-main';
        const numDiv = document.createElement('div'); numDiv.className = 'g-num'; numDiv.textContent = '0';
        const subDiv = document.createElement('div'); subDiv.className = 'g-sub'; subDiv.textContent = '...';
        const resetBtn = document.createElement('button'); resetBtn.className = 'g-btn'; resetBtn.textContent = 'Reset';
        resetBtn.onclick = reset;
        main.append(numDiv, subDiv, resetBtn);

        const list = document.createElement('div'); list.className = 'g-list';
        p.append(head, main, list);
        document.body.append(p);

        makeDraggable(p, head);
        updateUI();
    }

    function renderList() {
        const l = document.querySelector('.g-list');
        if (!l) return;
        l.replaceChildren(); // Safe clear

        const rows = [
            { id: 'session', label: 'Session', val: state.session },
            { id: 'chat', label: 'Current Chat', val: getChatId() ? (state.chats[getChatId()] || 0) : 0 },
            { id: 'total', label: 'Lifetime', val: state.total }
        ];

        rows.forEach(r => {
            const d = document.createElement('div');
            d.className = `g-row ${state.mode === r.id ? 'active' : ''}`;
            const labelSpan = document.createElement('span'); labelSpan.textContent = r.label;
            const valSpan = document.createElement('span'); valSpan.textContent = r.val;
            d.append(labelSpan, valSpan);
            d.onclick = () => { state.mode = r.id; updateUI(); renderList(); };
            l.appendChild(d);
        });
    }

    function toggle() {
        state.expanded = !state.expanded;
        const l = document.querySelector('.g-list');
        if (state.expanded) { l.classList.add('open'); renderList(); }
        else l.classList.remove('open');
    }

    function updateUI() {
        const num = document.querySelector('.g-num');
        const sub = document.querySelector('.g-sub');
        if (!num) return;

        let val = 0, txt = "";
        if (state.mode === 'session') { val = state.session; txt = "Local Session"; }
        else if (state.mode === 'chat') {
            const cid = getChatId();
            val = cid ? (state.chats[cid] || 0) : 0;
            txt = cid ? `ID: ${cid.slice(0, 6)}...` : "New Chat";
        }
        else { val = state.total; txt = "Total History"; }

        num.textContent = val;
        sub.textContent = txt;
    }

    function reset() {
        if (state.mode === 'session') state.session = 0;
        else if (state.mode === 'chat') { const c = getChatId(); if (c) state.chats[c] = 0; }
        else { state.total = 0; state.chats = {}; }
        save(); updateUI(); renderList();
    }

    function save() {
        GM_setValue(KEYS.TOTAL, state.total);
        GM_setValue(KEYS.CHATS, state.chats);
        GM_setValue(KEYS.SESSION, state.session);
    }

    let last = 0;
    function inc() {
        if (Date.now() - last < 1000) return;
        state.session++; state.total++;
        const c = getChatId();
        if (c) state.chats[c] = (state.chats[c] || 0) + 1;
        else setTimeout(() => { // Delayed ID check for new chats
            const nc = getChatId();
            if (nc) { state.chats[nc] = (state.chats[nc] || 0) + 1; save(); }
        }, 1000);

        last = Date.now();
        save(); updateUI();
        if (state.expanded) renderList();
    }

    function makeDraggable(el, h) {
        let isD = false, sx, sy, l, t;
        h.onmousedown = e => { isD = true; sx = e.clientX; sy = e.clientY; l = el.offsetLeft; t = el.offsetTop; el.style.right = 'auto'; el.style.bottom = 'auto'; };
        document.onmousemove = e => { if (isD) { el.style.left = (l + e.clientX - sx) + 'px'; el.style.top = (t + e.clientY - sy) + 'px'; } };
        document.onmouseup = () => { if (isD) { isD = false; GM_setValue(KEYS.POS, { left: el.style.left, top: el.style.top }); } };
    }

    setInterval(() => { if (!document.getElementById(PANEL_ID)) createPanel(); }, 1500);

    // Input Hooks
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true')) setTimeout(inc, 50); }, true);
    document.addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) { if (b.classList.contains('send-button')) { inc(); return; } const a = b.getAttribute('aria-label') || ''; if (a.includes('Send') || a.includes('发送')) inc(); } }, true);
})();
