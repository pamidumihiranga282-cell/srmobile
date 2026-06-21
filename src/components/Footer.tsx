import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { Container } from "./ui";
import type { ViewKey } from "./Navbar";
import type { SiteSettings } from "@/lib/types";

export function Footer(props: { settings: SiteSettings; setView: (v: ViewKey) => void }) {
  const link = (key: ViewKey, label: string) => (
    <button className="text-left text-sm text-white/60 hover:text-white" onClick={() => props.setView(key)}>
      {label}
    </button>
  );

  return (
    <footer className="mt-14 border-t border-white/10 bg-black/30">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-[Poppins] text-lg font-bold text-white">SR MOBILE</div>
            <p className="mt-2 text-sm text-white/60">
              Life to your phone – Premium Phone Parts & Accessories
              <br />
              Galle, Sri Lanka
            </p>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#00b4d8]" />
                <a className="hover:text-white" href={`tel:${props.settings.phone || "0726306039"}`}>
                  {props.settings.phone || "0726306039"}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-[#ff6b00]" />
                <div>{props.settings.address || "Galle, Sri Lanka"}</div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-white/60" />
                <span>Secure checkout • Trusted parts • Fast delivery</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Quick Links</div>
            <div className="mt-3 grid gap-2">
              {link("home", "Home")}
              {link("shop", "Shop")}
              {link("track", "Order Tracking")}
              {link("contact", "Contact")}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Legal</div>
            <div className="mt-3 grid gap-2">
              {link("about", "About Us")}
              {link("privacy", "Privacy Policy")}
              {link("refund", "Refund & Return Policy")}
              {link("terms", "Terms & Conditions")}
            </div>
            <div className="mt-4 text-xs text-white/40 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>© {new Date().getFullYear()} SR MOBILE. All rights reserved.</span>
              <span className="hidden sm:inline text-white/20">|</span>
              <span>
                Developed by{" "}
                <a
                  href="https://wa.me/94786800086"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white/60 hover:text-[#00b4d8] transition-colors"
                >
                  SmartZone (078 68000 86)
                </a>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
