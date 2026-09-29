import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendCommissionConfirmationToCustomer, sendCommissionAlertToStore } from './_lib/email';

interface RequestBody {
  customerName: string;
  customerEmail: string;
  subject: string;
  description: string;
  budget?: string;
  timeline?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, customerEmail, subject, description, budget, timeline } = req.body || {};

  if (!customerName || !customerEmail || !subject || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await Promise.allSettled([
      sendCommissionConfirmationToCustomer({ customerName, customerEmail, subject, description, budget, timeline }),
      sendCommissionAlertToStore({ customerName, customerEmail, subject, description, budget, timeline }),
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('POST /api/commissions failed:', err);
    return res.status(500).json({ error: 'Failed to send commission emails' });
  }
}
