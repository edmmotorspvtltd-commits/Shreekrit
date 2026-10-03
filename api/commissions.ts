export const config = { runtime: 'edge' };
import { sendCommissionConfirmationToCustomer, sendCommissionAlertToStore } from './_lib/email';
import { text, optionalText, email as validEmail, badRequest, MAX } from './_lib/validate';

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

  const raw = (body && typeof body === 'object' ? body : {}) as Partial<Record<keyof RequestBody, unknown>>;
  const customerName = text(raw.customerName, { max: MAX.name });
  const customerEmail = validEmail(raw.customerEmail);
  const subject = text(raw.subject, { max: MAX.subject });
  const description = text(raw.description, { max: MAX.longText, multiline: true });
  const budget = optionalText(raw.budget, { max: MAX.shortNote });
  const timeline = optionalText(raw.timeline, { max: MAX.shortNote });

  if (!customerName || !customerEmail || !subject || !description) {
    return badRequest('Please check the required fields: name, a valid email, subject and description.');
  }
  if (budget === null || timeline === null) {
    return badRequest('Budget and timeline must be 100 characters or fewer.');
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
