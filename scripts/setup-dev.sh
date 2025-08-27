#!/bin/bash

# Development setup script for AI Contests Navigator
# This script helps set up the development environment

set -e

echo "🚀 Setting up AI Contests Navigator development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/raw
mkdir -p data/processed
mkdir -p data/backup
mkdir -p logs
mkdir -p site

# Create local config if it doesn't exist
if [ ! -f "config/local.json" ]; then
    echo "⚙️ Creating local configuration..."
    cp config/default.json config/local.json
    echo "📝 Please edit config/local.json with your API keys and settings"
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Run linting
echo "🔍 Running code quality checks..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  npm run dev          # Start development mode"
echo "  npm run crawl        # Crawl contest data"
echo "  npm run process      # Process data with AI"
echo "  npm run generate     # Generate static site"
echo "  npm run health       # Health check"
echo ""
echo "📖 Check README.md for more information"
