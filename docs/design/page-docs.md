# Page Design: Documentation & Help

## 1. 页面目标
为用户提供平台使用指南、FAQ 以及项目背景信息。

## 2. 页面布局 (Layout)

### A. Sidebar Navigation (Left)
*   文档目录树 (Tree View)。
*   链接:
    *   **Introduction**: 关于本项目。
    *   **How to Participate**: 即使小白也能看懂的通用参赛指南。
    *   **Platform Guides**: 针对 ModelScope, Civitai 等特定平台的注册/提交帮助。
    *   **FAQ**: 常见问题。
    *   **Contributing**: 如何为本项目贡献爬虫或数据。

### B. Content Area (Right)
*   **Typography**: 使用 Tailwind Markdown Prose (`prose prose-invert prose-blue`)。
*   **Elements**:
    *   **Code Blocks**: 使用 JetBrains Mono 字体，深色代码块背景。
    *   **Callouts**: 提示框 (Info / Warning)，使用蓝色或琥珀色边框。

## 3. 视觉风格 (Deep Ocean Doc)
*   **Sidebar**: `bg-slate-950` border-r `border-slate-800`.
*   **Active Link**: 左侧加粗蓝线 (`border-l-4 border-cobalt-blue`)，背景微亮 `bg-slate-900`.
*   **Headings**: `text-slate-100`, JetBrains Mono Bold.

## 4. 技术实现
*   **Content Source**: 直接加载 `docs/` 目录下的 Markdown 文件。
*   **SSG**: 构建时将 markdown 转换为 HTML。可以使用 `next-mdx-remote` 或简单的 fs 读取 + `react-markdown`。

