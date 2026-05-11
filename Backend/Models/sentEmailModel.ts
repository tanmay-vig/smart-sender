import mongoose from 'mongoose';

const sentEmailSchema = new mongoose.Schema({
    fromEmail: { type: String, required: true },
    toEmail: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    recipientName: { type: String, default: '' },
    company: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    errorMessage: { type: String, default: '' },
    sentAt: { type: Date, default: Date.now },
    attachments: [{
        filename: String,
        originalName: String,
        size: Number
    }]
});

// Create index for faster queries
sentEmailSchema.index({ fromEmail: 1, sentAt: -1 });
sentEmailSchema.index({ toEmail: 1 });

export const SentEmail = mongoose.model("SentEmail", sentEmailSchema);
