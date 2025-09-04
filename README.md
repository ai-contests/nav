# AI Contests Navigator

An automated aggregation platform for AI competition information that regularly scrapes AI contest websites, uses AI to summarize contest information, and generates static websites to publish contest information.

## 🚀 Features

- **Automated Web Scraping**: Regularly scrape AI contest information from various platforms
- **AI-Powered Processing**: Use AI to summarize and categorize contest information
- **Static Site Generation**: Generate responsive static websites for contest information
- **Multi-Platform Support**: Support for ModelScope, Civitai, OpenArt, and more
- **Quality Validation**: Built-in data validation and quality checks
- **CI/CD Integration**: Automated deployment with GitHub Actions

## 🏠 Homepage Features

### Interactive Contest Discovery
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Catppuccin Mocha Theme**: Beautiful dark theme with consistent color palette
- **Real-time Data**: Fetches contest data from `/api/contests` endpoint
- **Interactive Filters**: Filter contests by status, category, and sorting options
- **Contest Cards**: Display contest information with status indicators, tags, and links
- **Loading & Error States**: Proper handling of loading and error scenarios
- **Modern UI**: Hover effects, transitions, and clean typography

### API Integration
- **Server API Routes**: Nuxt server-side API endpoints
- **TypeScript Interfaces**: Type-safe data handling
- **Error Handling**: Graceful error handling with fallback data
- **Data Transformation**: Clean data formatting for frontend consumption

## 📋 Project Structure

```
ai-contests-nav/
├── server/                 # Server-side code (Nuxt full-stack)
│   ├── api/               # API routes for data serving
│   └── utils/             # Server utilities and processors
├── pages/                  # Nuxt pages (file-based routing)
├── components/             # Reusable Vue components
├── assets/                 # Static assets and styles
├── data/                   # Processed contest data
│   ├── raw/               # Raw scraped data
│   ├── processed/         # Processed data
│   └── backup/            # Backup files
├── public/                 # Public static files
├── types/                  # TypeScript type definitions
├── config/                 # Configuration files
├── tests/                  # Test files
├── scripts/                # Build and deployment scripts
└── docs/                   # Documentation
```

## 🛠️ Technology Stack

- **Framework**: Nuxt 3 (Full-stack)
- **Language**: TypeScript + Node.js 18+
- **Frontend**: Vue 3 + Composition API
- **Styling**: Tailwind CSS + Catppuccin Mocha theme
- **Web Scraping**: Cheerio + Puppeteer
- **AI Processing**: OpenAI API / ModelScope API
- **Static Generation**: Nuxt generate
- **Deployment**: Vercel / Netlify
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
   ```bash
   cp config/default.json config/local.json
   # Edit config/local.json with your settings
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Quick Start

### View the Homepage
The application is now running with a beautiful homepage that displays AI contests:

```bash
# Start development server (if not already running)
npm run dev

# Open in browser
# http://localhost:3001
```

### Homepage Features
- **Contest Grid**: Responsive card layout showing contest information
- **Status Indicators**: Visual status badges (active, upcoming, ended)
- **Interactive Filters**: Filter by status, category, and sort options
- **Real-time Data**: Fetches data from the API endpoint
- **Dark Theme**: Catppuccin Mocha theme for comfortable viewing
- **Mobile Responsive**: Works perfectly on all device sizes

### API Testing
Test the API endpoint directly:

```bash
# View API response
curl http://localhost:3001/api/contests

# Or open in browser
# http://localhost:3001/api/contests
```

### Development Mode
```bash
npm run dev
# Open http://localhost:3001
```

### Production Build
```bash
# Build for production
npm run build

# Generate static site
npm run generate

# Preview production build
npm run preview
```

### Run Individual Components
```bash
# Scrape data only
npm run crawl

# Process data only
npm run process

# Generate site only
npm run generate

