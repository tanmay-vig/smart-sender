// controllers/emailController.ts
import { Request, Response } from "express";
import { getTransporter } from './transporterManager';
import { EmailService } from '../Services/emailService';
import { GeminiService } from '../Services/geminiService';
import { EmailDraft } from '../Models/emailDraftModel';
import { SentEmail } from '../Models/sentEmailModel';
import { userModel } from '../Models/userModel';
import * as fs from 'fs';
const xlsx = require("xlsx");

const geminiService = new GeminiService();

export const updateText = (
  text: string,
  name: string,
  contact: string,
  linkedIn?: string,
  recipientCompany?: string,
  userCurrentCompany?: string,
  userActualName?: string
) => {
  const senderName = userActualName || 'User'; // Use actual name from profile only
  return `
    <p>Hi ${name},</p>
    <p>I hope you're doing well.</p>
    <p>I'm ${senderName}, currently working as a Backend Developer at <strong>${userCurrentCompany || 'my current company'}</strong>. 
    My experience includes working with <strong>Spring Boot, Kafka, Docker, and Kubernetes</strong>, 
    along with building CI/CD workflows using <strong>GitHub Actions and Helm</strong> for deploying microservices.</p>
    <p>I am currently exploring new opportunities and wanted to check if there are any 
    <strong>SDE-1 backend</strong> openings at <strong>${recipientCompany ?? 'your organisation'}</strong>. 
    If you find my profile relevant, I would be grateful if you could consider referring me for a suitable role.</p>
    <p>Thank you for your time and consideration! I truly appreciate any help you can provide.</p>
    <p>Resume: Attached Below</p>
    <p>Warm Regards,<br>
    ${senderName}<br>
    Contact: +91${contact}<br>
    ${linkedIn ? `LinkedIn Profile: <a href="${linkedIn}" target="_blank">${linkedIn}</a>` : ''}
    </p>
  `;
};

export const updateSubject = (
  company: string,
  role: string = "SDE-1 Backend",
  experience: string = "1+ YOE",
  skills: string = "Java | Spring Boot | Microservices"
) => {
  return `Looking for ${role} Opportunities at ${company} | ${experience} | ${skills}`;
};

/**
 * Generate personalized email content using Gemini AI.
 * POST /api/generate-email
 * Body: { fromEmail, recipients: [{ name, email, company }], prompt }
 */
export const generateEmailWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromEmail, recipients, prompt } = req.body;

    if (!fromEmail || !prompt) {
      res.status(400).json({ error: "fromEmail and prompt are required" });
      return;
    }

    if (!process.env.GROQ_API_KEY) {
      res.status(500).json({ error: "Groq API key not configured on server" });
      return;
    }

    // Fetch sender info from DB
    const userData = await userModel.findOne({ email: fromEmail });
    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const senderInfo = {
      name: userData.profile?.name || userData.name || "User",
      email: fromEmail,
      company: userData.profile?.company || "",
      position: userData.profile?.position || "",
      contact: userData.profile?.contact || "",
      linkedIn: userData.profile?.linkedIn || "",
    };

    // If recipients provided, generate for each; otherwise generate a single preview
    const targetRecipients = recipients && recipients.length > 0
      ? recipients
      : [{ name: "Recipient", email: "recipient@example.com", company: "Company" }];

    const generated = await geminiService.generateBulkEmails(
      targetRecipients,
      senderInfo,
      prompt
    );

    // Convert Map to array for JSON response
    const previews = Array.from(generated.entries()).map(([email, content]) => ({
      recipientEmail: email,
      subject: content.subject,
      html: content.html,
    }));

    res.status(200).json({ previews });
  } catch (err: any) {
    console.error("Generate email error:", err);
    res.status(500).json({ error: err.message || "Failed to generate email with AI" });
  }
};

