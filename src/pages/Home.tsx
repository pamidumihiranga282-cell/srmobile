import { AnimatePresence, motion } from "framer-motion";
import { Wrench, Smartphone, Cable, ShieldCheck, Truck, RotateCcw, MessageCircle, Heart, Key } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product, SiteSettings, Testimonial } from "@/lib/types";
import { Button, Card, Container, Input } from "@/components/ui";
import { Stars } from "@/components/Stars";
import { cn } from "@/utils/cn";

import heroBanner from "@/assets/hero_banner.png";
import watchBanner1 from "@/assets/watch_banner1.png";
import watchBanner2 from "@/assets/watch_banner2.png";

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
  wishlist?: string[];
  toggleWishlist?: (id: string) => void;
}) {
  const slides = useMemo(() => {
    return [heroBanner];
  }, []);

  const [idx, setIdx] = useState(0);

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
    { label: "Unlock Tools on Rent", icon: Key, preset: { partType: "Unlock Tools on Rent" } },
  ];

  return (
    <div className="pb-16 text-[#111111]">
      <Container className="px-0 sm:px-4">
        {/* Full-width Hero Banner Slider (Celltronics Screenshot Look) */}
        <div className="relative overflow-hidden w-full sm:mt-6 sm:rounded-2xl shadow-sm">
          <div className="relative aspect-[16/6] w-full sm:aspect-[16/5.5]">
            <img
              src={slides[idx]}
              alt="Promo Banner"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        {/* 2-Grid Watch Category Promo Banners */}
        <div className="mt-4 px-4 sm:px-0 grid grid-cols-2 gap-3.5">
          <button
            onClick={() => {
              props.onPreset({ partType: "Accessories" });
              props.onGoShop();
            }}
            className="group relative overflow-hidden rounded-2xl bg-pure-white shadow-sm border border-gray-100 aspect-[1.8/1] active:scale-[0.98] transition-transform"
          >
            <img
              src={watchBanner1}
              alt="Apple Watch Series 11 & Ultra 3"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
          <button
            onClick={() => {
              props.onPreset({ partType: "Accessories" });
              props.onGoShop();
            }}
            className="group relative overflow-hidden rounded-2xl bg-pure-white shadow-sm border border-gray-100 aspect-[1.8/1] active:scale-[0.98] transition-transform"
          >
            <img
              src={watchBanner2}
              alt="Samsung Galaxy Watch 8 & 8 Classic"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        </div>

        {/* Quick categories */}
        <div className="mt-8 px-4 sm:px-0">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-gray-800 uppercase tracking-wide">Quick Categories</div>
              <div className="text-xs text-gray-500">Tap to filter shop instantly</div>
            </div>
            <button className="text-sm font-bold text-[#0073fe] hover:underline" onClick={props.onGoShop}>
              View all
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <button
                key={c.label}
                onClick={() => {
                  props.onPreset(c.preset);
                  props.onGoShop();
                }}
                className="group rounded-2xl border border-gray-100 bg-pure-white p-4 text-left transition shadow-sm hover:border-[#0073fe]/30 hover:bg-gray-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gray-50 group-hover:bg-[#0073fe]/10">
                    <c.icon className="h-5 w-5 text-gray-600 group-hover:text-[#0073fe]" />
                  </div>
                  <div className="text-sm font-bold text-gray-700">{c.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Latest Mobile Phones Header with Blue Line */}
        <div className="mt-10 px-4 sm:px-0">
          <div className="border-b-2 border-gray-200/80 pb-1 relative">
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-800 font-[Poppins]">
              LATEST MOBILE PHONES
            </h2>
            <div className="absolute bottom-[-2px] left-0 w-24 h-0.5 bg-[#0073fe]" />
          </div>

          {/* Product Grid (Matches Celltronics screenshot) */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => {
              const isWishlisted = props.wishlist?.includes(p.id) ?? false;
              return (
                <div
                  key={p.id}
                  onClick={() => props.onOpenProduct(p.id)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-pure-white p-3 text-left transition shadow-sm hover:border-gray-200/80 hover:shadow-md cursor-pointer"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50/50">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-gray-100 to-gray-50" />
                    )}

                    {/* Overlay Heart/Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        props.toggleWishlist?.(p.id);
                      }}
                      className={cn(
                        "absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-pure-white shadow-sm transition hover:scale-105 active:scale-95",
                        isWishlisted ? "border-[#0073fe]" : "border-gray-200"
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-4.5 w-4.5 transition-colors",
                          isWishlisted ? "fill-[#0073fe] text-[#0073fe]" : "text-gray-400"
                        )}
                      />
                    </button>
                  </div>

                  <div className="mt-3.5 flex flex-col flex-grow">
                    <div className="line-clamp-2 text-sm font-bold text-gray-800 leading-snug group-hover:text-[#0073fe] transition-colors">
                      {p.name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-gray-400">
                      {p.brand} • {p.model}
                    </div>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <div className="font-[Poppins] text-sm font-black text-gray-800">
                        Rs. {Number(p.price).toLocaleString()}
                      </div>
                      <Stars value={p.rating ?? 0} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12 px-4 sm:px-0">
          <div className="text-sm font-bold text-gray-800 uppercase tracking-wide">Testimonials</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {testimonials.slice(0, 6).map((x, i) => (
              <Card key={i} className="p-5 border border-gray-100 bg-pure-white shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-gray-700">{x.name}</div>
                  <Stars value={x.rating} />
                </div>
                <p className="mt-3 text-sm text-gray-500 italic font-medium leading-relaxed">“{x.text}”</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 px-4 sm:px-0">
          <Card className="p-5 sm:p-7 border border-gray-100 bg-pure-white shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="font-[Poppins] text-lg font-bold text-gray-800">{props.t("newsletterTitle")}</div>
                <p className="mt-1 text-sm text-gray-500">No spam. Only deals and restock alerts.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={props.newsletterEmail} onChange={props.setNewsletterEmail} placeholder="Email" className="border-gray-200 text-gray-800" />
                <Button onClick={props.onNewsletter} className="shrink-0 bg-[#0073fe] hover:bg-[#0056b3]">
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
