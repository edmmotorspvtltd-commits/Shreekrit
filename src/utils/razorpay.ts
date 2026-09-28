declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface OpenRazorpayCheckoutArgs {
  keyId: string;
  amountPaise: number;
  razorpayOrderId: string;
  prefill: { name: string; email: string; contact: string };
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onFailure: (description: string) => void;
  onDismiss: () => void;
}

let scriptLoadPromise: Promise<boolean> | null = null;

const loadRazorpayScript = (): Promise<boolean> => {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
};

export const openRazorpayCheckout = async ({
  keyId,
  amountPaise,
  razorpayOrderId,
  prefill,
  onSuccess,
  onFailure,
  onDismiss
}: OpenRazorpayCheckoutArgs): Promise<void> => {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    onFailure('Could not load the Razorpay checkout. Check your connection and try again.');
    return;
  }

  const rzp = new window.Razorpay({
    key: keyId,
    amount: amountPaise,
    currency: 'INR',
    name: 'Shreekrit',
    description: 'Mithila Folk Art Acquisition',
    order_id: razorpayOrderId,
    prefill,
    theme: { color: '#8C2711' },
    handler: (response: RazorpaySuccessResponse) => {
      void onSuccess(response);
    },
    modal: {
      ondismiss: onDismiss
    }
  });

  rzp.open();
};
