import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    contact: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    company: { type: String, default: '' },
    position: { type: String, default: '' },
    appPassword: { type: String, default: '' }
});

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // For email/password login
    googleId: { type: String }, // Optional for Google OAuth users
    name: { type: String, required: true },
    picture: { type: String },
    profile: { type: profileSchema },
    createdAt: { type: Date, default: Date.now },
});

export const userModel = mongoose.model("User", userSchema);