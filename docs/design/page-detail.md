# Page Design: Contest Detail

## 1. 页面目标
对单个比赛进行深度解析，通过结构化展示和 AI 增强信息辅助用户决策。

## 2. 页面布局 (Layout)

### A. Intelligent Header (智能头部)
*   **布局**: 双列布局。左侧核心信息，右侧倒计时/行动点。
*   **元素**:
    *   **Platform Badge**: 来源平台徽章 (e.g. "ModelScope")，点击可跳转至该平台筛选页。
    *   **AI Summary**: 比如 "这是一个基于 PyTorch 的 CV 类比赛..." (由 AIProcessor 生成)。
    *   **Action Button**: 巨大的 "Join Contest" 按钮，带发光效果。

### B. Info Grid (信息网格) - 分类展示区
您提到的"按照比赛来源、tag进行分类"在此处体现为结构化的属性展示：

| 分类维度 | 展示形式 | 组件建议 |
| :--- | :--- | :--- |
| **Source / Organizer** | 显示Logo和主办方名称链接。 | `Avatar` + `Link` |
| **Tags / Domain** | 彩色标签组 (e.g. Blue for NLP, Green for CV)。 | `Badge` / `Chip` (Rounded full) |
| **Difficulty** | 进度条或星级显示。 | `Progress` 或 自定义 SVG |
| **Prize Data** | 突出显示的金额数字。 | `Typography` (Gradient Text) |

### C. Content Body (内容主体)
*   **Markdown Viewer**: 渲染清洗后的 `description` 字段。
*   **Tab System (可选)**: 如果内容极长，拆分为 "Overview", "Rules", "Dates"。

## 3. 分类/标签系统的实现 (Classifier Strategy)

要在详情页体现"分类"，我们需要一个统一的 **Tagging System**：

1.  **数据层 (AIProcessor)**:
    *   我们目前的 `AIProcessor` 已经输出了 `tags` (如 `["cv", "image-generation"]`)。
    *   **建议**: 增加一个简单的映射表 (Mapping)，将松散的 AI tags 映射为标准分类 (System Categories)。
    
2.  **UI 层 (Components)**:
    *   **TagGroup 组件**: 接收 tags 数组，自动分配颜色 (Badge Style)。
        *   NLP 类 -> **Cornflower Blue** (`#6495ED` bg, white text)
        *   Vision 类 -> **Cobalt Blue** (`#0047AB` bg, white text)
        *   Audio/Other -> **Steel Azure** (`#314159` bg, `#e2e8f0` text)
    *   **Related Contests**: 底部增加 "Similar Contests" 模块，根据当前页面的 tags 推荐同类比赛。

## 4. 技术实现
*   **路由**: `/contest/[id]` (Next.js Dynamic Route)。
*   **数据获取**: `getStaticProps` (或 Next.js 13+ `generateStaticParams`) 读取对应的 JSON 文件。
*   **Markdown 渲染**: 使用 `react-markdown` 或 `remote-mdx`，配合 Tailwind Typography 插件 (`prose prose-invert`) 自动美化文档样式。

