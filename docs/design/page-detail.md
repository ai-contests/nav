# Page Design: Contest Detail

## 1. 页面目标
对单个比赛进行深度解析，通过结构化展示和 AI 增强信息辅助用户决策。

## 2. 页面布局 (Layout - Prototype Match)
采用了 **Grid Dashboard** 风格，顶部宽 Banner，下方左右分栏。

### A. Contest Header (Top Banner)
*   **Background**: Deep Grid (`bg-canvas` with subtle grid lines).
*   **Elements**:
    *   **Left**:
        *   **Badge**: `[ KAGGLE NODE • ID: #CV-2024 ]` (Terminal style).
        *   **Title**: Huge font, white text.
        *   **Lead**: Short summarized description.
    *   **Right**:
        *   **Countdown**: "04 DAYS : 12 HRS : 45 MIN" (Digital Clock style).
        *   **Primary Action**: `[ JOIN CONTEST > ]` (Big Outline Button with Icon).
        *   **Social Proof**: "1,204 Teams Competing" (Small text).

### B. Info Matrix (4-Grid Stats)
位于 Header 下方，一排 4 个独立的 Box 卡片：
1.  **Source Node**: Icon + Name (e.g. "Google AI").
2.  **Domain Specs**: Tags (e.g. `[COMPUTER VISION]`, `[REINFORCEMENT]`).
3.  **Difficulty**: Progress Bar (Yellow/Orange) + "Expert (7/10)".
4.  **Total Bounty**: Huge Cyan Text (`$25,000`).

### C. Content Split (Main Body)
*   **Left Column (70%)**:
    *   **Tabs**: `> OVERVIEW`, `RULES`, `TIMELINE`, `DISCUSSION`.
    *   **Markdown Content**: 带有 `# Context`, `## Dataset Description` 的结构化文档。
    *   **Code Block Style**: Dark theme `pre` blocks.
*   **Right Column (30%)**:
    *   **Related Contests**: "RELATED SIGNALS" vertical list.
        *   Small cards with Title, Tag, Time Left.

## 4. 技术实现
*   **路由**: `/contest/[id]` (Next.js Dynamic Route)。
*   **数据获取**: `getStaticProps` (或 Next.js 13+ `generateStaticParams`) 读取对应的 JSON 文件。
*   **Markdown 渲染**: 使用 `react-markdown` 或 `remote-mdx`，配合 Tailwind Typography 插件 (`prose prose-invert`) 自动美化文档样式。

