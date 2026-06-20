import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, Card, Container, Divider, Input } from "@/components/ui";
import type { CartState } from "@/lib/cart";
import { cartSubtotal, computeDiscount } from "@/lib/cart";

export function CartPage(props: {
  cart: CartState;
  setCoupon: (c: string) => void;
  onQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  deliveryCharge: number;
  onCheckout: () => void;
}) {
  const subtotal = cartSubtotal(props.cart);
  const discount = computeDiscount(props.cart);
  const total = Math.max(0, subtotal - discount) + props.deliveryCharge;

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">Home / Cart</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="p-4">
            <div className="text-sm font-semibold text-white">Cart Items</div>
            <Divider className="my-3" />

            <div className="space-y-3">
              {props.cart.items.length ? (
                props.cart.items.map((it) => (
                  <div key={it.productId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex gap-3">
                      <div className="h-20 w-20 overflow-hidden rounded-xl bg-white/5">
                        {it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{it.name}</div>
                        <div className="mt-1 text-xs text-white/50">Rs. {Number(it.price).toLocaleString()}</div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="inline-flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            <button
                              className="px-3 py-2 hover:bg-white/10"
                              onClick={() => props.onQty(it.productId, Math.max(1, it.qty - 1))}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <div className="w-10 text-center text-sm font-bold text-white">{it.qty}</div>
                            <button
                              className="px-3 py-2 hover:bg-white/10"
                              onClick={() => props.onQty(it.productId, Math.min(99, it.qty + 1))}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                            onClick={() => props.onRemove(it.productId)}
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/50">Line</div>
                        <div className="font-[Poppins] font-bold text-white">Rs. {(it.price * it.qty).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                  Your cart is empty.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-semibold text-white">Order Summary</div>
            <Divider className="my-3" />

            <div>
              <div className="text-xs font-semibold text-white/70">Coupon</div>
              <div className="mt-2">
                <Input value={props.cart.coupon ?? ""} onChange={props.setCoupon} placeholder="Try SR10" />
              </div>
              {discount > 0 ? <div className="mt-2 text-xs text-emerald-300">Discount applied: -Rs. {discount}</div> : null}
            </div>

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
                <span>Delivery</span>
                <span>Rs. {props.deliveryCharge.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-white">
                <span className="font-semibold">Total</span>
                <span className="font-[Poppins] font-extrabold">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <Button onClick={props.onCheckout} disabled={!props.cart.items.length} className="mt-4 w-full">
              Proceed to Checkout
            </Button>

            <p className="mt-3 text-xs text-white/40">
              Delivery charge is pulled live from Firestore: <code>site_settings/settings.deliveryCharge</code>.
            </p>
          </Card>
        </div>
      </Container>
    </div>
  );
}
