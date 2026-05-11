import mongoose from 'mongoose';

const emailDraftSchema = new mongoose.Schema({
  fromEmail: { type: String, required: true },
  toEmail: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  attachments: [String],
  status: { type: String, default: 'draft' },
  createdAt: { type: Date, default: Date.now },
});

export const EmailDraft = mongoose.model('EmailDraft', emailDraftSchema); 