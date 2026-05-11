import mongoose from 'mongoose';

const scheduledEmailSchema = new mongoose.Schema({
  fromEmail: { type: String, required: true },
  user: { type: String, required: true },
  subject: { type: String, required: true },
  text: { type: String, required: true },
  contact: { type: String, required: true },
  linkenIn: { type: String, required: true },
  xlsxData: { type: String, required: true }, // JSON string of recipient data
  attachments: [String], // Array of file paths
  scheduledFor: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  result: [{ 
    email: String, 
    status: String 
  }],
  createdAt: { type: Date, default: Date.now },
  sentAt: { type: Date },
  errorMessage: { type: String }
});

// Index for efficient querying of pending emails
scheduledEmailSchema.index({ status: 1, scheduledFor: 1 });

export const ScheduledEmail = mongoose.model('ScheduledEmail', scheduledEmailSchema); 