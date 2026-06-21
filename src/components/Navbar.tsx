import { motion } from "framer-motion";
import { LayoutDashboard, LogIn, LogOut, Search, ShoppingCart, User2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Button, Container, Input } from "./ui";
import type { Lang } from "@/lib/i18n";
import type { UserProfile } from "@/lib/firebase";
import logoSrc from "@/assets/logo.png";

export type ViewKey =
  | "home"
  | "shop"
  | "product"
  | "cart"
  | "checkout"
  | "track"
  | "account"
  | "contact"
  | "admin"
  | "about"
  | "privacy"
  | "refund"
  | "terms";

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

  const navItem = (key: ViewKey, label: string) => (
    <button
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-white/10",
        props.view === key ? "bg-white/10 text-white" : "text-white/70"
      )}
      onClick={() => props.setView(key)}
    >
      {label}
    </button>
  );

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-[var(--bg0)]/80 backdrop-blur">
      <Container className="py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => props.setView("home")}
            className="group flex items-center gap-2 rounded-2xl px-1 py-1"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <img
              src={logoSrc}
              alt="SR Mobile Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-contain drop-shadow-[0_0_8px_rgba(0,115,254,0.3)] transition group-hover:drop-shadow-[0_0_12px_rgba(0,115,254,0.5)]"
            />
            <div className="hidden sm:block text-left">
              <div className="font-[Poppins] text-sm font-bold tracking-wide text-white">SR MOBILE</div>
              <div className="text-xs text-white/50 leading-tight">{props.t("tagline")}</div>
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

        {/* Mobile search */}
        <div className="mt-3 md:hidden">
          <div className="relative">
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

          <div className="mt-2 flex flex-wrap gap-2">
            {navItem("home", props.t("home"))}
            {navItem("shop", props.t("shop"))}
            {navItem("track", props.t("track"))}
            {navItem("contact", props.t("contact"))}
            {props.profile ? navItem("account", props.t("account")) : null}
            {isAdmin ? navItem("admin", props.t("admin")) : null}
          </div>
        </div>
      </Container>
    </div>
  );
}
