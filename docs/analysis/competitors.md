# Competitor & Source Analysis

This document tracks potential data sources and competitor platforms for AI Contests Navigator. The goal is to analyze their features (UI/UX, Data Fields) and integrate them as future data sources.

## 1. Devpost (Competitor & Source)
*   **URL**: `https://devpost.com/hackathons`
*   **Role**: Top-tier global hackathon platform.
*   **UI Features**:
    *   **Horizontal Card**: Left thumbnail, clear "Time Left" badge, clean tags.
    *   **Filters**: "Match my eligibility", "Online/In-person", "Status", "Length".
    *   **Badges**: "Managed by Devpost", "Beginner Friendly".
*   **Data Points**: Prize Amount ($), Participants count, Host organization.

## 2. Kaggle (Competitor & Source)
*   **URL**: `https://www.kaggle.com/competitions`
*   **Role**: The gold standard for data science competitions.
*   **UI Features**:
    *   **List/Card Hybrid**: Extremely compact list view with small circular logos.
    *   **Categories**: "Featured", "Getting Started", "Research", "Playground".
    *   **Metrics**: Teams count (popularity indicator).
*   **Data Points**: Prize, Teams, Tags (CV, NLP, Tabular), Kernel requirements.

## 3. DrivenData (Source)
*   **URL**: `https://www.drivendata.org/competitions/`
*   **Role**: Focuses on "Social Impact" AI challenges (Climate, Health, Development).
*   **UI Features**:
    *   **Card Layout**: Big hero image top, clean white card body.
    *   **Categorization**: "Prize competitions" vs "Practice competitions".
    *   **Progress Bar**: Visual timeline for specific tracks.
*   **Target Content**: High-value "Social Good" projects.

## 4. Topcoder (Source)
*   **URL**: `https://www.topcoder.com/challenges`
*   **Role**: Veteran coding/algorithm platform, significant AI track.
*   **UI Features**:
    *   **Dense List**: Very information-dense table rows suitable for pro users.
    *   **Status Indicators**: "Open for Registration", "Submission", "Review".
    *   **Tags**: "Data Science", "Design", "Development".

## 5. ModelScope (Current Source)
*   **URL**: `https://modelscope.cn/brand/view/competition`
*   **Role**: Leading Chinese AI model community.
*   **UI Features**: Dark mode grid, focus on "Application Development".

## 6. Tianchi (Source - Future)
*   **URL**: `https://tianchi.aliyun.com/competition/gameList`
*   **Role**: Alibaba's big data competition platform.
*   **Relevance**: High overlap with ModelScope but distinct commercial contests.

---

## Action Plan
1.  **Design Inspiration**: Adopt Devpost's **Horizontal Card** layout (Thumbnail Left + Meta Right) as the primary Hub view.
2.  **Filter Logic**: Borrow Kaggle's "Category" logic (Research vs Playground) for our "Difficulty" filter.
3.  **Data Expansion**: Prioritize adding **Devpost** and **DrivenData** scrapers in Phase 2 to diversify English content.
