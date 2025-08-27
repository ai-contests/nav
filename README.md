# AI Contests Navigator

An automated aggregation platform for AI competition information that regularly scrapes AI contest websites, uses AI to summarize contest information, and generates static websites to publish contest information.

## 🚀 Features

- **Automated Web Scraping**: Regularly scrape AI contest information from various platforms
- **AI-Powered Processing**: Use AI to summarize and categorize contest information
- **Static Site Generation**: Generate responsive static websites for contest information
- **Multi-Platform Support**: Support for ModelScope, Civitai, OpenArt, and more
- **Quality Validation**: Built-in data validation and quality checks
- **CI/CD Integration**: Automated deployment with GitHub Actions

## 📋 Project Structure

```
ai-contests-nav/
├── src/                    # Source code
│   ├── sources/           # Data source management
│   ├── scrapers/          # Web scraping modules
│   ├── processors/        # AI processing modules
│   ├── storage/           # Data storage modules
│   ├── validators/        # Data validation modules
│   ├── generators/        # Static site generators
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── config/                 # Configuration files
├── data/                   # Data storage
│   ├── raw/               # Raw scraped data
│   ├── processed/         # Processed data
│   └── backup/            # Backup files
├── tests/                  # Test files
├── scripts/                # Build and deployment scripts
├── logs/                   # Log files
└── docs/                   # Documentation
```

## 🛠️ Technology Stack

- **Language**: TypeScript + Node.js 18+
- **Web Scraping**: Cheerio + Puppeteer
- **AI Processing**: OpenAI API / ModelScope API
- **Static Site**: HTML + CSS + JavaScript
- **CI/CD**: GitHub Actions
- **Deployment**: GitHub Pages

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

4. **Build the project**
   ```bash
   npm run build
   ```

## 🚀 Quick Start

### Run Full Workflow
```bash
npm run start
# or
npm run run
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

### Development Mode
```bash
npm run dev
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

### GitHub Actions
The project includes automated CI/CD pipelines:

1. **Scheduled Crawling**: Runs every 8 hours
2. **Automated Processing**: AI processing of scraped data
3. **Site Generation**: Build and deploy static site
4. **Health Monitoring**: System health checks

### Manual Deployment
```bash
# Build production version
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📊 Data Flow

```
Data Sources → Scrapers → Raw Data → AI Processing → Processed Data → Site Generator → Static Site
     ↓              ↓           ↓            ↓             ↓              ↓
Platform Configs   Validation  Storage    Quality Check  Backup      Deployment
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
