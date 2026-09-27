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

// FRONTEND_URL should be set to the Netlify (frontend) URL in production.
// Falls back to CLIENT_URL or the live production Netlify storefront.
const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/+$/, '');
  }
  if (process.env.CLIENT_URL) {
    const cUrl = process.env.CLIENT_URL.replace(/\/+$/, '');
    if (!cUrl.includes('onrender.com') && !cUrl.includes('localhost') && !cUrl.includes('127.0.0.1')) {
      return cUrl;
    }
  }
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    return 'https://beautiful-druid-f9f6aa.netlify.app';
  }
  return getClientUrl();
};

const getLogoUrl = () => {
  const base = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.replace(/\/+$/, '')
    : (process.env.CLIENT_URL || '');
  if (base && !base.includes('localhost')) {
    return `${base}/logo.png`;
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
        <a href="${getFrontendUrl()}" style="text-decoration: none; display: inline-block;">
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
          <a href="${getFrontendUrl()}" style="display: inline-block; background: #ff9700; color: #000000; font-weight: 800; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;">Start Shopping Now</a>
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
        <a href="${getFrontendUrl()}" style="text-decoration: none; display: inline-block;">
          <img src="${getLogoUrl()}" alt="X-Mart" style="height: 48px; max-height: 48px; width: auto; max-width: 180px; object-fit: contain; display: block; margin: 0 auto; border-radius: 0;" />
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
      imgUrl = `${getFrontendUrl()}${imgUrl}`;
    }

    // 2-column layout: fixed image cell + details cell (name, qty, price, savings).
    // Avoids 3-column tables that break on mobile email clients.
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; vertical-align: top; width: 68px; min-width: 68px;">
          <img src="${imgUrl}" alt="${item.name}" width="60" height="60"
            style="width: 60px; height: 60px; object-fit: contain; border-radius: 6px; border: 1px solid #e5e7eb; display: block; background: #ffffff;"
            onerror="this.src='${getLogoUrl()}';" />
        </td>
        <td style="padding: 12px 10px 12px 12px; vertical-align: top;">
          <div style="font-size: 13px; font-weight: 700; color: #111827; line-height: 1.4; margin-bottom: 5px;">${item.name}</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Qty: <strong style="color: #111827;">${qty}</strong></div>
          <div style="font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 3px;">₹${finalPriceTotal.toLocaleString('en-IN')}${qty > 1 ? `<span style="font-size:11px;font-weight:500;color:#6b7280;"> (₹${finalPriceUnit.toLocaleString('en-IN')} each)</span>` : ''}</div>
          <div style="font-size: 11.5px;">
            <span style="color: #9ca3af; text-decoration: line-through; margin-right: 5px;">₹${origPriceTotal.toLocaleString('en-IN')}</span>
            <span style="color: #16a34a; font-weight: 700;">₹${discountAmt.toLocaleString('en-IN')} OFF (${discountPct}%)</span>
          </div>
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

  // Use FRONTEND_URL for the tracking link so it always points to the Netlify frontend,
  // not the backend API server.
  const trackingUrl = `${getFrontendUrl()}/#track/${encodeURIComponent(orderId)}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #022F43; padding: 22px 20px 18px; text-align: center;">
        <a href="${getFrontendUrl()}" style="text-decoration: none; display: inline-block;">
          <img src="${getLogoUrl()}" alt="X-Mart" style="height: 48px; max-height: 48px; width: auto; max-width: 180px; object-fit: contain; display: block; margin: 0 auto; border-radius: 0;" />
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
            <tr style="border-bottom: 2px solid #e5e7eb; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">
              <th style="padding: 8px 0; text-align: left;" colspan="2">Item & Price Details</th>
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
async function sendReturnStatusEmail({ email, name, orderId, rmaNumber, status, reverseAwb, reverseCourier, notes, qcGrade, pickupAddress }) {
  const statusLabels = {
    'Approved': 'Return Request Approved — Doorstep Pickup Scheduled',
    'In_Transit': 'Item Picked Up by Courier — In Transit to Warehouse',
    'Item_Picked_Up': 'Item Received & Quality Inspection in Progress',
    'QC_Passed': 'Quality Check Passed — Refund Settlement Pre-Approved',
    'Rejected': 'Return Request Reviewed & Declined',
    'Replacement_Shipped': 'Replacement Unit Dispatched',
  };
  const title = statusLabels[status] || `Return Request Update: ${status}`;
  const subject = `[X-Mart] ${title} (Order ${orderId})`;

  const courierName = reverseCourier || 'Blue Dart Express';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #022F43; padding: 24px 20px; text-align: center;">
        <a href="${getFrontendUrl()}" style="text-decoration: none; display: inline-block;">
          <img src="${getLogoUrl()}" alt="X-Mart" style="height: 44px; max-height: 44px; width: auto; max-width: 170px; object-fit: contain; display: block; margin: 0 auto;" />
        </a>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">Reverse Logistics &amp; RMA Department</p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #0f172a;">${title}</h2>
        <p style="margin: 0 0 18px; font-size: 14.5px; color: #475569;">Hello <strong>${name || 'Valued Customer'}</strong>, here is the official status update regarding your return request for Order <strong>${orderId}</strong>.</p>

        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 18px; margin: 20px 0; font-size: 13.5px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">RMA Reference:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 800; color: #004ac6;">${rmaNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Associated Order ID:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a; font-family: monospace;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Current Pipeline Stage:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #059669;">${status}</td>
              </tr>
              ${reverseAwb ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Reverse Courier:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0284c7;">${courierName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Reverse Tracking (AWB):</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">${reverseAwb}</td>
              </tr>` : ''}
              ${qcGrade ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Warehouse QC Result:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #059669;">${qcGrade}</td>
              </tr>` : ''}
            </tbody>
          </table>

          ${notes ? `
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #334155;">
              <strong style="color: #0f172a;">Logistics / Inspection Remarks:</strong><br>
              <span style="font-style: italic; color: #475569;">"${notes}"</span>
            </div>
          ` : ''}
        </div>

        ${pickupAddress?.street ? `
          <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 12.5px; color: #334155;">
            <strong style="color: #0f172a; display: block; margin-bottom: 2px;">📍 Doorstep Handover Location:</strong>
            ${pickupAddress.street}, ${pickupAddress.city || ''} ${pickupAddress.state ? '• ' + pickupAddress.state : ''} - <strong>${pickupAddress.pincode || ''}</strong>
          </div>
        ` : ''}

        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
          Please keep the product in its original packaging with all included accessories ready for the courier handover.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart SuperStore Support • All Rights Reserved.</p>
      </div>
    </div>
  `;

  return sendBrevoEmail({ to: { email, name }, subject, htmlContent });
}

