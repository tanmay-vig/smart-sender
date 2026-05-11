import multer from "multer";
import { Request, Response } from "express";
import { Express } from "express";
const xlsx = require("xlsx");

// Store files in memory
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Handle multiple file uploads
export const uploadXlsx = (req: Request, res: Response): void => {
  try {
    console.log('Upload request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request files:', req.files);
    
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      console.log('No files found in request');
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    console.log('Processing', files.length, 'files');

    const allData: any[] = [];

    files.forEach((file, index) => {
      console.log(`Processing file ${index + 1}:`, file.originalname, 'Size:', file.size);
      
      const workbook = xlsx.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      const [headerRow, ...dataRows] = rawData;

      const lowerHeaders = headerRow.map((h: any) =>
        typeof h === "string" ? h.trim().toLowerCase() : h
      );

      console.log('Headers found:', lowerHeaders);

      const formattedData = dataRows.map((row: any[]) => {
        const entry: Record<string, any> = {};
        lowerHeaders.forEach((key: string, idx: number) => {
          entry[key] = row[idx];
        });
        return entry;
      });

      console.log('Processed', formattedData.length, 'rows from file', index + 1);
      allData.push(...formattedData);
    });

    console.log('Total data rows:', allData.length);
    res.json({ data: allData }); 
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ error: "Failed to process the uploaded files" });
  }
};