import { useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Home, Search, ShoppingCart, Truck, User2, Wrench, Heart } from "lucide-react";

import { Navbar, type ViewKey } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { Container, Spinner } from "@/components/ui";

import { useI18n } from "@/lib/i18n";
import { getHashQuery, setHash, useHashView } from "@/lib/useHashView";
import { ensureUserDoc, logout, subscribeAuth, type UserProfile } from "@/lib/firebase";
import {
  addNewsletter,
  subscribePayHere,
  subscribeProducts,
  subscribeSettings,
} from "@/lib/api";
import type { PayHereSettings, Product, SiteSettings } from "@/lib/types";
import {
  addToCart,
  cartCount,
  clearCart,
  loadCart,
  loadWishlist,
  removeFromCart,
  saveCart,
  saveWishlist,
  setQty,
  toggleWishlist,
  type CartState,
} from "@/lib/cart";

import { HomePage } from "@/pages/Home";
import { ShopPage, type ShopFilters } from "@/pages/Shop";
import { ProductDetailPage } from "@/pages/ProductDetail";
import { CartPage } from "@/pages/Cart";
import { CheckoutPage } from "@/pages/Checkout";
import { TrackingPage } from "@/pages/Tracking";
import { AccountPage } from "@/pages/Account";
import { ContactPage } from "@/pages/Contact";
import { AdminPage } from "@/pages/Admin";
import { PolicyPage } from "@/pages/Policy";

const DEFAULT_SETTINGS: SiteSettings = {
  deliveryCharge: 500,
  phone: "0726306039",
  address: "Galle, Sri Lanka",
  heroImage: "",
  aboutText: "",
  featuredProductIds: [],
  testimonials: [],
};

const DEFAULT_PAYHERE: PayHereSettings = {
  enabled: false,
  merchantId: "",
  merchantSecret: "",
  sandbox: true,
  returnUrl: typeof window !== "undefined" ? window.location.href : "",
  cancelUrl: typeof window !== "undefined" ? window.location.href : "",
  notifyUrl: typeof window !== "undefined" ? window.location.href : "",
};

