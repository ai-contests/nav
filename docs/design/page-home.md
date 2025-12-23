# Page Design: Discovery Dashboard (Home)

## 1. 页面目标
作为流量入口，提供高效的筛选、检索和概览功能，让用户最快找到感兴趣的比赛。

## 2. 页面布局 (Layout)

包含三个主要区域，自上而下：

1.  **Immersive Hero (沉浸式首屏)**
    *   **背景**: 动态流体渐变或粒子效果，传递"智能/未来"感。
    *   **内容**: 项目 Slogan, 全局搜索框 (SearchInput), 关键数据看板 (StatsTicker)。

2.  **Intelligence Control Bar (智能控制栏)**
    *   **位置**: 吸顶悬浮或位于 Hero 下方。
    *   **功能**: 也就是您提到的"分类器"核心区域。
    *   **组件交互**:
        *   **Source Filter**: 下拉复选 (Select/Dropdown)，选择 "ModelScope", "Civitai", "Kaggle"。
        *   **Status Tabs**: 胶囊切换 (Tabs)，"Active (进行中)", "Upcoming", "All"。
        *   **Tag Cloud**: 可展开的标签云，通过 AI 提取的关键字 (e.g. #CV, #NLP, #GenerativeArt)。
    *   **现成组件方案 (Base UI + Tailwind)**:
        *   使用 **Base UI Tabs** 做状态切换。
        *   使用 **Base UI Select** 或 **Combobox** 做多维度筛选。
        *   配合 Tailwind 实现毛玻璃背景。

3.  **Contest Matrix (比赛矩阵)**
    *   **形式**: 响应式网格 (Grid)，桌面端 3 列，移动端 1 列。
    *   **卡片设计**: 见 `web-ui-design.md` 中的 `ContestCard`。
    *   **加载状态**: 骨架屏 (Skeleton) 占位。

## 3. 关键组件规格

| 组件 | 样式思路 (基于 Deep Ocean Palette) |
| :--- | :--- |
| **Search Input** | **背景**: `#02040a` (Canvas黑)。<br>**边框**: `#314159` (Steel)。聚焦时 `#0047AB` (Cobalt)。<br>**圆角**: `rounded-md`。 |
| **Status Tabs** | **容器**: `bg-slate-900/50`。<br>**选中态**: `bg-cobalt-blue` (#0047AB) + 文字白。<br>**默认态**: 文字 `#94a3b8` (Slate Blue)。 |
| **Platform Select** | **样式**: 极简边框风格。下拉菜单背景 `#1e293b` (Surface)。 |
| **Contest Matrix** | 响应式 Grid，卡片间距 `gap-6`。 |

## 4. 数据交互逻辑
*   **SSG + Client Filtering**: 
    *   构建时读取所有 JSON，生成静态页面。
    *   客户端使用 React State (`useState`, `useMemo`) 基于 JSON 数据进行实时筛选（数据量 < 1000 条时前端筛选极快，无需后端 API）。

