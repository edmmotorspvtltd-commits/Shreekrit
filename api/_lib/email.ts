// ─────────────────────────────────────────────────────────────────────────────
// Shreekrit — centralised email helper (Resend)
// From address : Shreekrit <shreekrit06@gmail.com>
// ─────────────────────────────────────────────────────────────────────────────

const SENDER = 'Shreekrit <hello@shreekrit.in>';
const STORE_EMAIL = 'shreekrit06@gmail.com';

// Wrapper to always set reply_to so customer replies go to Gmail
async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY is not set. Emails will not be sent.');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: SENDER,
      to,
      reply_to: STORE_EMAIL,
      subject,
      html
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to send email via Resend:', errorText);
  }
}

// ── Shared layout ────────────────────────────────────────────────────────────
function layout(content: string, previewText = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shreekrit</title>
</head>
<body style="margin:0;padding:0;background:#FAF5EA;font-family:'Georgia',serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:#FAF5EA;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2D4BF;">
        <tr>
          <td style="background:#FAF5EA;border-bottom:3px solid #8C2711;padding:24px 40px;text-align:center;">
            <img
              src="https://shreekrit.in/shreekrit-logo.png"
              width="160"
              alt="SHREEKRIT"
              style="display:block;margin:0 auto;width:160px;height:auto;color:#8C2711;font-size:22px;font-weight:700;letter-spacing:1px;"
            />
            <p style="margin:6px 0 0;color:#8C2711;font-size:10px;letter-spacing:3px;text-transform:uppercase;">Authentic Folk Art Archive</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:#FAF5EA;border-top:1px solid #E2D4BF;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#8C7060;font-size:11px;line-height:1.6;">
              Shreekrit · Authentic Mithila Art · India<br/>
              <a href="mailto:shreekrit06@gmail.com" style="color:#8C2711;text-decoration:none;">shreekrit06@gmail.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const divider = `<hr style="border:none;border-top:1px solid #E2D4BF;margin:24px 0;" />`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORDER CONFIRMATION — sent to customer
// ─────────────────────────────────────────────────────────────────────────────
export interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderRef: string;
  orderDate: string;
  estimatedDelivery: string;
  items: { paintingTitle: string; editionType: string; frame: string; unitPriceINR: number; framePriceINR: number }[];
  subtotalINR: number;
  shippingINR: number;
  totalINR: number;
  shippingAddress: { addressLine1: string; addressLine2?: string; city: string; state: string; postalCode: string; country: string };
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemRows = data.items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F0E4D2;">
        <p style="margin:0;font-size:14px;color:#241A14;font-weight:600;">${i.paintingTitle}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#8C7060;">${i.editionType === 'original' ? 'Original Artwork' : 'Print Edition'} · Frame: ${i.frame}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #F0E4D2;text-align:right;vertical-align:top;">
        <p style="margin:0;font-size:14px;color:#241A14;">&#8377;${(i.unitPriceINR + i.framePriceINR).toLocaleString('en-IN')}</p>
      </td>
    </tr>`).join('');

  const addr = data.shippingAddress;
  const addrLine = [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ');

  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">Thank you, ${data.customerName}!</h2>
    <p style="margin:0 0 24px;color:#5C4A3A;font-size:14px;line-height:1.7;">Your order has been confirmed. We are carefully preparing your Mithila artwork for dispatch.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <tr><td style="font-size:12px;color:#8C7060;text-transform:uppercase;">Order Reference</td><td style="font-size:14px;color:#8C2711;font-weight:700;text-align:right;">${data.orderRef}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Order Date</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.orderDate}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Est. Delivery</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.estimatedDelivery}</td></tr>
    </table>
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#8C7060;margin:0 0 12px;">Your Items</h3>
    <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr><td style="font-size:13px;color:#5C4A3A;padding:4px 0;">Subtotal</td><td style="font-size:13px;color:#5C4A3A;text-align:right;padding:4px 0;">&#8377;${data.subtotalINR.toLocaleString('en-IN')}</td></tr>
      <tr><td style="font-size:13px;color:#5C4A3A;padding:4px 0;">Shipping</td><td style="font-size:13px;color:#5C4A3A;text-align:right;padding:4px 0;">${data.shippingINR === 0 ? 'Free' : '&#8377;' + data.shippingINR.toLocaleString('en-IN')}</td></tr>
      <tr><td style="font-size:16px;font-weight:700;color:#241A14;padding:10px 0 0;border-top:1px solid #E2D4BF;">Total Paid</td><td style="font-size:16px;font-weight:700;color:#8C2711;text-align:right;padding:10px 0 0;border-top:1px solid #E2D4BF;">&#8377;${data.totalINR.toLocaleString('en-IN')}</td></tr>
    </table>
    ${divider}
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#8C7060;margin:0 0 8px;">Shipping To</h3>
    <p style="margin:0;font-size:13px;color:#241A14;line-height:1.7;">${data.customerName}<br/>${addrLine}</p>
    ${divider}
    <p style="margin:0;font-size:13px;color:#5C4A3A;line-height:1.7;">Questions? Write to <a href="mailto:shreekrit06@gmail.com" style="color:#8C2711;">shreekrit06@gmail.com</a></p>
  `;

  return sendEmail(
    data.customerEmail,
    `Order Confirmed: ${data.orderRef} — Shreekrit`,
    layout(body, `Your order ${data.orderRef} is confirmed! Est. delivery: ${data.estimatedDelivery}`)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ORDER ALERT — sent to store
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOrderAlertToStore(data: OrderEmailData) {
  const itemList = data.items.map(i =>
    `<li style="padding:4px 0;">${i.paintingTitle} (${i.editionType}, ${i.frame}) — &#8377;${(i.unitPriceINR + i.framePriceINR).toLocaleString('en-IN')}</li>`
  ).join('');

  const addr = data.shippingAddress;
  const addrLine = [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ');

  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">New Order Received!</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <tr><td style="font-size:12px;color:#8C7060;text-transform:uppercase;">Order Ref</td><td style="font-size:15px;color:#8C2711;font-weight:700;text-align:right;">${data.orderRef}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Total</td><td style="font-size:15px;color:#241A14;font-weight:700;text-align:right;padding-top:8px;">&#8377;${data.totalINR.toLocaleString('en-IN')}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Customer</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.customerName} — ${data.customerEmail}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Ship to</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${addrLine}</td></tr>
    </table>
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#8C7060;margin:0 0 8px;">Items</h3>
    <ul style="margin:0;padding-left:20px;font-size:13px;color:#241A14;line-height:2;">${itemList}</ul>
  `;

  return sendEmail(
    STORE_EMAIL,
    `[New Order] ${data.orderRef} — &#8377;${data.totalINR.toLocaleString('en-IN')} from ${data.customerName}`,
    layout(body, `New order from ${data.customerName}`)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMISSION REQUEST
// ─────────────────────────────────────────────────────────────────────────────
export interface CommissionEmailData {
  customerName: string;
  customerEmail: string;
  subject: string;
  description: string;
  budget?: string;
  timeline?: string;
}

export async function sendCommissionConfirmationToCustomer(data: CommissionEmailData) {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">Commission Request Received!</h2>
    <p style="margin:0 0 24px;color:#5C4A3A;font-size:14px;line-height:1.7;">Dear ${data.customerName}, thank you! Our artisans will review your request within <strong>2-3 business days</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <tr><td style="font-size:12px;color:#8C7060;text-transform:uppercase;">Subject</td><td style="font-size:13px;color:#241A14;text-align:right;">${data.subject}</td></tr>
      ${data.budget ? `<tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Budget</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.budget}</td></tr>` : ''}
      ${data.timeline ? `<tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Timeline</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.timeline}</td></tr>` : ''}
    </table>
    ${divider}
    <p style="margin:0;font-size:13px;color:#5C4A3A;">Questions? Write to <a href="mailto:shreekrit06@gmail.com" style="color:#8C2711;">shreekrit06@gmail.com</a></p>
  `;
  return sendEmail(data.customerEmail, `Commission Request Received — Shreekrit`, layout(body));
}

export async function sendCommissionAlertToStore(data: CommissionEmailData) {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">New Commission Request</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <tr><td style="font-size:12px;color:#8C7060;text-transform:uppercase;">From</td><td style="font-size:13px;color:#241A14;text-align:right;">${data.customerName} (${data.customerEmail})</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Subject</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.subject}</td></tr>
      ${data.budget ? `<tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Budget</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.budget}</td></tr>` : ''}
      ${data.timeline ? `<tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Timeline</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.timeline}</td></tr>` : ''}
    </table>
    <p style="margin:0;font-size:13px;color:#241A14;background:#FAF5EA;padding:14px;border-radius:6px;border-left:3px solid #8C2711;">${data.description}</p>
  `;
  return sendEmail(STORE_EMAIL, `[Commission] ${data.subject} — from ${data.customerName}`, layout(body));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ARTIST APPLICATION
// ─────────────────────────────────────────────────────────────────────────────
export interface ArtistApplicationEmailData {
  artistName: string;
  artistEmail: string;
  village: string;
  district: string;
  state: string;
  phone: string;
  primaryStyle: string;
  yearsOfExperience: number;
  bio: string;
}

export async function sendArtistApplicationConfirmation(data: ArtistApplicationEmailData) {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">Application Received — Welcome, ${data.artistName}!</h2>
    <p style="margin:0 0 24px;color:#5C4A3A;font-size:14px;line-height:1.7;">Thank you for applying to Shreekrit. We will review your application within <strong>5-7 business days</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;border-radius:8px;padding:16px 20px;">
      <tr><td style="font-size:12px;color:#8C7060;text-transform:uppercase;">Style</td><td style="font-size:13px;color:#241A14;text-align:right;">${data.primaryStyle}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Experience</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.yearsOfExperience} years</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Location</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.village}, ${data.district}, ${data.state}</td></tr>
    </table>
  `;
  return sendEmail(data.artistEmail, `Artist Application Received — Shreekrit`, layout(body));
}

export async function sendArtistApplicationAlertToStore(data: ArtistApplicationEmailData) {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">New Artist Application</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <tr><td style="font-size:12px;color:#8C7060;text-transform:uppercase;">Name</td><td style="font-size:13px;color:#241A14;font-weight:600;text-align:right;">${data.artistName}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Email</td><td style="font-size:13px;color:#8C2711;text-align:right;padding-top:8px;">${data.artistEmail}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Phone</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.phone}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Style</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.primaryStyle}</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Experience</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.yearsOfExperience} yrs</td></tr>
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Location</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.village}, ${data.district}, ${data.state}</td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#241A14;background:#FAF5EA;padding:14px;border-radius:6px;border-left:3px solid #8C2711;">${data.bio}</p>
  `;
  return sendEmail(STORE_EMAIL, `[Artist Application] ${data.artistName} — ${data.primaryStyle}`, layout(body));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NEWSLETTER WELCOME
// ─────────────────────────────────────────────────────────────────────────────
export async function sendNewsletterWelcome(subscriberEmail: string) {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">Welcome to the Shreekrit Gazette!</h2>
    <p style="margin:0 0 24px;color:#5C4A3A;font-size:14px;line-height:1.7;">You are now part of a community that celebrates authentic Mithila folk art. Expect curated updates on new artworks, artist stories, and cultural insights.</p>
    ${divider}
    <p style="margin:0;font-size:12px;color:#8C7060;">To unsubscribe, reply "Unsubscribe" to <a href="mailto:shreekrit06@gmail.com" style="color:#8C2711;">shreekrit06@gmail.com</a></p>
  `;
  return sendEmail(subscriberEmail, `Welcome to the Shreekrit Gazette!`, layout(body));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ORDER SHIPPED — to customer
// ─────────────────────────────────────────────────────────────────────────────
export interface ShippingEmailData {
  customerName: string;
  customerEmail: string;
  orderRef: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery: string;
}

export async function sendOrderShipped(data: ShippingEmailData) {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">Your artwork is on its way!</h2>
    <p style="margin:0 0 24px;color:#5C4A3A;font-size:14px;line-height:1.7;">Dear ${data.customerName}, your Shreekrit order has been dispatched!</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;border-radius:8px;padding:16px 20px;">
      <tr><td style="font-size:12px;color:#8C7060;text-transform:uppercase;">Order Ref</td><td style="font-size:14px;color:#8C2711;font-weight:700;text-align:right;">${data.orderRef}</td></tr>
      ${data.carrier ? `<tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Carrier</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.carrier}</td></tr>` : ''}
      ${data.trackingNumber ? `<tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Tracking</td><td style="font-size:13px;color:#8C2711;font-weight:600;text-align:right;padding-top:8px;">${data.trackingNumber}</td></tr>` : ''}
      <tr><td style="font-size:12px;color:#8C7060;padding-top:8px;">Est. Delivery</td><td style="font-size:13px;color:#241A14;text-align:right;padding-top:8px;">${data.estimatedDelivery}</td></tr>
    </table>
  `;
  return sendEmail(data.customerEmail, `Your Shreekrit order ${data.orderRef} is on its way!`, layout(body));
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. VERIFICATION EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export async function sendVerificationEmail(email: string, link: string) {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#241A14;">Confirm your collector account</h2>
    <p style="margin:0 0 24px;color:#5C4A3A;font-size:14px;line-height:1.7;">Thank you for applying to be a verified collector. Please confirm your email address to log in.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#8C2711;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;letter-spacing:1px;text-transform:uppercase;">Confirm Email Address</a>
      </td></tr>
    </table>
    ${divider}
    <p style="margin:0;font-size:12px;color:#8C7060;">If you did not request this, you can safely ignore this email.</p>
  `;
  return sendEmail(email, `Confirm your Shreekrit Account`, layout(body, 'Confirm your email to access your collector account'));
}
