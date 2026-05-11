# Backend Setup Guide

## Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# Database Configuration
CONNECTION_STRING=mongodb://localhost:27017/smartsender

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Server Configuration
PORT=8102

# Email Configuration (for app password method)
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here
```

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application Type to "Web application"
6. Add authorized origins:
   - `http://localhost:3001` (development)
   - `https://yourdomain.com` (production)
7. Copy the Client ID and Client Secret

## Getting Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → Turn on
3. Security → 2-Step Verification → App passwords
4. Generate new app password for "Mail"
5. Copy the 16-character password

## Running the Backend

```bash
cd Backend
npm install
npm start
```

The server will run on `http://localhost:8102` 