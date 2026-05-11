import { ScheduledEmail } from '../Models/scheduledEmailModel';
import { EmailService } from './emailService';
import { normalizeXlsxData } from './normalizeHelper';
import fs from 'fs';
import path from 'path';

export class SchedulingService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async scheduleEmail(emailData: {
    fromEmail: string;
    user: string;
    subject: string;
    text: string;
    contact: string;
    linkenIn: string;
    xlsxData: string;
    attachments: string[];
    scheduledFor: Date;
  }) {
    try {
      const scheduledEmail = new ScheduledEmail({
        ...emailData,
        status: 'pending'
      });

      await scheduledEmail.save();
      return { success: true, scheduledEmail };
    } catch (error) {
      console.error('Error scheduling email:', error);
      throw new Error('Failed to schedule email');
    }
  }

  async getScheduledEmails(fromEmail: string) {
    try {
      const emails = await ScheduledEmail.find({ 
        fromEmail,
        status: { $in: ['pending', 'processing', 'sent', 'failed'] }
      }).sort({ scheduledFor: 1 });
      
      console.log(`Found ${emails.length} scheduled emails for ${fromEmail}`);
      return emails;
    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
      throw new Error('Failed to fetch scheduled emails');
    }
  }

  async cancelScheduledEmail(emailId: string, fromEmail: string) {
    try {
      const email = await ScheduledEmail.findOneAndUpdate(
        { _id: emailId, fromEmail, status: 'pending' },
        { status: 'cancelled' },
        { new: true }
      );

      if (!email) {
        throw new Error('Email not found or cannot be cancelled');
      }

      return { success: true, email };
    } catch (error) {
      console.error('Error cancelling scheduled email:', error);
      throw new Error('Failed to cancel scheduled email');
    }
  }

  async processScheduledEmails() {
    try {
      const now = new Date();
      console.log(`Checking for scheduled emails at ${now.toISOString()}`);
      
      const pendingEmails = await ScheduledEmail.find({
        status: 'pending',
        scheduledFor: { $lte: now }
      });

      console.log(`Found ${pendingEmails.length} scheduled emails to process`);

      for (const email of pendingEmails) {
        try {
          console.log(`Processing scheduled email ${email._id} scheduled for ${email.scheduledFor}`);
          
          // Update status to processing to prevent duplicate processing
          email.status = 'processing';
          await email.save();

          // Parse the xlsx data
          let parsedData: any[] = [];
          try {
            parsedData = JSON.parse(email.xlsxData);
          } catch (err) {
            throw new Error('Invalid xlsxData format');
          }

          const normalizedData = normalizeXlsxData(parsedData);

          // Handle attachments for scheduled emails
          const attachmentFiles: Express.Multer.File[] = [];
          if (email.attachments && email.attachments.length > 0) {
            for (const attachmentPath of email.attachments) {
              if (fs.existsSync(attachmentPath)) {
                attachmentFiles.push({
                  path: attachmentPath,
                  originalname: path.basename(attachmentPath),
                  fieldname: 'attachments',
                  encoding: '7bit',
                  mimetype: 'application/octet-stream',
                  size: fs.statSync(attachmentPath).size,
                  destination: path.dirname(attachmentPath),
                  filename: path.basename(attachmentPath),
                  buffer: fs.readFileSync(attachmentPath)
                } as Express.Multer.File);
              }
            }
          }

          // Send the emails
          const result = await this.emailService.sendBulkMails({
            fromEmail: email.fromEmail,
            normalizedData,
            files: attachmentFiles,
            user: email.user,
            subject: email.subject,
            text: email.text,
            linkenIn: email.linkenIn,
            contact: email.contact
          });

          // Update email status
          email.status = 'sent';
          email.set('result', result.map(r => ({ email: r.email, status: r.status })));
          email.sentAt = new Date();
          await email.save();

          console.log(`Successfully sent scheduled email ${email._id}`);
        } catch (error) {
          console.error(`Error processing scheduled email ${email._id}:`, error);
          
          // Update email status to failed
          email.status = 'failed';
          email.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await email.save();
        }
      }
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
    }
  }

  // Start the scheduler
  startScheduler() {
    console.log('Starting email scheduler...');
    
    // Process any emails that might be due immediately
    this.processScheduledEmails();
    
    // Check for emails to send every minute
    setInterval(() => {
      this.processScheduledEmails();
    }, 60000); // 60 seconds

    console.log('Email scheduler started successfully');
  }

  // Manual trigger for testing
  async triggerScheduler() {
    console.log('Manually triggering scheduler...');
    await this.processScheduledEmails();
  }
} 