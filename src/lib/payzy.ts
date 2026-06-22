import CryptoJS from "crypto-js";
import type { PayzySettings } from "./types";

export function generatePayzySignature(data: any, key: string) {
  const list = 'x_test_mode=' +
    data.x_test_mode +
    ',x_shopid=' +
    data.x_shopid +
    ',x_amount=' +
    data.x_amount +
    ',x_order_id=' +
    data.x_order_id +
    ',x_response_url=' +
    data.x_response_url +
    ',x_first_name=' +
    data.x_first_name +
    ',x_last_name=' +
    data.x_last_name +
    ',x_company=' +
    data.x_company +
    ',x_address=' +
    data.x_address +
    ',x_country=' +
    data.x_country +
    ',x_state=' +
    data.x_state +
    ',x_city=' +
    data.x_city +
    ',x_zip=' +
    data.x_zip +
    ',x_phone=' +
    data.x_phone +
    ',x_email=' +
    data.x_email +
    ',x_ship_to_first_name=' +
    data.x_ship_to_first_name +
    ',x_ship_to_last_name=' +
    data.x_ship_to_last_name +
    ',x_ship_to_company=' +
    data.x_ship_to_company +
    ',x_ship_to_address=' +
    data.x_ship_to_address +
    ',x_ship_to_country=' +
    data.x_ship_to_country +
    ',x_ship_to_state=' +
    data.x_ship_to_state +
    ',x_ship_to_city=' +
    data.x_ship_to_city +
    ',x_ship_to_zip=' +
    data.x_ship_to_zip +
    ',x_freight=' +
    data.x_freight +
    ',x_platform=' +
    data.x_platform +
    `,x_version` + // Maintain exact format without '=' matching the official script.js
    data.x_version +
    ',signed_field_names=' +
    data.signed_field_names +
    "";

  const hash = CryptoJS.HmacSHA256(list, key);
  return CryptoJS.enc.Base64.stringify(hash);
}

export async function submitPayzyPayment(args: {
  settings: PayzySettings;
  orderId: string;
  amount: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
}) {
  const { settings } = args;
  if (!settings.enabled) throw new Error("Payzy is not enabled");
  if (!settings.shopId || !settings.secretKey) throw new Error("Payzy shop details not configured");

  // Determine base API URL
  const baseUrl = settings.sandbox ? "https://api.payzypay.xyz" : "https://api.payzy.lk";
  const checkoutUrl = `${baseUrl}/checkout/custom-checkout`;

  const signedFieldNames = "x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names";

  const payload: Record<string, string> = {
    x_test_mode: settings.sandbox ? "on" : "off",
    x_shopid: settings.shopId,
    x_amount: String(args.amount),
    x_order_id: args.orderId,
    x_response_url: settings.returnUrl || window.location.origin + "/#account",
    x_first_name: args.firstName || "-",
    x_last_name: args.lastName || "-",
    x_company: "",
    x_address: args.address || "-",
    x_country: "Sri Lanka",
    x_state: "",
    x_city: args.city || "-",
    x_zip: args.zip || "12345",
    x_phone: args.phone || "-",
    x_email: args.email || "-",
    x_ship_to_first_name: args.firstName || "-",
    x_ship_to_last_name: args.lastName || "-",
    x_ship_to_company: "",
    x_ship_to_address: args.address || "-",
    x_ship_to_country: "Sri Lanka",
    x_ship_to_state: "",
    x_ship_to_city: args.city || "-",
    x_ship_to_zip: args.zip || "12345",
    x_freight: "0",
    x_platform: "custom",
    x_version: "1.0",
    signed_field_names: signedFieldNames,
    signature: "",
  };

  const signature = generatePayzySignature(payload, settings.secretKey);
  payload.signature = signature;

  console.log("[PAYZY SUBMIT]", payload);
  localStorage.setItem("PayzyOderData", JSON.stringify(payload));

  // Determine endpoint target
  const targetUrl = settings.backendUrl ? settings.backendUrl : checkoutUrl;

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const resData = await res.json();
    console.log("[PAYZY RESPONSE]", resData);

    const redirectUrl = resData?.data?.url || resData?.url;
    if (redirectUrl) {
      window.open(redirectUrl, "_blank");
    } else {
      throw new Error("Invalid response format, redirect URL not found.");
    }
  } catch (error: any) {
    console.error("Payzy checkout failed:", error);
    throw new Error(`Payzy payment failed: ${error.message}`);
  }
}
