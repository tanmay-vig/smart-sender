import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.CONNECTION_STRING;

  if (!uri) {
    throw new Error("Missing CONNECTION_STRING in environment variables.");
  }

  try {
    await mongoose.connect(uri); 
    console.log("Successfully connected to MongoDB using Mongoose");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}