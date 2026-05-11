import { Request, Response } from "express";
import { SchedulingService } from "../Services/schedulingService";
import multer from "multer";
import path from "path";
import fs from "fs";

const schedulingService = new SchedulingService();

export const scheduleEmail = async (req: Request, res: Response): Promise<void> => {
  const { user, fromEmail, xlsxData, subject, text, linkenIn, contact, scheduledFor } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!fromEmail || !xlsxData || !scheduledFor) {
    res.status(400).json({ error: "Missing required fields: fromEmail, xlsxData, or scheduledFor!" });
    return;
  }

  // Validate scheduledFor date
  const scheduledDate = new Date(scheduledFor);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    res.status(400).json({ error: "Scheduled date must be in the future!" });
    return;
  }

  // Handle file attachments
  const attachmentPaths: string[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join('uploads', fileName);
      
      // Move file to uploads directory
      fs.renameSync(file.path, filePath);
      attachmentPaths.push(filePath);
    }
  }

  try {
    const result = await schedulingService.scheduleEmail({
      fromEmail,
      user,
      subject,
      text,
      contact,
      linkenIn,
      xlsxData,
      attachments: attachmentPaths,
      scheduledFor: scheduledDate
    });

    res.status(201).json({ 
      message: "Email scheduled successfully", 
      scheduledEmail: result.scheduledEmail 
    });
  } catch (err) {
    console.error("Error scheduling email:", err);
    res.status(500).json({ error: "Failed to schedule email" });
  }
};

export const getScheduledEmails = async (req: Request, res: Response): Promise<void> => {
  const { fromEmail } = req.query;

  if (!fromEmail) {
    res.status(400).json({ error: "fromEmail is required!" });
    return;
  }

  try {
    const emails = await schedulingService.getScheduledEmails(fromEmail as string);
    res.status(200).json({ emails });
  } catch (err) {
    console.error("Error fetching scheduled emails:", err);
    res.status(500).json({ error: "Failed to fetch scheduled emails" });
  }
};

export const cancelScheduledEmail = async (req: Request, res: Response): Promise<void> => {
  const { emailId } = req.params;
  const { fromEmail } = req.body;

  if (!fromEmail) {
    res.status(400).json({ error: "fromEmail is required!" });
    return;
  }

  try {
    const result = await schedulingService.cancelScheduledEmail(emailId, fromEmail);
    res.status(200).json({ 
      message: "Email cancelled successfully", 
      email: result.email 
    });
  } catch (err) {
    console.error("Error cancelling scheduled email:", err);
    res.status(500).json({ error: "Failed to cancel scheduled email" });
  }
};

// Test endpoint to manually trigger scheduler
export const triggerScheduler = async (req: Request, res: Response): Promise<void> => {
  try {
    await schedulingService.triggerScheduler();
    res.status(200).json({ message: "Scheduler triggered successfully" });
  } catch (err) {
    console.error("Error triggering scheduler:", err);
    res.status(500).json({ error: "Failed to trigger scheduler" });
  }
}; 