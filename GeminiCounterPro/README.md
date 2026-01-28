# Gemini Counter Code Archive (Gemini 计数器代码库)

这是一个 Tampermonkey 油猴脚本集合，为 Google Gemini 提供精准的交互计数功能。
为了满足不同用户的需求，本代码库提供了 **4 个不同版本** 的脚本，你可以根据喜好选择其中一个安装。

## 📂 版本列表 (Versions)

### 1. 🍃 极简版 (Lite)
*   **文件名**: `GeminiCounter_Lite.user.js`
*   **特点**: 纯粹的计数器，仅在左下角显示数字。无面板，无拖拽。
*   **适用**: 极简主义者。

### 2. 🧩 简约版 (Simple)
*   **文件名**: `GeminiCounter_Simple.user.js` (原 Pro v6.0)
*   **特点**: 拥有漂亮的磨砂玻璃 UI，支持拖拽和多窗口同步。**只显示一个总数**，没有复杂的仪表盘。
*   **适用**: 喜欢漂亮界面但不需要查看历史详情的用户。

### 3. 📊 标准版 (Standard)
*   **文件名**: `GeminiCounter_Standard.user.js`
*   **特点**: 经典的单用户仪表盘。支持切换查看 **当前会话 / 当前窗口 / 历史总数**。
*   **适用**: 普通用户，需要查看详细数据。

### 4. 💎 终极版 (Ultimate)
*   **文件名**: `GeminiCounter_Ultimate.user.js` (推荐)
*   **特点**: 企业级全能版。支持 **多用户隔离** (自动识别账号)、**主题切换**、**智能容错**。
*   **适用**: Power User，多账号用户。

---

## 安装方法

1.  为你的浏览器安装 [Tampermonkey](https://www.tampermonkey.net/) 插件。
2.  在 Tampermonkey 中创建一个新脚本。
3.  选择上述任意一个版本的 `.user.js` 文件内容，复制并粘贴到编辑器中。
4.  保存脚本。

**注意**: 请同一时间只启用一个版本的脚本，以免发生冲突。

## 📜 详细更新日志

请查看 [CHANGELOG.md](./CHANGELOG.md) 获取完整的版本迭代历史。

## 作者

Script Weaver

---

## 🗺️ Roadmap (开发计划)

### UI/UX 优化
- [ ] **Paper 主题视觉优化**: 当前仍存在轻微视觉污染，需要进一步调整对比度和色彩平衡
- [ ] **更多主题策略**: 借助 UI/UX 设计原则，扩展主题系统 (深色 OLED、高对比度无障碍、自定义色板等)

### 功能扩展
- [ ] **消息搜索功能**: 支持在历史对话中搜索关键词
  - 参考: [AI Chat Window Enhancer Pro](https://greasyfork.org/zh-CN/scripts/517672-ai-chat-window-enhancer-pro)
- [ ] **文件夹/分类功能**: 支持将对话整理到自定义文件夹中，便于管理大量对话
  - 参考: [Reddit 讨论](https://www.reddit.com/r/GeminiAI/comments/1qob7is/)

### 数据增强
- [ ] **精确配额追踪**: 根据模型 multiplier 计算实际配额消耗 (Flash: 0x, Thinking: 0.33x, Pro: 1x)
- [ ] **导出格式扩展**: 支持 CSV、Markdown 等更多导出格式


