# Google Sign-In Setup Guide

## For Public Use (Google Sign-In)

### 1. Get Google Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application Type to "Web application"
6. Add your domain to "Authorized JavaScript origins":
   - `http://localhost:3001` (for development)
   - `https://yourdomain.com` (for production)
7. Copy the Client ID

### 2. Configure Environment
Create `.env.local` in the frontend directory:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Deploy
- Set up your production domain
- Add production URL to Google Cloud Console
- Update environment variables

## For Personal Use (App Password)

### 1. Enable 2-Step Verification
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → Turn on

### 2. Generate App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate new app password for "Mail"
4. Copy the 16-character password

### 3. Use in SmartSender
1. Choose "App Password" login method
2. Enter your Gmail address
3. Enter the app password
4. Complete your profile

## Security Notes

- **App Password**: Only for personal use, never share
- **Google Sign-In**: Secure for public use
- **Environment Variables**: Never commit to git
- **HTTPS**: Required for production Google Sign-In

## Troubleshooting

### Google Sign-In Issues
- Check Client ID is correct
- Verify domain is authorized
- Ensure HTTPS in production

### App Password Issues
- Verify 2-Step Verification is enabled
- Check app password is correct
- Ensure Gmail account is active 