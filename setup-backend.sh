#!/bin/bash
# Quick Setup Script for TradeTrack Backend
# Stock Market Analysis System

echo "=========================================="
echo "TradeTrack - Backend Quick Setup"
echo "Developed by Midhul Sasikumar | Reg No: 24122018"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Navigate to Backend directory
cd "Backend_" || exit 1

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
        echo ""
        echo "⚠️  IMPORTANT: Please edit .env file and update:"
        echo "   - JWT_SECRET (set a strong random string)"
        echo "   - MONGODB_URI (if using local MongoDB)"
        echo "   - GOOGLE_CLIENT_ID"
        echo "   - GOOGLE_CLIENT_SECRET"
    else
        echo "❌ .env.example file not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "=========================================="
echo "✅ Backend setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit Backend_/.env with your configuration"
echo "2. Ensure MongoDB is running"
echo "3. Run 'npm run dev' to start the server"
echo ""
echo "Backend will run on http://localhost:5000"
