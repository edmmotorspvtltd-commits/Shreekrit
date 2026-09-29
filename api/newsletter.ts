import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendNewsletterWelcome } from './_lib/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = req.body?.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    await sendNewsletterWelcome(email);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Newsletter send failed:', err);
    return res.status(500).json({ error: 'Failed to send welcome email' });
  }
}
