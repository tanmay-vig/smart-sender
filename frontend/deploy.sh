#!/bin/bash

# SmartSender Deployment Script
echo "🚀 Deploying SmartSender to Production"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the frontend directory?"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Built files are in the 'out' directory"
    echo "🌐 Ready for Netlify deployment"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "🎉 Deployment preparation complete!"
echo "ℹ️ Next steps:"
echo "   1. Push your code to GitHub"
echo "   2. Connect repository to Netlify"
echo "   3. Configure environment variables"
echo "   4. Deploy!"
