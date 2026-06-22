import { useEffect, useState } from "react";
import type { ViewKey } from "@/components/Navbar";

export function parseHash(): ViewKey {
  const raw = (window.location.hash || "").replace(/^#/, "");
  const key = raw.split("?")[0];
  const allowed: ViewKey[] = [
    "home",
    "shop",
    "product",
    "cart",
    "checkout",
    "track",
    "account",
    "contact",
    "admin",
    "about",
    "privacy",
    "refund",
    "terms",
  ];
  return (allowed.includes(key as any) ? (key as ViewKey) : "home") as ViewKey;
}

export function setHash(view: ViewKey, query?: Record<string, string>) {
  const queryStr = query
    ? "?" +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    : "";
  window.location.hash = `#${view}${queryStr}`;
}

export function getHashQuery() {
  const raw = (window.location.hash || "").replace(/^#/, "");
  const idx = raw.indexOf("?");
  if (idx === -1) return new URLSearchParams();
  return new URLSearchParams(raw.slice(idx + 1));
}

export function useHashView() {
  const [view, setViewState] = useState<ViewKey>(() => {
    try {
      return parseHash();
    } catch {
      return "home";
    }
  });

  useEffect(() => {
    const on = () => setViewState(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const setView = (v: ViewKey) => {
    setViewState(v);
    setHash(v);
  };

  return { view, setView };
}
