export const config = { runtime: 'edge' };
import { sql } from '../_lib/db';
import { toOrderRecord } from '../_lib/orderRecord';
import { text, email as validEmail } from '../_lib/validate';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' }
  });

// Guest order lookup: an order is only returned when BOTH the order reference
// and the email it was placed with match. Every non-match, including a valid
// reference with the wrong email, gets the same generic 404, so the endpoint
// cannot be used to discover which order references exist.
const ORDER_REF_RE = /^[A-Z0-9][A-Z0-9-]{2,39}$/;
const NOT_FOUND = 'No order found with that order number and email. Double-check both and try again.';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const params = new URL(req.url).searchParams;
  const rawRef = text(params.get('order_ref'), { max: 40, min: 3 });
  const ref = rawRef ? rawRef.toUpperCase() : null;
  const email = validEmail(params.get('email'));
  if (!ref || !ORDER_REF_RE.test(ref) || !email) {
    return json({ error: 'Enter your order number and the email you used at checkout.' }, 400);
  }

  try {
    const db = sql();
    const orders = await db`
      SELECT * FROM orders
      WHERE order_ref = ${ref} AND lower(email) = ${email.toLowerCase()}
    `;
    if (orders.length === 0) {
      return json({ error: NOT_FOUND }, 404);
    }

    const items = await db`SELECT * FROM order_items WHERE order_id = ${orders[0].id}`;
    return json({ order: toOrderRecord(orders[0], items) });
  } catch (err) {
    console.error('GET /api/orders/track failed:', err);
    return json({ error: 'Failed to look up your order' }, 500);
  }
}
