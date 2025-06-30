const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove the deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cultural-survey');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;