export default function App() {
  const { lang, setLang, t } = useI18n();
  const { view, setView } = useHashView();

  const [search, setSearch] = useState("");

  // Firebase-backed state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [payhere, setPayhere] = useState<PayHereSettings>(DEFAULT_PAYHERE);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Cart + wishlist
  const [cart, setCart] = useState<CartState>(() => loadCart());
  const [wishlist, setWishlist] = useState<string[]>(() => loadWishlist());

  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const [newsletterEmail, setNewsletterEmail] = useState("");

  // Shop filters
  const [filters, setFilters] = useState<ShopFilters>({
    brand: "",
    model: "",
    partType: "",
    minPrice: "",
    maxPrice: "",
    ratingMin: "",
    sort: "popularity",
  });

  // Selected product (deep-link via hash query)
  const [selectedId, setSelectedId] = useState<string>("");
  const [accountTab, setAccountTab] = useState<"orders" | "profile" | "wishlist">("orders");

  useEffect(() => {
    const q = getHashQuery();
    const pid = q.get("pid");
    if (pid) setSelectedId(pid);
  }, [view]);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    saveWishlist(wishlist);
  }, [wishlist]);

  // Firebase subscriptions
  useEffect(() => {
    const unsubAuth = subscribeAuth(async (u) => {
      setAuthLoading(true);
      try {
        if (!u) {
          setProfile(null);
          return;
        }
        const prof = await ensureUserDoc(u);
        setProfile(prof);
      } finally {
        setAuthLoading(false);
      }
    });

    const unsubSettings = subscribeSettings(setSettings);
    const unsubPayHere = subscribePayHere(setPayhere);

    const unsubProducts = subscribeProducts((arr) => {
      setProducts(arr);
      setProductsLoading(false);
    });

    return () => {
      unsubAuth();
      unsubSettings();
      unsubPayHere();
      unsubProducts();
    };
  }, []);

  const isAdmin = profile?.role === "admin";

  const selectedProduct = useMemo(() => products.find((p) => p.id === selectedId) ?? null, [products, selectedId]);

  function openProduct(id: string) {
    setSelectedId(id);
    setHash("product", { pid: id });
  }

  function addCartProduct(p: Product, qty = 1) {
    setCart((c) => addToCart(c, { productId: p.id, name: p.name, price: Number(p.price), image: p.images?.[0] }, qty));
    toast.success("Added to cart");
  }

  function buyNow(p: Product, qty = 1) {
    addCartProduct(p, qty);
    setView("checkout");
  }

  async function onNewsletter() {
    const email = newsletterEmail.trim();
    if (!email) return toast.error("Enter email");
    await addNewsletter(email);
    setNewsletterEmail("");
    toast.success("Subscribed");
  }

  async function onLogout() {
    await logout();
    toast.success("Logged out");
    setView("home");
  }

  const count = cartCount(cart);

  // Hidden-div pages rendering helper
  const show = (k: ViewKey) => (view === k ? "" : "hidden");

  return (
    <div className="min-h-screen text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#111111",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          },
        }}
      />

      {/* Animated backdrop blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#0073fe]/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 top-24 h-80 w-80 rounded-full bg-[#ff6b00]/8 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Navbar
        view={view}
        setView={setView}
        search={search}
        setSearch={setSearch}
        cartCount={count}
        profile={profile}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={onLogout}
        lang={lang}
        setLang={setLang}
        t={t as any}
        rightSlot={authLoading ? <Spinner className="hidden md:flex" /> : null}
      />

      {/* PAGES (hidden divs) */}
      <div className={show("home")}>
        <HomePage
          settings={settings}
          products={products}
          onOpenProduct={openProduct}
          onGoShop={() => setView("shop")}
          onPreset={(p) => {
            setFilters((f) => ({
              ...f,
              brand: p.brand ?? f.brand,
              model: p.model ?? f.model,
              partType: p.partType ?? f.partType,
            }));
            setView("shop");
          }}
          search={search}
          setSearch={setSearch}
          newsletterEmail={newsletterEmail}
          setNewsletterEmail={setNewsletterEmail}
          onNewsletter={onNewsletter}
          t={t as any}
          wishlist={wishlist}
          toggleWishlist={(id) => setWishlist((prev) => toggleWishlist(prev, id))}
        />
      </div>

      <div className={show("shop")}>
        <ShopPage
          products={products}
          search={search}
          filters={filters}
          setFilters={setFilters}
          onOpenProduct={openProduct}
          onAddToCart={(p) => addCartProduct(p, 1)}
          wishlist={wishlist}
          toggleWishlist={(id) => setWishlist((prev) => toggleWishlist(prev, id))}
          t={t as any}
        />
      </div>

      <div className={show("product")}>
        {selectedProduct ? (
          <ProductDetailPage
            product={selectedProduct}
            allProducts={products}
            profile={profile}
            onAddToCart={(p, qty) => addCartProduct(p, qty)}
            onBuyNow={(p, qty) => buyNow(p, qty)}
            onOpenProduct={openProduct}
          />
        ) : (
          <Container>
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              {productsLoading ? <Spinner label="Loading product..." /> : <div className="text-white/70">Product not found.</div>}
            </div>
          </Container>
        )}
      </div>

      <div className={show("cart")}>
        <CartPage
          cart={cart}
          setCoupon={(c) => setCart((prev) => ({ ...prev, coupon: c }))}
          onQty={(pid, qty) => setCart((c) => setQty(c, pid, qty))}
          onRemove={(pid) => setCart((c) => removeFromCart(c, pid))}
          deliveryCharge={settings.deliveryCharge ?? 500}
          onCheckout={() => setView("checkout")}
        />
      </div>

      <div className={show("checkout")}>
        <CheckoutPage
          cart={cart}
          clearCart={() => setCart(clearCart())}
          settings={settings}
          payhere={payhere}
          profile={profile}
          view={view}
        />
      </div>

      <div className={show("track")}>
        <TrackingPage />
      </div>

      <div className={show("account")}>
        {profile ? (
          <AccountGate
            profile={profile}
            products={products}
            wishlist={wishlist}
            setWishlist={setWishlist}
            settings={settings}
            tab={accountTab}
            setTab={setAccountTab}
          />
        ) : (
          <NeedLogin />
        )}
      </div>

      <div className={show("contact")}>
        <ContactPage settings={settings} />
      </div>

      <div className={show("admin")}>
        {isAdmin && profile ? (
          <AdminPage products={products} settings={settings} payhere={payhere} profile={profile} />
        ) : (
          <Container>
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
              Admin access only.
            </div>
          </Container>
        )}
      </div>

      <div className={show("about")}>
        <PolicyPage kind="about" settings={settings} />
      </div>
      <div className={show("privacy")}>
        <PolicyPage kind="privacy" settings={settings} />
      </div>
      <div className={show("refund")}>
        <PolicyPage kind="refund" settings={settings} />
      </div>
      <div className={show("terms")}>
        <PolicyPage kind="terms" settings={settings} />
      </div>

      {/* Global footer */}
      <Footer settings={settings} setView={setView} />

      {/* Floating WhatsApp (mobile) with notification badge */}
      <button
        className="fixed bottom-22 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-xl shadow-green-500/30 hover:scale-105 transition-transform focus:outline-none sm:bottom-6"
        onClick={() => window.open("https://wa.me/94726306039", "_blank")}
      >
        <svg viewBox="0 0 24 24" className="h-7.5 w-7.5 fill-current">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.936 9.936 0 0 0 4.777 1.224h.005c5.505 0 9.99-4.478 9.991-9.986 0-2.67-1.037-5.178-2.923-7.065C17.198 2.915 14.69 2 12.012 2zm5.726 14.122c-.274.767-1.353 1.397-1.859 1.455-.466.053-.948.077-2.6-.59-2.227-.899-3.662-3.153-3.774-3.302-.112-.149-.912-1.21-1.01-2.28-.1-.1-.53-.59-.72-.9-.12-.2-.25-.39-.23-.62.03-.31.18-.46.28-.56.09-.1.2-.14.29-.14.1 0 .19.01.27.01.09 0 .2.02.31.25.12.27.42 1.02.46 1.1.04.08.06.18.01.28-.05.1-.1.21-.17.29-.07.08-.15.17-.22.25-.08.08-.16.18-.07.34.09.16.4 0.66.86 1.07.59.53 1.09.83 1.25.91.16.08.26.07.36-.05.1-.12.43-.5.55-.67.12-.17.24-.15.4-.09.16.06 1 .47 1.17.56.17.09.28.13.32.2.04.07.04.41-.09.78z" />
        </svg>
        <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#ff2d2d] text-[10px] font-black text-white ring-2 ring-white animate-bounce">
          1
        </span>
      </button>

      {/* Mobile bottom dock (Matches Celltronics screenshot) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-[#ffffff] backdrop-blur sm:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-1">
          <DockBtn
            active={view === "shop" || view === "home"}
            label="Shop"
            icon={<Search className="h-5.5 w-5.5" />}
            onClick={() => setView("shop")}
          />
          <DockBtn
            active={view === "account" && accountTab === "wishlist"}
            label="Wishlist"
            icon={<Heart className="h-5.5 w-5.5" />}
            onClick={() => {
              if (profile) {
                setAccountTab("wishlist");
                setView("account");
              } else {
                setAuthOpen(true);
              }
            }}
          />
          <DockBtn
            active={view === "cart"}
            label="Cart"
            icon={
              <div className="relative">
                <ShoppingCart className="h-5.5 w-5.5" />
                <span className="absolute -right-2 -top-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#0073fe] px-1 text-[9px] font-black text-white">
                  {count}
                </span>
              </div>
            }
            onClick={() => setView("cart")}
          />
          <DockBtn
            active={view === "account" && accountTab !== "wishlist"}
            label="My account"
            icon={<User2 className="h-5.5 w-5.5" />}
            onClick={() => {
              if (profile) {
                setAccountTab("orders");
                setView("account");
              } else {
                setAuthOpen(true);
              }
            }}
          />
        </div>
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setCoupon={(code) => setCart((c) => ({ ...c, coupon: code }))}
        onQty={(pid, qty) => setCart((c) => setQty(c, pid, qty))}
        onRemove={(pid) => setCart((c) => removeFromCart(c, pid))}
        deliveryCharge={settings.deliveryCharge ?? 500}
        onCheckout={() => {
          setCartOpen(false);
          setView("checkout");
        }}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Preload some icon to keep Vite tree-shaking happy */}
      <div className="hidden">
        <Wrench />
      </div>
    </div>
  );
}

