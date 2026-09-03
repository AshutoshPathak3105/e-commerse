const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`\n🟢  MongoDB Atlas Connected: ${conn.connection.host}\n`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌  MongoDB error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️   MongoDB disconnected. Attempting to reconnect...');
    });

  } catch (error) {
    console.error(`❌  MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
