import { Minus, Plus, Trash2 } from "lucide-react";
import { Drawer, Button, Divider, Input } from "./ui";
import type { CartState } from "@/lib/cart";
import { cartSubtotal, computeDiscount } from "@/lib/cart";

export function CartDrawer(props: {
  open: boolean;
  onClose: () => void;
  cart: CartState;
  setCoupon: (code: string) => void;
  onQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  deliveryCharge: number;
  onCheckout: () => void;
}) {
  const subtotal = cartSubtotal(props.cart);
  const discount = computeDiscount(props.cart);
  const total = Math.max(0, subtotal - discount) + props.deliveryCharge;

  return (
    <Drawer open={props.open} onClose={props.onClose} title="Your Cart">
      <div className="space-y-4">
        {props.cart.items.length ? (
          props.cart.items.map((it) => (
            <div key={it.productId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/5">
                  {it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{it.name}</div>
                  <div className="mt-1 text-xs text-white/50">Rs. {Number(it.price).toLocaleString()}</div>

                  <div className="mt-2 flex items-center justify-between gap-2">
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
                      className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      onClick={() => props.onRemove(it.productId)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            Your cart is empty.
          </div>
        )}

        <Divider />

        <div>
          <div className="text-xs font-semibold text-white/70">Coupon Code</div>
          <div className="mt-2 flex gap-2">
            <Input
              value={props.cart.coupon ?? ""}
              onChange={(v) => props.setCoupon(v)}
              placeholder="Try SR10"
            />
          </div>
          {discount > 0 ? <div className="mt-2 text-xs text-emerald-300">Discount applied: -Rs. {discount}</div> : null}
        </div>

        <Divider />

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

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              props.onClose();
              window.location.hash = "#cart";
            }}
            disabled={!props.cart.items.length}
            className="w-full"
          >
            View cart
          </Button>
          <Button onClick={props.onCheckout} disabled={!props.cart.items.length} className="w-full">
            Checkout
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
