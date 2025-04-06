import mongoose from "mongoose"

// Use direct connection string for immediate testing
const MONGODB_URI = "mongodb+srv://quychinh:5CPKDgtaL4XqyiBH@1stprojectmern.wtzu6.mongodb.net/?retryWrites=true&w=majority&appName=1stProjectMERN"

// Keep track of the connection status
let isConnected = false

export async function connectToDatabase() {
  // If already connected, return
  if (isConnected) {
    return
  }

  try {
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, options)
    
    isConnected = true
    console.log("Connected to MongoDB")
    
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