/**
 * 6. Send Refund Confirmation & Credit Note Advice to Customer
 */
async function sendRefundConfirmationEmail({ email, name, orderId, rmaNumber, amount, refundMethod, refundUtr, bankDetails, deductions = 0 }) {
  const subject = `Refund Processed: ₹${Number(amount).toLocaleString('en-IN')} for Order ${orderId}`;
  const isWallet = refundMethod === 'wallet';
  const destination = isWallet ? 'X-Mart Digital Wallet (Instant Credit)' : 'Direct Bank Account / UPI Transfer';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      <div style="background: #064e3b; padding: 28px 24px; text-align: center;">
        <a href="${getFrontendUrl()}" style="text-decoration: none; display: inline-block;">
          <img src="${getLogoUrl()}" alt="X-Mart" style="height: 42px; max-height: 42px; width: auto; max-width: 170px; object-fit: contain; display: block; margin: 0 auto;" />
        </a>
        <h1 style="color: #34d399; margin: 10px 0 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">X-MART REFUND ADVICE</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0; font-size: 12.5px;">Official Settlement Confirmation &amp; Credit Note</p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="display: inline-block; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 50%; width: 50px; height: 50px; line-height: 50px; font-size: 24px; color: #059669; margin-bottom: 8px;">✓</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #064e3b;">Refund Successfully Issued</h2>
          <p style="margin: 4px 0 0; font-size: 14px; color: #475569;">Hello <strong>${name || 'Valued Customer'}</strong>, your return settlement has been approved and disbursed.</p>
        </div>

        <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 10px; padding: 22px; margin: 20px 0; text-align: center;">
          <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #15803d; letter-spacing: 0.5px;">Settled Refund Amount</div>
          <div style="font-size: 36px; font-weight: 900; color: #065f46; margin: 4px 0;">₹${Number(amount).toLocaleString('en-IN')}</div>
          <div style="font-size: 13px; color: #166534; font-weight: 600;">Credited to <strong>${destination}</strong></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Order ID:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${orderId}</td>
            </tr>
            ${rmaNumber ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">RMA Number:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 800; font-family: monospace; color: #004ac6;">${rmaNumber}</td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Credit Destination:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">${destination}</td>
            </tr>
            ${refundUtr ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Bank Reference UTR:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 800; font-family: monospace; color: #0284c7;">${refundUtr}</td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Settlement Date:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
            </tr>
          </tbody>
        </table>

        ${(!isWallet && bankDetails?.bankName) ? `
          <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 12.5px; color: #1e3a8a;">
            <strong style="display: block; margin-bottom: 4px; color: #1e40af;">Disbursement Bank Details:</strong>
            <div>Bank: <strong>${bankDetails.bankName}</strong></div>
            <div>Beneficiary: <strong>${bankDetails.accountHolder || name}</strong></div>
            ${bankDetails.accountNumber ? `<div>Account No: <strong>${bankDetails.accountNumber}</strong></div>` : ''}
            ${bankDetails.ifscCode ? `<div>IFSC Code: <strong>${bankDetails.ifscCode}</strong></div>` : ''}
            ${bankDetails.upiId ? `<div>UPI ID: <strong>${bankDetails.upiId}</strong></div>` : ''}
          </div>
        ` : ''}

        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
          ${isWallet ? 'Your X-Mart Wallet balance has been updated and is ready for use on your next order.' : 'Depending on your bank, credit reflections typically appear within 2-4 business hours (or instantly via IMPS/UPI).'}
        </p>
      </div>

      <div style="background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart SuperStore Financial Operations • Need assistance? Reply to this email.</p>
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


