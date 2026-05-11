import { Request, Response } from "express";
import { UploadedContacts } from '../Models/uploadedContactsModel';

export const saveUploadedContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fromEmail, fileName, contacts } = req.body;
        
        console.log(`📋 Saving uploaded contacts for: ${fromEmail}, file: ${fileName}`);
        
        if (!fromEmail || !fileName || !contacts || !Array.isArray(contacts)) {
            res.status(400).json({ error: 'Missing required fields: fromEmail, fileName, contacts' });
            return;
        }

        // Process and validate contacts
        const processedContacts = contacts.map((contact: any, index: number) => {
            const { name, email, company, jobTitle, ...additionalFields } = contact;
            return {
                sno: index + 1,
                name: name || '',
                email: email || '',
                company: company || '',
                jobTitle: jobTitle || contact['job title'] || '',
                additionalFields: Object.keys(additionalFields).length > 0 ? additionalFields : undefined
            };
        });

        // Calculate metadata
        const validEmails = processedContacts.filter(contact => 
            contact.email && contact.email.includes('@')
        ).length;
        
        const invalidEmails = processedContacts.length - validEmails;
        
        // Get unique columns from the original data
        const allColumns = new Set<string>();
        contacts.forEach(contact => {
            Object.keys(contact).forEach(key => allColumns.add(key));
        });

        // Create upload record
        const uploadRecord = new UploadedContacts({
            fromEmail,
            fileName,
            totalContacts: processedContacts.length,
            contacts: processedContacts,
            metadata: {
                originalColumns: Array.from(allColumns),
                validEmails,
                invalidEmails,
                duplicatesFound: 0 // Will be calculated if needed
            }
        });

        await uploadRecord.save();
        
        console.log(`✅ Saved ${processedContacts.length} contacts from ${fileName} for ${fromEmail}`);
        
        res.status(201).json({
            message: 'Contacts uploaded successfully',
            uploadId: uploadRecord._id,
            totalContacts: processedContacts.length,
            validEmails,
            invalidEmails
        });

    } catch (error: any) {
        console.error('Error saving uploaded contacts:', error);
        res.status(500).json({ error: 'Failed to save uploaded contacts' });
    }
};

export const getUploadedContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fromEmail } = req.query;
        
        if (!fromEmail) {
            res.status(400).json({ error: 'fromEmail is required' });
            return;
        }

        console.log(`📊 Fetching uploaded contacts for: ${fromEmail}`);

        // Get all uploads for this user, sorted by most recent first
        const uploads = await UploadedContacts.find({ fromEmail })
            .sort({ uploadedAt: -1 })
            .limit(50) // Limit to last 50 uploads
            .select({
                fileName: 1,
                uploadedAt: 1,
                totalContacts: 1,
                'metadata.validEmails': 1,
                'metadata.invalidEmails': 1,
                'metadata.originalColumns': 1
            });

        console.log(`📊 Found ${uploads.length} upload records for ${fromEmail}`);

        // Transform data for frontend
        const formattedUploads = uploads.map(upload => ({
            id: upload._id,
            fileName: upload.fileName,
            uploadedAt: upload.uploadedAt,
            totalContacts: upload.totalContacts,
            validEmails: upload.metadata?.validEmails || 0,
            invalidEmails: upload.metadata?.invalidEmails || 0,
            columns: upload.metadata?.originalColumns || []
        }));
        
        res.json({ 
            uploads: formattedUploads,
            total: uploads.length,
            fromEmail: fromEmail
        });

    } catch (error: any) {
        console.error('Error fetching uploaded contacts:', error);
        res.status(500).json({ error: 'Failed to fetch uploaded contacts' });
    }
};

export const getUploadDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uploadId } = req.params;
        const { fromEmail } = req.query;
        
        if (!uploadId || !fromEmail) {
            res.status(400).json({ error: 'uploadId and fromEmail are required' });
            return;
        }

        console.log(`📋 Fetching upload details for: ${uploadId} by ${fromEmail}`);

        // Get specific upload with all contact details
        const upload = await UploadedContacts.findOne({ 
            _id: uploadId, 
            fromEmail 
        });

        if (!upload) {
            res.status(404).json({ error: 'Upload not found' });
            return;
        }

        console.log(`📋 Found upload: ${upload.fileName} with ${upload.totalContacts} contacts`);
        
        res.json({
            id: upload._id,
            fileName: upload.fileName,
            uploadedAt: upload.uploadedAt,
            totalContacts: upload.totalContacts,
            contacts: upload.contacts,
            metadata: upload.metadata
        });

    } catch (error: any) {
        console.error('Error fetching upload details:', error);
        res.status(500).json({ error: 'Failed to fetch upload details' });
    }
};

export const deleteUploadedContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uploadId } = req.params;
        const { fromEmail } = req.query;
        
        if (!uploadId || !fromEmail) {
            res.status(400).json({ error: 'uploadId and fromEmail are required' });
            return;
        }

        console.log(`🗑️ Deleting upload: ${uploadId} by ${fromEmail}`);

        const deleted = await UploadedContacts.findOneAndDelete({ 
            _id: uploadId, 
            fromEmail 
        });

        if (!deleted) {
            res.status(404).json({ error: 'Upload not found' });
            return;
        }

        console.log(`✅ Deleted upload: ${deleted.fileName}`);
        
        res.json({ 
            message: 'Upload deleted successfully',
            fileName: deleted.fileName
        });

    } catch (error: any) {
        console.error('Error deleting upload:', error);
        res.status(500).json({ error: 'Failed to delete upload' });
    }
};