# Health check
npm run health
```

## ⚙️ Configuration

### Platform Configuration (`config/sources.json`)
```json
{
  "platforms": {
    "modelscope": {
      "displayName": "ModelScope",
      "baseUrl": "https://modelscope.cn",
      "contestListUrl": "https://modelscope.cn/competitions",
      "selectors": {
        "contestItems": ".competition-item",
        "title": ".competition-title",
        "link": "a[href]"
      },
      "enabled": true,
      "delay": 2.0,
      "maxRetries": 3
    }
  }
}
```

### Main Configuration (`config/default.json`)
```json
{
  "mode": "full",
  "enableValidation": true,
  "enableHealthCheck": true,
  "maxConcurrency": 3,
  "logLevel": "info",
  "schedule": {
    "crawlInterval": 8,
    "enableAutoRun": true
  }
}
```

## 📖 CLI Usage

```bash
# Full workflow
ai-contest run

# Scraping only
ai-contest crawl --platform modelscope

# Processing only
ai-contest process

# Site generation only
ai-contest generate

# Health check
ai-contest health

# Show statistics
ai-contest stats

# Validate configuration
ai-contest validate-config config/default.json
```

## 🔧 Development

### Code Style
- Use TypeScript for all modules
- Follow ESLint and Prettier configurations
- Write comments and documentation in English
- Use semantic file and variable naming

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Linting
```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format
```

## 🏗️ Deployment

### Vercel (Recommended)
1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Build Settings**:
   ```bash
   Build Command: npm run build
   Output Directory: .output/public
   Install Command: npm install
   ```
3. **Environment Variables**: Set up API keys and configuration
4. **Deploy**: Automatic deployment on push to main branch

### Static Generation
```bash
# Generate static site for any hosting
npm run generate

# Output will be in .output/public/
```

### Manual Deployment
```bash
# Build production version
npm run build

# Deploy to Vercel/Netlify
npm run deploy
```

## 📊 Data Flow

```
Data Sources → Scrapers → Raw Data → AI Processing → Processed Data → Nuxt API → Frontend → Static Site
     ↓              ↓           ↓            ↓             ↓              ↓            ↓           ↓
Platform Configs   Validation  Storage    Quality Check  JSON Storage   Routes      Components  Vercel Deploy
```

## 🎨 Frontend Architecture

### Pages
- **Home (`/`)**: Contest discovery with search and filters
- **Contest Detail (`/contest/[id]`)**: Detailed contest information
- **About (`/about`)**: Platform information and statistics

### Components
- **ContestCard**: Individual contest display component
- **ContestFilters**: Search and filtering controls
- **ContestGrid**: Responsive grid layout
- **LoadingSpinner**: Loading state indicator

### Styling
- **Framework**: Tailwind CSS
- **Theme**: Catppuccin Mocha dark theme
- **Responsive**: Mobile-first design
- **Accessibility**: WCAG compliant

## 🔧 API Routes

### GET /api/contests
Returns processed contest data for the frontend.

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contest-123",
      "title": "AI Challenge 2024",
      "platform": "ModelScope",
      "status": "active",
      "description": "Comprehensive AI competition...",
      "tags": ["machine-learning", "computer-vision"],
      "quality": 8.5,
      "url": "https://example.com"
    }
  ],
  "total": 66,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Individual module testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full workflow testing
- **Performance Tests**: Load and performance testing

## 📋 API Reference

### Source Manager
```typescript
const sourceManager = new SourceManager('config/sources.json');
const platforms = sourceManager.listPlatforms();
const tasks = sourceManager.generateCrawlTasks();
```

### Scrapers
```typescript
const scraper = new ModelScopeScraper(platformConfig);
const contests = await scraper.scrape();
```

### AI Processor
```typescript
const processor = new AIProcessor(processorConfig);
const processed = await processor.process(rawContests);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Update documentation for API changes
- Follow the existing code style
- Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs](./docs) folder
- **Issues**: Report bugs on [GitHub Issues](https://github.com/ai-contests/nav/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/ai-contests/nav/discussions)

## 🔄 Roadmap

- [ ] **Phase 1**: Basic infrastructure setup ✅
- [ ] **Phase 2**: Data processing and validation
- [ ] **Phase 3**: Site generation and UI
- [ ] **Phase 4**: CI/CD and monitoring
- [ ] **Phase 5**: Optimization and release

## 📈 Status

- **Build**: ![Build Status](https://github.com/ai-contests/nav/workflows/CI/badge.svg)
- **Coverage**: ![Coverage](https://img.shields.io/codecov/c/github/ai-contests/nav)
- **Version**: ![Version](https://img.shields.io/npm/v/ai-contests-nav)

---

**Made with ❤️ by the AI Contests Team**
