# Core Concepts

## 1. Aggregation (Aggregation)
The process of collecting data from multiple external sources (Contest Platforms) into a unified local database.
- **Source**: External website (e.g., ModelScope).
- **Task**: A single unit of work to fetch and parse a specific page.

## 2. Scraping (Scraping)
The technical action of fetching HTML/JSON and extracting structured data.
- **Raw Data**: The initial data extracted, potentially unstructured or messy.
- **Selectors**: Patterns (CSS/XPath) used to locate data points.

## 3. AI Processing (AI Processing)
Using Large Language Models (LLMs) to enhance raw data.
- **Summarization**: Reducing long descriptions to concise summaries.
- **Tagging**: Automatically assigning relevant categories (e.g., "CV", "NLP").
- **Quality Scoring**: Assigning a 1-10 score based on completeness and relevance.

## 4. Static Generation (SSG)
Pre-building all pages at build time to serve fast, static HTML.
- **Hydration**: Client-side JavaScript makes the static page interactive.
- **Data JSON**: Static files containing the contest data for the frontend.
