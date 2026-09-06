const dns = require('dns');
const mongoose = require('mongoose');

// Configure public DNS resolvers to prevent querySrv ECONNREFUSED from local ISP/router DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if unsupported
}

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
    console.error(`\n❌  MongoDB Connection Failed: ${error.message}`);
    console.error('👉  Troubleshooting tips:');
    console.error('    1. Open MongoDB Atlas (https://cloud.mongodb.com)');
    console.error('    2. Go to "Network Access" -> Click "Add IP Address" -> Click "Allow Access From Anywhere" (0.0.0.0/0)');
    console.error('    3. Verify your MONGO_URI in backend/.env has the correct username, password, and database name.\n');
  }
};

module.exports = connectDB;
