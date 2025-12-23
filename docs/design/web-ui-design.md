# Web UI Design Guidelines v2

## 1. 站点地图 (Sitemap)

采用经典的 Landing + App 结构：

| 路由 | 页面名称 | 描述 |
| :--- | :--- | :--- |
| `/` | **Landing Page** | 品牌着陆页。介绍项目愿景、核心特性、引导进入 Hub。 |
| `/hub` | **Contest Hub** | 比赛聚合中心。核心功能区，包含筛选器、列表卡片。 |
| `/contest/[id]` | **Detail Page** | 比赛详情页。详细信息、AI 分析、跳转链接。 |
| `/docs` | **Documentation** | 帮助文档/关于页面。 |

## 2. 导航栏设计 (Navbar)

*   **布局**: 固定在顶部 (Sticky Top)。
*   **左侧**: Logo (Icon + Text "AI Nav")。
*   **中部/右侧 (Desktop)**: 
    *   `Home` (Link to `/`)
    *   `Hub` (Link to `/hub`)
    *   `Docs` (Link to `/docs`)
    *   *(No Login/Signup buttons)*
*   **移动端**: 汉堡菜单。

---

## 3. 设计系统 (Design System)

### A. 字体 (Typography)
*   **Font Family**: **JetBrains Mono** (User Request). 全站统一使用等宽字体，营造极客(Geek)/终端(Terminal) 氛围。
*   **Type Scale (基于 Tailwind)**:
    *   `text-xs`: 12px (Tags, Metadata)
    *   `text-sm`: 14px (Body minimal, Subtitles)
    *   `text-base`: 16px (Body standard)
    *   `text-lg`: 18px (Card Titles)
    *   `text-xl`: 20px (Section Headers)
    *   `text-2xl` ~ `text-4xl`: Page Titles.

### B. 配色方案 (Color Palette) - "Deep Ocean"
基于用户偏好的蓝色系，构建一套深邃、专业且具有明暗主题支持的配色。

| 语义角色 | Dark Mode (夜间) | Light Mode (日间) | 说明 |
| :--- | :--- | :--- | :--- |
| **Canvas** (底色) | **Midnight Blue**<br>`#02040a` | **Alice Blue**<br>`#f0f8ff` | 页面最底层背景。夜间接近纯黑的午夜蓝，日间极淡蓝。 |
| **Surface** (卡片) | **Steel Azure**<br>`#1e293b` (类似 #314159) | **White**<br>`#ffffff` | 卡片、导航栏背景。#314159 可作为 Hover 或高亮卡片色。 |
| **Primary** (主色) | **Cobalt Blue**<br>`#0047AB` | **Cobalt Blue**<br>`#0047AB` | 品牌色。用于主按钮、Logo、关键链接。 |
| **Secondary** (辅色) | **Cornflower Blue**<br>`#6495ED` | **Cornflower Blue**<br>`#6495ED` | 辅助高亮、选中的标签、Icon 装饰。 |
| **Accent** (强调) | **Electric Cyan**<br>`#00BFFF` | **Royal Blue**<br>`#4169E1` | 极高亮元素，如 CTA 按钮的光晕、进度条高亮。 |
| **Text Main** | **Pale Blue**<br>`#e2e8f0` | **Navy**<br>`#000080` | 主要内容文字。 |
| **Text Muted** | **Slate Blue**<br>`#94a3b8` | **Slate Gray**<br>`#64748b` | 次要信息。 |
| **Border** | **Indigo Ink**<br>`#1e3a8a` | **Cloud Blue**<br>`#bfdbfe` | 边框线。 |

### C. 字体 (Typography)
*   **Font Family**: **JetBrains Mono**。
*   全站统一使用等宽字体，营造 **Developer / Terminal** 的专业极客氛围。
*   标题与正文通过字重 (Bold/Regular) 和颜色区分，而非字体。

---

## 4. 核心组件设计 (Component Specs)

### A. Contest Card (Hub Page)
*   **Visual**: 深色模式下使用 `#1e293b` 背景，边框 `#1e3a8a`。Hover 时边框变为 `#6495ED` (Cornflower) 并带有微弱发光。
*   **Layout**:
    1.  **Header**: 平台 Logo (Icon) + 倒计时 (Text: "3 days left", Color: `#f59e0b`).
    2.  **Body**: 标题 (2行, JetBrains Mono Bold).
    3.  **Meta**: `Type Icon` (e.g. Image) • `Difficulty` (e.g. ⭐⭐) • `Prize` (Color: `#00BFFF`).
    4.  **Footer**: Tags (e.g. `#CV`, `#GenAI`) 使用 Pill 样式 (Bg: `#0047AB` opacity-20, Text: `#6495ED`).

### B. Filter Bar
*   **Style**: 终端命令行风格。
*   **Inputs**: 输入框背景 `#02040a`，边框 `#314159`。Focus 时边框 `#0047AB`。

### C. Navigation
*   **Header**: Sticky, Glassmorphism (Blur). Logo 使用 Cobalt Blue。
*   **Links**: Hover 时显示下划线 (`border-b-2 border-cornflower-blue`)。

