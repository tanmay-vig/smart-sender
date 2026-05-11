#!/bin/bash

# 🚀 SmartSender Deployment Script
# This script helps you deploy your SmartSender project to GitHub and Netlify

echo "🚀 SmartSender Deployment Helper"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the SmartSender root directory"
    exit 1
fi

print_info "Current directory: $(pwd)"

# Step 1: Git Setup and Branch Management
echo ""
echo "📁 Step 1: Git Repository and Branch Setup"
echo "=========================================="

if [ ! -d ".git" ]; then
    print_error "No Git repository found. Please run this from a Git repository."
    exit 1
else
    print_status "Git repository exists"
fi

# Fetch latest changes
print_info "Fetching latest changes from remote..."
git fetch origin

# Check if improvements branch exists locally
if git show-ref --verify --quiet refs/heads/improvements; then
    print_status "Local improvements branch exists"
    git checkout improvements
else
    print_info "Creating local improvements branch from remote..."
    git checkout -b improvements origin/improvements
fi

print_status "Switched to improvements branch"

# Step 2: Add files
echo ""
echo "📋 Step 2: Adding Files"
echo "======================="

print_info "Adding all files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    print_info "Committing changes..."
    git commit -m "Deploy: SmartSender ready for Netlify deployment $(date '+%Y-%m-%d %H:%M:%S')"
    print_status "Changes committed"
fi

# Step 3: Remote repository check
echo ""
echo "🌐 Step 3: GitHub Repository Check"
echo "=================================="

# Check if origin remote exists
if git remote get-url origin > /dev/null 2>&1; then
    ORIGIN_URL=$(git remote get-url origin)
    print_status "Remote origin set: $ORIGIN_URL"
else
    print_error "Remote origin not set. Please add your GitHub repository as origin."
    echo "Example: git remote add origin https://github.com/your-org/smartsender.git"
    exit 1
fi

# Step 4: Push to GitHub and Create PR
echo ""
echo "⬆️  Step 4: Pushing to GitHub and Creating PR"
echo "============================================="

print_info "Pushing improvements branch to GitHub..."
if git push origin improvements; then
    print_status "Improvements branch pushed to GitHub successfully"
else
    print_error "Failed to push to GitHub. Please check your repository access."
    exit 1
fi

echo ""
print_info "🔄 Creating Pull Request..."
echo ""
echo "Please follow these steps to create a Pull Request:"
echo "1. Go to your GitHub repository"
echo "2. You should see a 'Compare & pull request' button for the improvements branch"
echo "3. Click it and create a PR with title: 'Deploy: SmartSender improvements for Netlify'"
echo "4. Add description of changes (uploaded contacts feature, deployment configs, etc.)"
echo "5. Assign reviewers if needed"
echo "6. Click 'Create pull request'"
echo ""
echo "GitHub Repository URL: $(git remote get-url origin 2>/dev/null || echo 'Not set')"
echo ""

read -p "Have you created the Pull Request? (y/n): " PR_CREATED

if [ "$PR_CREATED" = "y" ] || [ "$PR_CREATED" = "Y" ]; then
    print_status "Great! PR created."
    
    echo ""
    read -p "Do you want to merge the PR now? (y/n): " MERGE_PR
    
    if [ "$MERGE_PR" = "y" ] || [ "$MERGE_PR" = "Y" ]; then
        print_info "Switching to main branch and merging..."
        git checkout main
        git pull origin main
        git merge improvements
        git push origin main
        print_status "✅ PR merged and main branch updated!"
    else
        print_info "You can merge the PR later through GitHub interface or locally."
    fi
else
    print_warning "Please create the PR before proceeding with deployment."
fi

# Step 5: Netlify deployment instructions
echo ""
echo "🌐 Step 5: Netlify Deployment"
echo "============================="

print_info "Your code is now on GitHub! 🎉"
echo ""
echo "Next steps for Netlify deployment:"
echo "1. Go to https://netlify.com"
echo "2. Sign in with your GitHub account"
echo "3. Click 'Add new site' → 'Import an existing project'"
echo "4. Choose 'Deploy with GitHub'"
echo "5. Select your organization and repository"
echo ""
echo "Build Settings (should auto-detect):"
echo "  - Base directory: frontend"
echo "  - Build command: npm run build"
echo "  - Publish directory: frontend/out"
echo "  - Node version: 18"
echo ""
echo "Environment Variables to add in Netlify:"
echo "  - NEXT_PUBLIC_API_URL=https://your-backend-url.com"
echo "  - NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id"
echo ""

# Step 6: Backend CORS update reminder
echo ""
echo "🔧 Step 6: Backend Update Required"
echo "=================================="

print_warning "Don't forget to update your backend CORS settings!"
echo ""
echo "Add your Netlify domain to your backend CORS configuration:"
echo "Example: 'https://your-site-name.netlify.app'"
echo ""

# Step 7: Final checklist
echo ""
echo "✅ Final Deployment Checklist"
echo "============================="

echo "□ Improvements branch created and pushed"
echo "□ Pull Request created and reviewed"
echo "□ PR merged to main branch"
echo "□ Netlify site created and configured"
echo "□ Environment variables set in Netlify"
echo "□ Backend CORS updated with Netlify domain"
echo "□ Test all features on live site"
echo ""

print_status "Git workflow and deployment preparation complete!"
print_info "Your improvements branch is ready for deployment."

echo ""
echo "🔗 Useful Links:"
echo "GitHub Repository: $(git remote get-url origin 2>/dev/null || echo 'Not set')"
echo "Netlify Dashboard: https://app.netlify.com/"
echo "Deployment Guide: ./DEPLOYMENT_GUIDE.md"
echo ""

print_status "Happy deploying! 🚀"
