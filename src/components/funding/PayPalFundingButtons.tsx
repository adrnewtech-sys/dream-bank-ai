import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

const PAYPAL_CLIENT_ID = 'sb';
const PAYPAL_SCRIPT_ID = 'paypal-js-sdk';

interface PayPalOrderActions {
  order: {
    create: (order: {
      purchase_units: Array<{ description: string; amount: { value: string; currency_code: string } }>;
    }) => Promise<string>;
    capture: () => Promise<unknown>;
  };
}

interface PayPalButtonsInstance {
  render: (container: HTMLElement) => Promise<void>;
  close?: () => Promise<void> | void;
}

interface PayPalNamespace {
  Buttons: (options: {
    style?: Record<string, string | number>;
    createOrder: (data: unknown, actions: PayPalOrderActions) => Promise<string>;
    onApprove: (data: { orderID: string }, actions: PayPalOrderActions) => Promise<void>;
    onError: (error: unknown) => void;
  }) => PayPalButtonsInstance;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

const PAYPAL_LOAD_TIMEOUT_MS = 15000;

function loadPayPalSdk(): Promise<PayPalNamespace> {
  if (window.paypal) return Promise.resolve(window.paypal);

  document.getElementById(PAYPAL_SCRIPT_ID)?.remove();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = PAYPAL_SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    script.async = true;

    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error('PayPal took too long to load. Check for an ad blocker or privacy extension, then try again.'));
    }, PAYPAL_LOAD_TIMEOUT_MS);

    script.addEventListener('load', () => {
      window.clearTimeout(timeout);
      if (window.paypal) resolve(window.paypal);
      else reject(new Error('PayPal did not finish loading. Please try again.'));
    });
    script.addEventListener('error', () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('PayPal could not be reached. Check your connection and try again.'));
    });
    document.head.appendChild(script);
  });
}

interface PayPalFundingButtonsProps {
  amount: number;
  description: string;
  onApproved: (amount: number, orderId: string) => Promise<void>;
}

export function PayPalFundingButtons({ amount, description, onApproved }: PayPalFundingButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef(amount);
  const onApprovedRef = useRef(onApproved);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    amountRef.current = amount;
    onApprovedRef.current = onApproved;
  }, [amount, onApproved]);

  useEffect(() => {
    let cancelled = false;
    let button: PayPalButtonsInstance | null = null;
    const container = containerRef.current;

    loadPayPalSdk()
      .then((paypal) => {
        if (cancelled || !container) return;
        button = paypal.Buttons({
          style: { layout: 'horizontal', color: 'blue', shape: 'pill', label: 'pay', height: 45 },
          createOrder: (_data, actions) => {
            const value = amountRef.current;
            if (!(value > 0)) throw new Error('Enter an amount above zero first.');
            return actions.order.create({
              purchase_units: [{ description, amount: { value: value.toFixed(2), currency_code: 'USD' } }],
            });
          },
          onApprove: async (data, actions) => {
            setMessage(null);
            try {
              await actions.order.capture();
              await onApprovedRef.current(amountRef.current, data.orderID);
            } catch (err) {
              setMessage(err instanceof Error ? err.message : 'We could not record your PayPal payment.');
            }
          },
          onError: () => setMessage('PayPal ran into a problem. No money was taken. Please try again.'),
        });
        return button.render(container).then(() => {
          if (!cancelled) setStatus('ready');
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'PayPal is unavailable right now.');
      });

    return () => {
      cancelled = true;
      if (button?.close) void button.close();
      if (container) container.innerHTML = '';
    };
  }, [description]);

  return (
    <div className="space-y-3">
      <div
        className={`transition ${amount > 0 && status === 'ready' ? 'opacity-100' : 'pointer-events-none opacity-40'}`}
        aria-disabled={!(amount > 0)}
      >
        <div ref={containerRef} className="min-h-[45px]" />
        {status === 'loading' && <p className="text-sm text-slate-500">Loading PayPal...</p>}
      </div>
      {amount <= 0 && status !== 'error' && (
        <p className="text-xs text-slate-500">Enter an amount above zero to enable PayPal.</p>
      )}
      {message && (
        <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}
