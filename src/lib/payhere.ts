import md5 from "crypto-js/md5";
import type { PayHereSettings } from "./types";

export const PAYHERE_CURRENCY = "LKR";

export function formatAmount(amount: number) {
  // PayHere requires 2 decimals, no thousand separators.
  return amount
    .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/,/g, "");
}

export function generatePayHereHash(params: {
  merchantId: string;
  merchantSecret: string;
  orderId: string;
  amount: number;
  currency?: string;
}) {
  const currency = params.currency ?? PAYHERE_CURRENCY;
  const hashedSecret = md5(params.merchantSecret).toString().toUpperCase();
  const amountFormatted = formatAmount(params.amount);
  const hash = md5(params.merchantId + params.orderId + amountFormatted + currency + hashedSecret)
    .toString()
    .toUpperCase();
  return hash;
}

export function payhereCheckoutUrl(sandbox: boolean) {
  return sandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";
}

export function submitPayHerePayment(args: {
  settings: PayHereSettings;
  orderId: string;
  itemsLabel: string;
  amount: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country?: string;
}) {
  const { settings } = args;
  if (!settings.enabled) throw new Error("PayHere is not enabled");
  if (!settings.merchantId || !settings.merchantSecret) throw new Error("PayHere merchant details not configured");

  // SECURITY NOTE:
  // PayHere recommends generating this hash on a backend to avoid exposing merchant_secret.
  // This project follows the client request for a single-file/static setup, so it is generated client-side.
  const hash = generatePayHereHash({
    merchantId: settings.merchantId,
    merchantSecret: settings.merchantSecret,
    orderId: args.orderId,
    amount: args.amount,
    currency: PAYHERE_CURRENCY,
  });

  const form = document.createElement("form");
  form.method = "POST";
  form.action = payhereCheckoutUrl(settings.sandbox);
  form.target = "_self";

  const fields: Record<string, string> = {
    merchant_id: settings.merchantId,
    return_url: settings.returnUrl,
    cancel_url: settings.cancelUrl,
    notify_url: settings.notifyUrl,
    order_id: args.orderId,
    items: args.itemsLabel,
    currency: PAYHERE_CURRENCY,
    amount: formatAmount(args.amount),
    first_name: args.firstName,
    last_name: args.lastName,
    email: args.email,
    phone: args.phone,
    address: args.address,
    city: args.city,
    country: args.country ?? "Sri Lanka",
    hash,
  };

  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
}
