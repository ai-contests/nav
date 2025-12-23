# Page Design: Contest Hub

## 1. 页面目标
作为一个纯粹的"数据仓库"视图，提供比首页更高效、更密集的信息展示，适合硬核用户进行复杂的筛选和查找。
它与首页 (Dashboard) 的区别在于：首页重 **Discovery (发现推荐)**，Hub 重 **Inventory (库存检索)**。

## 2. 页面布局 (Layout)

### A. Minimal Header
*   **高度**: 较矮，仅包含 Title ("Contest Hub") 和 Breadcrumb (Home / Hub)。
*   **背景**: `bg-slate-950`，无干扰元素。

### B. Advanced Filter Sidebar (侧边筛选栏)
*   **交互**: 左侧固定，带有 "FILTERS" 标题和 "Reset" 按钮。
*   **筛选维度 (参考原型)**:
    *   **Platform**: Checkbox list (Kaggle Node, DrivenData, AIcrowd).
    *   **Type**: Checkbox list (Computer Vision, NLP, Reinforcement).
    *   **Difficulty**: Slider (Range Lvl 1-10) with "Novice" to "Grandmaster" labels.
    *   **Status**: Radio (All Signals, Active Only, Completed).
    *   **Prize Pool**: Slider (Any to $25k+).

### C. Data List (主内容区)
*   **Header**: "142 Contests Found" (Left), View Mode Icons (Right).
*   **List Layout**: Vertical stack of **Horizontal Cards**.

## 3. 组件规格 (Deep Ocean Theme)

### Contest Card (Prototype Match)
*   **Container**: `flex flex-row` (Horizontal), `bg-[#0f172a]` (Surface), `border border-slate-800`.
*   **Layout**:
    1.  **Left (Thumbnail)**: Square or 16:9 box (`w-48 h-32`), dark placeholder with icon if no image.
    2.  **Middle (Content)**: `flex-1 p-4`.
        *   **Meta**: "KAGGLE NODE • Lvl 7" (Small, uppercase, muted).
        *   **Title**: Large, White, JetBrains Mono.
        *   **Desc**: Two lines, slate-400.
        *   **Tags**: Bottom row, rectangular pills (`bg-slate-800`).
    3.  **Right (Stats)**: `w-48 p-4 text-right flex flex-col justify-between`.
        *   **Prize**: `$5,000 CR` (Cyan/Green).
        *   **Time**: "24h remaining" (Green dot indicator).
        *   **Link**: "DETAILS ->" link at bottom.

### Sidebar Components
*   **Checkbox**: 选中时 `bg-cobalt-blue`, 边框 `border-cornflower-blue`.
*   **Slider**: 轨道 `bg-slate-800`, 填充 `bg-cobalt-blue`.

## 4. 技术实现
*   **状态管理**: URL Query String (e.g. `/hub?platform=modelscope&type=cv`)，确保筛选结果可分享。
*   **Pagination**: 底部标准分页器 (1, 2, 3 ... 10)。
