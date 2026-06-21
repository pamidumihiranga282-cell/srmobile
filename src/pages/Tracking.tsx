import { useState } from "react";
import { Button, Card, Container, Divider, Input, Spinner } from "@/components/ui";
import { findOrderByTracking } from "@/lib/api";
import type { OrderStatus } from "@/lib/types";
import toast from "react-hot-toast";
import { CheckCircle2, Circle, PackageCheck, PackageOpen, PackageSearch, Truck } from "lucide-react";

type StepInfo = { key: OrderStatus; label: string; description: string; icon: React.FC<any> };

const steps: StepInfo[] = [
  { key: "pending", label: "Order Placed", description: "We have received your order", icon: PackageOpen },
  { key: "processing", label: "Processing", description: "Your order is being prepared", icon: PackageSearch },
  { key: "shipped", label: "Shipped", description: "On the way to you", icon: Truck },
  { key: "delivered", label: "Delivered", description: "Order completed", icon: PackageCheck },
];

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  processing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export function TrackingPage() {
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);

  async function lookup() {
    const t = tracking.trim();
    if (!t) return toast.error("Enter tracking number");
    setLoading(true);
    try {
      const o = await findOrderByTracking(t);
      setOrder(o);
      if (!o) toast.error("No order found for this tracking number");
    } finally {
      setLoading(false);
    }
  }

  const activeIndex = order ? steps.findIndex((s) => s.key === order.status) : -1;

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">Home / Order Tracking</div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
          {/* Search & Timeline */}
          <Card className="p-4 sm:p-6">
            <div className="font-[Poppins] text-lg font-bold text-white">Track your order</div>
            <p className="mt-1 text-sm text-white/60">
              Enter the tracking number provided by SR MOBILE after your order ships.
            </p>

            <Divider className="my-4" />

            <div className="flex gap-2">
              <Input
                value={tracking}
                onChange={setTracking}
                placeholder="Enter tracking number…"
                onKeyDown={(e: any) => e.key === "Enter" && lookup()}
              />
              <Button onClick={lookup} disabled={loading}>
                {loading ? "…" : "Track"}
              </Button>
            </div>

            {loading ? (
              <div className="mt-6">
                <Spinner label="Searching for your order…" />
              </div>
            ) : null}

            {order && !loading ? (
              <div className="mt-8">
                {/* Status badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">Status Timeline</div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                      statusColors[order.status as OrderStatus] ?? "bg-white/10 text-white border-white/20"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Visual stepper */}
                <div className="mt-6 flex flex-col gap-0">
                  {steps.map((s, i) => {
                    const done = i <= activeIndex;
                    const active = i === activeIndex;
                    const Icon = s.icon;
                    return (
                      <div key={s.key} className="flex gap-4">
                        {/* Left: icon + connector */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition ${
                              done
                                ? active
                                  ? "border-[#00b4d8] bg-[#00b4d8] text-black"
                                  : "border-[#00b4d8]/60 bg-[#00b4d8]/15 text-[#00b4d8]"
                                : "border-white/10 bg-white/5 text-white/30"
                            }`}
                          >
                            {done && !active ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : done && active ? (
                              <Icon className="h-5 w-5" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </div>
                          {i < steps.length - 1 ? (
                            <div
                              className={`mt-1 w-0.5 flex-1 rounded-full transition ${
                                i < activeIndex ? "bg-[#00b4d8]/40" : "bg-white/10"
                              }`}
                              style={{ minHeight: "2.5rem" }}
                            />
                          ) : null}
                        </div>

                        {/* Right: text */}
                        <div className={`pb-8 pt-1.5 ${i === steps.length - 1 ? "pb-2" : ""}`}>
                          <div
                            className={`text-sm font-semibold ${done ? "text-white" : "text-white/40"}`}
                          >
                            {s.label}
                          </div>
                          <div className={`text-xs mt-0.5 ${done ? "text-white/60" : "text-white/25"}`}>
                            {s.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </Card>

          {/* Order Info */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-white">Order Info</div>
            <Divider className="my-3" />
            {order ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Order ID</span>
                  <span className="font-mono text-xs text-white">{order.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Customer</span>
                  <span className="text-white">{order.userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Payment</span>
                  <span className="text-white">{order.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Total</span>
                  <span className="font-[Poppins] font-bold text-white">
                    Rs. {Number(order.total).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Tracking #</span>
                  <span className="text-white">{order.trackingNumber || "—"}</span>
                </div>
                {order.shippingAddress ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-white/50">Address</span>
                    <span className="text-right text-white">
                      {order.shippingAddress}, {order.city}
                    </span>
                  </div>
                ) : null}

                <Divider />

                {/* Items */}
                <div className="text-xs font-semibold text-white/70">Items</div>
                <div className="space-y-1.5">
                  {(order.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="max-w-[180px] truncate text-white/70">
                        {item.qty}× {item.name}
                      </span>
                      <span className="text-white/70">Rs. {(item.qty * item.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      window.open(
                        `https://wa.me/94726306039?text=${encodeURIComponent(
                          `Hi SR MOBILE, I need an update on my order ${order.id}. Tracking: ${order.trackingNumber || "N/A"}`
                        )}`,
                        "_blank"
                      )
                    }
                  >
                    WhatsApp Support
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-white/50">
                <p>Enter your tracking number to see order details.</p>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/40">
                  <div className="font-semibold text-white/60 mb-1">How to find your tracking number?</div>
                  <p>
                    After your order is shipped, SR MOBILE will send your tracking number via WhatsApp or
                    email.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </Container>
    </div>
  );
}
