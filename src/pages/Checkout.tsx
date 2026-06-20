import { useMemo, useState } from "react";
import type { CartState } from "@/lib/cart";
import { cartSubtotal, computeDiscount } from "@/lib/cart";
import type { PayHereSettings, SiteSettings } from "@/lib/types";
import type { UserProfile } from "@/lib/firebase";
import { Button, Card, Container, Divider, Input, Textarea } from "@/components/ui";
import { createOrder } from "@/lib/api";
import toast from "react-hot-toast";
import { submitPayHerePayment } from "@/lib/payhere";

function lkWhatsAppNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  // assume already local without 0
  return `94${digits}`;
}

export function CheckoutPage(props: {
  cart: CartState;
  clearCart: () => void;
  settings: SiteSettings;
  payhere: PayHereSettings;
  profile: UserProfile | null;
}) {
  const subtotal = cartSubtotal(props.cart);
  const discount = computeDiscount(props.cart);
  const delivery = props.settings.deliveryCharge ?? 500;
  const total = Math.max(0, subtotal - discount) + delivery;

  const [name, setName] = useState(props.profile?.name ?? "");
  const [email, setEmail] = useState(props.profile?.email ?? "");
  const [phone, setPhone] = useState(props.profile?.phone ?? "");
  const [address, setAddress] = useState(props.profile?.address ?? "");
  const [city, setCity] = useState("Galle");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<
    "Card" | "Cash on Delivery" | "Bank Transfer" | "PayHere"
  >("Cash on Delivery");

  const itemsLabel = useMemo(() => {
    if (!props.cart.items.length) return "SR MOBILE Order";
    return props.cart.items.length === 1 ? props.cart.items[0].name : `SR MOBILE Order (${props.cart.items.length} items)`;
  }, [props.cart.items]);

  async function placeOrder() {
    if (!props.cart.items.length) {
      toast.error("Cart is empty");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const orderPayload = {
        userId: props.profile?.email ?? email,
        userName: name,
        email,
        phone,
        items: props.cart.items.map((x) => ({ productId: x.productId, name: x.name, price: x.price, qty: x.qty })),
        total,
        deliveryCharge: delivery,
        status: "pending" as const,
        trackingNumber: "",
        shippingAddress: address,
        city,
        zip,
        paymentMethod,
        notes,
      };

      const orderId = await createOrder(orderPayload);

      // WhatsApp confirmation
      const waPhone = lkWhatsAppNumber(phone);
      const text = encodeURIComponent(
        `Your order has been accepted. Order number: ${orderId}. Stay tuned for more updates.`
      );
      if (waPhone) window.open(`https://wa.me/${waPhone}?text=${text}`, "_blank");

      // Simulated email notifications (optional EmailJS hook in comments)
      console.log("[EMAIL to Admin] New order", { orderId, ...orderPayload });
      console.log("[EMAIL to Customer] Order accepted", { orderId, email });
      toast.success(`Order placed: ${orderId}`);

      /*
      // OPTIONAL: EmailJS integration (client-side)
      // 1) npm i @emailjs/browser
      // 2) import emailjs from '@emailjs/browser'
      // 3) emailjs.send(SERVICE_ID, TEMPLATE_ID, { orderId, ... }, PUBLIC_KEY)
      */

      // If PayHere selected, launch payment after creating order
      if (paymentMethod === "PayHere") {
        if (!props.payhere.enabled) {
          toast.error("PayHere is not enabled (ask admin to configure)");
        } else {
          submitPayHerePayment({
            settings: props.payhere,
            orderId,
            itemsLabel,
            amount: total,
            firstName: name.split(" ")[0] ?? name,
            lastName: name.split(" ").slice(1).join(" ") || "-",
            email,
            phone,
            address,
            city,
          });
          toast("PayHere payment opened in a new tab.");
        }
      }

      props.clearCart();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to place order");
    }
  }

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">Home / Checkout</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="p-4 sm:p-6">
            <div className="text-sm font-semibold text-white">Delivery Details</div>
            <Divider className="my-3" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold text-white/70">Name *</div>
                <Input value={name} onChange={setName} placeholder="Your name" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white/70">Email *</div>
                <Input value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white/70">Phone *</div>
                <Input value={phone} onChange={setPhone} placeholder="0726306039" />
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold text-white/70">Address *</div>
                <Input value={address} onChange={setAddress} placeholder="Street / Area" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white/70">City *</div>
                <Input value={city} onChange={setCity} placeholder="Galle" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white/70">ZIP</div>
                <Input value={zip} onChange={setZip} placeholder="" />
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold text-white/70">Notes</div>
                <Textarea value={notes} onChange={setNotes} placeholder="Any instructions..." rows={3} />
              </div>
            </div>

            <Divider className="my-4" />

            <div className="text-sm font-semibold text-white">Payment Method</div>
            <div className="mt-2 grid gap-2">
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === "Cash on Delivery"}
                  onChange={() => setPaymentMethod("Cash on Delivery")}
                />
                <span className="text-sm font-semibold text-white">Cash on Delivery</span>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <input type="radio" name="pm" checked={paymentMethod === "Card"} onChange={() => setPaymentMethod("Card")} />
                <span className="text-sm font-semibold text-white">Card</span>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === "Bank Transfer"}
                  onChange={() => setPaymentMethod("Bank Transfer")}
                />
                <span className="text-sm font-semibold text-white">Bank Transfer</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <input type="radio" name="pm" checked={paymentMethod === "PayHere"} onChange={() => setPaymentMethod("PayHere")} />
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                  {/* PayHere icon (simple) */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 8.5C4 6.567 5.567 5 7.5 5H16.5C18.433 5 20 6.567 20 8.5V15.5C20 17.433 18.433 19 16.5 19H7.5C5.567 19 4 17.433 4 15.5V8.5Z" stroke="#00b4d8" strokeWidth="1.8" />
                    <path d="M7 10H17" stroke="#ff6b00" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M7 14H12" stroke="white" strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">PayHere</div>
                  <div className="text-xs text-white/50">Pay securely via PayHere gateway (opens new tab)</div>
                </div>
              </label>

              {paymentMethod === "PayHere" && !props.payhere.enabled ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  PayHere is not configured yet. Admin can enable it from Admin → PayHere Setup.
                </div>
              ) : null}
            </div>

            <Button onClick={placeOrder} className="mt-5 w-full">
              Confirm & Place Order
            </Button>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-semibold text-white">Order Summary</div>
            <Divider className="my-3" />

            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>- Rs. {discount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery (live)</span>
                <span>Rs. {delivery.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-white">
                <span className="font-semibold">Total</span>
                <span className="font-[Poppins] font-extrabold">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <Divider className="my-3" />

            <div className="space-y-2">
              {props.cart.items.map((x) => (
                <div key={x.productId} className="flex items-center justify-between text-xs text-white/60">
                  <span className="max-w-[220px] truncate">
                    {x.qty} × {x.name}
                  </span>
                  <span>Rs. {(x.qty * x.price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
