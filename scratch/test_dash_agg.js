const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Order = require('../backend/models/Order');
  const User = require('../backend/models/User');
  const SupportTicket = require('../backend/models/SupportTicket');
  const Payout = require('../backend/models/Payout');

  const topC = await Order.aggregate([
    { $match: { status: { $nin: ['Cancelled'] } } },
    {
      $group: {
        _id: '$user',
        ordersCount: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' },
        lastOrder: { $max: '$createdAt' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
    { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } }
  ]);

  const tickets = await SupportTicket.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const payouts = await Payout.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
  ]);

  console.log('Top customers:', topC.map(c => ({
    name: c.u?.name || 'Customer',
    email: c.u?.email || 'N/A',
    spent: c.totalSpent,
    orders: c.ordersCount,
    lastOrder: c.lastOrder
  })));

  console.log('Tickets:', tickets);
  console.log('Payouts:', payouts);

  await mongoose.disconnect();
}

run().catch(console.error);
