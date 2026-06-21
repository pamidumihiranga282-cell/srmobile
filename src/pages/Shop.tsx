import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { Button, Card, Container, Divider, Input, Modal, Select } from "@/components/ui";
import { Stars } from "@/components/Stars";
import { Eye, Heart, ShoppingCart } from "lucide-react";

export type ShopFilters = {
  brand: string;
  model: string;
  partType: string;
  minPrice: string;
  maxPrice: string;
  ratingMin: string;
  sort: "popularity" | "newest" | "price_asc" | "price_desc";
};

export function ShopPage(props: {
  products: Product[];
  search: string;
  filters: ShopFilters;
  setFilters: (f: ShopFilters) => void;
  onOpenProduct: (id: string) => void;
  onAddToCart: (p: Product) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  t: (k: any) => string;
}) {
  const [quickId, setQuickId] = useState<string | null>(null);
  const quick = props.products.find((p) => p.id === quickId) ?? null;

  const brands = useMemo(() => {
    const s = new Set(props.products.map((p) => p.brand).filter(Boolean));
    return ["", ...Array.from(s).sort()];
  }, [props.products]);

  const models = useMemo(() => {
    const s = new Set(
      props.products
        .filter((p) => (props.filters.brand ? p.brand === props.filters.brand : true))
        .map((p) => p.model)
        .filter(Boolean)
    );
    return ["", ...Array.from(s).sort()];
  }, [props.products, props.filters.brand]);

  const partTypes = useMemo(() => {
    const s = new Set(
      props.products
        .filter((p) => (props.filters.brand ? p.brand === props.filters.brand : true))
        .filter((p) => (props.filters.model ? p.model === props.filters.model : true))
        .map((p) => p.partType)
        .filter(Boolean)
    );
    return ["", ...Array.from(s).sort()];
  }, [props.products, props.filters.brand, props.filters.model]);

  const filtered = useMemo(() => {
    const q = props.search.trim().toLowerCase();
    const minP = props.filters.minPrice ? Number(props.filters.minPrice) : -Infinity;
    const maxP = props.filters.maxPrice ? Number(props.filters.maxPrice) : Infinity;
    const minR = props.filters.ratingMin ? Number(props.filters.ratingMin) : 0;

    let arr = props.products.filter((p) => {
      if (props.filters.brand && p.brand !== props.filters.brand) return false;
      if (props.filters.model && p.model !== props.filters.model) return false;
      if (props.filters.partType && p.partType !== props.filters.partType) return false;
      if (Number(p.price) < minP || Number(p.price) > maxP) return false;
      if ((p.rating ?? 0) < minR) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.model} ${p.partType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (props.filters.sort === "price_asc") {
      arr = arr.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (props.filters.sort === "price_desc") {
      arr = arr.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (props.filters.sort === "newest") {
      arr = arr.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    } else {
      // popularity
      arr = arr.sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0));
    }

    return arr;
  }, [props.products, props.search, props.filters]);

  return (
    <div>
      <Container>
        {/* Breadcrumb */}
        <div className="mt-6 text-xs text-white/50">
          Home <span className="mx-1">/</span> Shop
          {props.filters.brand ? (
            <>
              <span className="mx-1">/</span> {props.filters.brand}
            </>
          ) : null}
          {props.filters.model ? (
            <>
              <span className="mx-1">/</span> {props.filters.model}
            </>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">{props.t("filters")}</div>
              <button
                className="text-xs font-semibold text-white/60 hover:text-white"
                onClick={() =>
                  props.setFilters({
                    brand: "",
                    model: "",
                    partType: "",
                    minPrice: "",
                    maxPrice: "",
                    ratingMin: "",
                    sort: "popularity",
                  })
                }
              >
                Reset
              </button>
            </div>
            <Divider className="my-3" />

            <div className="grid gap-3">
              <div>
                <div className="text-xs font-semibold text-white/70">Brand</div>
                <Select
                  value={props.filters.brand}
                  onChange={(v) => props.setFilters({ ...props.filters, brand: v, model: "", partType: "" })}
                  options={brands.map((b) => ({ value: b, label: b || "All" }))}
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-white/70">Model</div>
                <Select
                  value={props.filters.model}
                  onChange={(v) => props.setFilters({ ...props.filters, model: v, partType: "" })}
                  options={models.map((m) => ({ value: m, label: m || "All" }))}
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-white/70">Part Type</div>
                <Select
                  value={props.filters.partType}
                  onChange={(v) => props.setFilters({ ...props.filters, partType: v })}
                  options={partTypes.map((p) => ({ value: p, label: p || "All" }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs font-semibold text-white/70">Min Price</div>
                  <Input value={props.filters.minPrice} onChange={(v) => props.setFilters({ ...props.filters, minPrice: v })} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70">Max Price</div>
                  <Input value={props.filters.maxPrice} onChange={(v) => props.setFilters({ ...props.filters, maxPrice: v })} />
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-white/70">Rating</div>
                <Select
                  value={props.filters.ratingMin}
                  onChange={(v) => props.setFilters({ ...props.filters, ratingMin: v })}
                  options={[
                    { value: "", label: "Any" },
                    { value: "4", label: "4+" },
                    { value: "3", label: "3+" },
                    { value: "2", label: "2+" },
                    { value: "1", label: "1+" },
                  ]}
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-white/70">{props.t("sort")}</div>
                <Select
                  value={props.filters.sort}
                  onChange={(v) => props.setFilters({ ...props.filters, sort: v as any })}
                  options={[
                    { value: "popularity", label: "Popularity" },
                    { value: "newest", label: "Newest" },
                    { value: "price_asc", label: "Price Low-High" },
                    { value: "price_desc", label: "Price High-Low" },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Grid */}
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Products</div>
                <div className="text-xs text-white/50">{filtered.length} results</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => {
                const inWishlist = props.wishlist.includes(p.id);
                return (
                  <Card key={p.id} className="group overflow-hidden">
                    <div className="relative">
                      <button onClick={() => props.onOpenProduct(p.id)} className="block w-full text-left">
                        <div className="aspect-square w-full overflow-hidden bg-white/5">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,180,216,0.25),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,107,0,0.2),transparent_45%)]" />
                          )}
                        </div>
                      </button>

                      <div className="absolute left-2 top-2 flex gap-2">
                        <button
                          className={`grid h-9 w-9 place-items-center rounded-xl border border-white/10 backdrop-blur transition ${
                            inWishlist ? "bg-[#ff6b00] text-black" : "bg-black/40 text-pure-white hover:bg-black/55"
                          }`}
                          onClick={() => props.toggleWishlist(p.id)}
                          aria-label="Wishlist"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                        <button
                          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/40 text-pure-white backdrop-blur hover:bg-black/55"
                          onClick={() => setQuickId(p.id)}
                          aria-label="Quick view"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>

                      <div className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[11px] font-semibold ${p.stock > 0 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
                        {p.stock > 0 ? "In Stock" : "Out of Stock"}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="line-clamp-2 text-sm font-semibold text-white">{p.name}</div>
                      <div className="mt-1 text-xs text-white/50">
                        {p.brand} • {p.model} • {p.partType}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="font-[Poppins] text-sm font-bold text-white">Rs. {Number(p.price).toLocaleString()}</div>
                        <Stars value={p.rating ?? 0} />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => props.onAddToCart(p)}
                          disabled={p.stock <= 0}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add
                        </Button>
                        <Button variant="secondary" onClick={() => props.onOpenProduct(p.id)} className="px-3">
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </Container>

      <Modal open={!!quick} onClose={() => setQuickId(null)} title={quick?.name ?? ""}>
        {quick ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="aspect-square overflow-hidden rounded-xl bg-white/5">
              {quick.images?.[0] ? (
                <img src={quick.images[0]} alt={quick.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-white/5" />
              )}
            </div>
            <div>
              <div className="text-xs text-white/50">
                {quick.brand} • {quick.model} • {quick.partType}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="font-[Poppins] text-lg font-bold text-white">Rs. {Number(quick.price).toLocaleString()}</div>
                <Stars value={quick.rating ?? 0} />
              </div>
              <p className="mt-3 text-sm text-white/70 line-clamp-4">{quick.description || quick.specs}</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => props.onAddToCart(quick)} disabled={quick.stock <= 0}>
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </Button>
                <Button variant="secondary" onClick={() => props.onOpenProduct(quick.id)}>
                  Full details
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
