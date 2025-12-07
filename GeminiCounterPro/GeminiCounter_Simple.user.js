// ==UserScript==
// @name         Gemini Counter Simple (Legacy Sync)
// @namespace    http://tampermonkey.net/
// @version      6.0.1
// @description  简约同步版 (Legacy)：精准计数 + 多窗口实时同步 + 磨砂玻璃UI + 可拖拽
// @author       Script Weaver
// @match        https://gemini.google.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @run-at       document-idle
// ==/UserScript==

/*
 * 📜 版本历史 (Version History)
 *
 * v6.0.1: Archived as "Simple" (归档为简约版)
 * - 本版本已归档为 Gemini Counter Simple。
 * - 保留了 v2.x 的同步核心与 v5.x 的 UI，作为轻量级替代方案。
 *
 * v6.0: The Sync Update (最终同步版)
 * - 核心: 引入 GM_addValueChangeListener 和原子化读写，解决多窗口竞态条件。
 * - UI: 增加同步状态指示灯。
 *
 * v5.0: The GUI Overhaul (UI 重构版)
 * - 核心: Windows 风格拖拽系统，位置记忆。
 * - UI: 磨砂玻璃 (Glassmorphism) 设计。
 *
 * v4.0: The Anti-Jitter Update (防抖动版)
 * - 修复: 中文输入法回车误判 (isComposing)，增加 1s 冷却。
 *
 * v3.0: The Trusted API Update (合规版)
 * - 重构: 移除 innerHTML，使用原生 DOM API 绕过 CSP 限制。
 *
 * v2.0: The Watchdog Update (守护进程版)
 * - 修复: 解决 SPA 页面重绘导致 DOM 丢失问题。
 *
 * v1.0: Prototype (原型版)
 * - 基础功能验证。
 */

