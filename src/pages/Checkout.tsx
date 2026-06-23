import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import type { CartState } from "@/lib/cart";
import { cartSubtotal, computeDiscount } from "@/lib/cart";
import type { PayHereSettings, PayzySettings, SiteSettings, Product } from "@/lib/types";
import type { UserProfile } from "@/lib/firebase";
import { Button, Card, Container, Divider, Input, Textarea } from "@/components/ui";
import { createOrder, uploadPaymentSlip } from "@/lib/api";
import toast from "react-hot-toast";
import { submitPayHerePayment } from "@/lib/payhere";
import { submitPayzyPayment } from "@/lib/payzy";

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
  bankTransferSlip?: string;
};

export function CheckoutPage(props: {
  cart: CartState;
  clearCart: () => void;
  settings: SiteSettings;
  payhere: PayHereSettings;
  payzy: PayzySettings;
  profile: UserProfile | null;
  view?: string;
  products?: Product[];
}) {
  const [name, setName] = useState(props.profile?.name ?? "");
  const [email, setEmail] = useState(props.profile?.email ?? "");
  const [phone, setPhone] = useState(props.profile?.phone ?? "");
  const [address, setAddress] = useState(props.profile?.address ?? "");
  const [city, setCity] = useState("Galle");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slipUrl, setSlipUrl] = useState("");
  const [uploadingSlip, setUploadingSlip] = useState(false);

  async function handleSlipUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG/JPG)");
      return;
    }
    setUploadingSlip(true);
    try {
      const url = await uploadPaymentSlip(file);
      setSlipUrl(url);
      toast.success("Payment slip uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to upload payment slip");
    } finally {
      setUploadingSlip(false);
    }
  }

  const isDigitalCart = useMemo(() => {
    if (!props.cart.items.length) return false;
    return props.cart.items.every((item) => {
      if (item.isDigital) return true;
      const matchingProd = props.products?.find((p) => p.id === item.productId);
      return matchingProd?.isDigital === true;
    });
  }, [props.cart.items, props.products]);

  const [paymentMethod, setPaymentMethod] = useState<
    "Card" | "Cash on Delivery" | "Bank Transfer" | "PayHere" | "Payzy"
  >("Cash on Delivery");

  // Adjust payment method if COD or Card is selected but cart is digital
  useEffect(() => {
    if (isDigitalCart) {
      if (paymentMethod === "Cash on Delivery" || paymentMethod === "Card") {
        setPaymentMethod("PayHere");
      }
    }
  }, [isDigitalCart, paymentMethod]);

  const subtotal = cartSubtotal(props.cart);
  const discount = computeDiscount(props.cart);
  const delivery = isDigitalCart ? 0 : (props.settings.deliveryCharge ?? 500);
  const totalWithoutSurcharge = Math.max(0, subtotal - discount) + delivery;
  const isPayzy = paymentMethod === "Payzy";
  const payzySurcharge = isPayzy ? Math.round(totalWithoutSurcharge * 0.14) : 0;
  const total = totalWithoutSurcharge + payzySurcharge;
  const payzyMonthly = isPayzy ? Math.round(total / 4) : 0;

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
    if (!name.trim() || !email.trim() || !phone.trim() || (!isDigitalCart && (!address.trim() || !city.trim()))) {
      toast.error("Please fill all required fields");
      return;
    }
    if (paymentMethod === "Bank Transfer" && !slipUrl) {
      toast.error("Please upload your bank transfer payment slip to place the order");
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
        shippingAddress: isDigitalCart ? "Digital Delivery" : address,
        city: isDigitalCart ? "Digital" : city,
        zip: isDigitalCart ? "" : zip,
        paymentMethod,
        notes,
        bankTransferSlip: paymentMethod === "Bank Transfer" ? slipUrl : undefined,
      };

      const orderId = await createOrder(orderPayload);

      // Log for any future EmailJS / webhook integration
      console.log("[ORDER PLACED]", { orderId, ...orderPayload });

      // Save placed info for success screen — copy items before clearing cart
      const itemsCopy = props.cart.items.map((x) => ({ name: x.name, qty: x.qty, price: x.price }));
      setPlaced({
        orderId,
        customerName: name,
        customerPhone: phone,
        total,
        paymentMethod,
        items: itemsCopy,
        bankTransferSlip: paymentMethod === "Bank Transfer" ? slipUrl : undefined,
      });

      // Clear cart immediately
      props.clearCart();

      // If PayHere selected, launch payment in a new tab
      if (paymentMethod === "PayHere") {
        if (!props.payhere.enabled) {
          toast.error("PayHere is not configured yet. Admin can enable it from Admin → PayHere Setup.");
        } else {
          try {
            submitPayHerePayment({
              settings: props.payhere,
              orderId,
              itemsLabel,
              amount: total,
              firstName: name.split(" ")[0] ?? name,
              lastName: name.split(" ").slice(1).join(" ") || "-",
              email,
              phone,
              address: isDigitalCart ? "Digital Delivery" : address,
              city: isDigitalCart ? "Digital" : city,
            });
            toast("PayHere payment window opened.");
          } catch (payhereErr) {
            console.error("PayHere integration error:", payhereErr);
            toast.error("Failed to open PayHere payment page.");
          }
        }
      }

      // If Payzy selected, launch payment in a new tab
      if (paymentMethod === "Payzy") {
        if (!props.payzy.enabled) {
          toast.error("Payzy is not configured yet. Admin can enable it from Admin → Payment Methods.");
        } else {
          try {
            await submitPayzyPayment({
              settings: props.payzy,
              orderId,
              amount: total,
              firstName: name.split(" ")[0] ?? name,
              lastName: name.split(" ").slice(1).join(" ") || "-",
              email,
              phone,
              address: isDigitalCart ? "Digital Delivery" : address,
              city: isDigitalCart ? "Digital" : city,
              zip: isDigitalCart ? "N/A" : zip,
            });
            toast("Payzy payment window opened.");
          } catch (payzyErr) {
            console.error("Payzy integration error:", payzyErr);
            toast.error("Failed to open Payzy payment page.");
          }
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (placed) {
    const adminPhone = toWaPhone(props.settings.phone || "0726306039");
    const slipLine = placed.paymentMethod === "Bank Transfer" && placed.bankTransferSlip
      ? `Payment Slip: ${placed.bankTransferSlip}\n`
      : "";
    const waText = encodeURIComponent(
      `Hi SR MOBILE! I just placed an order.\n\n` +
        `Order ID: ${placed.orderId}\n` +
        `Name: ${placed.customerName}\n` +
        `Total: Rs. ${placed.total.toLocaleString()}\n` +
        `Payment: ${placed.paymentMethod}\n` +
        slipLine +
        `\nItems:\n` +
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
            <div className="text-sm font-semibold text-white">
              {isDigitalCart ? "Contact Information" : "Delivery Details"}
            </div>
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
              {!isDigitalCart && (
                <>
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
                </>
              )}
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold text-white/70">Notes</div>
                <Textarea value={notes} onChange={setNotes} placeholder="Any special instructions..." rows={3} />
              </div>
            </div>

            <Divider className="my-4" />

            <div className="text-sm font-semibold text-white">Payment Method</div>
            <div className="mt-2 grid gap-2">
              {/* Cash on Delivery */}
              {!isDigitalCart && (
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
              )}

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

              {paymentMethod === "Bank Transfer" && (
                <div className="rounded-2xl border border-[#00b4d8]/30 bg-[#00b4d8]/5 p-4 space-y-4">
                  <div className="text-xs font-bold text-[#00b4d8] uppercase tracking-wider mb-2">Bank Account Details</div>

                  {/* Account 1 */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Bank</span>
                      <span className="text-sm font-bold text-white">HNB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Account Name</span>
                      <span className="text-sm font-semibold text-white">SR MOBILE</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Account Number</span>
                      <span className="font-mono text-sm font-bold text-[#00b4d8] select-all">202020083890</span>
                    </div>
                  </div>

                  {/* Account 2 */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Bank</span>
                      <span className="text-sm font-bold text-white">HNB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Account Name</span>
                      <span className="text-sm font-semibold text-white">S. Rashmika</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Account Number</span>
                      <span className="font-mono text-sm font-bold text-[#00b4d8] select-all">081020281103</span>
                    </div>
                  </div>

                  <p className="text-xs text-white/40">
                    After transferring, please upload your payment slip below and send your order details via WhatsApp to confirm your order.
                  </p>

                  <Divider className="my-2 border-white/5" />

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70">Upload Payment Slip (Receipt) *</div>
                    <input
                      type="file"
                      accept="image/*"
                      id="slip-upload"
                      className="hidden"
                      onChange={handleSlipUpload}
                      disabled={uploadingSlip}
                    />
                    <label
                      htmlFor="slip-upload"
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-sm text-white/60 hover:bg-white/[0.05] transition ${
                        uploadingSlip ? "opacity-50 cursor-wait" : ""
                      }`}
                    >
                      {uploadingSlip ? (
                        <span>Uploading slip...</span>
                      ) : slipUrl ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          Slip Uploaded ✓
                        </span>
                      ) : (
                        <span>Choose Slip Image</span>
                      )}
                    </label>
                    {slipUrl && (
                       <div className="mt-2 relative inline-block">
                         <img src={slipUrl} alt="Slip Preview" className="max-h-24 rounded-lg border border-white/10" />
                         <button
                           type="button"
                           onClick={() => setSlipUrl("")}
                           className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 h-5 w-5 flex items-center justify-center text-[10px]"
                           title="Remove slip"
                         >
                           ✕
                         </button>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card */}
              {!isDigitalCart && (
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
              )}

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

              {/* Payzy */}
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === "Payzy"}
                  onChange={() => setPaymentMethod("Payzy")}
                />
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="5" width="20" height="14" rx="3" stroke="#0073fe" strokeWidth="1.8" />
                    <path d="M6 12H18" stroke="#ff6b00" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M12 9V15" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">Payzy (Pay in 4 Months)</div>
                    <span className="rounded bg-[#0073fe]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#0073fe]">
                      14% Fee
                    </span>
                  </div>
                  <div className="text-xs text-white/50">
                    Split payment into 4 monthly installments of Rs. {payzyMonthly.toLocaleString()}
                  </div>
                </div>
              </label>

              {paymentMethod === "Payzy" && !props.payzy.enabled ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Payzy is not configured yet. Admin can enable it from Admin → Payment Methods.
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
              {isPayzy && (
                <div className="flex items-center justify-between text-[#0073fe]">
                  <span>Payzy Surcharge (14%)</span>
                  <span>Rs. {payzySurcharge.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-white">
                <span className="font-semibold">Total</span>
                <span className="font-[Poppins] font-extrabold">Rs. {total.toLocaleString()}</span>
              </div>
              {isPayzy && (
                <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/5 pt-1">
                  <span>Installments (4 Months)</span>
                  <span>Rs. {payzyMonthly.toLocaleString()} / month</span>
                </div>
              )}
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
