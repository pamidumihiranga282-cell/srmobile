import { useMemo, useState } from "react";
import { Button, Card, Container, Divider, Input, Spinner } from "@/components/ui";
import type { Order, Product } from "@/lib/types";
import type { UserProfile } from "@/lib/firebase";
import toast from "react-hot-toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageCircle } from "lucide-react";

function wa(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const waPhone = digits.startsWith("94") ? digits : digits.startsWith("0") ? `94${digits.slice(1)}` : `94${digits}`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, "_blank");
}

export function AccountPage(props: {
  profile: UserProfile;
  orders: Order[];
  ordersLoading: boolean;
  wishlist: string[];
  products: Product[];
  toggleWishlist: (id: string) => void;
}) {
  const [tab, setTab] = useState<"orders" | "profile" | "wishlist">("orders");

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

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">Home / Account</div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === "orders" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10"}`}
            onClick={() => setTab("orders")}
          >
            My Orders
          </button>
          <button
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === "profile" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10"}`}
            onClick={() => setTab("profile")}
          >
            Profile
          </button>
          <button
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === "wishlist" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10"}`}
            onClick={() => setTab("wishlist")}
          >
            Wishlist ({props.wishlist.length})
          </button>
        </div>

        <div className="mt-4">
          {tab === "orders" ? (
            <Card className="p-4">
              <div className="text-sm font-semibold text-white">My Orders</div>
              <Divider className="my-3" />
              {props.ordersLoading ? <Spinner label="Loading orders..." /> : null}
              <div className="space-y-3">
                {props.orders.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-white/50">Order ID</div>
                        <div className="font-mono text-xs text-white">{o.id}</div>
                        <div className="mt-2 text-sm font-semibold text-white">Rs. {Number(o.total).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/50">Status</div>
                        <div className="text-sm font-semibold text-white">{o.status}</div>
                        <div className="mt-1 text-xs text-white/50">Tracking: {o.trackingNumber || "—"}</div>
                      </div>
                    </div>
                    <Divider className="my-3" />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => wa(o.phone, `Hi SR MOBILE, I need help with my order: ${o.id}`)}
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </Button>
                      {o.trackingNumber ? (
                        <Button
                          onClick={() => wa(o.phone, `Tracking number for order ${o.id}: ${o.trackingNumber}`)}
                          variant="ghost"
                        >
                          Share tracking
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!props.ordersLoading && !props.orders.length ? (
                  <div className="text-sm text-white/60">No orders yet.</div>
                ) : null}
              </div>
            </Card>
          ) : null}

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

          {tab === "wishlist" ? (
            <Card className="p-4">
              <div className="text-sm font-semibold text-white">Wishlist</div>
              <Divider className="my-3" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {wishlistProducts.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="aspect-square overflow-hidden rounded-xl bg-white/5">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm font-semibold text-white">{p.name}</div>
                    <div className="mt-1 text-xs text-white/50">Rs. {Number(p.price).toLocaleString()}</div>
                    <Button className="mt-3 w-full" variant="secondary" onClick={() => props.toggleWishlist(p.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              {!wishlistProducts.length ? <div className="text-sm text-white/60">No saved items.</div> : null}
            </Card>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
