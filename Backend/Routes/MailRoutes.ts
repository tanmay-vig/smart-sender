import express from "express";
import { uploadXlsx, upload as memoryUpload } from "../Controllers/xlsxController";
import multer from 'multer';
import { userLogin, saveProfile, authenticateUser, registerUser } from "../Controllers/userLogin";
import { sendMail, getSentEmails, uploadAndSendMail, generateEmailWithAI } from "../Controllers/mailController";
import { scheduleEmail, getScheduledEmails, cancelScheduledEmail } from "../Controllers/schedulingController";
import { userModel } from "../Models/userModel";

const MailRouter = express.Router();
const diskUpload = multer({ dest: 'uploads/' });

// Original separate endpoints
MailRouter.post("/upload", memoryUpload.array('files'), uploadXlsx);
MailRouter.post("/sendmail", diskUpload.array("attachments"), sendMail);

// New unified endpoint that combines upload and compose mail
MailRouter.post("/upload-and-send", diskUpload.fields([
  { name: 'files', maxCount: 10 },      // Excel/CSV files for contacts
  { name: 'attachments', maxCount: 10 }  // Email attachments
]), uploadAndSendMail);

// Scheduling routes
MailRouter.post("/schedule", diskUpload.array("attachments"), scheduleEmail);
MailRouter.get("/scheduled", getScheduledEmails);
MailRouter.delete("/scheduled/:emailId", cancelScheduledEmail);

// Sent emails history
MailRouter.get("/sent-emails", getSentEmails);

// AI email generation
MailRouter.post("/generate-email", generateEmailWithAI);

// User authentication and profile
MailRouter.post("/userlogin", userLogin); // Google OAuth login
MailRouter.post("/authenticate", authenticateUser); // Email/Password login
MailRouter.post("/register", registerUser); // Register new user
MailRouter.post("/userlogin/profile", saveProfile);

export default MailRouter;