function DockBtn(props: { active: boolean; label: string; icon: any; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold ${
        props.active ? "text-[#00b4d8]" : "text-white/60"
      }`}
    >
      {props.icon}
      {props.label}
    </button>
  );
}

function NeedLogin() {
  return (
    <Container>
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
        Please login to view your account.
      </div>
    </Container>
  );
}

function AccountGate(props: {
  profile: UserProfile;
  products: Product[];
  wishlist: string[];
  setWishlist: (ids: string[]) => void;
  settings: SiteSettings;
  tab: "orders" | "profile" | "wishlist";
  setTab: (t: "orders" | "profile" | "wishlist") => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: any = null;
    (async () => {
      const { subscribeMyOrders } = await import("@/lib/api");
      unsub = subscribeMyOrders(props.profile.email, (arr) => {
        setOrders(arr as any);
        setLoading(false);
      });
    })();
    return () => {
      if (unsub) unsub();
    };
  }, [props.profile.email]);

  return (
    <AccountPage
      profile={props.profile}
      orders={orders as any}
      ordersLoading={loading}
      wishlist={props.wishlist}
      products={props.products}
      toggleWishlist={(id) => props.setWishlist(toggleWishlist(props.wishlist, id))}
      adminPhone={props.settings.phone || "0726306039"}
      tab={props.tab}
      setTab={props.setTab}
    />
  );
}
