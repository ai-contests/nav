# AI Contests Navigator

<div align="center">

[![Created by nev4rb14su](https://img.shields.io/badge/Created%20by-nev4rb14su-blue?style=flat-square&logo=github)](https://github.com/nev4rb14su)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
![Build Status](https://github.com/ai-contests/nav/workflows/Production%20Deployment/badge.svg)

**The definitive terminal for global AI competitions.**
[aicontests.dev](https://aicontests.dev)

</div>

An automated aggregation platform for AI competition information that regularly scrapes AI contest websites, uses AI to summarize contest information, and generates static websites to publish contest information.

## 🚀 Features

- **Automated Web Scraping**: Regularly scrape AI contest information from various platforms
- **AI-Powered Processing**: Use AI to summarize and categorize contest information
- **Static Site Generation**: Generate responsive processed data for the hub
- **Multi-Platform Support**: Support for ModelScope, Civitai, OpenArt, Kaggle and more
- **Quality Validation**: Built-in data validation and quality checks
- **CI/CD Integration**: Automated deployment with GitHub Actions

## 🏠 Homepage Features

### Interactive Contest Discovery
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Terminal Aesthetic**: Cyberpunk / Developer-focused dark theme
- **Real-time Data**: Fetches contest data from Supabase / API
- **Interactive Filters**: Filter contests by status, category, and sorting options
- **Contest Cards**: Display contest information with status indicators, tags, and links
- **Modern UI**: Hover effects, transitions, and clean typography

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript + Node.js 18+
- **Frontend**: React + Tailwind CSS
- **Styling**: Custom Terminal Theme
- **Web Scraping**: Puppeteer + Cheerio
- **Database**: Supabase
- **Auth**: Clerk
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ai-contests/nav.git
   cd nav
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env.local` file with necessary keys (Supabase, Clerk, etc.)

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Quick Start

### View the Homepage
```bash
npm run dev
# Open http://localhost:3000
```

### Run Scraper Pipeline
```bash
# Scrape data only
npm run crawl

# Process data only
npm run process

# Full Workflow
npm run run --mode full
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/nev4rb14su">@nev4rb14su</a>
</div>
