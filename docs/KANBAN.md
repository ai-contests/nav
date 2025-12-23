# AI Contests Navigator - Kanban Board

## 📋 Backlog
- [ ] Implement robust retry logic for Civitai API (451 error)
- [ ] Add proxy rotation support for scrapers
- [ ] Design and implement Web UI (Static Site Generation)
- [ ] Add "OpenArt" platform scraper support
- [ ] Add "Devpost" platform scraper support
- [ ] Add "DrivenData" platform scraper support
- [ ] Implement email notifications for new contests

## 🏗️ In Progress
- [ ] **Data Pipeline Optimization**
    - [x] Validate AI enrichment data quality
    - [x] Implement platform filtering for `process` command
    - [ ] Monitor GitHub Models API usage/limits

## ✅ Completed
- [x] **Design and implement Web UI (Static Site Generation)**
    - [x] Create Design System (Deep Ocean / JetBrains Mono)
    - [x] Initialize Next.js Project Structure
    - [x] Implement Landing Page (Home)
    - [x] Implement Contest Hub Page (Grid/List View & Filters)
    - [x] Implement Detail Page
    - [x] Implement Documentation Page
- [x] **Project Infrastructure**
    - Initial project setup with TypeScript
    - ESLint/Prettier configuration
    - GitHub Actions workflow for CI/CD
- [x] **Civitai Scraper Core**
    - Basic HTML parsing
    - Title cleaning logic
    - API announcement fallback (implemented but hitting 451)
- [x] **AI Enrichment Upgrade**
    - Switch to GitHub Models (gpt-4o / Jamba)
    - Integrate `@azure-rest/ai-inference` SDK
    - Configurable API keys and endpoints
- [x] **ModelScope Scraper Fixes**
    - API-based data extraction (Title, Desc, Url, Status, Organizer)
    - Rich text description parsing
    - Robust date validations
- [x] **Code Quality & Maintenance**
    - Fix ESLint errors in Scrapers and Processors
    - Pass all unit tests (4/4 suites)
    - Clean up unused imports/variables

## 🐛 Known Issues
- [ ] **Civitai Scraper**: 
  - **Issue**: `AxiosError: Request failed with status code 451` (Region Blocked).
  - **Analysis**: The scraping environment (Cloudflare blocked IP) is restricted from accessing `civitai.com`. Both `curl` and `puppeteer` requests fail with 451.
  - **Resolution Plan**: Requires a residential proxy or running the scraper from a non-blocked region. Configured `HTTPS_PROXY` support in `CivitaiScraper.ts`.
- [x] **ModelScope Scraper**:
  - **Issue**: URL was undefined, fields missing.
  - **Resolution**: Switched to API (`/api/v1/competitions`). Fixed URL generation to fallback to `Id` if `CompetitionId` is missing. Map `status` field. Extract `imageUrl` from `Content` JSON.
  - **Status**: **FIXED**. Validation warnings persist for past contests (expected).
- [ ] **Validation Warnings**: 
  - **Issue**: Pipeline reports warnings for valid checks (e.g., past deadlines).
  - **Resolution**: Review validation logic to distinguish between critical data issues and informational warnings (like "deadline in past").