export const sendMail = async (req: Request, res: Response): Promise<void> => {
  console.log("🔥 SENDMAIL FUNCTION CALLED - START");
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[${requestId}] Received request to send mail`);

  const { user, fromEmail, xlsxData, subject, text, linkedIn, contact, company, useAI, aiPrompt } = req.body;
  const files = req.files as Express.Multer.File[];

  console.log(`[${requestId}] Request data:`, {
    user,
    fromEmail,
    hasXlsxData: !!xlsxData,
    subject,
    linkedIn,
    contact,
    company,
    filesCount: files?.length || 0
  });

  if (!fromEmail || !xlsxData) {
    console.log(`[${requestId}] Missing required fields:`, { fromEmail: !!fromEmail, xlsxData: !!xlsxData });
    res.status(400).json({ error: "Missing fromEmail or xlsxData!" });
    return;
  }

  let ParsedData: any[] = [];
  try {
    const parsed = JSON.parse(xlsxData);
    if (!Array.isArray(parsed)) {
      console.log(`[${requestId}] xlsxData is not an array`);
      res.status(400).json({ error: "xlsxData must be an array." });
      return;
    }
    ParsedData = parsed;
    console.log(`[${requestId}] Parsed ${ParsedData.length} email records`);
  } catch (err) {
    console.log(`[${requestId}] Failed to parse xlsxData:`, err);
    res.status(400).json({ error: "Invalid xlsxData format." });
    return;
  }

  const normalizedData = ParsedData.map((row: any) => {
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
      normalizedRow[key.toLowerCase()] = row[key];
    }
    return normalizedRow;
  });

  const result: { email: string; status: string; debugInfo?: any }[] = [];

  try {
    console.log(`[${requestId}] Getting transporter for email:`, fromEmail);
    const transporter = await getTransporter(fromEmail);
    console.log(`[${requestId}] Transporter created successfully`);

    // Fetch user data to get their current company and actual name
    const userData = await userModel.findOne({ email: fromEmail });
    const userCurrentCompany = userData?.profile?.company || 'my current company';
    const userActualName = userData?.profile?.name || userData?.name || 'User'; // Use the name from profile first, then main user record
    console.log(`[${requestId}] User current company: ${userCurrentCompany}, User name: ${userActualName}`);

    // If AI mode, pre-generate all emails in bulk
    let aiGeneratedEmails: Map<string, { subject: string; html: string }> | null = null;
    if (useAI === 'true' && aiPrompt) {
      console.log(`[${requestId}] AI mode enabled, generating personalized emails with Gemini`);
      const recipients = normalizedData
        .filter((row: any) => row.email)
        .map((row: any) => ({
          name: row.name || "Sir/Ma'am",
          email: row.email,
          company: row.company || "",
        }));

      aiGeneratedEmails = await geminiService.generateBulkEmails(
        recipients,
        {
          name: userActualName,
          email: fromEmail,
          company: userCurrentCompany,
          position: userData?.profile?.position || "",
          contact: contact || userData?.profile?.contact || "",
          linkedIn: linkedIn || userData?.profile?.linkedIn || "",
        },
        aiPrompt
      );
    }

    for (const row of normalizedData) {
      const toEmail = row.email;
      const name = row.name || "Sir/Ma'am";
      const recipientCompany = row.company || "your organisation"; // Use recipient's company from Excel data

      if (!toEmail) {
        result.push({ email: "N/A", status: "No email found" });
        continue;
      }

      // Use AI-generated content if available, otherwise fall back to template or user-provided content
      let htmlText: string;
      let htmlSubject: string;

      if (aiGeneratedEmails && aiGeneratedEmails.has(toEmail)) {
        const aiContent = aiGeneratedEmails.get(toEmail)!;
        htmlSubject = aiContent.subject;
        htmlText = aiContent.html;
        console.log(`[${requestId}] Using AI-generated content for ${toEmail}`);
      } else if (subject && text) {
        // User provided their own subject and text — use them directly
        htmlSubject = subject;
        htmlText = text;
      } else {
        htmlText = updateText(text, name, contact, linkedIn, recipientCompany, userCurrentCompany, userActualName);
        htmlSubject = updateSubject(recipientCompany);
      }

      const mailOptions: any = {
        from: fromEmail,
        to: toEmail,
        subject: htmlSubject,
        html: htmlText,
      };

      if (files && files.length > 0) {
        mailOptions.attachments = files.map((file) => ({
          filename: file.originalname,
          path: file.path,
        }));
      }

      // Save email record to database BEFORE sending (with pending status)
      let emailRecord;
      try {
        emailRecord = new SentEmail({
          fromEmail,
          toEmail,
          subject: htmlSubject,
          content: htmlText,
          recipientName: name,
          company: recipientCompany, // Store recipient's company, not sender's
          status: 'pending',
          sentAt: new Date(),
          attachments: files ? files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size
          })) : []
        });
        await emailRecord.save();
        console.log(`� [${requestId}] Email record created for ${toEmail} with ID: ${emailRecord._id}`);
      } catch (dbErr: any) {
        console.error(`[${requestId}] Failed to save email record for ${toEmail}:`, dbErr);
      }

      try {
        console.log(`🚀 [${requestId}] Attempting to send email to ${toEmail}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ [${requestId}] Email sent successfully to ${toEmail}`);

        // Update email record status to 'sent'
        if (emailRecord) {
          try {
            emailRecord.status = 'sent';
            await emailRecord.save();
            console.log(`✅ [${requestId}] Email record updated to 'sent' for ${toEmail}`);
          } catch (updateErr: any) {
            console.error(`[${requestId}] Failed to update email record status for ${toEmail}:`, updateErr);
          }
        }

        result.push({ email: toEmail, status: "Sent" });
      } catch (sendErr: any) {
        console.error(`[${requestId}] Failed to send email to ${toEmail}:`, sendErr);

        // EXPLICIT DEBUG LOGGING
        console.log("=== ERROR DEBUG START ===");
        console.log("sendErr type:", typeof sendErr);
        console.log("sendErr:", sendErr);
        console.log("sendErr.message:", sendErr?.message);
        console.log("sendErr.code:", sendErr?.code);
        console.log("sendErr.responseCode:", sendErr?.responseCode);
        console.log("=== ERROR DEBUG END ===");

        // Get detailed error message
        let errorMessage = "Unknown error";
        if (sendErr && sendErr.message) {
          errorMessage = sendErr.message;
        } else if (sendErr && sendErr.code) {
          errorMessage = `Error code: ${sendErr.code}`;
        } else if (sendErr && typeof sendErr === 'string') {
          errorMessage = sendErr;
        } else if (sendErr) {
          errorMessage = JSON.stringify(sendErr);
        }

        console.error(`[${requestId}] Detailed error for ${toEmail}:`, {
          message: sendErr?.message,
          code: sendErr?.code,
          responseCode: sendErr?.responseCode,
          command: sendErr?.command
        });

        // Update email record status to 'failed'
        if (emailRecord) {
          try {
            emailRecord.status = 'failed';
            emailRecord.errorMessage = errorMessage;
            await emailRecord.save();
            console.log(`❌ [${requestId}] Email record updated to 'failed' for ${toEmail}`);
          } catch (updateErr: any) {
            console.error(`[${requestId}] Failed to update email record status for ${toEmail}:`, updateErr);
          }
        } else {
          // Fallback: create new failed record if the pre-save failed
          try {
            const failedEmailRecord = new SentEmail({
              fromEmail,
              toEmail,
              subject: htmlSubject,
              content: htmlText,
              recipientName: name,
              company: recipientCompany, // Store recipient's company, not sender's
              status: 'failed',
              errorMessage: errorMessage,
              sentAt: new Date(),
              attachments: files ? files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                size: file.size
              })) : []
            });
            await failedEmailRecord.save();
            console.log(`💾 [${requestId}] Failed email record saved for ${toEmail}`);
          } catch (saveErr) {
            console.error(`⚠️ [${requestId}] Failed to save failed email record for ${toEmail}:`, saveErr);
          }
        }

        result.push({
          email: toEmail,
          status: `Failed: ${errorMessage}`,
          debugInfo: {
            errorType: typeof sendErr,
            hasMessage: !!sendErr?.message,
            hasCode: !!sendErr?.code,
            rawError: String(sendErr)
          }
        });
      }
    }

    if (files && files.length > 0) {
      files.forEach((file) => {
        fs.unlink(file.path, (err: NodeJS.ErrnoException | null) => {
          if (err) console.error(`[${requestId}] Failed to delete uploaded file:`, err);
        });
      });
    }

    console.log(`[${requestId}] Send process completed. Results:`, result);
    res.status(200).json({ message: "Send process complete.", result });
  } catch (err: any) {

    let errorMessage = "Server error during sending";

    if (err.message) {
      if (err.message.includes("User not found")) {
        errorMessage = "User not found. Please log in again.";
      } else if (err.message.includes("App password not configured")) {
        errorMessage = "Gmail App Password not configured. Please set it up in your profile.";
      } else if (err.message.includes("Invalid login")) {
        errorMessage = "Invalid Gmail credentials. Please check your email and app password.";
      } else if (err.message.includes("authentication")) {
        errorMessage = "Gmail authentication failed. Please verify your app password.";
      } else {
        errorMessage = `Server error: ${err.message}`;
      }
    }

    res.status(500).json({
      error: errorMessage,
      details: err.message,
      timestamp: new Date().toISOString(),
      requestId
    });
  }
};

export const saveDraft = async (req: Request, res: Response): Promise<Response> => {
  const { fromEmail, toEmail, subject, body, attachments } = req.body;
  try {
    const draft = await EmailDraft.create({ fromEmail, toEmail, subject, body, attachments });
    return res.status(201).json({ message: 'Draft saved', draft });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save draft' });
  }
};

export const sendDraft = async (req: Request, res: Response): Promise<Response> => {
  const { draftId } = req.body;
  try {
    const draft = await EmailDraft.findById(draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const emailService = new EmailService();
    await emailService.sendBulkMails({
      fromEmail: draft.fromEmail,
      normalizedData: [{ email: draft.toEmail, name: '', company: '', contact: '' }],
      files: [],
      user: '',
      subject: draft.subject,
      text: draft.body,
      linkenIn: '',
      contact: ''
    });

    draft.status = 'sent';
    await draft.save();
    return res.json({ message: 'Email sent', draft });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send email' });
  }
};

export const getSentEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromEmail } = req.query;

    console.log(`🔍 GET /api/sent-emails called with fromEmail: ${fromEmail}`);

    if (!fromEmail) {
      console.log(`❌ No fromEmail provided in request`);
      res.status(400).json({ error: 'fromEmail is required' });
      return;
    }

    console.log(`📊 Fetching sent emails for: ${fromEmail}`);

    // Query sent emails from database, sorted by most recent first
    const sentEmails = await SentEmail.find({ fromEmail })
      .sort({ sentAt: -1 }) // Most recent first
      .limit(100) // Limit to last 100 emails
      .select({
        toEmail: 1,
        subject: 1,
        recipientName: 1,
        company: 1,
        status: 1,
        errorMessage: 1,
        sentAt: 1,
        attachments: 1
      });

    console.log(`📊 Found ${sentEmails.length} sent emails for ${fromEmail}`);

    // Transform the data for frontend consumption
    const formattedEmails = sentEmails.map(email => ({
      id: email._id,
      toEmail: email.toEmail,
      subject: email.subject,
      recipientName: email.recipientName,
      company: email.company,
      status: email.status,
      errorMessage: email.errorMessage,
      sentAt: email.sentAt,
      attachmentCount: email.attachments?.length || 0,
      attachments: email.attachments?.map(att => ({
        filename: att.originalName || att.filename,
        size: att.size
      })) || []
    }));

    res.json({
      emails: formattedEmails,
      total: sentEmails.length,
      fromEmail: fromEmail
    });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
};

export const uploadAndSendMail = async (req: Request, res: Response): Promise<void> => {
  const requestId = (req as any).requestId || 'unknown';
  console.log(`\n📧 [${requestId}] Starting uploadAndSendMail process`);

  try {
    const { user, fromEmail, subject, text, linkedIn, contact, company, selectedIndices } = req.body;
    const files = req.files as Express.Multer.File[];

    console.log(`📋 [${requestId}] Form data received:`, {
      user, fromEmail, subject: subject?.substring(0, 50) + '...',
      linkedIn, contact, company, selectedIndices
    });

    // Separate Excel/CSV files from attachment files
    const excelFiles: Express.Multer.File[] = [];
    const attachmentFiles: Express.Multer.File[] = [];

    if (files && files.length > 0) {
      files.forEach(file => {
        if (file.fieldname === 'files' &&
          (file.mimetype.includes('spreadsheet') ||
            file.mimetype.includes('csv') ||
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls') ||
            file.originalname.endsWith('.csv'))) {
          excelFiles.push(file);
        } else if (file.fieldname === 'attachments') {
          attachmentFiles.push(file);
        }
      });
    }

    console.log(`📁 [${requestId}] File breakdown: ${excelFiles.length} Excel/CSV files, ${attachmentFiles.length} attachments`);

    // Process Excel/CSV files to extract contact data
    let contactData: any[] = [];

    if (excelFiles.length > 0) {
      console.log(`📊 [${requestId}] Processing ${excelFiles.length} Excel/CSV files`);

      excelFiles.forEach((file, index) => {
        console.log(`📄 [${requestId}] Processing file ${index + 1}: ${file.originalname}`);

        const workbook = xlsx.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        const [headerRow, ...dataRows] = rawData;
        const lowerHeaders = headerRow.map((h: any) =>
          typeof h === "string" ? h.trim().toLowerCase() : h
        );

        const formattedData = dataRows.map((row: any[]) => {
          const entry: Record<string, any> = {};
          lowerHeaders.forEach((key: string, idx: number) => {
            entry[key] = row[idx];
          });
          return entry;
        });

        contactData.push(...formattedData);
      });
    } else {
      console.log(`❌ [${requestId}] No Excel/CSV files found for contact data`);
      res.status(400).json({ error: "No contact files (Excel/CSV) uploaded" });
      return;
    }

    console.log(`📊 [${requestId}] Total contacts extracted: ${contactData.length}`);

    // Filter selected contacts if indices provided
    let selectedContacts = contactData;
    if (selectedIndices) {
      try {
        const indices = JSON.parse(selectedIndices);
        if (Array.isArray(indices)) {
          selectedContacts = indices.map(index => contactData[index]).filter(Boolean);
          console.log(`🎯 [${requestId}] Selected ${selectedContacts.length} contacts from ${indices.length} indices`);
        }
      } catch (err) {
        console.log(`⚠️ [${requestId}] Failed to parse selectedIndices, using all contacts`);
      }
    }

    // Validate required fields
    if (!fromEmail || !subject || !text) {
      console.log(`❌ [${requestId}] Missing required fields: fromEmail=${!!fromEmail}, subject=${!!subject}, text=${!!text}`);
      res.status(400).json({ error: "Missing required fields: fromEmail, subject, or text" });
      return;
    }

    // Normalize contact data
    const normalizedData = selectedContacts.map((row: any) => {
      const normalizedRow: Record<string, any> = {};
      for (const key in row) {
        normalizedRow[key.toLowerCase()] = row[key];
      }
      return normalizedRow;
    });

    // Deduplicate emails
    const uniqueEmailMap = new Map<string, any>();
    normalizedData.forEach(row => {
      const email = row.email?.toLowerCase().trim();
      if (email && !uniqueEmailMap.has(email)) {
        uniqueEmailMap.set(email, row);
      }
    });

    const uniqueContacts = Array.from(uniqueEmailMap.values());
    const duplicateCount = normalizedData.length - uniqueContacts.length;

    console.log(`🔄 [${requestId}] After deduplication: ${uniqueContacts.length} unique emails (${duplicateCount} duplicates removed)`);

    // Get email transporter
    console.log(`🔑 [${requestId}] Getting email transporter for: ${fromEmail}`);
    const transporter = await getTransporter(fromEmail);

    // Fetch user data to get their current company
    const userData = await userModel.findOne({ email: fromEmail });
    const userCurrentCompany = userData?.profile?.company || 'my current company';
    const userActualName = userData?.profile?.name || userData?.name || 'User'; // Use the name from profile first, then main user record
    console.log(`[${requestId}] User current company: ${userCurrentCompany}, User name: ${userActualName}`);

    // Send emails
    const result: { email: string; status: string; error?: string }[] = [];
    console.log(`📤 [${requestId}] Starting to send ${uniqueContacts.length} emails`);

    for (const [index, row] of uniqueContacts.entries()) {
      const toEmail = row.email;
      const name = row.name || "Sir/Ma'am";

      if (!toEmail) {
        result.push({ email: "N/A", status: "No email found" });
        continue;
      }

      console.log(`📧 [${requestId}] Sending email ${index + 1}/${uniqueContacts.length} to: ${toEmail}`);

      const htmlText = updateText(text, name, contact, linkedIn, row.company || 'your organisation', userCurrentCompany, userActualName);
      const recipientCompany = row.company || 'your organisation'; // Store recipient's company
      const emailSubject = subject.includes('${company}')
        ? subject.replace('${company}', row.company || company || 'your company')
        : subject;

      const mailOptions: any = {
        from: fromEmail,
        to: toEmail,
        subject: emailSubject,
        html: htmlText,
      };

      // Add attachments if any
      if (attachmentFiles && attachmentFiles.length > 0) {
        mailOptions.attachments = attachmentFiles.map((file) => ({
          filename: file.originalname,
          path: file.path,
        }));
      }

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ [${requestId}] Email sent successfully to ${toEmail}`);

        // Save sent email record to database
        try {
          const sentEmailRecord = new SentEmail({
            fromEmail,
            toEmail,
            subject: emailSubject,
            content: mailOptions.html,
            recipientName: name,
            company: recipientCompany, // Store recipient's company, not sender's
            status: 'sent',
            sentAt: new Date(),
            attachments: attachmentFiles ? attachmentFiles.map(file => ({
              filename: file.filename,
              originalName: file.originalname,
              size: file.size
            })) : []
          });

          await sentEmailRecord.save();
          console.log(`💾 [${requestId}] Sent email record saved for ${toEmail}`);
        } catch (saveErr) {
          console.error(`⚠️ [${requestId}] Failed to save sent email record for ${toEmail}:`, saveErr);
        }

        result.push({ email: toEmail, status: "Sent" });
      } catch (sendErr: any) {
        console.error(`❌ [${requestId}] Failed to send email to ${toEmail}:`, sendErr.message);

        // Save failed email record to database
        try {
          const failedEmailRecord = new SentEmail({
            fromEmail,
            toEmail,
            subject: emailSubject,
            content: mailOptions.html,
            recipientName: name,
            company: recipientCompany, // Store recipient's company, not sender's
            status: 'failed',
            errorMessage: sendErr.message || 'Unknown error',
            sentAt: new Date(),
            attachments: attachmentFiles ? attachmentFiles.map(file => ({
              filename: file.filename,
              originalName: file.originalname,
              size: file.size
            })) : []
          });

          await failedEmailRecord.save();
          console.log(`💾 [${requestId}] Failed email record saved for ${toEmail}`);
        } catch (saveErr) {
          console.error(`⚠️ [${requestId}] Failed to save failed email record for ${toEmail}:`, saveErr);
        }

        result.push({ email: toEmail, status: "Failed", error: sendErr.message });
      }
    }

    // Clean up attachment files
    if (attachmentFiles && attachmentFiles.length > 0) {
      attachmentFiles.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) console.error(`🗑️ [${requestId}] Failed to delete file ${file.path}:`, err);
        });
      });
    }

    const successCount = result.filter(r => r.status === "Sent").length;
    const failCount = result.filter(r => r.status === "Failed").length;

    console.log(`📊 [${requestId}] Email sending complete - Success: ${successCount}, Failed: ${failCount}, Duplicates removed: ${duplicateCount}`);

    res.status(200).json({
      message: `Email sending complete. ${successCount} sent, ${failCount} failed${duplicateCount > 0 ? `, ${duplicateCount} duplicates removed` : ''}.`,
      result,
      stats: {
        total: uniqueContacts.length,
        sent: successCount,
        failed: failCount,
        duplicatesRemoved: duplicateCount
      }
    });

  } catch (err: any) {
    console.error(`💥 [${requestId}] Critical error in uploadAndSendMail:`, err);
    res.status(500).json({
      error: "Server error during email sending process",
      details: err.message
    });
  }
};