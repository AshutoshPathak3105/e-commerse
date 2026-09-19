/**
 * Brevo (Sendinblue) Transactional Email Service
 * Uses native fetch to send responsive HTML transactional emails.
 */

const getClientUrl = () => {
  let url = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/+$/, '') : 'http://localhost:8000';
  if (url === 'http://localhost:3000' || url === 'http://127.0.0.1:3000') {
    url = 'http://localhost:8000';
  }
  return url;
};
const getLogoUrl = () => {
  if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
    return `${process.env.CLIENT_URL.replace(/\/+$/, '')}/logo.png`;
  }
  return 'https://raw.githubusercontent.com/AshutoshPathak3105/e-commerse/main/logo.png';
};

async function sendBrevoEmail({ to, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    console.warn('[Brevo] BREVO_API_KEY is not configured. Email skipped.');
    return { success: false, reason: 'No API Key' };
  }

  const senderEmail = process.env.SENDER_EMAIL || 'collegebilaspur@gmail.com';
  const senderName = process.env.SENDER_NAME || 'X-Mart Store';

  try {
    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: Array.isArray(to) ? to : [{ email: to.email, name: to.name || 'Valued Customer' }],
      subject,
      htmlContent,
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Brevo Error]', data);
      return { success: false, error: data };
    }

    console.log(`[Brevo Success] Email sent to ${to.email || to[0]?.email}: ${subject} (MessageID: ${data.messageId})`);
    return { success: true, data };
  } catch (err) {
    console.error('[Brevo Fetch Error]', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Send Welcome Email upon user registration
 */
async function sendWelcomeEmail({ email, name }) {
  const subject = `Welcome to X-Mart, ${name || 'Friend'}!`;
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #022F43; padding: 22px 20px 18px; text-align: center;">
        <a href="${getClientUrl()}" style="text-decoration: none; display: inline-block;">
          <img src="${getLogoUrl()}" alt="X-Mart" style="height: 48px; max-height: 48px; width: auto; max-width: 180px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px;" />
        </a>
        <p style="color: #9ca3af; margin: 8px 0 0; font-size: 13px;">Everything you love, delivered instantly.</p>
      </div>

      <div style="padding: 32px 24px; color: #1f2937; line-height: 1.6;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827;">Welcome aboard, ${name}!</h2>
        <p style="margin: 0 0 16px; font-size: 15px; color: #4b5563;">We're thrilled to have you as part of the X-Mart community. Your account is active and ready for fast shopping, exclusive lightning deals, and doorstep delivery.</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #111827;">What you can do now:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
            <li style="margin-bottom: 6px;">Browse 10,000+ top electronics, fashion, and home essentials.</li>
            <li style="margin-bottom: 6px;">Track your orders in real time in <strong>Order History</strong>.</li>
            <li style="margin-bottom: 6px;">Save favorites to your <strong>Saved Wishlist</strong>.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 28px 0 12px;">
          <a href="${getClientUrl()}" style="display: inline-block; background: #ff9700; color: #000000; font-weight: 800; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;">Start Shopping Now</a>
        </div>
      </div>

      <div style="background: #f3f4f6; padding: 18px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px;">Need help? Reply directly to this email or visit our 24/7 Customer Care Hub.</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart SuperStore. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendBrevoEmail({ to: { email, name }, subject, htmlContent });
}

/**
 * 2. Send OTP Email — supports 'register' (new account verification), 'reset' (password reset) and 'login' (login verification) types
 */
async function sendPasswordResetEmail({ email, name, otp, type = 'reset' }) {
  let subject, headingText, bodyText, noteText, ignoreText;

  if (type === 'register') {
    subject = `Verify Your Email for X-Mart`;
    headingText = `Confirm Your Registration`;
    bodyText = `Hello ${name || 'Friend'}, thank you for signing up for X-Mart! Enter the verification code below to activate your account.`;
    noteText = `This registration code expires in 15 minutes. Do not share it with anyone.`;
    ignoreText = `If you didn't attempt to create an X-Mart account with ${email}, please ignore this email.`;
  } else if (type === 'login') {
    subject = `X-Mart Login Verification Code`;
    headingText = `Verify Your Login`;
    bodyText = `Hello ${name || 'User'}, your sign-in OTP for X-Mart (<strong>${email}</strong>) is below. Use it to complete your login.`;
    noteText = `This login code expires in 10 minutes. Do not share it.`;
    ignoreText = `If you didn't try to log in, please secure your account immediately.`;
  } else if (type === 'profile') {
    subject = `X-Mart Profile Update Verification Code`;
    headingText = `Confirm Profile Changes`;
    bodyText = `Hello ${name || 'User'}, you requested to update your X-Mart account details. Enter the one-time code below to confirm these changes.`;
    noteText = `This profile update code expires in 15 minutes. Do not share it.`;
    ignoreText = `If you did not request this profile update, please secure your account immediately.`;
  } else if (type === 'seller-toggle') {
    subject = `X-Mart Seller Account Status Verification Code`;
    headingText = `Confirm Seller Account Status Change`;
    bodyText = `Hello ${name || 'Merchant'}, enter the one-time verification code below to confirm disabling or enabling your X-Mart seller account. When disabled, your listings will be marked as Currently Unavailable.`;
    noteText = `This verification code expires in 10 minutes. Do not share it with anyone.`;
    ignoreText = `If you did not request this seller account change, please secure your account immediately.`;
  } else if (type === 'seller-update') {
    subject = `X-Mart Merchant Profile & Settlement Update Verification Code`;
    headingText = `Confirm Merchant Profile & Settlement Update`;
    bodyText = `Hello ${name || 'Merchant'}, you requested to update your merchant store identity, GSTIN, or bank settlement details on X-Mart. Enter the one-time verification code below to authorize and apply these changes.`;
    noteText = `This verification code expires in 10 minutes. Do not share it with anyone.`;
    ignoreText = `If you did not request to update your seller credentials, please change your account password and contact support immediately.`;
  } else if (type === 'seller-delete') {
    subject = `URGENT: X-Mart Seller Account Deletion Verification Code`;
    headingText = `Confirm Seller Account Deletion`;
    bodyText = `Hello ${name || 'Merchant'}, you have requested to permanently delete your X-Mart seller account. Once verified with the code below, your seller account and all associated product listings will be permanently deleted from the website.`;
    noteText = `This deletion code expires in 10 minutes. Do not share it.`;
    ignoreText = `If you did NOT request to delete your seller account, please change your password immediately.`;
  } else {
    subject = `X-Mart Password Reset Code`;
    headingText = `Reset Your Password`;
    bodyText = `Hello ${name || 'User'}, we received a password reset request for your X-Mart account (<strong>${email}</strong>). Enter the code below to continue.`;
    noteText = `This reset code expires in 15 minutes. Do not share it with anyone.`;
    ignoreText = `If you didn't request a reset, you can safely ignore this email.`;
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #022F43; padding: 22px 20px 18px; text-align: center;">
        <a href="${getClientUrl()}" style="text-decoration: none; display: inline-block;">
          <img src="${getLogoUrl()}" alt="X-Mart" style="height: 48px; max-height: 48px; width: auto; max-width: 180px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px;" />
        </a>
        <p style="color: #9ca3af; margin: 8px 0 0; font-size: 13px;">Account Security</p>
      </div>

      <div style="padding: 32px 24px; color: #1f2937; line-height: 1.6;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827;">${headingText}</h2>
        <p style="margin: 0 0 16px; font-size: 15px; color: #4b5563;">${bodyText}</p>

        <div style="background: transparent; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #000000; text-transform: uppercase;">Your One-Time Code</p>
          <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #000000; font-variant-numeric: tabular-nums;">${otp}</div>
          <p style="margin: 8px 0 0; font-size: 12px; color: #000000;">${noteText}</p>
        </div>

        <p style="font-size: 13px; color: #6b7280; margin: 16px 0 0;">${ignoreText}</p>
      </div>

      <div style="background: #f3f4f6; padding: 18px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart SuperStore Security. Never share your OTP.</p>
      </div>
    </div>
  `;

  return sendBrevoEmail({ to: { email, name }, subject, htmlContent });
}

/**
 * 3. Send Purchase / Order Confirmation Invoice Email
 */
async function sendOrderConfirmationEmail({ email, name, order }) {
  const rawId = order.orderId || order._id || '';
  const orderId = order.orderId || (rawId ? (String(rawId).startsWith('XM-') ? String(rawId) : `XM-${String(rawId).slice(-8).toUpperCase()}`) : `XM-${Date.now()}`);
  const subject = `Order Confirmed: ${orderId}`;
  const items = order.orderItems || order.items || [];

  let totalOriginal = 0;
  let totalFinal = 0;

  const itemsRows = items.map((item) => {
    const qty = Number(item.quantity || item.qty) || 1;
    const finalPriceUnit = Number(item.price) || 0;
    const finalPriceTotal = finalPriceUnit * qty;

    // Resolve original MRP price
    let origPriceUnit = Number(item.originalPrice) || 0;
    if (origPriceUnit <= finalPriceUnit) {
      if (item.discount && item.discount > 0) {
        origPriceUnit = Math.round(finalPriceUnit / (1 - item.discount / 100));
      } else {
        origPriceUnit = Math.round(finalPriceUnit * 1.25);
      }
    }
    const origPriceTotal = origPriceUnit * qty;
    const discountAmt = Math.max(0, origPriceTotal - finalPriceTotal);
    const discountPct = origPriceTotal > 0 ? Math.round((discountAmt / origPriceTotal) * 100) : 0;

    totalOriginal += origPriceTotal;
    totalFinal += finalPriceTotal;

    // Resolve product image
    let imgUrl = item.image || '';
    if (!imgUrl || imgUrl === 'logo.png') {
      imgUrl = getLogoUrl();
    } else if (imgUrl.startsWith('/')) {
      imgUrl = `${getClientUrl()}${imgUrl}`;
    }

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 16px 0; vertical-align: middle; width: 68px;">
          <img src="${imgUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 6px; border: 1px solid #e5e7eb; display: block; background: #ffffff;" onerror="this.src='${getLogoUrl()}';" />
        </td>
        <td style="padding: 16px 12px; vertical-align: middle;">
          <div style="font-size: 14px; font-weight: 700; color: #000000; line-height: 1.4; margin-bottom: 4px;">${item.name}</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Quantity: <strong style="color: #000000;">${qty}</strong></div>
          <div style="font-size: 12.5px;">
            <span style="color: #6b7280; text-decoration: line-through; margin-right: 6px;">₹${origPriceTotal.toLocaleString('en-IN')}</span>
            <span style="color: #16a34a; font-weight: 700;">₹${discountAmt.toLocaleString('en-IN')} OFF (${discountPct}%)</span>
          </div>
        </td>
        <td style="padding: 16px 0; vertical-align: middle; text-align: right; white-space: nowrap;">
          <div style="font-size: 16px; font-weight: 800; color: #000000;">₹${finalPriceTotal.toLocaleString('en-IN')}</div>
          ${qty > 1 ? `<div style="font-size: 11px; color: #6b7280;">(₹${finalPriceUnit.toLocaleString('en-IN')} each)</div>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  const grandTotal = Number(order.totalPrice) || totalFinal || 0;
  if (totalOriginal <= grandTotal) {
    totalOriginal = Math.round(grandTotal * 1.25);
  }
  const totalSavings = Math.max(0, totalOriginal - grandTotal);
  const paymentMethod = String(order.paymentMethod || 'COD').toUpperCase();
  const isPaid = order.isPaid || (paymentMethod !== 'COD');
  const paymentStatus = isPaid ? 'PAID & CONFIRMED' : 'PAY ON DELIVERY (COD)';

  // Delivery address details
  const addr = order.shippingAddress || {};
  const recipientName = addr.name || name || 'Customer';
  const street = addr.street || '';
  const city = addr.city || '';
  const state = addr.state || '';
  const pincode = addr.pincode || '';
  const phone = addr.phone || '';
  const addressParts = [street, city, state ? `${state} - ${pincode}` : pincode].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Registered Delivery Address';

  const trackingUrl = `${getClientUrl()}/#track/${encodeURIComponent(orderId)}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #022F43; padding: 22px 20px 18px; text-align: center;">
        <a href="${getClientUrl()}" style="text-decoration: none; display: inline-block;">
          <img src="${getLogoUrl()}" alt="X-Mart" style="height: 48px; max-height: 48px; width: auto; max-width: 180px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px;" />
        </a>
        <p style="color: #9ca3af; margin: 8px 0 0; font-size: 13px;">Thank you for your order!</p>
      </div>

      <div style="padding: 32px 24px; color: #000000; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; font-size: 19px; font-weight: 800; color: #000000;">Order Confirmation</h2>
            <p style="margin: 4px 0 0; font-size: 13px; color: #4b5563;">Order ID: <strong style="color: #000000; font-family: monospace; font-size: 14px;">${orderId}</strong></p>
          </div>
          <div style="text-align: right;">
            <span style="background: #dcfce7; color: #15803d; font-size: 11.5px; font-weight: 800; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.3px;">${paymentStatus}</span>
          </div>
        </div>

        <p style="margin: 0 0 18px; font-size: 14.5px; color: #000000;">Hi <strong>${recipientName}</strong>, your order has been received and is being prepared for fast dispatch.</p>

        <!-- Order Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">
              <th style="padding: 8px 0; text-align: left;" colspan="2">Item & Price Details</th>
              <th style="padding: 8px 0; text-align: right;">Final Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Amount Summary Ledger -->
        <table style="width: 100%; border-collapse: collapse; margin: 14px 0 24px;">
          <tbody>
            <tr>
              <td style="padding: 6px 0; font-size: 13.5px; color: #4b5563;">Total MRP / Original Price:</td>
              <td style="padding: 6px 0; font-size: 13.5px; color: #4b5563; text-align: right;">₹${totalOriginal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13.5px; color: #16a34a; font-weight: 600;">Total Discount / Savings:</td>
              <td style="padding: 6px 0; font-size: 13.5px; color: #16a34a; font-weight: 700; text-align: right;">-₹${totalSavings.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13.5px; color: #4b5563;">Delivery Charges:</td>
              <td style="padding: 6px 0; font-size: 13.5px; color: #16a34a; font-weight: 700; text-align: right;">FREE</td>
            </tr>
            <tr style="border-top: 1.5px solid #e5e7eb;">
              <td style="padding: 12px 0 6px; font-size: 16px; font-weight: 800; color: #000000;">Grand Total:</td>
              <td style="padding: 12px 0 6px; font-size: 20px; font-weight: 900; color: #000000; text-align: right;">₹${grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <!-- Delivery & Payment Info Box -->
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <div style="margin-bottom: 10px; font-size: 13.5px; color: #000000; line-height: 1.5;">
            <strong style="color: #000000;">Delivery Address:</strong><br />
            ${recipientName}<br />
            ${fullAddress}
            ${phone ? `<br />Phone: ${phone}` : ''}
          </div>
          <div style="font-size: 13.5px; color: #000000; border-top: 1px solid #f3f4f6; padding-top: 10px;">
            <strong style="color: #000000;">Payment Mode:</strong> ${paymentMethod} &bull; ${paymentStatus}
          </div>
        </div>

        <!-- Tracking Button -->
        <div style="text-align: center; margin: 28px 0 14px;">
          <a href="${trackingUrl}" style="display: inline-block; background: #ff9700; color: #000000; font-weight: 800; padding: 14px 34px; border-radius: 8px; text-decoration: none; font-size: 15px; letter-spacing: 0.2px;">Track Package in Store</a>
        </div>
      </div>

      <div style="background: #f9fafb; padding: 18px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart SuperStore. Need help with this order? Contact our customer support team.</p>
      </div>
    </div>
  `;

  return sendBrevoEmail({ to: { email, name }, subject, htmlContent });
}

/**
 * 4. Send Seller Payout Disbursement Notification Email
 */
async function sendSellerPayoutEmail({ email, name, storeName, amount, bankAcc, bankIfsc, utrNumber, transferMode, remarks }) {
  const subject = `Payout Disbursed: ₹${Number(amount).toLocaleString('en-IN')} transferred to your bank account`;
  const maskedAcc = bankAcc ? '•••• ' + String(bankAcc).slice(-4) : 'Direct Account';
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #064e3b; padding: 28px 24px; text-align: center;">
        <h1 style="color: #34d399; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">X-MART SETTLEMENTS</h1>
        <p style="color: #a7f3d0; margin: 6px 0 0; font-size: 13px;">Official Vendor Escrow Clearing Advice</p>
      </div>

      <div style="padding: 32px 24px; color: #1f2937; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px; color: #059669; margin-bottom: 12px;">✓</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #064e3b;">Payment Released &amp; Transferred</h2>
          <p style="margin: 6px 0 0; font-size: 14px; color: #4b5563;">Escrow proceeds have been successfully disbursed to your registered bank account.</p>
        </div>

        <div style="background: #f0fdf4; border: 1.5px dashed #86efac; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #15803d; letter-spacing: 0.05em;">Net Disbursed Amount</p>
          <div style="font-size: 36px; font-weight: 900; color: #065f46; margin: 6px 0;">₹${Number(amount).toLocaleString('en-IN')}</div>
          <p style="margin: 0; font-size: 12px; color: #166534;">via ${transferMode || 'IMPS'} Electronic Bank Clearance</p>
        </div>

        <!-- Bank Transfer Advice Ledger -->
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13.5px;">
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Merchant Store:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #111827;">${storeName || name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Beneficiary Name:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Settlement Bank A/C:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; font-family: monospace; color: #111827;">${maskedAcc}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Bank IFSC:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; font-family: monospace; color: #111827;">${bankIfsc}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Bank UTR / Reference ID:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 800; font-family: monospace; color: #0284c7;">${utrNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Disbursement Timestamp:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827;">${now}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Remarks:</td>
              <td style="padding: 10px 0; text-align: right; color: #4b5563;">${remarks || 'Marketplace Escrow Release'}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px; font-size: 12px; color: #6b7280; line-height: 1.5;">
          <strong>Settlement Note:</strong> Bank credits via IMPS/UPI reflect instantly. NEFT/RTGS credits typically settle within 30–60 minutes per RBI clearing cycles. Retain this UTR reference for your financial audit.
        </div>
      </div>

      <div style="background: #f3f4f6; padding: 18px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px;">X-Mart Financial Operations &amp; Escrow Clearing House</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart SuperStore. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendBrevoEmail({ to: { email, name }, subject, htmlContent });
}

/**
 * 5. Send RMA Status / Reverse Logistics Update Email to Customer
 */
async function sendReturnStatusEmail({ email, name, orderId, rmaNumber, status, reverseAwb, notes }) {
  const subject = `Update on Return Request ${rmaNumber} (Order ${orderId})`;
  const statusLabels = {
    'Approved': 'RMA Approved — Pickup Scheduled',
    'Item_Picked_Up': 'Item Received at Fulfillment Center',
    'Rejected': 'Return Request Reviewed',
  };
  const title = statusLabels[status] || 'Return Request Status Update';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #022F43; padding: 22px 20px 18px; text-align: center;">
        <a href="${getClientUrl()}" style="text-decoration: none; display: inline-block;">
          <img src="${getLogoUrl()}" alt="X-Mart" style="height: 48px; max-height: 48px; width: auto; max-width: 180px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px;" />
        </a>
        <p style="color: #9ca3af; margin: 8px 0 0; font-size: 13px;">Reverse Logistics &amp; Customer Care</p>
      </div>

      <div style="padding: 32px 24px; color: #1f2937; line-height: 1.6;">
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 800; color: #0f172a;">${title}</h2>
        <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">Hello ${name || 'Customer'}, here is the latest update regarding your return request.</p>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13.5px;">
          <div style="margin-bottom: 8px;"><strong>RMA Number:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: 700;">${rmaNumber}</span></div>
          <div style="margin-bottom: 8px;"><strong>Associated Order:</strong> ${orderId}</div>
          <div style="margin-bottom: 8px;"><strong>Current RMA Status:</strong> <span style="font-weight: 700; color: #059669;">${status}</span></div>
          ${reverseAwb ? `<div style="margin-bottom: 8px;"><strong>Reverse Pickup Tracking (AWB):</strong> <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${reverseAwb}</span> (Blue Dart Express)</div>` : ''}
          ${notes ? `<div><strong>Notes:</strong> ${notes}</div>` : ''}
        </div>
      </div>

      <div style="background: #f3f4f6; padding: 18px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart SuperStore Support. Need help? Reply directly to this email.</p>
      </div>
    </div>
  `;

  return sendBrevoEmail({ to: { email, name }, subject, htmlContent });
}

/**
 * 6. Send Refund Confirmation & Credit Note Advice to Customer
 */
async function sendRefundConfirmationEmail({ email, name, orderId, rmaNumber, amount, refundMethod, refundUtr }) {
  const subject = `Refund Processed: ₹${Number(amount).toLocaleString('en-IN')} for Order ${orderId}`;
  const destination = refundMethod === 'wallet' ? 'X-Mart Wallet' : 'Original Payment Source / Bank Account';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #064e3b; padding: 28px 24px; text-align: center;">
        <h1 style="color: #34d399; margin: 0; font-size: 24px; font-weight: 800;">X-MART REFUNDS</h1>
        <p style="color: #a7f3d0; margin: 6px 0 0; font-size: 13px;">Official Refund &amp; Credit Note</p>
      </div>

      <div style="padding: 32px 24px; color: #1f2937; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 50%; width: 52px; height: 52px; line-height: 52px; font-size: 24px; color: #059669; margin-bottom: 8px;">✓</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #064e3b;">Refund Successfully Issued</h2>
          <p style="margin: 4px 0 0; font-size: 14px; color: #475569;">Your settlement has been approved and authorized by our clearing team.</p>
        </div>

        <div style="background: #f0fdf4; border: 1.5px dashed #86efac; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #15803d;">Settled Refund Amount</div>
          <div style="font-size: 34px; font-weight: 900; color: #065f46; margin: 4px 0;">₹${Number(amount).toLocaleString('en-IN')}</div>
          <div style="font-size: 12px; color: #166534;">Credited to ${destination}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 18px 0;">
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; color: #6b7280;">Order ID:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">${orderId}</td>
            </tr>
            ${rmaNumber ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; color: #6b7280;">RMA Reference:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${rmaNumber}</td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; color: #6b7280;">Credit Destination:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${destination}</td>
            </tr>
            ${refundUtr ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; color: #6b7280;">Refund UTR / Ref:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 800; font-family: monospace; color: #0284c7;">${refundUtr}</td>
            </tr>` : ''}
          </tbody>
        </table>
      </div>

      <div style="background: #f3f4f6; padding: 18px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart SuperStore Financial Operations.</p>
      </div>
    </div>
  `;

  return sendBrevoEmail({ to: { email, name }, subject, htmlContent });
}

module.exports = {
  sendBrevoEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendSellerPayoutEmail,
  sendReturnStatusEmail,
  sendRefundConfirmationEmail,
};


