import { useEffect, useMemo, useState } from "react";

export type Lang = "en" | "si";

const LS_KEY = "sr_lang";

const dict = {
  en: {
    brand: "SR MOBILE",
    tagline: "Life to your phone – Premium Phone Parts & Accessories",
    searchPlaceholder: "Search by model or part name",
    home: "Home",
    shop: "Shop",
    track: "Order Tracking",
    account: "Account",
    contact: "Contact",
    admin: "Admin",
    login: "Login",
    logout: "Logout",
    register: "Register",
    cart: "Cart",
    checkout: "Checkout",
    buyNow: "Buy Now",
    addToCart: "Add to Cart",
    qty: "Qty",
    filters: "Filters",
    sort: "Sort",
    settings: "Settings",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    new: "New",
    newsletterTitle: "Get offers & restock alerts",
    newsletterCta: "Join Newsletter",
    aboutUs: "About Us",
    privacy: "Privacy Policy",
    refund: "Refund & Return Policy",
    terms: "Terms & Conditions",
  },
  si: {
    brand: "SR MOBILE",
    tagline: "Life to your phone – Premium Phone Parts & Accessories",
    searchPlaceholder: "Model හෝ part name අනුව සොයන්න",
    home: "මුල් පිටුව",
    shop: "අලෙවිසැල",
    track: "ඇණවුම් ට්‍රැක් කිරීම",
    account: "ගිණුම",
    contact: "සම්බන්ධ වන්න",
    admin: "පාලනය",
    login: "ඇතුල්වන්න",
    logout: "පිටවන්න",
    register: "ලියාපදිංචිවන්න",
    cart: "කාර්ට්",
    checkout: "ගෙවීම",
    buyNow: "දැන් මිලදීගන්න",
    addToCart: "කාර්ට් එකට",
    qty: "ගණන",
    filters: "පෙරහන්",
    sort: "සකසන්න",
    settings: "සැකසුම්",
    save: "සුරකින්න",
    cancel: "අවලංගු",
    delete: "මකන්න",
    edit: "සංස්කරණය",
    new: "නව",
    newsletterTitle: "Offer & restock දැනුම්දීම සඳහා",
    newsletterCta: "Newsletter එකට",
    aboutUs: "අප ගැන",
    privacy: "පෞද්ගලිකත්ව ප්‍රතිපත්තිය",
    refund: "ආපසු/ආපසු ගෙවීම් ප්‍රතිපත්තිය",
    terms: "නියම සහ කොන්දේසි",
  },
} as const;

export function getInitialLang(): Lang {
  const v = (localStorage.getItem(LS_KEY) as Lang | null) ?? "en";
  return v === "si" ? "si" : "en";
}

export function useI18n() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return getInitialLang();
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const t = useMemo(() => {
    const table = dict[lang];
    return (key: keyof typeof table) => table[key] ?? (key as string);
  }, [lang]);

  return { lang, setLang, t };
}
