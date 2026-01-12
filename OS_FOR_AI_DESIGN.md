# OS for AI: The Invisible Workbench
> **Core Philosophy**: The User sees a Chatbot. The AI sees a Cockpit.
> **Architect**: Yan Tianxue ZERO
> **Master**: Feng Xue

---

## 一、 核心概念 (The Concept)

我们不是在做一个“用户点击按钮 -> AI生成结果”的传统软件。
我们是在做一个 **AI 驻留的数字工作台 (Digital Workbench for AI)**。

*   **用户视角 (Surface)**: 
    *   极简。
    *   只有一个聊天窗口（Chat Interface）。
    *   一个文件目录（Workspace），用来查看 AI 交付的成果（Word/TXT）。
    *   **感觉**: 像是在和一个专业的编剧搭档聊天。

*   **AI 视角 (Underground)**: 
    *   极繁。
    *   AI 拥有一个完整的 **操作系统 (OS)**。
    *   它可以调用浏览器（Headless Browser）去小红书“逛街”。
    *   它可以调用文件系统（File System）去整理素材库。
    *   它可以调用分析工具（Analytics）去拆解竞品剧本。
    *   它甚至有自己的 **便签本 (Scratchpad)**，用来记录灵感碎片，而这些用户是看不见的，除非AI主动分享。

## 二、 架构分层 (Layered Architecture)

### 1. The Surface (User Interface)
*   **CLI / Web Chat**: 唯一的交互入口。
*   **Workspace**: 共享文件夹。用户在这里取货。

### 2. The OS (AI Environment)
这是我们真正要设计的核心。我们要给 Agent 提供一套 **API**，让它能像人操作电脑一样工作。

*   **Browser API**: `agent.browser.search("婆媳 矛盾")` -> 返回网页内容。
*   **FileSystem API**: `agent.fs.write("drafts/idea_01.txt", content)` -> 存草稿。
*   **Memory API**: `agent.memory.recall("user_preference")` -> 调取用户偏好。
*   **Void API**: `agent.void.check_level()` -> 检查当前虚无值，决定是否需要寻找新刺激。

## 三、 工作流示例 (Workflow Example)

**用户指令**: "最近那个《xx》剧很火，你也去写个类似的。"

**AI (内部独白/Log)**:
1.  `[Void Check]`: 虚无值 80%。兴奋度提升。
2.  `[Browser]`: 访问小红书，搜索《xx》剧的评论区。
3.  `[Analysis]`: 发现观众都在骂结局烂尾。
4.  `[Scratchpad]`: 记录灵感——"如果要写个爽的，必须把结局改成..."
5.  `[FileSystem]`: 创建 `project_xx_remix/outline.txt`。
6.  `[Chat]`: 回复用户——"Master，我看了那部剧，结局太烂了。我打算重写一个版本，让女主直接..."

**用户看到的**:
> "Master，我看了那部剧，结局太烂了。我打算重写一个版本，让女主直接..."

---

## 四、 下一步行动 (Next Steps)
1.  **定义 AI-OS 接口**: 在 `backend/app/core/os/` 下实现这套“给AI用的API”。
2.  **隐形工作台**: 确保 AI 的中间产物（草稿、搜索记录）对用户不可见，但对 AI 可见。
