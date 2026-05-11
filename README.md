# SmartSender

**Effortless, personalized mass emails—powered by AI.**

SmartSender is a full-stack web application that enables users to send personalized bulk emails efficiently. Built with Next.js frontend and Node.js/Express backend, it integrates with Gmail OAuth2 for secure email sending and supports Excel/CSV file uploads for contact management.

## Project Demo

[![Watch the demo](/ProjectDemo.png)](https://www.youtube.com/watch?v=R4H83FJqNKA)

## Features

- **OAuth2 Gmail Integration**: Secure authentication with Google Gmail API
- **Bulk Email Sending**: Send personalized emails to multiple recipients
- **Excel/CSV Support**: Upload contact lists from Excel or CSV files
- **Email Personalization**: Automatically personalize emails with recipient names
- **Real-time Status Tracking**: Monitor email delivery status for each recipient
- **Export Results**: Download email status reports as Excel files
- **Responsive UI**: Modern, mobile-friendly interface built with Tailwind CSS

## Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Icons** - Icon library
- **XLSX** - Excel file processing
- **File Saver** - File download functionality

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB/Mongoose** - Database
- **Nodemailer** - Email sending
- **Google APIs** - OAuth2 and Gmail integration
- **Multer** - File upload handling
- **XLSX** - Excel file processing

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MRPERFECT0603/SmartSender.git
cd SmartSender
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the Backend directory:

```env
CONNECTION_STRING=your_mongodb_connection_string
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REDIRECT_URI=http://localhost:8101/callback
SCOPES=https://www.googleapis.com/auth/gmail.send
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:8101/callback` to authorized redirect URIs
6. Add your client ID and secret to the backend `.env` file

## Running the Application

### Start Backend Server

```bash
cd Backend
npm run dev
```

The backend server will run on `http://localhost:8101`

### Start Frontend Server

```bash
cd frontend
npm run dev
```

The frontend application will run on `http://localhost:3000`

## Usage

### 1. User Authentication
- Navigate to `/login`
- Enter your username, Gmail address, and password
- Complete OAuth2 authorization with Google
- You'll be redirected to the dashboard

### 2. Upload Contact List
- On the dashboard, upload an Excel (.xlsx) or CSV file containing contacts
- Required columns: `name` and `email`
- The application will display the uploaded contacts in a table

### 3. Compose and Send Emails
- Fill in the email form:
  - **User Name**: Your name (appears in email signature)
  - **From Email**: Your Gmail address
  - **Subject**: Email subject line
  - **Email Body**: Message content
- Click "Send Emails" to send personalized emails to all contacts

### 4. Monitor Results
- View real-time status updates for each email
- Green highlighting indicates successful delivery
- Red highlighting indicates failed delivery
- Download status report as Excel file

## Environment Variables

### Backend (.env)
```env
CONNECTION_STRING=mongodb://localhost:27017/smartsender
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REDIRECT_URI=http://localhost:8101/callback
SCOPES=https://www.googleapis.com/auth/gmail.send
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/userlogin` | User authentication |
| POST | `/api/upload` | Upload Excel/CSV file |
| POST | `/api/sendmail` | Send bulk emails |
| GET | `/callback` | OAuth2 callback handler |

## Security Features

- OAuth2 authentication with Google
- Secure token management with refresh tokens
- Input validation and sanitization
- CORS protection
- Environment variable protection

## Email Personalization

The application automatically personalizes emails with:
- Recipient's name in greeting: "Dear [Name]"
- Sender's name in signature: "Yours, [User Name]"

Example:
```
Dear Vivek,

Your email content here...

Yours,
Shaurya
```

## File Format Requirements

### Excel/CSV Format
Your contact file should include these columns:
- `name`: Recipient's full name
- `email`: Recipient's email address

Example:
```csv
name,email
John Doe,john@example.com
Jane Smith,jane@example.com
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Authors

- **MRPERFECT0603** - *Initial work* - [GitHub](https://github.com/MRPERFECT0603)

## Links

- [Repository](https://github.com/MRPERFECT0603/SmartSender)
- [Issues](https://github.com/MRPERFECT0603/SmartSender/issues)

## Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Search existing [issues](https://github.com/MRPERFECT0603/SmartSender/issues)
3. Create a new issue with detailed information

---

Made with 💙 by MRPERFECT0603

