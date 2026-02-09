# Gemini Counter Code Archive (Gemini 计数器代码库)

这是一个 Tampermonkey 油猴脚本集合，为 Google Gemini 提供精准的交互计数功能。当前版本：**v8.1**。
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

### 4. 💎 终极版 (Ultimate) → Gemini Assistant
*   **文件名**: `GeminiCounter_Ultimate.user.js` (推荐)
*   **特点**: **模块化架构** - 可扩展的 Gemini 助手平台。
    *   📊 **计数器模块**: 消息统计、热力图、配额追踪、模型检测
    *   📁 **文件夹模块**: 整理对话到自定义文件夹 (Pure Enhancement - 不修改原有布局)
    *   🎛️ **Feature Extensions**: 在设置中开关各功能模块
*   **适用**: Power User，多账号用户，需要扩展功能。

---

## 安装方法

1.  为你的浏览器安装 [Tampermonkey](https://www.tampermonkey.net/) 插件。
2.  在 Tampermonkey 中创建一个新脚本。
3.  选择上述任意一个版本的 `.user.js` 文件内容，复制并粘贴到编辑器中。
4.  保存脚本。

**注意**: 请同一时间只启用一个版本的脚本，以免发生冲突。

## 📜 详细更新日志

请查看 [CHANGELOG.md](./CHANGELOG.md) 获取完整的版本迭代历史。

## 🧪 测试

在 `GeminiCounterPro` 目录下运行：

```bash
npm test
```

## 作者

Script Weaver

---

## 🗺️ Roadmap (开发计划)

### 当前开发 (v7.x)
- [x] **模块化架构**: Core + Module 分离，支持功能扩展
- [x] **文件夹模块**: 整理对话到自定义文件夹 (Pure Enhancement 方式)
  - 小圆点颜色标记 + 面板内管理 + 拖拽分组

### UI/UX 优化
- [ ] **Paper 主题视觉优化**: 当前仍存在轻微视觉污染，需要进一步调整对比度和色彩平衡
- [ ] **更多主题策略**: 借助 UI/UX 设计原则，扩展主题系统 (深色 OLED、高对比度无障碍、自定义色板等)

### 数据增强
- [ ] **精确配额追踪**: 根据模型 multiplier 计算实际配额消耗 (Flash: 0x, Thinking: 0.33x, Pro: 1x)
- [ ] **导出格式扩展**: 支持 CSV、Markdown 等更多导出格式

### 已搁置
- ~~消息搜索功能~~: 消费者版 Gemini 无法获取完整对话内容，实现价值有限。Enterprise 版已有原生语义搜索。


