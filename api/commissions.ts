export const config = { runtime: 'edge' };
import { sendCommissionConfirmationToCustomer, sendCommissionAlertToStore } from './_lib/email';

interface RequestBody {
  customerName: string;
  customerEmail: string;
  subject: string;
  description: string;
  budget?: string;
  timeline?: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { customerName, customerEmail, subject, description, budget, timeline } = body || {};

  if (!customerName || !customerEmail || !subject || !description) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  try {
    await Promise.allSettled([
      sendCommissionConfirmationToCustomer({ customerName, customerEmail, subject, description, budget, timeline }),
      sendCommissionAlertToStore({ customerName, customerEmail, subject, description, budget, timeline }),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('POST /api/commissions failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to send commission emails' }), { status: 500 });
  }
}
