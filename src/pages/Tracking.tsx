import { useState } from "react";
import { Button, Card, Container, Divider, Input, Spinner } from "@/components/ui";
import { findOrderByTracking } from "@/lib/api";
import type { OrderStatus } from "@/lib/types";
import toast from "react-hot-toast";

const steps: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

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
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card className="p-4 sm:p-6">
            <div className="text-sm font-semibold text-white">Track your order</div>
            <p className="mt-1 text-sm text-white/60">Enter the tracking number provided by SR MOBILE.</p>

            <Divider className="my-4" />
            <div className="flex gap-2">
              <Input value={tracking} onChange={setTracking} placeholder="Tracking number" />
              <Button onClick={lookup} disabled={loading}>
                Search
              </Button>
            </div>

            {loading ? (
              <div className="mt-4">
                <Spinner label="Searching..." />
              </div>
            ) : null}

            {order ? (
              <div className="mt-6">
                <div className="text-sm font-semibold text-white">Status Timeline</div>
                <div className="mt-3 grid gap-3">
                  {steps.map((s, i) => {
                    const done = i <= activeIndex;
                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <div
                          className={`grid h-9 w-9 place-items-center rounded-2xl border ${
                            done ? "border-[#00b4d8] bg-[#00b4d8]/15 text-[#00b4d8]" : "border-white/10 bg-white/5 text-white/40"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-semibold ${done ? "text-white" : "text-white/60"}`}>{s.label}</div>
                          <div className="text-xs text-white/40">{done ? "Updated" : "Pending"}</div>
                        </div>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-4">
            <div className="text-sm font-semibold text-white">Order Info</div>
            <Divider className="my-3" />
            {order ? (
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>Order ID</span>
                  <span className="font-mono text-xs text-white">{order.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-semibold text-white">{order.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="font-semibold text-white">Rs. {Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/60">Search to see details.</div>
            )}
          </Card>
        </div>
      </Container>
    </div>
  );
}
