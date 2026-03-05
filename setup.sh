#!/bin/bash
# Quick Start Script for Infoapp
# Run this after cloning the repository

echo "🚀 Setting up Infoapp..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the app:"
echo "  npm start          - Start normally"
echo "  npm run start:clear - Start with cache cleared (recommended first time)"
echo ""
echo "To run on specific platforms:"
echo "  npm run web        - Run in web browser"
echo "  npm run android    - Run on Android"
echo "  npm run ios        - Run on iOS (macOS only)"
echo ""
echo "📖 Read FIX_APPLIED.md for details about the navigation fix"
echo ""
