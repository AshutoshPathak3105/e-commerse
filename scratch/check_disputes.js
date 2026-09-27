require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await mongoose.connection.collection('orders').countDocuments();
  console.log('Total orders:', total);

  const disputeOrders = await mongoose.connection.collection('orders').find({
    $or: [
      { returnRequest: { $ne: null } },
      { status: { $in: ['Returned', 'Cancelled', 'Refunded', 'Return Requested'] } },
      { refundApproved: true }
    ]
  }).toArray();
  console.log('Dispute orders count:', disputeOrders.length);
  disputeOrders.forEach((o, i) => {
    console.log(`[${i}] ID:`, o.orderId || o._id, 'Status:', o.status, 'Total:', o.totalPrice, 'ReturnReq:', o.returnRequest);
  });

  // Also check if there is a tickets collection
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
