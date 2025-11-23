# Gemini Counter Pro (同步 & 可拖拽版)

这是一个 Tampermonkey 油猴脚本，为 Google Gemini 提供精准的交互计数功能。它支持多窗口实时同步、磨砂玻璃 UI 风格以及自由拖拽定位。

## 功能特点

*   **精准计数**: 准确记录你与 Gemini 的交互次数。
*   **多窗口同步**: 在多个标签页和窗口之间实时同步计数状态。
*   **可拖拽 UI**: 可以将计数面板拖动到屏幕的任意位置。
*   **现代设计**: 采用磨砂玻璃效果 (backdrop-filter)，外观高级。
*   **状态持久化**: 自动记住计数值和面板位置。

## 安装方法

1.  为你的浏览器安装 [Tampermonkey](https://www.tampermonkey.net/) 插件。
2.  在 Tampermonkey 中创建一个新脚本。
3.  将 `GeminiCounterPro.user.js` 的内容复制并粘贴到编辑器中。
4.  保存脚本。

## 使用说明

*   脚本会在访问 `https://gemini.google.com/*` 时自动加载计数器。
*   拖动面板顶部的标题栏 ("SYNCED") 即可移动面板。
*   点击 "Reset" 按钮可将计数重置为 0。
*   当你在聊天框按 Enter 键或点击发送按钮时，计数器会自动增加。

## 作者

Script Weaver

## 📜 版本历史

### v6.0: The Sync Update (最终同步版)
- **核心特性**: 引入 `GM_addValueChangeListener` 和原子化读写逻辑。
- **解决问题**: 解决了多标签页（Tab）同时打开时，计数器数据不一致、相互覆盖的“竞态条件”问题。
- **UI 调整**: 增加了“SYNCED”状态指示灯，优化了数据同步时的视觉反馈。

### v5.0: The GUI Overhaul (UI 重构版)
- **核心特性**: 实现了 Windows 风格的窗口拖拽系统（Draggable Window）。
- **UI 升级**: 采用磨砂玻璃 (Glassmorphism) 设计语言，完美融入 Gemini 深色模式。
- **持久化**: 增加了窗口位置记忆功能，刷新页面后窗口停留在上次位置。

### v4.0: The Anti-Jitter Update (防抖动版)
- **核心特性**: 引入输入法状态检测 (`isComposing`) 和 1秒冷却机制 (Cooldown)。
- **解决问题**: 修复了中文输入法按回车选词时导致计数器误判 +1 的严重 Bug。

### v3.0: The Trusted API Update (合规版)
- **技术重构**: 完全移除 `innerHTML` 字符串拼接，改用 `document.createElement` 等原生 DOM API。
- **解决问题**: 绕过了 Google 严格的 CSP (内容安全策略) 和 TrustedHTML 限制，消除了控制台报错。

### v2.0: The Watchdog Update (守护进程版)
- **核心特性**: 引入 `setInterval` 守护进程。
- **解决问题**: 解决了 SPA (单页应用) 页面重绘导致计数器 DOM 元素被清除的问题。

### v1.0: Prototype (原型版)
- **功能**: 基础的点击与回车监听，本地存储计数。
- **状态**: 验证了通过前端 Hook 统计对话次数的可行性。

