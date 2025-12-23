# Page Design: Contest Hub

## 1. 页面目标
作为一个纯粹的"数据仓库"视图，提供比首页更高效、更密集的信息展示，适合硬核用户进行复杂的筛选和查找。
它与首页 (Dashboard) 的区别在于：首页重 **Discovery (发现推荐)**，Hub 重 **Inventory (库存检索)**。

## 2. 页面布局 (Layout)

### A. Minimal Header
*   **高度**: 较矮，仅包含 Title ("Contest Hub") 和 Breadcrumb (Home / Hub)。
*   **背景**: `bg-slate-950`，无干扰元素。

### B. Advanced Filter Sidebar (侧边筛选栏)
*   **位置**: 桌面端左侧固定 (Sticky)，移动端从下方弹出 (Drawer)。
*   **交互**: 实时响应，无需点击 "Apply"。
*   **筛选维度**:
    *   **Platform**: Checkbox list (ModelScope, Civitai, Kaggle, Others).
    *   **Contest Type**: Checkbox list (CV, NLP, Multi-modal, Audio).
    *   **Difficulty**: Slider (Range 1-3) 或 Checkbox (Beginner, Intermediate, Advanced).
    *   **Status**: Radio (Active Only, Include Ended).
    *   **Prize Range**: Slider (Min - Max).

### C. Data Grid / List Toggle (主内容区)
*   **Top Bar**:
    *   **Total Count**: "Showing 42 contests".
    *   **View Toggle**: 切换图标，支持 [Grid View (网格)] 和 [List View (列表)]。
        *   **Grid View**: 使用标准的 `ContestCard`。
        *   **List View**: 类似表格的紧凑行布局，方便快速扫视 Deadlines 和 Prizes。
    *   **Sort**: "Sort by Newest", "Sort by Deadline (Asc)".

## 3. 组件规格 (基于 Deep Ocean Theme)

### Sidebar Components
*   **Checkbox**: 选中时 `bg-cobalt-blue`, 边框 `border-cornflower-blue`.
*   **Slider**: 轨道 `bg-slate-800`, 填充 `bg-cobalt-blue`.

### List View Item (列表视图专用)
*   **布局**: Flex Row.
*   **Columns**:
    1.  **Icon**: 平台 Logo (24px).
    2.  **Title**: 粗体文字，截断。
    3.  **Tags**: 仅显示主要 Tag (1个)。
    4.  **Prize**: 文本颜色 `#00BFFF` (Electric Cyan).
    5.  **Status**: 小圆点指示器 (Green/Gray).
    6.  **Action**: "Details" 箭头图标。
*   **交互**: 鼠标悬停整行变色 `bg-slate-900`。

## 4. 技术实现
*   **状态管理**: URL Query String (e.g. `/hub?platform=modelscope&type=cv`)，确保筛选结果可分享。
*   **Pagination**: 底部标准分页器 (1, 2, 3 ... 10)。
