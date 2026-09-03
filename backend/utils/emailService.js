/**
 * Brevo (Sendinblue) Transactional Email Service
 * Uses native fetch to send responsive HTML transactional emails.
 */

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
  const subject = `Welcome to X-Mart, ${name || 'Friend'}! 🎉`;
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: #19324c; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ff9700; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">X-MART</h1>
        <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Everything you love, delivered instantly.</p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">Welcome aboard, ${name}! 👋</h2>
        <p style="margin: 0 0 16px; font-size: 15px; color: #475569;">We're thrilled to have you as part of the X-Mart community. Your account is active and ready for fast shopping, exclusive lightning deals, and doorstep delivery.</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #0f172a;">What you can do now:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
            <li style="margin-bottom: 6px;">⚡ Browse 10,000+ top electronics, fashion, and home essentials.</li>
            <li style="margin-bottom: 6px;">📦 Track your orders in real time in <strong>Order History</strong>.</li>
            <li style="margin-bottom: 6px;">❤️ Save favorites to your <strong>Saved Wishlist</strong>.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 28px 0 12px;">
          <a href="http://localhost:8000" style="display: inline-block; background: #ff9700; color: #000000; font-weight: 800; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;">Start Shopping Now</a>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
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
    subject = `Verify Your Email for X-Mart 🚀`;
    headingText = `Confirm Your Registration`;
    bodyText = `Hello ${name || 'Friend'}, thank you for signing up for X-Mart! Enter the verification code below to activate your account.`;
    noteText = `This registration code expires in 15 minutes. Do not share it with anyone.`;
    ignoreText = `If you didn't attempt to create an X-Mart account with ${email}, please ignore this email.`;
  } else if (type === 'login') {
    subject = `X-Mart Login Verification Code 🔐`;
    headingText = `Verify Your Login`;
    bodyText = `Hello ${name || 'User'}, your sign-in OTP for X-Mart (<strong>${email}</strong>) is below. Use it to complete your login.`;
    noteText = `This login code expires in 10 minutes. Do not share it.`;
    ignoreText = `If you didn't try to log in, please secure your account immediately.`;
  } else if (type === 'profile') {
    subject = `X-Mart Profile Update Verification Code 🔐`;
    headingText = `Confirm Profile Changes`;
    bodyText = `Hello ${name || 'User'}, you requested to update your X-Mart account details. Enter the one-time code below to confirm these changes.`;
    noteText = `This profile update code expires in 15 minutes. Do not share it.`;
    ignoreText = `If you did not request this profile update, please secure your account immediately.`;
  } else {
    subject = `X-Mart Password Reset Code 🔒`;
    headingText = `Reset Your Password`;
    bodyText = `Hello ${name || 'User'}, we received a password reset request for your X-Mart account (<strong>${email}</strong>). Enter the code below to continue.`;
    noteText = `This reset code expires in 15 minutes. Do not share it with anyone.`;
    ignoreText = `If you didn't request a reset, you can safely ignore this email.`;
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: #19324c; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ff9700; margin: 0; font-size: 26px; font-weight: 800;">X-MART</h1>
        <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Account Security</p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">${headingText}</h2>
        <p style="margin: 0 0 16px; font-size: 15px; color: #475569;">${bodyText}</p>

        <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #92400e; text-transform: uppercase;">Your One-Time Code</p>
          <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1e293b; font-variant-numeric: tabular-nums;">${otp}</div>
          <p style="margin: 8px 0 0; font-size: 12px; color: #b45309;">${noteText}</p>
        </div>

        <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">${ignoreText}</p>
      </div>

      <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
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
  const orderId = order.orderId || order._id || 'XM-ORD-' + Date.now();
  const subject = `Order Confirmed! Ref: ${orderId} 📦`;
  const items = order.items || [];
  const total = order.totalPrice || order.items?.reduce((s, i) => s + (i.price * (i.qty || 1)), 0) || 0;

  const itemsRows = items.map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 0; font-size: 14px; color: #1e293b; font-weight: 600;">
        ${item.name}
        <div style="font-size: 12px; color: #64748b; font-weight: normal;">Qty: ${item.qty || 1}</div>
      </td>
      <td style="padding: 12px 0; font-size: 14px; color: #0f172a; font-weight: 800; text-align: right;">
        ₹${((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: #19324c; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ff9700; margin: 0; font-size: 26px; font-weight: 800;">X-MART</h1>
        <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Thank you for your order!</p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">Order Confirmation</h2>
            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Order Ref: <strong>${orderId}</strong></p>
          </div>
          <div style="text-align: right;">
            <span style="background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">PAID & CONFIRMED</span>
          </div>
        </div>

        <p style="margin: 0 0 16px; font-size: 15px; color: #475569;">Hi ${name || 'Shopper'}, your order has been received and is being prepared for fast dispatch.</p>

        <!-- Order Items Summary Table -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b;">
              <th style="padding: 8px 0; text-align: left;">Item</th>
              <th style="padding: 8px 0; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 14px 0 6px; font-size: 15px; font-weight: 800; color: #0f172a;">Grand Total:</td>
              <td style="padding: 14px 0 6px; font-size: 18px; font-weight: 900; color: #19324c; text-align: right;">₹${total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Shipping & Payment Info -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; color: #475569;">
          <div style="margin-bottom: 8px;"><strong>Delivery To:</strong> ${order.shippingAddress?.street || 'Customer Address'}, ${order.shippingAddress?.city || 'India'} - ${order.shippingAddress?.pincode || 'Pincode'}</div>
          <div><strong>Payment Mode:</strong> ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'ONLINE'}</div>
        </div>

        <div style="text-align: center; margin: 28px 0 12px;">
          <a href="http://localhost:8000" style="display: inline-block; background: #ff9700; color: #000000; font-weight: 800; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-size: 14px;">Track Package in Store</a>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">© ${new Date().getFullYear()} X-Mart Store. Need help with this order? Contact our support team.</p>
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
};
