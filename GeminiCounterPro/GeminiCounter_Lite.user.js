// ==UserScript==
// @name         Gemini Counter Lite (v1.0)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  极简版：仅在左下角显示一个数字，统计累计次数。
// @author       Script Weaver
// @match        https://gemini.google.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    const KEY = 'gemini_lite_count';
    let count = GM_getValue(KEY, 0);

    // 极简样式
    GM_addStyle(`
        #gemini-lite-panel {
            position: fixed; bottom: 20px; left: 20px;
            background: rgba(0,0,0,0.6); color: #aaa;
            padding: 5px 10px; border-radius: 4px;
            font-family: monospace; font-size: 12px;
            z-index: 9999; user-select: none; pointer-events: none;
        }
        #gemini-lite-num { color: #fff; font-weight: bold; margin-left: 5px; }
    `);

    // 创建面板 (纯 DOM)
    const panel = document.createElement('div');
    panel.id = 'gemini-lite-panel';
    const label = document.createElement('span');
    label.textContent = 'COUNT:';
    const num = document.createElement('span');
    num.id = 'gemini-lite-num';
    num.textContent = count;
    panel.appendChild(label);
    panel.appendChild(num);

    // 守护进程
    setInterval(() => {
        if (!document.body.contains(panel)) document.body.appendChild(panel);
    }, 2000);

    // 计数逻辑
    function inc() {
        count++;
        num.textContent = count;
        GM_setValue(KEY, count);
        // 简单的视觉反馈
        panel.style.background = 'rgba(138, 180, 248, 0.8)';
        setTimeout(() => panel.style.background = 'rgba(0,0,0,0.6)', 200);
    }

    // 监听
    let lastTime = 0;
    function tryInc() {
        if (Date.now() - lastTime < 1000) return;
        inc();
        lastTime = Date.now();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            const act = document.activeElement;
            if (act && (act.tagName === 'TEXTAREA' || act.getAttribute('contenteditable') === 'true')) {
                setTimeout(tryInc, 50);
            }
        }
    }, true);

    document.addEventListener('click', (e) => {
        const btn = e.target?.closest?.('button');
        if (btn && !btn.disabled) {
            const l = btn.getAttribute('aria-label') || '';
            if (l.includes('Send') || l.includes('发送')) tryInc();
        }
    }, true);
})();
