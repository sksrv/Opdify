import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Opdify');
    console.log(` MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(` MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
