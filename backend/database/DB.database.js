const mongoose = require('mongoose');

const connectDB = async (mongo_url) => {
  try {
    await mongoose.connect(mongo_url);
    console.log('MongoDB main/global connection established successfully');
  } catch (error) {
    console.error('MongoDB main/global connection error:', error);
    throw error;
  }
};

const createConnection = async (mongo_url) => {
  try {
    const connection = mongoose.createConnection(mongo_url);
    console.log('New MongoDB external connection created successfully');
    return connection;
  } catch (error) {
    console.error('Error creating new MongoDB external connection:', error);
    throw error;
  }
};

module.exports = { connectDB, createConnection };
