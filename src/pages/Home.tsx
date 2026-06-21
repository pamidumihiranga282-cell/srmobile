import { AnimatePresence, motion } from "framer-motion";
import { Wrench, Smartphone, Cable, ShieldCheck, Truck, RotateCcw, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product, SiteSettings, Testimonial } from "@/lib/types";
import { Button, Card, Container, Input } from "@/components/ui";
import { Stars } from "@/components/Stars";

const fallbackSlides = [
  "https://images.pexels.com/photos/31862953/pexels-photo-31862953.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/31862950/pexels-photo-31862950.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/7194619/pexels-photo-7194619.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
];

export function HomePage(props: {
  settings: SiteSettings;
  products: Product[];
  onOpenProduct: (id: string) => void;
  onGoShop: () => void;
  onPreset: (p: Partial<{ brand: string; model: string; partType: string }>) => void;
  search: string;
  setSearch: (v: string) => void;
  newsletterEmail: string;
  setNewsletterEmail: (v: string) => void;
  onNewsletter: () => void;
  t: (k: any) => string;
}) {
  const slides = useMemo(() => {
    const hero = (props.settings.heroImage ?? "").trim();
    return hero ? [hero, ...fallbackSlides] : fallbackSlides;
  }, [props.settings.heroImage]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((x) => (x + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  const featured = useMemo(() => {
    const ids = props.settings.featuredProductIds ?? [];
    if (!ids.length) return props.products.slice(0, 8);
    const map = new Map(props.products.map((p) => [p.id, p] as const));
    return ids.map((id) => map.get(id)).filter(Boolean) as Product[];
  }, [props.products, props.settings.featuredProductIds]);

  const testimonials: Testimonial[] = (props.settings.testimonials ?? []).length
    ? (props.settings.testimonials ?? [])
    : [
        { name: "Kasun", text: "Fast delivery and original parts. Highly recommended!", rating: 5 },
        { name: "Nimali", text: "Great customer support via WhatsApp. Very helpful.", rating: 5 },
        { name: "Tharindu", text: "Quality accessories for a fair price.", rating: 4 },
      ];

  const categories = [
    { label: "iPhone Parts", icon: Smartphone, preset: { brand: "Apple" } },
    { label: "Samsung Parts", icon: Smartphone, preset: { brand: "Samsung" } },
    { label: "Accessories", icon: Cable, preset: { partType: "Accessories" } },
    { label: "Repair Tools", icon: Wrench, preset: { partType: "Repair Tools" } },
    { label: "Charging", icon: Cable, preset: { partType: "Charging" } },
  ];

  const modelBrands = ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Huawei", "Oppo", "Vivo"];

  return (
    <div>
      <Container>
        {/* Hero */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="relative overflow-hidden">
            <div className="relative aspect-[16/10] w-full sm:aspect-[16/7]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.65 }}
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.25)), url(${slides[idx]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </AnimatePresence>

              <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-8">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-pure-white/10 bg-pure-white/5 px-3 py-1 text-xs font-semibold text-pure-white/80">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    Sri Lanka • Island-wide delivery
                  </div>
                  <h1 className="mt-4 font-[Poppins] text-2xl font-bold leading-tight text-pure-white sm:text-4xl">
                    SR MOBILE
                    <span className="block text-pure-white/70 text-base sm:text-xl font-semibold mt-1">
                      {props.t("tagline")}
                    </span>
                  </h1>
                  <p className="mt-3 text-sm text-pure-white/70">
                    Premium parts, accessories, and repair tools—curated for popular phone models.
                  </p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Button onClick={props.onGoShop}>Shop Now</Button>
                    <Button
                      variant="secondary"
                      onClick={() => window.open("https://wa.me/94726306039", "_blank")}
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </Button>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={`h-2 w-7 rounded-full transition ${i === idx ? "bg-[var(--accent)]" : "bg-pure-white/20 hover:bg-pure-white/30"}`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Right side cards */}
          <div className="grid gap-4">
            <Card className="p-5">
              <div className="text-sm font-semibold text-white">Search</div>
              <div className="mt-3">
                <Input
                  value={props.search}
                  onChange={(v) => {
                    props.setSearch(v);
                    props.onGoShop();
                  }}
                  placeholder={props.t("searchPlaceholder")}
                />
              </div>
              <p className="mt-3 text-xs text-white/50">
                Tip: Search by model (e.g., iPhone 13) or part name (e.g., screen, battery, cable).
              </p>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold text-white">Today’s Promise</div>
              <div className="mt-3 grid gap-2 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#00b4d8]" /> Free delivery (Sri Lanka)
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-[#ff6b00]" /> 14-day returns
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-white/60" /> Secure checkout
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick categories */}
        <div className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Quick Categories</div>
              <div className="text-xs text-white/50">Tap to filter shop instantly</div>
            </div>
            <button className="text-sm font-semibold text-[#00b4d8] hover:underline" onClick={props.onGoShop}>
              View all
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <button
                key={c.label}
                onClick={() => {
                  props.onPreset(c.preset);
                  props.onGoShop();
                }}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 group-hover:bg-white/10">
                    <c.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-white">{c.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Shop by model */}
        <div className="mt-10">
          <div className="text-sm font-semibold text-white">Shop by Phone Model</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {modelBrands.map((b) => (
              <button
                key={b}
                onClick={() => {
                  props.onPreset({ brand: b });
                  props.onGoShop();
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left hover:bg-white/[0.06]"
              >
                <div className="text-sm font-semibold text-white">{b}</div>
                <div className="text-xs text-white/50">Parts & accessories</div>
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Featured Products</div>
              <div className="text-xs text-white/50">Hand-picked by admin (or newest)</div>
            </div>
            <Button variant="secondary" onClick={props.onGoShop}>
              Shop
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <button
                key={p.id}
                onClick={() => props.onOpenProduct(p.id)}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-white/5">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,180,216,0.25),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,107,0,0.2),transparent_45%)]" />
                  )}
                </div>
                <div className="mt-3">
                  <div className="line-clamp-2 text-sm font-semibold text-white">{p.name}</div>
                  <div className="mt-1 text-xs text-white/50">
                    {p.brand} • {p.model} • {p.partType}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="font-[Poppins] text-sm font-bold text-white">Rs. {Number(p.price).toLocaleString()}</div>
                    <Stars value={p.rating ?? 0} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12">
          <div className="text-sm font-semibold text-white">Testimonials</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {testimonials.slice(0, 6).map((x, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{x.name}</div>
                  <Stars value={x.rating} />
                </div>
                <p className="mt-3 text-sm text-white/70">“{x.text}”</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12">
          <Card className="p-5 sm:p-7">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="font-[Poppins] text-lg font-bold text-white">{props.t("newsletterTitle")}</div>
                <p className="mt-1 text-sm text-white/60">No spam. Only deals and restock alerts.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={props.newsletterEmail} onChange={props.setNewsletterEmail} placeholder="Email" />
                <Button onClick={props.onNewsletter} className="shrink-0">
                  {props.t("newsletterCta")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
