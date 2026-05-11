# SmartSender Frontend Deployment

## Environment Variables Required

Set these environment variables in your Netlify dashboard:

- `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., https://your-backend.onrender.com)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth client ID (if using Google login)

## Build Commands

- Build Command: `npm run build`
- Publish Directory: `out`
- Node Version: 18

## Deployment Notes

This is a Next.js static export optimized for Netlify deployment.
