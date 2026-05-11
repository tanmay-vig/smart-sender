# 🚀 SmartSender Netlify Deployment Guide

This guide will help you deploy your SmartSender frontend to Netlify using your GitHub organization.

## 📋 Prerequisites

- GitHub organization created ✅
- SmartSender project ready for deployment ✅
- Netlify account (free account works fine)
- Backend deployed (Render, Railway, or Heroku)

## 🔧 Step 1: Prepare Your Repository

### 1.1 Initialize Git Repository (if not done)
```bash
cd /Users/nemo/Documents/Codebase/SmartSender
git init
```

### 1.2 Create .gitignore (if needed)
```bash
# Make sure these are in your .gitignore
echo "node_modules/" >> .gitignore
echo ".env.local" >> .gitignore
echo ".next/" >> .gitignore
echo "dist/" >> .gitignore
echo ".DS_Store" >> .gitignore
```

### 1.3 Add and Commit Files
```bash
git add .
git commit -m "Initial commit: SmartSender ready for deployment"
```

### 1.4 Create Repository in Your GitHub Organization
1. Go to your GitHub organization
2. Click "New repository"
3. Name it `smartsender` or `smart-sender`
4. Make it public (recommended for easier deployment)
5. Don't initialize with README (since you already have code)

### 1.5 Push to GitHub
```bash
# Replace 'your-org-name' with your actual organization name
git remote add origin https://github.com/your-org-name/smartsender.git
git branch -M main
git push -u origin main
```

## 🌐 Step 2: Netlify Deployment

### 2.1 Access Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Log in (can use GitHub account for easier integration)

### 2.2 Import Your Project
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access your GitHub organization
4. Select your organization and the `smartsender` repository

### 2.3 Configure Build Settings
Netlify should auto-detect your settings, but verify these:

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/out`
- **Node version**: `18`

### 2.4 Set Environment Variables
Before deploying, add these environment variables in Netlify:

**Site settings** → **Environment variables** → **Add variable**

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

⚠️ **Important**: Replace `your-backend-url` with your actual backend URL

### 2.5 Deploy
1. Click **"Deploy site"**
2. Netlify will build and deploy your site
3. You'll get a random URL like `https://amazing-name-123456.netlify.app`

## 🎯 Step 3: Custom Domain (Optional)

### 3.1 Add Custom Domain
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `smartsender.yourdomain.com`)
4. Follow DNS configuration instructions

### 3.2 Enable HTTPS
- Netlify automatically provisions SSL certificates
- Force HTTPS redirect in **Site settings** → **HTTPS**

## 🔧 Step 4: Backend Integration

### 4.1 Update Backend CORS
Add your Netlify domain to your backend CORS settings:

```javascript
// In your backend server.ts
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://your-netlify-domain.netlify.app",
    "https://your-custom-domain.com" // if using custom domain
  ],
  credentials: true,
}));
```

### 4.2 Deploy Backend Changes
Redeploy your backend after updating CORS settings.

## 🚀 Step 5: Automatic Deployments

### 5.1 Enable Auto-Deploy
- Netlify automatically deploys when you push to your main branch
- You can configure branch-specific deployments if needed

### 5.2 Deploy Previews
- Pull requests automatically create deploy previews
- Perfect for testing before merging

## 📊 Step 6: Monitoring and Analytics

### 6.1 Enable Analytics
- Go to **Site settings** → **Analytics**
- Enable Netlify Analytics for traffic insights

### 6.2 Form Handling (if using contact forms)
- Netlify provides form handling for static sites
- Add `netlify` attribute to your forms

## 🛠️ Troubleshooting

### Common Issues and Solutions

**Build Fails:**
```bash
# Check your build locally first
cd frontend
npm install
npm run build
```

**Environment Variables Not Working:**
- Ensure variables start with `NEXT_PUBLIC_`
- Redeploy after adding variables

**API Calls Fail:**
- Check CORS settings on backend
- Verify API URL in environment variables
- Check browser network tab for exact errors

**Images Not Loading:**
- Ensure `images.unoptimized: true` in next.config.ts
- Use relative paths for images in public folder

## 📝 Example Deployment Commands

```bash
# Complete deployment script
cd /Users/nemo/Documents/Codebase/SmartSender

# Ensure everything is committed
git add .
git commit -m "Deploy: SmartSender v1.0"

# Push to trigger automatic deployment
git push origin main

# Check deployment status
echo "Check your Netlify dashboard for deployment status"
echo "Your site will be available at: https://your-site-name.netlify.app"
```

## 🎉 Success Checklist

- [ ] Repository pushed to GitHub organization
- [ ] Netlify site created and configured
- [ ] Environment variables set
- [ ] Build successful
- [ ] Frontend loads correctly
- [ ] API calls work (login, upload, send emails)
- [ ] All features functional
- [ ] Backend CORS updated
- [ ] SSL certificate active

## 🔗 Useful Links

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Organizations](https://docs.github.com/en/organizations)

---

🎯 **Next Steps After Deployment:**
1. Test all functionality on the live site
2. Set up monitoring and error tracking
3. Configure custom domain if desired
4. Share with users and gather feedback
