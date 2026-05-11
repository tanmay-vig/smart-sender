import mongoose from 'mongoose';

const uploadedContactSchema = new mongoose.Schema({
    fromEmail: { type: String, required: true }, // User who uploaded
    fileName: { type: String, required: true }, // Original file name
    uploadedAt: { type: Date, default: Date.now },
    totalContacts: { type: Number, required: true },
    contacts: [{
        sno: Number,
        name: String,
        email: { type: String, required: true },
        company: String,
        jobTitle: String,
        // Store any additional fields that might be in the uploaded file
        additionalFields: { type: mongoose.Schema.Types.Mixed }
    }],
    // Store metadata about the upload
    metadata: {
        fileSize: Number,
        originalColumns: [String],
        duplicatesFound: { type: Number, default: 0 },
        validEmails: { type: Number, default: 0 },
        invalidEmails: { type: Number, default: 0 }
    }
});

// Create index for faster queries
uploadedContactSchema.index({ fromEmail: 1, uploadedAt: -1 });
uploadedContactSchema.index({ 'contacts.email': 1 });

export const UploadedContacts = mongoose.model("UploadedContacts", uploadedContactSchema);
