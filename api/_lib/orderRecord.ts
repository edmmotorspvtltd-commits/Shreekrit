// Maps a row from the Neon `orders` table (plus its `order_items` rows) to the
// OrderRecord shape the UI expects (see OrderRecord in src/types.ts).
// api/orders/list.ts builds the same shape inline.
export function toOrderRecord(order: any, items: any[]) {
  const status = order.status === 'pending' ? 'pending_payment' : order.status === 'failed' ? 'cancelled' : order.status;
  return {
    id: String(order.id),
    order_number: order.order_ref,
    user_id: null,
    guest_email: order.email,
    status,
    // Amounts are stored in INR only, so display them as INR.
    currency: 'INR',
    total_amount_inr: Number(order.total_inr),
    total_amount_display: Number(order.total_inr),
    shipping_address: {
      fullName: order.full_name,
      email: order.email,
      phone: order.phone,
      addressLine1: order.address_line1,
      addressLine2: order.address_line2 ?? undefined,
      city: order.city,
      state: order.state,
      postalCode: order.postal_code,
      country: order.country
    },
    payment_method: 'razorpay',
    tracking_number: null,
    tracking_carrier: null,
    estimated_delivery_date: null,
    created_at: order.created_at,
    updated_at: order.paid_at ?? order.created_at,
    order_items: items
      .filter((item: any) => item.order_id === order.id)
      .map((item: any) => ({ ...item, id: String(item.id), order_id: String(item.order_id) }))
  };
}
