import mongoose from 'mongoose';

const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION !== undefined;
const MONGO_URI = process.env.MONGO_URI || (isVercel ? null : 'mongodb://localhost:27017/expense-tracker');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGO_URI) {
    console.log('MongoDB is not configured (MONGO_URI is missing). Skipping connection, using local storage.');
    return null;
  }

  // If already connected, return the connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is cached, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection promise exists, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // Timeout after 3 seconds if DB is unreachable
    };

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGO_URI, opts).then((m) => {
      console.log('Connected to MongoDB successfully');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
