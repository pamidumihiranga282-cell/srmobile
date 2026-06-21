import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Container, Divider, Input, Spinner } from "@/components/ui";
import type { Order, Product } from "@/lib/types";
import type { UserProfile } from "@/lib/firebase";
import toast from "react-hot-toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Package,
  PackageCheck,
  PackageSearch,
  ShoppingBag,
  Truck,
  User,
  Heart,
} from "lucide-react";

/** Normalise any LK phone → 94x for wa.me */
function toWaPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

function waAdmin(adminPhone: string, text: string) {
  window.open(`https://wa.me/${toWaPhone(adminPhone)}?text=${encodeURIComponent(text)}`, "_blank");
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; Icon: any }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/30",
    Icon: Package,
  },
  processing: {
    label: "Processing",
    color: "text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/30",
    Icon: PackageSearch,
  },
  shipped: {
    label: "Shipped",
    color: "text-purple-400",
    bg: "bg-purple-500/15 border-purple-500/30",
    Icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    Icon: PackageCheck,
  },
};

function OrderCard({ o, adminPhone }: { o: Order; adminPhone: string }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = st.Icon;

  const orderDate = (o as any).orderDate?.toDate?.()
    ? new Intl.DateTimeFormat("en-LK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format((o as any).orderDate.toDate())
    : null;

  const waText = encodeURIComponent(
    `Hi SR MOBILE! I need help with my order.\n\nOrder ID: ${o.id}\nStatus: ${o.status}\n\nPlease assist me. Thank you!`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Left — ID + date */}
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-white/40" />
              <span className="font-mono text-sm font-bold text-[#00b4d8]">
                {o.id}
              </span>
            </div>
            {orderDate && (
              <div className="mt-0.5 text-xs text-white/40">{orderDate}</div>
            )}
            <div className="mt-2 text-base font-bold text-white">
              Rs. {Number(o.total).toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-white/50">
              {o.paymentMethod}
            </div>
          </div>

          {/* Right — status badge */}
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${st.bg} ${st.color}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {st.label}
            </span>
            {o.trackingNumber && (
              <div className="text-xs text-white/50">
                Tracking:{" "}
                <span className="font-mono text-white/70">
                  {o.trackingNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items preview (collapsed — top 2 only) */}
        <div className="mt-3 space-y-1">
          {(expanded ? o.items : o.items.slice(0, 2)).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-xs"
            >
              <span className="max-w-[200px] truncate text-white/70">
                {item.qty}× {item.name}
              </span>
              <span className="text-white/60 shrink-0 pl-2">
                Rs. {(item.qty * item.price).toLocaleString()}
              </span>
            </div>
          ))}
          {o.items.length > 2 && !expanded && (
            <div className="text-center text-xs text-white/40">
              +{o.items.length - 2} more item{o.items.length - 2 !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-white/40">Shipping to</div>
                  <div className="mt-0.5 text-white/80">
                    {o.shippingAddress}, {o.city}
                    {o.zip ? ` ${o.zip}` : ""}
                  </div>
                </div>
                <div>
                  <div className="text-white/40">Payment</div>
                  <div className="mt-0.5 text-white/80">{o.paymentMethod}</div>
                </div>
                {o.notes && (
                  <div className="col-span-2">
                    <div className="text-white/40">Notes</div>
                    <div className="mt-0.5 text-white/80">{o.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
        <Button
          className="gap-1.5 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/25"
          onClick={() =>
            window.open(
              `https://wa.me/${toWaPhone(adminPhone)}?text=${waText}`,
              "_blank"
            )
          }
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp Support
        </Button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" /> Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> Details
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export function AccountPage(props: {
  profile: UserProfile;
  orders: Order[];
  ordersLoading: boolean;
  wishlist: string[];
  products: Product[];
  toggleWishlist: (id: string) => void;
  adminPhone: string;
  tab?: "orders" | "profile" | "wishlist";
  setTab?: (t: "orders" | "profile" | "wishlist") => void;
}) {
  const [localTab, setLocalTab] = useState<"orders" | "profile" | "wishlist">("orders");
  const tab = props.tab ?? localTab;
  const setTab = props.setTab ?? setLocalTab;

  const [name, setName] = useState(props.profile.name);
  const [phone, setPhone] = useState(props.profile.phone);
  const [address, setAddress] = useState(props.profile.address);

  const wishlistProducts = useMemo(() => {
    const map = new Map(props.products.map((p) => [p.id, p] as const));
    return props.wishlist.map((id) => map.get(id)).filter(Boolean) as Product[];
  }, [props.products, props.wishlist]);

  async function saveProfile() {
    try {
      await updateDoc(doc(db, "users", props.profile.email), {
        name,
        phone,
        address,
        updatedAt: serverTimestamp(),
      });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  const tabs = [
    { key: "orders", label: "My Orders", Icon: ShoppingBag, count: props.orders.length },
    { key: "profile", label: "Profile", Icon: User },
    { key: "wishlist", label: "Wishlist", Icon: Heart, count: props.wishlist.length },
  ] as const;

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">Home / Account</div>

        {/* Tab bar */}
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map(({ key, label, Icon, count }) => (
            <button
              key={key}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                tab === key
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/10"
              }`}
              onClick={() => setTab(key as any)}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className="rounded-full bg-[#00b4d8]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#00b4d8]">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {/* ── MY ORDERS ── */}
          {tab === "orders" ? (
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">My Orders</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    Track your purchases and order history
                  </div>
                </div>
                {!props.ordersLoading && props.orders.length > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                    {props.orders.length} order{props.orders.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <Divider className="my-4" />

              {props.ordersLoading ? (
                <Spinner label="Loading your orders..." />
              ) : props.orders.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-white/[0.04]">
                    <ShoppingBag className="h-7 w-7 text-white/30" />
                  </div>
                  <div className="text-sm font-semibold text-white/60">No orders yet</div>
                  <div className="mt-1 text-xs text-white/40">
                    Start shopping and your orders will appear here.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {props.orders.map((o) => (
                    <OrderCard key={o.id} o={o} adminPhone={props.adminPhone} />
                  ))}
                </div>
              )}
            </Card>
          ) : null}

          {/* ── PROFILE ── */}
          {tab === "profile" ? (
            <Card className="p-4 sm:p-6">
              <div className="text-sm font-semibold text-white">Profile</div>
              <Divider className="my-3" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-white/70">Name</div>
                  <Input value={name} onChange={setName} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70">Email</div>
                  <Input value={props.profile.email} onChange={() => {}} className="opacity-70" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70">Phone</div>
                  <Input value={phone} onChange={setPhone} />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-white/70">Address</div>
                  <Input value={address} onChange={setAddress} />
                </div>
              </div>
              <Button onClick={saveProfile} className="mt-4">
                Save
              </Button>
            </Card>
          ) : null}

          {/* ── WISHLIST ── */}
          {tab === "wishlist" ? (
            <Card className="p-4">
              <div className="text-sm font-semibold text-white">Wishlist</div>
              <Divider className="my-3" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {wishlistProducts.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="aspect-square overflow-hidden rounded-xl bg-white/5">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm font-semibold text-white">
                      {p.name}
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      Rs. {Number(p.price).toLocaleString()}
                    </div>
                    <Button
                      className="mt-3 w-full"
                      variant="secondary"
                      onClick={() => props.toggleWishlist(p.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              {!wishlistProducts.length ? (
                <div className="py-8 text-center text-sm text-white/60">No saved items.</div>
              ) : null}
            </Card>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
