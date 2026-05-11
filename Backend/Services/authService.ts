import { Request, Response } from 'express';
import { userModel } from '../Models/userModel';

/**
 * Handle Google Sign-In callback
 */
export async function handleCallback(req: Request, res: Response): Promise<void> {
  try {
    const { email, googleId, name, picture } = req.body;
    
    if (!email || !googleId) {
      res.status(400).json({ error: 'Email and Google ID are required' });
      return;
    }

    // Check if user exists
    let userData = await userModel.findOne({ email });

    if (!userData) {
      // Create new user
      userData = new userModel({
        email,
        googleId,
        name,
        picture,
        createdAt: new Date()
      });
      await userData.save();
    } else {
      // Update existing user's Google info
      userData.googleId = googleId;
      userData.name = name;
      userData.picture = picture;
      await userData.save();
    }

    res.status(200).json({
      message: "Authentication successful",
      user: {
        email: userData.email,
        name: userData.name,
        profile: userData.profile
      }
    });

  } catch (error: any) {
    console.error('Auth callback error:', error);
    res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
}