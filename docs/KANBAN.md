# AI Contests Navigator - Kanban Board

## 📊 Project Status: Launch Ready

**Platforms**: 7 active
**Total Contests**: ~147 (raw data)
**Last Updated**: 2026-01-10

## 🎯 Current Focus: Launch & Promotion

---

## 📋 Backlog (Future Improvements)
- [ ] **Community**: Add `CONTRIBUTING.md` guide
- [ ] **Feature**: RSS Feed generation for contest updates
- [ ] **Feature**: Contest deadline reminders (24h before email)
- [ ] **Scraper**: Add proxy rotation support
- [ ] **Scraper**: Fix OpenArt selectors

## 🏗️ In Progress (User Action Required)
- [ ] **Vercel Environment Variables**
    - [ ] Double check all keys are set in Vercel Dashboard
- [ ] **Product Hunt Launch**
    - [ ] Prepare screenshots and tagline
    - [ ] Submit launch post

## ✅ Completed

### Phase 9: Launch Polish
- [x] **Data Quality & Logic** (New!)
    - [x] **AICrowd**: Fixed garbage titles ("Round 2") & duplicate descriptions.
    - [x] **Tag Precision**: Split "Machine Learning/AI" -> ["Machine Learning", "AI"].
    - [x] **Auto-Archive**: Contests with no deadline are marked strictly `ended` (if no future status).
    - [x] **Civitai**: Implemented robust Image URL extraction.
    - [x] **Workflow**: Reduced update frequency to 12h (from 8h) to save resources.
- [x] **Content & Signals**
    - [x] Implemented `/signals` (Redirect to Hub)
    - [x] Implemented `/logs` (Changelog)
    - [x] Updated Homepage to use Real Data (discarded Mocks)
- [x] **Visuals**
    - [x] Added visual fallback for missing contest images (Gradient + Terminal Icon)
- [x] **Documentation**
    - [x] Updated README with correct Tech Stack (Next.js)
    - [x] Added Authorship Metadata (package.json, Meta tags)
    - [x] Added "Created by" badge
- [x] **Deployment Fixes**
    - [x] Fixed Vercel Build Error (Environment Variables)
    - [x] Integrate Vercel Analytics
    - [x] Configured GitHub Actions for reliable builds
    - [x] Resolved TypeScript strict mode build errors (`src/lib/data.ts`)
- [x] **SEO** (New!)
    - [x] Added `sitemap.ts` (Dynamic) & `robots.ts`
    - [x] Implemented JSON-LD Event Schema for Contest Pages

### Phase 7: Optimization & Maintenance
- [x] **Scraper Performance**
    - [x] Concurrent scraping for AICrowd & Devpost
    - [x] Reduced Puppeteer timeouts (10s -> 5s)
- [x] **Repository Cleanup**
    - [x] Removed `docs/` from git history to reduce repo size
    - [x] Enforced `.gitignore` for documentation
- [x] **Code Quality**
    - [x] Fixed ESLint errors in API routes and Scrapers
    - [x] Optimized types for Supabase data

### Phase 6: User System & Personalization
- [x] **Authentication (Clerk)** & **Database (Supabase)**
- [x] **User Features**: Subscribe, Calendar, Countdown

### Phase 5: Platform Expansion
- [x] **DrivenData, Zindi, Kaggle Scrapers**

### Phase 4: Automation & Notifications
- [x] **Resend Email Integration**
- [x] **Pipeline Optimization**

### Phase 3: Data Pipeline
- [x] **AICrowd & Devpost Scrapers**

### Phase 2: Scrapers
- [x] **ModelScope, Civitai Scrapers**

### Phase 1: Infrastructure
- [x] **Next.js & GitHub Actions**

---

## 🐛 Known Issues
- [ ] **Civitai (Local)**: 451 Region Blocked - works in CI environment
- [ ] **Validation Warnings**: Some contests missing deadline/description

---