(function () {
    'use strict';

    // --- 常量配置 ---
    const COUNTER_KEY = 'gemini_interaction_count';
    const PANEL_POS_KEY = 'gemini_panel_position';
    const PANEL_ID = 'gemini-monitor-panel-v6';
    const COOLDOWN_TIME = 1000;

    // --- 状态变量 ---
    // 初始化时直接读取存储，如果没有则为0
    let count = GM_getValue(COUNTER_KEY, 0);
    let lastCountTime = 0;

    const savedPos = GM_getValue(PANEL_POS_KEY, { top: 'auto', left: 'auto', bottom: '85px', right: '30px' });

    // --- 📡 核心升级：多窗口同步监听 ---
    // 类似于 C++ 的条件变量/信号槽，监听共享内存的变化
    GM_addValueChangeListener(COUNTER_KEY, (name, oldVal, newVal, remote) => {
        // 无论变化是来自本地(remote=false)还是其他窗口(remote=true)，都同步更新本地状态
        count = newVal;
        // 刷新 UI
        const el = document.getElementById('gemini-cnt-display');
        if (el) {
            el.textContent = count;
            // 如果是其他窗口触发的，本地也稍微闪一下以示同步，但颜色淡一点
            if (remote) {
                el.style.color = '#d2e3fc';
                setTimeout(() => el.style.color = '#a8c7fa', 300);
            }
        }
    });

    // --- 🎨 UI 样式 (保持 V5 的高颜值) ---
    GM_addStyle(`
        #${PANEL_ID} {
            position: fixed;
            z-index: 2147483647;
            width: 140px;
            background: rgba(30, 31, 32, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            font-family: 'Google Sans', Roboto, sans-serif;
            overflow: hidden;
            transition: transform 0.1s, box-shadow 0.3s;
            user-select: none;
        }
        #${PANEL_ID}:hover {
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6);
            border-color: rgba(255, 255, 255, 0.2);
        }
        .gemini-drag-handle {
            padding: 8px 12px 4px 12px;
            cursor: grab;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .gemini-drag-handle:active {
            cursor: grabbing;
            background: rgba(255, 255, 255, 0.08);
        }
        .gemini-drag-title {
            font-size: 10px;
            font-weight: 700;
            color: #9aa0a6;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .gemini-panel-content {
            padding: 10px 16px 16px 16px;
            text-align: center;
        }
        .gemini-count-num {
            font-size: 36px;
            font-weight: 400;
            color: #a8c7fa;
            line-height: 1;
            margin-bottom: 8px;
            text-shadow: 0 0 10px rgba(168, 199, 250, 0.2);
            transition: color 0.3s;
        }
        .gemini-reset-btn {
            background: rgba(255, 255, 255, 0.05);
            border: none;
            color: #bdc1c6;
            border-radius: 20px;
            padding: 4px 12px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
        }
        .gemini-reset-btn:hover {
            background: rgba(138, 180, 248, 0.2);
            color: #d2e3fc;
        }
        .gemini-dot {
            width: 6px; height: 6px;
            background: #81c995; /* 在线指示灯绿色 */
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 5px rgba(129, 201, 149, 0.5);
        }
    `);

    // --- 拖拽逻辑 ---
    function makeDraggable(el, handle) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = el.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            el.style.bottom = 'auto';
            el.style.right = 'auto';
            el.style.left = `${initialLeft}px`;
            el.style.top = `${initialTop}px`;
            handle.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.style.left = `${initialLeft + dx}px`;
            el.style.top = `${initialTop + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            handle.style.cursor = 'grab';
            GM_setValue(PANEL_POS_KEY, {
                top: el.style.top,
                left: el.style.left,
                bottom: 'auto',
                right: 'auto'
            });
        });
    }

    // --- UI 构建 ---
    function createPanel() {
        const container = document.createElement('div');
        container.id = PANEL_ID;
        const winW = window.innerWidth, winH = window.innerHeight;
        const l = parseFloat(savedPos.left), t = parseFloat(savedPos.top);

        if ((l && l > winW - 50) || (t && t > winH - 50)) {
             container.style.top = 'auto'; container.style.left = 'auto';
             container.style.bottom = '85px'; container.style.right = '30px';
             GM_setValue(PANEL_POS_KEY, { top: 'auto', left: 'auto', bottom: '85px', right: '30px' });
        } else {
            if (savedPos.top !== 'auto') container.style.top = savedPos.top;
            if (savedPos.left !== 'auto') container.style.left = savedPos.left;
            if (savedPos.bottom !== 'auto') container.style.bottom = savedPos.bottom;
            if (savedPos.right !== 'auto') container.style.right = savedPos.right;
        }

        const header = document.createElement('div');
        header.className = 'gemini-drag-handle';

        const dot = document.createElement('span');
        dot.className = 'gemini-dot';

        const title = document.createElement('span');
        title.className = 'gemini-drag-title';
        title.textContent = 'SYNCED'; // 改个名字体现同步状态

        header.appendChild(dot);
        header.appendChild(title);

        const content = document.createElement('div');
        content.className = 'gemini-panel-content';

        const countNum = document.createElement('div');
        countNum.className = 'gemini-count-num';
        countNum.id = 'gemini-cnt-display';
        countNum.textContent = count;

        const btn = document.createElement('button');
        btn.className = 'gemini-reset-btn';
        btn.textContent = 'Reset';
        btn.addEventListener('mousedown', (e) => e.stopPropagation());

        // 重置逻辑：直接写0到存储，监听器会自动更新所有窗口的UI
        btn.onclick = () => {
            GM_setValue(COUNTER_KEY, 0);
        };

        content.appendChild(countNum);
        content.appendChild(btn);
        container.appendChild(header);
        container.appendChild(content);
        document.body.appendChild(container);
        makeDraggable(container, header);
    }

    // --- 逻辑层：更新与计数 ---
    function attemptIncrement() {
        const now = Date.now();
        if (now - lastCountTime < COOLDOWN_TIME) return;

        // CRITICAL FIX: 
        // 每次增加前，强制从存储中读取最新值，而不是依赖本地变量
        // 这避免了 "Dirty Read"
        const currentGlobalCount = GM_getValue(COUNTER_KEY, 0);
        const newCount = currentGlobalCount + 1;

        // 写入新值（这会触发所有窗口的 GM_addValueChangeListener）
        GM_setValue(COUNTER_KEY, newCount);

        lastCountTime = now;

        // 本地UI反馈（虽然监听器也会做，但直接做可以减少肉眼可见的延迟）
        const el = document.getElementById('gemini-cnt-display');
        if (el) {
            el.textContent = newCount;
            el.style.color = '#81c995';
            el.style.transform = 'scale(1.1)';
            setTimeout(() => {
                el.style.transform = 'scale(1)';
            }, 200);
        }
    }

    function ensurePanel() {
        if (!document.getElementById(PANEL_ID)) createPanel();
    }
    setInterval(ensurePanel, 1000);

    // --- 事件监听 (保持 V4 的防误触逻辑) ---
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

})();
