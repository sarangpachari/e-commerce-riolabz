const mongoose = require('mongoose');

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = connectDatabase;
