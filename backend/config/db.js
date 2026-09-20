const mongoose = require('mongoose');
const dns = require('dns');

// Use reliable public DNS (Google & Cloudflare) to prevent SRV query ECONNREFUSED issues on local ISP DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in environments where setServers is restricted
}

let isConnecting = false;

const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 20000,
      maxPoolSize: 10,
    });

    console.log(`\n🟢  MongoDB Atlas Connected: ${conn.connection.host}\n`);
    isConnecting = false;

    if (!mongoose.connection._hasRegisteredListeners) {
      mongoose.connection._hasRegisteredListeners = true;

      mongoose.connection.on('error', (err) => {
        console.error(`❌  MongoDB error: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️   MongoDB disconnected. Reconnecting automatically in 3s...');
        setTimeout(() => {
          if (mongoose.connection.readyState === 0) {
            connectDB().catch(() => {});
          }
        }, 3000);
      });
    }

    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`\n❌  MongoDB Connection Failed: ${error.message}`);
    console.error('👉  Troubleshooting tips:');
    console.error('    1. Open MongoDB Atlas (https://cloud.mongodb.com)');
    console.error('    2. Go to "Network Access" -> Click "Add IP Address" -> Click "Allow Access From Anywhere" (0.0.0.0/0)');
    console.error('    3. Verify your MONGO_URI in backend/.env has the correct username, password, and database name.\n');
    return null;
  }
};

module.exports = connectDB;
