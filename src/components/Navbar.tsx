import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, LogIn, LogOut, Search, ShoppingCart, User2, Menu, Wifi, X, Truck, Phone, Info } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Button, Container, Input } from "./ui";
import type { Lang } from "@/lib/i18n";
import type { UserProfile } from "@/lib/firebase";
import type { ViewKey } from "./Navbar";

export function Navbar(props: {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  search: string;
  setSearch: (v: string) => void;
  cartCount: number;
  profile: UserProfile | null;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: any) => string;
  rightSlot?: ReactNode;
}) {
  const isAdmin = props.profile?.role === "admin";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItem = (key: ViewKey, label: string) => (
    <button
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-white/10",
        props.view === key ? "bg-white/10 text-white" : "text-white/70"
      )}
      onClick={() => {
        props.setView(key);
        setMobileMenuOpen(false);
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="sticky top-0 z-30 w-full">
      {/* Mobile Top Blue Bar (Screenshot Celltronics Look) */}
      <div className="bg-[#0073fe] py-3.5 px-4 shadow-md sm:hidden">
        <div className="flex items-center justify-between">
          {/* Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 focus:outline-none"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-white" />
            <span className="text-xs font-black uppercase tracking-wider text-white">MENU</span>
          </button>

          {/* Centered CELLTRONICS style logo */}
          <div className="flex items-center justify-center">
            <span className="font-[Poppins] text-xl font-black italic tracking-wide text-white">
              SR MOBILE
            </span>
            <div className="relative -top-1 ml-0.5">
              <Wifi className="h-4 w-4 rotate-45 text-white animate-pulse" />
            </div>
          </div>

          {/* Cart Icon with badge */}
          <button
            onClick={props.onOpenCart}
            className="relative flex items-center justify-center focus:outline-none"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-6 w-6 text-white" />
            {props.cartCount > 0 ? (
              <span className="absolute -right-2.5 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-[#0073fe] shadow-sm">
                {props.cartCount}
              </span>
            ) : (
              <span className="absolute -right-2.5 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-bold text-white">
                0
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Input directly below blue header (Matches Celltronics screenshot) */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 sm:hidden">
        <div className="relative">
          <input
            type="text"
            value={props.search}
            onChange={(e) => {
              props.setSearch(e.target.value);
              if (props.view !== "shop") props.setView("shop");
            }}
            placeholder="Search for products"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-[#111111] placeholder:text-gray-400 focus:border-[#0073fe] focus:outline-none focus:ring-1 focus:ring-[#0073fe]"
          />
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Desktop / Tablet Navbar */}
      <div className="hidden sm:block border-b border-white/10 bg-[var(--bg0)]/80 backdrop-blur py-3">
        <Container>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => props.setView("home")}
              className="group flex items-center gap-2 rounded-2xl px-1 py-1"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center text-left">
                <span className="font-[Poppins] text-lg font-bold tracking-wide text-white">SR MOBILE</span>
                <Wifi className="h-4 w-4 rotate-45 text-[#0073fe] ml-1" />
              </div>
            </motion.button>

            <div className="hidden lg:flex items-center gap-1">
              {navItem("home", props.t("home"))}
              {navItem("shop", props.t("shop"))}
              {navItem("track", props.t("track"))}
              {navItem("contact", props.t("contact"))}
              {props.profile ? navItem("account", props.t("account")) : null}
              {isAdmin ? navItem("admin", props.t("admin")) : null}
            </div>

            <div className="ml-auto flex flex-1 items-center justify-end gap-2">
              <div className="hidden md:flex w-full max-w-xl items-center gap-2">
                <div className="relative w-full">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <Search className="h-4 w-4" />
                  </div>
                  <Input
                    value={props.search}
                    onChange={(v) => {
                      props.setSearch(v);
                      if (props.view !== "shop") props.setView("shop");
                    }}
                    placeholder={props.t("searchPlaceholder")}
                    className="pl-9"
                  />
                </div>
              </div>

              <button
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10"
                onClick={props.onOpenCart}
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
                {props.cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff6b00] px-1 text-[11px] font-black text-black">
                    {props.cartCount}
                  </span>
                ) : null}
              </button>

              <button
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white/5 px-3 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => props.setLang(props.lang === "en" ? "si" : "en")}
                aria-label="Toggle language"
                title="English / සිංහල"
              >
                {props.lang === "en" ? "EN" : "සි"}
              </button>

              {props.profile ? (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">
                    {isAdmin ? (
                      <LayoutDashboard className="h-4 w-4 text-[#00b4d8]" />
                    ) : (
                      <User2 className="h-4 w-4 text-white/70" />
                    )}
                    <span className="max-w-[180px] truncate text-sm font-semibold text-white">
                      {props.profile.name || props.profile.email}
                    </span>
                  </div>
                  <Button variant="ghost" onClick={props.onLogout} className="h-10 px-3">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:block">{props.t("logout")}</span>
                  </Button>
                </div>
              ) : (
                <Button onClick={props.onOpenAuth} className="h-10 px-3">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:block">{props.t("login")}</span>
                </Button>
              )}

              {props.rightSlot}
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile Slide-out/Dropdown Menu overlay (Hamburger Menu) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex sm:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Menu panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex w-4/5 max-w-sm flex-col bg-white p-5 text-[#111111] shadow-2xl h-full"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <span className="font-[Poppins] text-lg font-black italic tracking-wide text-[#0073fe]">
                  SR MOBILE Menu
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    props.setView("home");
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    props.view === "home" ? "bg-[#0073fe]/10 text-[#0073fe]" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    props.setView("shop");
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    props.view === "shop" ? "bg-[#0073fe]/10 text-[#0073fe]" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  Shop Products
                </button>
                <button
                  onClick={() => {
                    props.setView("track");
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    props.view === "track" ? "bg-[#0073fe]/10 text-[#0073fe]" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Truck className="h-4 w-4" />
                  Track Order
                </button>
                <button
                  onClick={() => {
                    props.setView("contact");
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    props.view === "contact" ? "bg-[#0073fe]/10 text-[#0073fe]" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Phone className="h-4 w-4" />
                  Contact Support
                </button>

                <div className="border-t border-gray-100 my-2 pt-2" />

                <button
                  onClick={() => {
                    props.setLang(props.lang === "en" ? "si" : "en");
                  }}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span>Language</span>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold">
                    {props.lang === "en" ? "English" : "සිංහල"}
                  </span>
                </button>

                {props.profile ? (
                  <>
                    <button
                      onClick={() => {
                        props.setView("account");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <User2 className="h-4 w-4 text-gray-500" />
                      My Account
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          props.setView("admin");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#0073fe] hover:bg-gray-50"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => {
                        props.onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 mt-4"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      props.onOpenAuth();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#0073fe] py-3 text-sm font-bold text-white hover:brightness-110 mt-4 shadow-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In / Register
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
