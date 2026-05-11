import { userModel } from '../Models/userModel';
import dotenv from "dotenv";
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

dotenv.config();

export const userLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, googleId, name, picture } = req.body;
        
        if (!email || !name) {
            res.status(400).json({ error: 'Email and name are required' });
            return;
        }

        // Check if user exists
        let userData = await userModel.findOne({ email });

        if (!userData) {
            // Create new user
            userData = new userModel({
                email,
                googleId: googleId || null, // Optional for app password users
                name,
                picture,
                createdAt: new Date()
            });
            await userData.save();
            
            res.status(201).json({
                message: "New user created",
                email,
                profile: null
            });
        } else {
            // Update existing user's info
            if (googleId) {
                userData.googleId = googleId;
            }
            userData.name = name;
            if (picture) {
                userData.picture = picture;
            }
            await userData.save();
            
            res.status(200).json({
                message: "User found",
                email,
                profile: userData.profile || null
            });
        }

    } catch (error: any) {
        console.error("Login Error:", error);
        res.status(500).json({
            error: error.message || "Internal Server Error",
        });
    }
};

export const saveProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, name, contact, linkedIn, company, position, appPassword } = req.body;
        
        console.log('Profile update request:', { email, name, contact, linkedIn, company, position, appPassword: appPassword ? '[HIDDEN]' : 'not provided' });
        
        if (!email || !name) {
            console.log('Missing required fields:', { email: !!email, name: !!name });
            res.status(400).json({ error: 'Email and name are required' });
            return;
        }

        // Find and update user profile
        const userData = await userModel.findOne({ email });
        
        if (!userData) {
            console.log('User not found for email:', email);
            res.status(404).json({ error: 'User not found' });
            return;
        }

        console.log('Found user:', { email: userData.email, hasProfile: !!userData.profile });

        // Update both the main user name and the profile
        userData.name = name; // Ensure the main user name is also updated
        userData.profile = {
            email,
            name,
            contact: contact || '',
            linkedIn: linkedIn || '',
            company: company || '',
            position: position || '',
            appPassword: appPassword || ''
        };
        
        await userData.save();

        console.log('Profile saved successfully for user:', userData.email);

        res.status(200).json({
            message: "Profile saved successfully",
            profile: userData.profile
        });

    } catch (error: any) {
        console.error("Profile Save Error:", error);
        res.status(500).json({
            error: error.message || "Internal Server Error",
        });
    }
};

// Email/Password Authentication
export const authenticateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        console.log(`🔐 Authentication attempt for: ${email}`);

        // Find user by email
        const userData = await userModel.findOne({ email });

        if (!userData) {
            console.log(`❌ User not found: ${email}`);
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Check if user has a password (for email/password login)
        if (!userData.password) {
            console.log(`❌ No password set for user: ${email}`);
            res.status(401).json({ error: 'Password not set. Please use Google Sign-In or contact administrator.' });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, userData.password);
        
        if (!isValidPassword) {
            console.log(`❌ Invalid password for user: ${email}`);
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        console.log(`✅ Authentication successful for: ${email}`);

        // Return user data with profile
        res.status(200).json({
            message: "Authentication successful",
            email: userData.email,
            name: userData.name,
            profile: userData.profile || null
        });

    } catch (error: any) {
        console.error("Authentication Error:", error);
        res.status(500).json({
            error: error.message || "Internal Server Error",
        });
    }
};

// Register new user with email/password
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
            res.status(400).json({ error: 'Email, password, and name are required' });
            return;
        }

        console.log(`📝 Registration attempt for: ${email}`);

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        
        if (existingUser) {
            console.log(`❌ User already exists: ${email}`);
            res.status(409).json({ error: 'User already exists. Please login instead.' });
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new userModel({
            email,
            password: hashedPassword,
            name,
            createdAt: new Date()
        });

        await newUser.save();
        console.log(`✅ User registered successfully: ${email}`);

        res.status(201).json({
            message: "User registered successfully",
            email: newUser.email,
            name: newUser.name,
            profile: null
        });

    } catch (error: any) {
        console.error("Registration Error:", error);
        res.status(500).json({
            error: error.message || "Internal Server Error",
        });
    }
};