import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import type { CartState } from "@/lib/cart";
import { cartSubtotal, computeDiscount } from "@/lib/cart";
import type { PayHereSettings, SiteSettings } from "@/lib/types";
import type { UserProfile } from "@/lib/firebase";
import { Button, Card, Container, Divider, Input, Textarea } from "@/components/ui";
import { createOrder } from "@/lib/api";
import toast from "react-hot-toast";
import { submitPayHerePayment } from "@/lib/payhere";

/** Normalise any LK phone number to international 94x format for wa.me */
function toWaPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

type Placed = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paymentMethod: string;
  items: { name: string; qty: number; price: number }[];
};

export function CheckoutPage(props: {
  cart: CartState;
  clearCart: () => void;
  settings: SiteSettings;
  payhere: PayHereSettings;
  profile: UserProfile | null;
  view?: string;
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
  const [submitting, setSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<
    "Card" | "Cash on Delivery" | "Bank Transfer" | "PayHere"
  >("Cash on Delivery");

  // Holds the confirmed order info for the success screen
  const [placed, setPlaced] = useState<Placed | null>(null);

  // Reset the success screen state when navigating to checkout with items in the cart
  useEffect(() => {
    if (props.view === "checkout" && props.cart.items.length > 0) {
      setPlaced(null);
    }
  }, [props.view, props.cart.items.length]);

  const itemsLabel = useMemo(() => {
    if (!props.cart.items.length) return "SR MOBILE Order";
    return props.cart.items.length === 1
      ? props.cart.items[0].name
      : `SR MOBILE Order (${props.cart.items.length} items)`;
  }, [props.cart.items]);

  async function placeOrder() {
    if (!props.cart.items.length) {
      toast.error("Cart is empty");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        userId: (props.profile?.email ?? email).toLowerCase(),
        userName: name,
        email: email.toLowerCase(),
        phone,
        items: props.cart.items.map((x) => ({
          productId: x.productId,
          name: x.name,
          price: x.price,
          qty: x.qty,
        })),
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

      // Log for any future EmailJS / webhook integration
      console.log("[ORDER PLACED]", { orderId, ...orderPayload });

      // If PayHere selected, launch payment in a new tab
      if (paymentMethod === "PayHere") {
        if (!props.payhere.enabled) {
          toast.error("PayHere is not configured yet. Admin can enable it from Admin → PayHere Setup.");
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
          toast("PayHere payment window opened.");
        }
      }

      // Save placed info for success screen — don't touch WhatsApp here
      setPlaced({
        orderId,
        customerName: name,
        customerPhone: phone,
        total,
        paymentMethod,
        items: props.cart.items.map((x) => ({ name: x.name, qty: x.qty, price: x.price })),
      });

      props.clearCart();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (placed) {
    const adminPhone = toWaPhone(props.settings.phone || "0726306039");
    const waText = encodeURIComponent(
      `Hi SR MOBILE! I just placed an order.\n\n` +
        `Order ID: ${placed.orderId}\n` +
        `Name: ${placed.customerName}\n` +
        `Total: Rs. ${placed.total.toLocaleString()}\n` +
        `Payment: ${placed.paymentMethod}\n\n` +
        `Items:\n` +
        placed.items.map((i) => `• ${i.qty}× ${i.name} — Rs. ${(i.qty * i.price).toLocaleString()}`).join("\n") +
        `\n\nPlease confirm my order. Thank you!`
    );

    return (
      <div>
        <Container>
          <div className="mt-6 text-xs text-white/50">Home / Order Confirmation</div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-6 max-w-lg mx-auto"
          >
            <Card className="p-6 sm:p-8 text-center">
              {/* Success icon */}
              <div className="flex justify-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
              </div>

              <div className="mt-5 font-[Poppins] text-2xl font-bold text-white">Order Placed!</div>
              <p className="mt-2 text-sm text-white/60">
                Thank you, <span className="text-white font-semibold">{placed.customerName}</span>. Your order has
                been received and is pending confirmation.
              </p>

              {/* Order ID */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-xs text-white/50">Order ID</div>
                <div className="mt-1 font-mono text-base font-bold text-[#00b4d8]">{placed.orderId}</div>
              </div>

              <Divider className="my-5" />

              {/* Order summary */}
              <div className="space-y-2 text-sm text-left">
                {placed.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-white/70">
                    <span className="max-w-[220px] truncate">
                      {item.qty}× {item.name}
                    </span>
                    <span>Rs. {(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-white font-semibold">
                  <span>Total</span>
                  <span className="font-[Poppins]">Rs. {placed.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Payment</span>
                  <span>{placed.paymentMethod}</span>
                </div>
              </div>

              <Divider className="my-5" />

              {/* WhatsApp CTA → Admin's number */}
              <p className="text-sm text-white/60 mb-4">
                Tap below to send your order details to SR MOBILE on WhatsApp for a quick confirmation.
              </p>
              <Button
                className="w-full gap-2 bg-[#25D366] hover:brightness-110 text-pure-white"
                onClick={() => window.open(`https://wa.me/${adminPhone}?text=${waText}`, "_blank")}
              >
                <MessageCircle className="h-5 w-5" />
                Contact SR MOBILE on WhatsApp
              </Button>

              <p className="mt-3 text-xs text-white/40">
                You will receive a shipping update once your order is confirmed.
              </p>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  // ── Checkout form ───────────────────────────────────────────────────────────
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
                <Textarea value={notes} onChange={setNotes} placeholder="Any special instructions..." rows={3} />
              </div>
            </div>

            <Divider className="my-4" />

            <div className="text-sm font-semibold text-white">Payment Method</div>
            <div className="mt-2 grid gap-2">
              {/* Cash on Delivery */}
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === "Cash on Delivery"}
                  onChange={() => setPaymentMethod("Cash on Delivery")}
                />
                <div>
                  <div className="text-sm font-semibold text-white">Cash on Delivery</div>
                  <div className="text-xs text-white/50">Pay when you receive your order</div>
                </div>
              </label>

              {/* Bank Transfer */}
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === "Bank Transfer"}
                  onChange={() => setPaymentMethod("Bank Transfer")}
                />
                <div>
                  <div className="text-sm font-semibold text-white">Bank Transfer</div>
                  <div className="text-xs text-white/50">Transfer to our bank account before shipping</div>
                </div>
              </label>

              {/* Card */}
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === "Card"}
                  onChange={() => setPaymentMethod("Card")}
                />
                <div>
                  <div className="text-sm font-semibold text-white">Card</div>
                  <div className="text-xs text-white/50">Debit / credit card payment</div>
                </div>
              </label>

              {/* PayHere */}
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === "PayHere"}
                  onChange={() => setPaymentMethod("PayHere")}
                />
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 8.5C4 6.567 5.567 5 7.5 5H16.5C18.433 5 20 6.567 20 8.5V15.5C20 17.433 18.433 19 16.5 19H7.5C5.567 19 4 17.433 4 15.5V8.5Z"
                      stroke="#00b4d8"
                      strokeWidth="1.8"
                    />
                    <path d="M7 10H17" stroke="#ff6b00" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M7 14H12" stroke="white" strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">PayHere</div>
                  <div className="text-xs text-white/50">Secure online gateway (opens in new tab)</div>
                </div>
              </label>

              {paymentMethod === "PayHere" && !props.payhere.enabled ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  PayHere is not configured yet. Admin can enable it from Admin → PayHere Setup.
                </div>
              ) : null}
            </div>

            <Button onClick={placeOrder} disabled={submitting} className="mt-5 w-full">
              <ShoppingBag className="h-4 w-4" />
              {submitting ? "Placing order…" : "Confirm & Place Order"}
            </Button>
          </Card>

          {/* Order Summary */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-white">Order Summary</div>
            <Divider className="my-3" />

            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>− Rs. {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span>Rs. {delivery.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-white">
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
