import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    throw new Error('MONGODB_URL is not defined in .env file');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log('MongoDB Connection Error', error);
    process.exit(1);
  }
}
