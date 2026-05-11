import { getTransporter } from "../Controllers/transporterManager";
import { updateSubject, updateText } from "../Controllers/mailController";
import { GeminiService } from "./geminiService";
import { userModel } from "../Models/userModel";
import fs from "fs";

const geminiService = new GeminiService();

interface SendBulkMailsParams {
  fromEmail: string;
  normalizedData: any[];
  files: Express.Multer.File[];
  user: string;
  subject: string;
  text: string;
  linkenIn: string;
  contact: string;
  useAI?: boolean;
  aiPrompt?: string;
}

export class EmailService {
  async sendBulkMails({ fromEmail, normalizedData, files, user, subject, text, linkenIn, contact, useAI, aiPrompt }: SendBulkMailsParams) {
    const result: { email: string; status: string }[] = [];
    const transporter = await getTransporter(fromEmail);

    // Deduplicate emails on the backend as well for safety
    const uniqueEmailMap = new Map<string, any>();
    const processedEmails = new Set<string>();

    // First pass: collect unique emails
    normalizedData.forEach(row => {
      const email = row.email?.toLowerCase().trim();
      if (email && !uniqueEmailMap.has(email)) {
        uniqueEmailMap.set(email, row);
      }
    });

    const uniqueData = Array.from(uniqueEmailMap.values());
    const duplicateCount = normalizedData.length - uniqueData.length;

    console.log(`Backend deduplication: ${normalizedData.length} total emails, ${uniqueData.length} unique emails, ${duplicateCount} duplicates filtered`);

    // If AI mode, pre-generate all emails
    let aiGeneratedEmails: Map<string, { subject: string; html: string }> | null = null;
    if (useAI && aiPrompt) {
      const userData = await userModel.findOne({ email: fromEmail });
      const recipients = uniqueData
        .filter((row: any) => row.email)
        .map((row: any) => ({
          name: row.name || "Sir/Ma'am",
          email: row.email.toLowerCase().trim(),
          company: row.company || "",
        }));

      aiGeneratedEmails = await geminiService.generateBulkEmails(
        recipients,
        {
          name: userData?.profile?.name || userData?.name || user || "User",
          email: fromEmail,
          company: userData?.profile?.company || "",
          position: userData?.profile?.position || "",
          contact: contact || userData?.profile?.contact || "",
          linkedIn: linkenIn || userData?.profile?.linkedIn || "",
        },
        aiPrompt
      );
    }

    for (const row of uniqueData) {
      const toEmail = row.email?.toLowerCase().trim();
      const name = row.name || "Sir/Ma'am";
      const company = row.company;

      if (!toEmail) {
        result.push({ email: "N/A", status: "No email found" });
        continue;
      }

      // Skip if we've already processed this email
      if (processedEmails.has(toEmail)) {
        result.push({ email: toEmail, status: "Skipped (duplicate)" });
        continue;
      }

      processedEmails.add(toEmail);

      let mailSubject: string;
      let htmlText: string;

      if (aiGeneratedEmails && aiGeneratedEmails.has(toEmail)) {
        const aiContent = aiGeneratedEmails.get(toEmail)!;
        mailSubject = aiContent.subject;
        htmlText = aiContent.html;
      } else if (subject && text) {
        mailSubject = subject;
        htmlText = text;
      } else {
        mailSubject = updateSubject(company);
        htmlText = updateText(text, name, contact, linkenIn);
      }

      const mailOptions: any = {
        from: fromEmail,
        to: toEmail,
        subject: mailSubject,
        html: htmlText,
      };

      if (files && files.length > 0) {
        mailOptions.attachments = files.map((file) => ({
          filename: file.originalname,
          path: file.path,
        }));
      }

      try {
        await transporter.sendMail(mailOptions);
        result.push({ email: toEmail, status: "Sent" });
      } catch (sendErr) {
        result.push({ email: toEmail, status: "Failed" });
      }
    }

    if (files && files.length > 0) {
      files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Failed to delete uploaded file:", err);
        });
      });
    }

    return result;
  }
} 