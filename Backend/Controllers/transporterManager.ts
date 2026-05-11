import { userModel } from '../Models/userModel';
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const getTransporter = async (fromEmail: string): Promise<nodemailer.Transporter> => {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🔐 [${requestId}] Getting transporter for email: ${fromEmail}`);
  
  try {
    const userData = await userModel.findOne({ email: fromEmail });

    if (!userData) {
      console.error(`❌ [${requestId}] User not found for email: ${fromEmail}`);
      throw new Error("User not found. Please ensure you have logged in and set up your profile.");
    }

    console.log(`👤 [${requestId}] User found: ${userData.name}`);

    // Get app password from user profile
    const appPassword = userData.profile?.appPassword;
    
    if (!appPassword) {
      console.error(`❌ [${requestId}] App password not configured for user: ${fromEmail}`);
      console.log(`💡 [${requestId}] User profile:`, userData.profile);
      throw new Error("App password not configured. Please set up your Gmail app password in your profile settings.");
    }

    console.log(`🔑 [${requestId}] Creating transporter with app password (length: ${appPassword.length})`);
    
    // Create transporter using user's app password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: fromEmail,
        pass: appPassword, // Use the app password from user profile
      },
    });

    // Verify the transporter configuration
    console.log(`🔍 [${requestId}] Verifying transporter configuration...`);
    await transporter.verify();
    console.log(`✅ [${requestId}] Transporter verified successfully for ${fromEmail}`);

    return transporter;

  } catch (error: any) {
    console.error(`💥 [${requestId}] Error in getTransporter:`, error);
    
    if (error.responseCode === 535) {
      throw new Error("Invalid Gmail App Password. Please generate a new app password from your Google Account settings.");
    } else if (error.code === 'EAUTH') {
      throw new Error("Gmail authentication failed. Please check your email address and app password.");
    } else if (error.message.includes('User not found')) {
      throw error;
    } else if (error.message.includes('App password not configured')) {
      throw error;
    } else {
      throw new Error(`Gmail connection failed: ${error.message}`);
    }
  }
};