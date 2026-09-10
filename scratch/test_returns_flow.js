const http = require('http');

function req(options, data) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    r.on('error', reject);
    if (data) r.write(typeof data === 'string' ? data : JSON.stringify(data));
    r.end();
  });
}

async function test() {
  const adminToken = 'admin_jwt_master';

  console.log('1. Checking current /api/admin/customer-service...');
  const cs1 = await req({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/customer-service',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('CS1 status:', cs1.status, 'Stats:', cs1.data?.data?.stats);
  console.log('Cancel orders count:', cs1.data?.data?.cancelOrders?.length);

  // Pick an order to simulate return request
  console.log('2. Finding a confirmed order to initiate customer return request...');
  const allOrdersRes = await req({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/dashboard',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const recentOrders = allOrdersRes.data?.data?.recentOrders || [];
  const targetOrder = recentOrders.find(o => o.status === 'Confirmed') || recentOrders[0];
  console.log('Target order:', targetOrder?._id, 'Status:', targetOrder?.status, 'Total:', targetOrder?.totalPrice);

  if (targetOrder) {
    console.log('3. Simulating customer return submission (POST /api/orders/:id/return)...');
    const returnRes = await req({
      hostname: 'localhost',
      port: 8000,
      path: `/api/orders/${targetOrder._id}/return`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      reason: 'Item defective or not working',
      comments: 'Smartwatch display flickering and not charging properly',
      refundMethod: 'wallet',
    });
    console.log('Return request response:', returnRes.status, returnRes.data);

    console.log('4. Admin checking customer service returns list...');
    const cs2 = await req({
      hostname: 'localhost',
      port: 8000,
      path: '/api/admin/customer-service',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('CS2 stats:', cs2.data?.data?.stats);
    console.log('Returns in queue:', cs2.data?.data?.returnOrders?.map(r => ({ id: r.orderId, rma: r.returnRequest?.rmaNumber, status: r.returnRequest?.status })));

    console.log('5. Admin approving RMA (approve_rma)...');
    const appRes = await req({
      hostname: 'localhost',
      port: 8000,
      path: `/api/admin/orders/${targetOrder._id}/return-action`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      action: 'approve_rma',
      notes: 'Blue Dart courier pickup scheduled for tomorrow 10:00 AM',
    });
    console.log('Approve RMA response:', appRes.status, appRes.data?.message);

    console.log('6. Admin marking item received at FC (mark_received)...');
    const recRes = await req({
      hostname: 'localhost',
      port: 8000,
      path: `/api/admin/orders/${targetOrder._id}/return-action`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      action: 'mark_received',
      notes: 'Physical inspection completed. Serial numbers match.',
    });
    console.log('Mark received response:', recRes.status, recRes.data?.message);

    console.log('7. Admin authorizing and issuing refund (authorize_refund)...');
    const refRes = await req({
      hostname: 'localhost',
      port: 8000,
      path: `/api/admin/orders/${targetOrder._id}/return-action`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      action: 'authorize_refund',
      refundAmount: targetOrder.totalPrice,
      notes: 'Full wallet credit settlement processed.',
    });
    console.log('Authorize refund response:', refRes.status, refRes.data?.message, 'Refund UTR:', refRes.data?.data?.refundUtr);

    console.log('8. Fetching official Credit Note advice...');
    const receiptRes = await req({
      hostname: 'localhost',
      port: 8000,
      path: `/api/admin/orders/${targetOrder._id}/refund-receipt`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Credit Note status:', receiptRes.status, receiptRes.data?.data?.receipt?.refundUtr, 'Amount: ₹' + receiptRes.data?.data?.receipt?.refundAmount);
  }

  // Also test settling a cancellation
  const cancelOrder = cs1.data?.data?.cancelOrders?.[0];
  if (cancelOrder) {
    console.log('9. Settling a cancellation refund for order:', cancelOrder.orderId, 'Total: ₹' + cancelOrder.total);
    const cancelRefRes = await req({
      hostname: 'localhost',
      port: 8000,
      path: `/api/admin/orders/${cancelOrder._id}/return-action`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      action: 'settle_cancellation',
      refundAmount: cancelOrder.total,
    });
    console.log('Cancellation settle response:', cancelRefRes.status, cancelRefRes.data?.message);
  }

  console.log('10. Final check of /api/admin/customer-service stats...');
  const csFinal = await req({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/customer-service',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('Final Stats:', csFinal.data?.data?.stats);
}

test().catch(console.error);
