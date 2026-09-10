const fs = require('fs');

// 1. Update index.html to remove placeholder attributes
let html = fs.readFileSync('index.html', 'utf8');
const initialHtmlMatches = html.match(/\s+placeholder=(?:"[^"]*"|'[^']*')/g);
console.log('index.html placeholder matches before:', initialHtmlMatches?.length || 0);

html = html.replace(/\s+placeholder=(?:"[^"]*"|'[^']*')/g, '');
fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated. Remaining placeholders:', (html.match(/\s+placeholder=(?:"[^"]*"|'[^']*')/g) || []).length);

// 2. Update script.js
let js = fs.readFileSync('script.js', 'utf8');

// Replace _adminMockFallback /profile section
const oldFallback = `    if (cleanEp === '/profile') {
      const u = Auth.getUser() || {};
      return {
        success: true,
        data: {
          id: u._id || '6a946d65adbc99d858d2cb7b',
          name: u.name || 'X-Mart Admin',
          email: u.email || 'admin@xmart.com',
          phone: u.phone || '+91 9999999999',
          role: 'Super Admin (Level 4 Root)',
          empId: 'XM-D2CB7B',
          designation: 'VP of Marketplace Operations & Chief Platform Administrator',
          department: 'Marketplace Operations & Governance',
          station: 'Bellandur Tech Park HQ, Outer Ring Rd, Bengaluru',
          timezone: 'Asia/Kolkata (IST • UTC+05:30)',
          securityScore: 98,
          yubikeyEnforced: true,
          standbyContact: 'Ashu (Acting Ops Director, Mitra Lok Buxar)',
          delegationEnabled: true,
          alertRules: { slaBreaches: true, vendorFraud: true, nightlyDigest: true },
          stats: { adminOps30d: 1420, pendingApprovals: 5, activeNodes: 1 },
          recentAuditLogs: [
            {
              timestamp: 'Today, 11:20:14 AM',
              domain: 'Merchant Escrow',
              action: 'Approved instant merchant payout of ₹14,20,500 to Apex Retail Enterprises Pvt Ltd',
              refId: 'TXN-902148',
              status: 'Hardware Signed'
            },
            {
              timestamp: 'Today, 09:45:02 AM',
              domain: 'Logistics SLA',
              action: 'Updated pincode serviceability rule for 560038 (Indiranagar Tier-1 COD cap raised to ₹25,000)',
              refId: 'PIN-560038-RO',
              status: 'Direct Committed'
            },
            {
              timestamp: 'Yesterday, 17:15:40 PM',
              domain: 'Seller Compliance',
              action: 'Cleared KYC & Bank Verification for Apex Tech Store (GSTIN 27ABCDE1234F1Z5)',
              refId: 'KYC-APX-882',
              status: 'Validated'
            },
            {
              timestamp: '23 Oct, 14:02:18 PM',
              domain: '3PL Routing',
              action: 'Adjusted NDR failover threshold from 2.0% to 1.8% for BlueDart Express Southern Grid',
              refId: 'SLA-BLD-019',
              status: 'Propagated'
            }
          ]
        }
      };
    }`;

const newFallback = `    if (cleanEp === '/profile') {
      const u = Auth.getUser() || {};
      const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Aug 2026';
      return {
        success: true,
        data: {
          id: u._id || 'ADM-ROOT',
          name: u.name || 'X-Mart Admin',
          email: u.email || 'admin@xmart.com',
          phone: u.phone || '+91 9999999999',
          role: 'Super Administrator',
          empId: \`ADM-\${(u._id || 'ROOT').toString().slice(-6).toUpperCase()}\`,
          designation: 'Marketplace Administrator',
          department: 'Operations & Management',
          registrationDate: regDate,
          securityScore: 100,
          activeNodes: 1,
          stats: {
            totalOrders: (window.Store?.orders?.length) || 23,
            pendingApprovals: (window.Store?.orders?.filter(o => o.status === 'Pending').length) || 5,
            catalogItems: (window.Store?.products?.length) || 662,
            activeSellers: 1,
            activeNodes: 1,
          },
          recentAuditLogs: []
        }
      };
    }`;

if (js.includes(oldFallback)) {
  js = js.replace(oldFallback, newFallback);
  console.log('Replaced _adminMockFallback successfully!');
} else {
  console.log('Warning: oldFallback not matched exactly. Checking substring...');
}

fs.writeFileSync('scratch/test_js_step1.js', js, 'utf8');
