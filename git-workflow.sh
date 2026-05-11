#!/bin/bash

# 🔄 SmartSender Git Workflow Script
# This script handles the improvements branch workflow for deployment

echo "🔄 SmartSender Git Workflow for Deployment"
echo "==========================================="

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

# Step 1: Fetch and switch to improvements branch
echo "📥 Step 1: Setting up improvements branch"
echo "========================================"

print_info "Fetching latest changes..."
git fetch origin

if git show-ref --verify --quiet refs/heads/improvements; then
    print_info "Switching to existing improvements branch..."
    git checkout improvements
    git pull origin improvements
else
    print_info "Creating improvements branch from remote..."
    git checkout -b improvements origin/improvements
fi

print_status "Now on improvements branch"

# Step 2: Add and commit changes
echo ""
echo "📝 Step 2: Committing changes"
echo "============================="

if git diff --staged --quiet && git diff --quiet; then
    print_warning "No changes to commit"
else
    print_info "Adding all changes..."
    git add .
    
    print_info "Committing changes..."
    git commit -m "feat: Add uploaded contacts feature and deployment configurations

- Implemented comprehensive uploaded contacts management
- Added backend APIs for contact storage and retrieval
- Enhanced frontend with uploaded contacts tab
- Added Netlify deployment configuration
- Updated environment configuration for production

Ready for Netlify deployment via GitHub organization."
    
    print_status "Changes committed to improvements branch"
fi

# Step 3: Push improvements branch
echo ""
echo "⬆️  Step 3: Pushing improvements branch"
echo "======================================"

print_info "Pushing improvements branch to GitHub..."
if git push origin improvements; then
    print_status "Improvements branch pushed successfully"
else
    print_error "Failed to push improvements branch"
    exit 1
fi

# Step 4: Create Pull Request instructions
echo ""
echo "🔄 Step 4: Create Pull Request"
echo "=============================="

REPO_URL=$(git remote get-url origin 2>/dev/null)
print_info "Repository: $REPO_URL"

echo ""
echo "🎯 Create Pull Request:"
echo "1. Go to: $REPO_URL"
echo "2. Click 'Compare & pull request' for improvements branch"
echo "3. Title: 'Deploy: SmartSender improvements for Netlify'"
echo "4. Description:"
echo "   - Added comprehensive uploaded contacts feature"
echo "   - Enhanced email tracking and storage"
echo "   - Added Netlify deployment configuration"
echo "   - Ready for production deployment"
echo ""

read -p "Press Enter after creating the Pull Request..."

# Step 5: Merge PR
echo ""
echo "🔀 Step 5: Merge Pull Request"
echo "============================"

echo "Options for merging:"
echo "1. Merge via GitHub web interface (recommended)"
echo "2. Merge locally"
echo ""

read -p "Choose option (1/2): " MERGE_OPTION

if [ "$MERGE_OPTION" = "2" ]; then
    print_info "Merging locally..."
    
    # Switch to main and pull latest
    git checkout main
    git pull origin main
    
    # Merge improvements
    git merge improvements --no-ff -m "Merge improvements: SmartSender deployment ready

- Comprehensive uploaded contacts feature
- Enhanced email tracking system  
- Netlify deployment configuration
- Production-ready frontend and backend"
    
    # Push merged main
    git push origin main
    
    print_status "✅ Pull Request merged locally and pushed!"
    
    # Optional: Delete local improvements branch
    read -p "Delete local improvements branch? (y/n): " DELETE_BRANCH
    if [ "$DELETE_BRANCH" = "y" ] || [ "$DELETE_BRANCH" = "Y" ]; then
        git branch -d improvements
        print_status "Local improvements branch deleted"
    fi
    
else
    print_info "Please merge the PR via GitHub web interface"
    echo "After merging via GitHub:"
    echo "1. The improvements branch will be merged to main"
    echo "2. You can delete the improvements branch"
    echo "3. Your main branch will be ready for Netlify deployment"
fi

# Step 6: Deployment instructions
echo ""
echo "🚀 Step 6: Netlify Deployment"
echo "============================"

print_status "Your code is ready for Netlify deployment!"
echo ""
echo "Next steps:"
echo "1. Go to https://netlify.com"
echo "2. Create new site from your GitHub repository"
echo "3. Use main branch for deployment"
echo "4. Configure build settings:"
echo "   - Base directory: frontend"
echo "   - Build command: npm run build"
echo "   - Publish directory: frontend/out"
echo "5. Add environment variables"
echo ""

print_info "See DEPLOYMENT_GUIDE.md for detailed Netlify setup instructions"

echo ""
print_status "Git workflow complete! 🎉"
