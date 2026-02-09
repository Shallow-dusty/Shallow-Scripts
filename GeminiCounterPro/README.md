# Gemini Counter Code Archive (Gemini 计数器代码库)

这是一个 Tampermonkey 油猴脚本集合，为 Google Gemini 提供精准的交互计数功能。当前版本：**v9.0**。
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
*   **特点**: **模块化架构** - 可扩展的 Gemini 助手平台，8 个功能模块：
    *   📊 **计数器模块**: 消息统计、热力图、配额追踪、模型检测、加权配额
    *   📁 **文件夹模块**: 整理对话到自定义文件夹、拖拽排序、搜索/置顶/批量操作/自动分类
    *   📤 **导出模块**: JSON / CSV / Markdown 三种格式导出统计数据
    *   💎 **Prompt 金库**: 保存和快速插入常用 Prompt 模板
    *   🤖 **默认模型**: 新对话自动选择首选模型 (Fast/Thinking/Pro)
    *   🗑️ **批量删除**: 面板中批量选择并删除对话
    *   💬 **引用回复**: 选中文本快速插入引用到输入框
    *   🎨 **UI 自定义**: Tab 标题同步 / Ctrl+Enter 发送 / 布局调整
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

### v8.x — 已完成
- [x] **精确配额追踪**: byModel 字段 + 加权配额计算
- [x] **ExportModule**: JSON / CSV / Markdown 导出
- [x] **Paper 主题优化**: 19 CSS 变量全覆盖
- [x] **文件夹增强**: 拖拽排序 / 搜索 / 置顶 / 自定义颜色 / 批量操作 / 自动分类 / 统计
- [x] **Dashboard 模型可视化**: 分布条形图 + 加权汇总
- [x] **PromptVaultModule**: Prompt 金库
- [x] **DefaultModelModule**: 默认模型自动切换
- [x] **BatchDeleteModule**: 批量删除对话
- [x] **QuoteReplyModule**: 引用回复
- [x] **UITweaksModule**: UI 自定义合集

### 未来考虑
- [ ] **更多主题策略**: 深色 OLED、高对比度无障碍、自定义色板
- [ ] **云同步**: Google Drive 数据备份 (受 Tampermonkey 限制)

### 已搁置
- ~~消息搜索功能~~: 消费者版 Gemini 无法获取完整对话内容，实现价值有限。Enterprise 版已有原生语义搜索。
