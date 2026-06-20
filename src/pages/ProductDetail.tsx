import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import type { UserProfile } from "@/lib/firebase";
import { Button, Card, Container, Divider, Input, Select, Textarea } from "@/components/ui";
import { Stars } from "@/components/Stars";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateProduct } from "@/lib/api";
import toast from "react-hot-toast";

type Review = {
  id: string;
  email: string;
  name: string;
  rating: number;
  text: string;
  date?: any;
};

export function ProductDetailPage(props: {
  product: Product;
  allProducts: Product[];
  profile: UserProfile | null;
  onAddToCart: (p: Product, qty: number) => void;
  onBuyNow: (p: Product, qty: number) => void;
  onOpenProduct: (id: string) => void;
}) {
  const p = props.product;
  const [img, setImg] = useState(p.images?.[0] ?? "");
  const [qty, setQty] = useState(1);

  const [checkBrand, setCheckBrand] = useState(p.brand || "");
  const [checkModel, setCheckModel] = useState(p.model || "");

  const compatible = useMemo(() => {
    const key = `${checkBrand}|${checkModel}`.toLowerCase();
    const list = (p.compatibility ?? []).map((x) => String(x).toLowerCase());
    if (!checkBrand || !checkModel) return null;
    if (list.length === 0) return true; // if not defined, assume usable
    return list.includes(key);
  }, [checkBrand, checkModel, p.compatibility]);

  const crossSell = useMemo(() => {
    return props.allProducts
      .filter((x) => x.id !== p.id)
      .filter((x) => (p.brand ? x.brand === p.brand : true) || (p.partType ? x.partType === p.partType : true))
      .slice(0, 4);
  }, [props.allProducts, p.brand, p.partType, p.id]);

  const [tab, setTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    setImg(p.images?.[0] ?? "");
  }, [p.id]);

  useEffect(() => {
    const q = query(collection(db, "products", p.id, "reviews"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      const arr: Review[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setReviews(arr);
    });
  }, [p.id]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return p.rating ?? 0;
    return reviews.reduce((a, b) => a + (b.rating ?? 0), 0) / reviews.length;
  }, [reviews, p.rating]);

  // Review form
  const [rRating, setRRating] = useState("5");
  const [rText, setRText] = useState("");

  async function submitReview() {
    if (!props.profile) {
      toast.error("Please login to review");
      return;
    }
    const rating = Math.max(1, Math.min(5, Number(rRating || 5)));
    if (!rText.trim()) {
      toast.error("Write a short review");
      return;
    }

    await addDoc(collection(db, "products", p.id, "reviews"), {
      email: props.profile.email,
      name: props.profile.name || props.profile.email,
      rating,
      text: rText.trim(),
      date: serverTimestamp(),
    });

    // Update product rating fields for listing filters/sorting.
    const nextCount = (p.ratingCount ?? reviews.length ?? 0) + 1;
    const nextAvg = (avgRating * (nextCount - 1) + rating) / nextCount;
    await updateProduct(p.id, { rating: Number(nextAvg.toFixed(2)), ratingCount: nextCount } as any);

    setRText("");
    toast.success("Thanks for your review!");
  }

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">
          Home <span className="mx-1">/</span> Shop <span className="mx-1">/</span> {p.brand} <span className="mx-1">/</span>{" "}
          {p.model} <span className="mx-1">/</span> {p.name}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-white/5">
              {img ? (
                <img src={img} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,180,216,0.25),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,107,0,0.2),transparent_45%)]" />
              )}
            </div>
            <div className="mt-3 flex gap-2 overflow-auto pb-1">
              {(p.images ?? []).length ? (
                p.images.map((u) => (
                  <button
                    key={u}
                    onClick={() => setImg(u)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${
                      u === img ? "border-[#00b4d8]" : "border-white/10"
                    } bg-white/5`}
                  >
                    <img src={u} alt="thumb" className="h-full w-full object-cover" />
                  </button>
                ))
              ) : (
                <div className="text-sm text-white/50">No images yet (admin can upload).</div>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="text-xs text-white/50">
              {p.brand} • {p.model} • {p.partType}
            </div>
            <div className="mt-2 font-[Poppins] text-2xl font-bold text-white">{p.name}</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="font-[Poppins] text-xl font-extrabold text-white">Rs. {Number(p.price).toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <Stars value={avgRating} />
                <span className="text-xs text-white/50">({reviews.length})</span>
              </div>
            </div>

            <div className="mt-3 text-sm text-white/70">Stock: {p.stock}</div>

            {/* Compatibility checker */}
            <Divider className="my-4" />
            <div className="text-sm font-semibold text-white">Compatibility Checker</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input value={checkBrand} onChange={setCheckBrand} placeholder="Brand (e.g., Apple)" />
              <Input value={checkModel} onChange={setCheckModel} placeholder="Model (e.g., iPhone 13)" />
            </div>
            {compatible === null ? null : (
              <div
                className={`mt-2 rounded-xl border px-3 py-2 text-sm ${
                  compatible ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"
                }`}
              >
                {compatible ? "Compatible" : "Not listed as compatible"}
              </div>
            )}

            {/* Qty + actions */}
            <Divider className="my-4" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white/70">Quantity</div>
                <div className="mt-2 inline-flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <button className="px-3 py-2 hover:bg-white/10" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="w-12 text-center text-sm font-bold text-white">{qty}</div>
                  <button className="px-3 py-2 hover:bg-white/10" onClick={() => setQty((q) => Math.min(99, q + 1))}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/50">Subtotal</div>
                <div className="font-[Poppins] text-lg font-bold text-white">Rs. {(Number(p.price) * qty).toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={() => props.onAddToCart(p, qty)} disabled={p.stock <= 0}>
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
              <Button onClick={() => props.onBuyNow(p, qty)} variant="secondary" disabled={p.stock <= 0}>
                Buy Now
              </Button>
            </div>

            <div className="mt-4 text-xs text-white/50">
              Tip: For parts installation, professional installation is recommended.
            </div>
          </Card>
        </div>

        {/* Accordions */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTab("desc")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === "desc" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10"}`}
              >
                Description
              </button>
              <button
                onClick={() => setTab("specs")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === "specs" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10"}`}
              >
                Specs
              </button>
              <button
                onClick={() => setTab("reviews")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === "reviews" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10"}`}
              >
                Reviews ({reviews.length})
              </button>
            </div>
            <Divider className="my-4" />

            {tab === "desc" ? <p className="whitespace-pre-wrap text-sm text-white/75">{p.description || "—"}</p> : null}
            {tab === "specs" ? <p className="whitespace-pre-wrap text-sm text-white/75">{p.specs || "—"}</p> : null}

            {tab === "reviews" ? (
              <div>
                <div className="grid gap-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">{r.name}</div>
                        <Stars value={r.rating} />
                      </div>
                      <p className="mt-2 text-sm text-white/70">{r.text}</p>
                    </div>
                  ))}
                  {!reviews.length ? <div className="text-sm text-white/50">No reviews yet.</div> : null}
                </div>

                <Divider className="my-4" />
                <div className="text-sm font-semibold text-white">Write a review</div>
                <div className="mt-2 grid gap-2">
                  <Select
                    value={rRating}
                    onChange={setRRating}
                    options={["5", "4", "3", "2", "1"].map((x) => ({ value: x, label: `${x} stars` }))}
                  />
                  <Textarea value={rText} onChange={setRText} placeholder="Your experience..." rows={4} />
                  <Button onClick={submitReview}>Submit</Button>
                </div>
                <p className="mt-2 text-xs text-white/40">
                  Reviews are stored in Firestore at <code>products/{p.id}/reviews</code>.
                </p>
              </div>
            ) : null}
          </Card>

          {/* Frequently bought */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-white">Frequently Bought Together</div>
            <Divider className="my-3" />
            <div className="grid gap-3">
              {crossSell.map((x) => (
                <button
                  key={x.id}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left hover:bg-white/[0.06]"
                  onClick={() => props.onOpenProduct(x.id)}
                >
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/5">
                    {x.images?.[0] ? <img src={x.images[0]} alt={x.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{x.name}</div>
                    <div className="mt-1 text-xs text-white/50">{x.partType}</div>
                    <div className="mt-1 text-sm font-bold text-white">Rs. {Number(x.price).toLocaleString()}</div>
                  </div>
                </button>
              ))}
              {!crossSell.length ? <div className="text-sm text-white/50">No suggestions yet.</div> : null}
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
