const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

function parseTimeframeFilter(timeframe = 'day', range = 'all', startDate, endDate) {
  const now = new Date();
  let start = null;
  let end = null;
  let prevStart = null;
  let prevEnd = null;
  let filterLabel = 'All Time';

  switch (range) {
    case 'today': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      filterLabel = `Today (${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`;
      break;
    }
    case 'yesterday': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59, 999);
      filterLabel = `Yesterday (${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`;
      break;
    }
    case '7d': {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = new Date(now);
      prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      filterLabel = 'Last 7 Days';
      break;
    }
    case '30d': {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = new Date(now);
      prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      filterLabel = 'Last 30 Days';
      break;
    }
    case 'this_month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      filterLabel = `This Month (${start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`;
      break;
    }
    case 'last_month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      filterLabel = `Last Month (${start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`;
      break;
    }
    case 'this_year': {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now);
      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      filterLabel = `This Year (${now.getFullYear()})`;
      break;
    }
    case 'last_year': {
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 2, 11, 31, 23, 59, 59, 999);
      filterLabel = `Last Year (${now.getFullYear() - 1})`;
      break;
    }
    case 'custom': {
      if (startDate) {
        start = new Date(startDate + 'T00:00:00.000');
        end = endDate ? new Date(endDate + 'T23:59:59.999') : new Date(startDate + 'T23:59:59.999');
        filterLabel = `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} to ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
      break;
    }
    default: {
      filterLabel = 'All Time History';
      break;
    }
  }

  let dateFormat = '%Y-%m-%d';
  if (timeframe === 'year') {
    dateFormat = '%Y';
  } else if (timeframe === 'month') {
    dateFormat = '%Y-%m';
  }

  return { start, end, prevStart, prevEnd, dateFormat, filterLabel };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/xmart');
  const Order = require('../backend/models/Order');

  console.log('Testing Daywise Yesterday:');
  const yest = parseTimeframeFilter('day', 'yesterday');
  console.log('Yest filter:', yest);
  const matchYest = { createdAt: { $gte: yest.start, $lte: yest.end } };
  const yestOrders = await Order.countDocuments(matchYest);
  console.log('Orders yesterday:', yestOrders);

  console.log('\nTesting Monthwise All Time:');
  const mw = parseTimeframeFilter('month', 'all');
  const monthTimeline = await Order.aggregate([
    { $match: { status: { $nin: ['Cancelled'] } } },
    {
      $group: {
        _id: { $dateToString: { format: mw.dateFormat, date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } }
  ]);
  console.log('Monthwise timeline:', monthTimeline);

  console.log('\nTesting Daywise All Time:');
  const dayTimeline = await Order.aggregate([
    { $match: { status: { $nin: ['Cancelled'] } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } }
  ]);
  console.log('Daywise timeline (IST):', dayTimeline);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
