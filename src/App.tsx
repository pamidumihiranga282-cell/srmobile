import { useEffect, useMemo, useRef, useState } from "react";
import {
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBgLGLuQEog9uJ1BF-4aKR0WEiZHPSO46M",
  authDomain: "myweb-7ecb4.firebaseapp.com",
  projectId: "myweb-7ecb4",
  storageBucket: "myweb-7ecb4.firebasestorage.app",
  messagingSenderId: "1027238820127",
  appId: "1:1027238820127:web:7b3d49b74d8151ec53582a",
  measurementId: "G-81JY5FKV0E",
};

// Initialize Firebase (single app instance for the SPA)
let firebaseApp: FirebaseApp;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (e) {
  // In dev with HMR this can throw if initialized twice; fallback to the default instance
  firebaseApp = (globalThis as any).firebaseApp || initializeApp(firebaseConfig);
  (globalThis as any).firebaseApp = firebaseApp;
}

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const ADMIN_EMAIL = "smartzonelk101@gmail.com";

// --- Types & Helpers -----------------------------------------------------------------

type Language = "en" | "si";

// Hidden "pages" rendered as sections in a single SPA container
 type Page =
  | "home"
  | "shop"
  | "product"
  | "checkout"
  | "account"
  | "track"
  | "contact"
  | "admin";

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  partType: string;
  price: number;
  stock: number;
  images: string[];
  description: string;
  specs: string;
  compatibility: string[];
  createdBy?: string;
  createdAt?: Date | null;
  rating?: number;
  popularity?: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  brand?: string;
  model?: string;
}

type UserRole = "admin" | "customer";

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  role: UserRole;
  wishlist?: string[];
}

interface SiteTestimonial {
  id: string;
  name: string;
  text: string;
  role?: string;
}

interface SiteSettings {
  deliveryCharge: number;
  phone: string;
  address: string;
  heroImage?: string;
  aboutText?: string;
  featuredProductIds?: string[];
  testimonials?: SiteTestimonial[];
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

interface Order {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  total: number;
  deliveryCharge: number;
  status: OrderStatus;
  trackingNumber?: string;
  shippingAddress: string;
  city: string;
  zip: string;
  orderDate?: Date | null;
  paymentMethod: "card" | "cod" | "bank";
  notes?: string;
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    brandTagline: "Premium Phone Parts & Accessories",
    navHome: "Home",
    navShop: "Shop",
    navTrack: "Track Order",
    navAccount: "My Account",
    navContact: "Contact",
    navAdmin: "Admin",
    heroTitle: "Premium Phone Parts, Delivered Across Sri Lanka",
    heroSubtitle:
      "Genuine parts, performance-tested accessories, and tools for professional repairs.",
    heroSearchPlaceholder: "Search by model or part name",
    heroCTA: "Shop Now",
    heroSecondaryCTA: "View iPhone Parts",
    quickCategories: "Shop by Category",
    featuredTitle: "Featured Parts & Accessories",
    featuredSubtitle: "Hand-picked best sellers and new arrivals.",
    trustFreeDelivery: "Island-wide Delivery",
    trustReturns: "14-day Easy Returns",
    trustSecure: "Secure Checkout",
    trustWhatsApp: "24/7 WhatsApp Support",
    newsletterTitle: "Stay Ahead of Every Launch",
    newsletterSubtitle:
      "Get stock updates, new arrivals, and exclusive dealer pricing.",
    newsletterPlaceholder: "Enter your email",
    newsletterButton: "Join Newsletter",
    toastSubscribed: "Subscribed to newsletter.",
    toastSubscribedError: "Could not subscribe right now.",
    shopTitle: "Shop All Products",
    filtersTitle: "Filter",
    filterBrand: "Brand",
    filterModel: "Model",
    filterPartType: "Part Type",
    filterPrice: "Price Range",
    filterRating: "Min. Rating",
    sortLabel: "Sort by",
    sortPopular: "Popularity",
    sortNewest: "Newest",
    sortPriceLowHigh: "Price: Low to High",
    sortPriceHighLow: "Price: High to Low",
    addToCart: "Add to Cart",
    buyNow: "Buy Now",
    viewDetails: "View Details",
    quickView: "Quick View",
    emptyProducts: "No products match your filters yet.",
    cartTitle: "Cart",
    cartEmpty: "Your cart is empty.",
    cartSubtotal: "Subtotal",
    cartDelivery: "Delivery",
    cartTotal: "Total",
    cartCouponPlaceholder: "Coupon code (optional)",
    cartApplyCoupon: "Apply",
    cartProceedCheckout: "Proceed to Checkout",
    checkoutTitle: "Checkout",
    checkoutCustomerDetails: "Customer & Delivery Details",
    checkoutPaymentMethod: "Payment Method",
    pmCard: "Card",
    pmCOD: "Cash on Delivery",
    pmBank: "Bank Transfer",
    placeOrder: "Confirm Order",
    orderSuccess: "Order placed successfully.",
    orderFailed: "Failed to place order.",
    authLogin: "Login",
    authRegister: "Create Account",
    authForgot: "Reset Password",
    authEmail: "Email",
    authPassword: "Password",
    authName: "Full Name",
    authPhone: "Phone",
    authLoginGoogle: "Continue with Google",
    authHaveAccount: "Already have an account?",
    authNoAccount: "Don't have an account?",
    authForgotLink: "Forgot password?",
    authResetInfo: "Enter your email to receive a reset link.",
    authResetSent: "Password reset email sent.",
    authLogout: "Logout",
    accountTitle: "My Account",
    accountOrders: "My Orders",
    accountProfile: "Profile",
    accountWishlist: "Wishlist",
    saveChanges: "Save Changes",
    profileUpdated: "Profile updated.",
    trackTitle: "Track Your Order",
    trackPlaceholder: "Enter tracking number",
    trackButton: "Track Order",
    trackNotFound: "Order not found. Check your tracking number.",
    contactTitle: "Contact & Support",
    contactMessagePlaceholder: "How can we help you?",
    contactSend: "Send Message",
    contactSent: "Message sent. We'll get back to you.",
    adminTitle: "Admin Panel",
    adminProducts: "Products",
    adminOrders: "Orders",
    adminUsers: "Users",
    adminSettings: "Site Settings",
    adminHomeContent: "Homepage Content",
    adminNewsletter: "Newsletter",
    statusPending: "Pending",
    statusProcessing: "Processing",
    statusShipped: "Shipped",
    statusDelivered: "Delivered",
    whatsappOrderPlaced: "Opening WhatsApp to confirm your order...",
    whatsappStatusUpdated: "Opening WhatsApp to notify customer...",
    emailSimulated: "Simulated emails sent to customer and admin.",
  },
  si: {
    brandTagline: "උසස් දුරකථන කොටස් සහ ආලංකාර",
    navHome: "මූලික පිටුව",
    navShop: "ද්රව්ය ගබඩාව",
    navTrack: "ඇණවුම හඹා යන්න",
    navAccount: "මගේ ගිණුම",
    navContact: "සම්බන්ධ වන්න",
    navAdmin: "පරිපාලක",
    heroTitle:
      "ඔබගේ දුරකථනයට ගැළපෙන මුල් කොටස්, ලංකාව පුරා බෙදාහැරීමෙන්",
    heroSubtitle:
      "ඇත්ත පිස්සු කොටස්, පරීක්ෂා කළ ආලංකාර සහ වෘත්තීය අලුත්වැඩියා උපකරණ.",
    heroSearchPlaceholder: "මාදිළිය හෝ කොටස් නාමය අනුව සොයන්න",
    heroCTA: "දැන් මිලදී ගන්න",
    heroSecondaryCTA: "iPhone කොටස් බලන්න",
    quickCategories: "කාණ්ඩ අනුව සාප්පු යන්න",
    featuredTitle: "විශේෂිත ද්රව්ය",
    featuredSubtitle: "බෙස්ට් සෙලර් සහ නව පැමිණීම්.",
    trustFreeDelivery: "සර්ව ලංකා බෙදාහැරීම",
    trustReturns: "දිනය 14 ක් තුළ ආපසු ලබා දීම",
    trustSecure: "ආරක්ෂිත ගෙවීම්",
    trustWhatsApp: "පැය 24/7 WhatsApp සහාය",
    newsletterTitle: "නව පැමිණීම් දැන ගන්න",
    newsletterSubtitle:
      "ගබඩා යාවත්කාලීන, නව ද්රව්‍ය සහ වට්ටම් ලබාගන්න.",
    newsletterPlaceholder: "ඔබගේ Email ලිපිනය",
    newsletterButton: "Newsletter එකට එක්වන්න",
    toastSubscribed: "Newsletter එකට සාර්ථකව එක් විය.",
    toastSubscribedError: "දැනට සබ්ස්ක්‍රයිබ් කළ නොහැක.",
    shopTitle: "සියලු ද්රව්ය",
    filtersTitle: "පෙරහන්",
    filterBrand: "බ්රෑන්ඩ්",
    filterModel: "මාදිලිය",
    filterPartType: "කොටස් වර්ගය",
    filterPrice: "මිල පරාසය",
    filterRating: "අවම අගයන්",
    sortLabel: "ලැයිස්තුගත කිරීම",
    sortPopular: "ජනප්රියතාවය",
    sortNewest: "අලුත්ම ද්රව්ය",
    sortPriceLowHigh: "මිල: අඩු සිට වැඩි",
    sortPriceHighLow: "මිල: වැඩි සිට අඩු",
    addToCart: "කරත්තයට එක් කරන්න",
    buyNow: "දැන් මිලදී ගන්න",
    viewDetails: "විස්තර බලන්න",
    quickView: "ක්වික් විව්",
    emptyProducts: "ඔබ සඳහන් පෙරහන් වලට ගැළපෙන ද්රව්ය නැත.",
    cartTitle: "කරත්තය",
    cartEmpty: "ඔබගේ කරත්තය හිස්ය.",
    cartSubtotal: "මූලික එකතුව",
    cartDelivery: "බෙදාහැරීම",
    cartTotal: "ಒಟ್ಟು",
    cartCouponPlaceholder: "කූපන් කේතය (විකල්පයි)",
    cartApplyCoupon: "යොදන්න",
    cartProceedCheckout: "Checkout වෙත යන්න",
    checkoutTitle: "Checkout",
    checkoutCustomerDetails: "පාරිභෝගික හා බෙදාහැරීම් විස්තර",
    checkoutPaymentMethod: "ගෙවීම් ක්රමය",
    pmCard: "බැංකු කාඩ්",
    pmCOD: "තැපැල් ගෙවීම",
    pmBank: "බැංකු හුවමාරුව",
    placeOrder: "ඇණවුම තහවුරු කරන්න",
    orderSuccess: "ඔබගේ ඇණවුම සාර්ථකයි.",
    orderFailed: "ඇණවුම තැබීම අසාර්ථක විය.",
    authLogin: "ප්රවේශ වන්න",
    authRegister: "ගිණුමක් තනන්න",
    authForgot: "මුරපදය යළි සකසන්න",
    authEmail: "Email",
    authPassword: "මුරපදය",
    authName: "පූර්ණ නාමය",
    authPhone: "දුරකථන අංකය",
    authLoginGoogle: "Google ಮುಖಾಂತರ ලොග් වන්න",
    authHaveAccount: "දැනටමත් ගිණුමක් තිබේද?",
    authNoAccount: "ගිණුමක් නොමැතිද?",
    authForgotLink: "මුරපදය අමතකද?",
    authResetInfo: "Reset Link එකක් සඳහා ඔබගේ Email ලිපිනය ඇතුළත් කරන්න.",
    authResetSent: "Password Reset Email එක යවා ඇත.",
    authLogout: "ලොග් අවුට් වන්න",
    accountTitle: "මගේ ගිණුම",
    accountOrders: "ඇණවුම්",
    accountProfile: "පැතිකඩ",
    accountWishlist: "අවශ්යතා ලැයිස්තුව",
    saveChanges: "වෙනස්කම් සුරකින්න",
    profileUpdated: "පැතිකඩ යාවත්කාලීන විය.",
    trackTitle: "ඔබගේ ඇණවුම හඹා යන්න",
    trackPlaceholder: "Tracking Number එක ඇතුළත් කරන්න",
    trackButton: "හඹා යන්න",
    trackNotFound: "ඇණවුම හමු නොවුණි. Tracking Number එක පරික්ෂා කරන්න.",
    contactTitle: "අප හා සම්බන්ධ වන්න",
    contactMessagePlaceholder: "ඔබට කුමක් කර දිය යුතුද?",
    contactSend: "පණිවිඩය යවන්න",
    contactSent: "පණිවිඩය ලැබුණු අතර ඉක්මනින් පිළිතුරු දෙනු ඇත.",
    adminTitle: "පරිපාලක පුවරුව",
    adminProducts: "ද්රව්ය",
    adminOrders: "ඇණවුම්",
    adminUsers: "පරිශීලකයන්",
    adminSettings: "අඩවි සැකසුම්",
    adminHomeContent: "මුල් පිටුවේ අන්තර්ගතය",
    adminNewsletter: "Newsletter ලැයිස්තුව",
    statusPending: "කැඳවීමට ඇත",
    statusProcessing: "සැකසෙමින් පවතී",
    statusShipped: "කුරියර් වෙත භාර දී ඇත",
    statusDelivered: "බෙදා දී ඇත",
    whatsappOrderPlaced:
      "ඔබගේ ඇණවුම තහවුරු කිරීමට WhatsApp විවෘත කරයි...",
    whatsappStatusUpdated:
      "පාරිභෝගිකයාට WhatsApp මඟින් දැනුම් දෙයි...",
    emailSimulated:
      "පාරිභෝගික හා පරිපාලක Email යැවීම simulation එකක් ලෙස සිදු විය.",
  },
};

const t = (lang: Language, key: string) =>
  translations[lang][key] ?? translations["en"][key] ?? key;

const defaultTestimonials: SiteTestimonial[] = [
  {
    id: "t1",
    name: "Lahiru | Galle",
    text: "Super fast delivery and genuine iPhone parts. My repair shop relies on SR MOBILE.",
    role: "Repair Partner",
  },
  {
    id: "t2",
    name: "Nadeesha | Colombo",
    text: "Excellent customer service on WhatsApp. Helped me find the exact display I needed.",
    role: "Retail Customer",
  },
  {
    id: "t3",
    name: "Tech Lab | Kandy",
    text: "Consistent stock and good pricing for bulk orders.",
    role: "Service Centre",
  },
];

const defaultSiteSettings: SiteSettings = {
  deliveryCharge: 500,
  phone: "0726306039",
  address: "GALLE, Sri Lanka",
  heroImage: "",
  aboutText: "Premium Phone Parts & Accessories with island-wide delivery.",
  featuredProductIds: [],
  testimonials: defaultTestimonials,
};

const formatCurrencyLKR = (amount: number) =>
  `Rs. ${amount.toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;

const statusOrder: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

const getStatusLabel = (lang: Language, status: OrderStatus) => {
  switch (status) {
    case "pending":
      return t(lang, "statusPending");
    case "processing":
      return t(lang, "statusProcessing");
    case "shipped":
      return t(lang, "statusShipped");
    case "delivered":
      return t(lang, "statusDelivered");
    default:
      return status;
  }
};

const normalizeSriLankaPhone = (phone: string): string => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return `94${digits}`;
};

const scrollToTop = () => {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

// --- Main App Component ---------------------------------------------------------------

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem("srmobile_lang");
    return stored === "si" || stored === "en" ? (stored as Language) : "en";
  });

  const [page, setPage] = useState<Page>("home");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(
    defaultSiteSettings,
  );
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("srmobile_cart");
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const [shopSearch, setShopSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedPartType, setSelectedPartType] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popular");

  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutCity, setCheckoutCity] = useState("");
  const [checkoutZip, setCheckoutZip] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod" | "bank">(
    "cod",
  );
  const [placingOrder, setPlacingOrder] = useState(false);

  const [trackInput, setTrackInput] = useState("");
  const [trackOrder, setTrackOrder] = useState<Order | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">(
    "login",
  );
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [accountTab, setAccountTab] = useState<
    "orders" | "profile" | "wishlist"
  >("orders");
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const [adminTab, setAdminTab] = useState<
    "products" | "orders" | "users" | "settings" | "homepage" | "newsletter"
  >("products");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [newsletterList, setNewsletterList] = useState<string[]>([]);

  const [adminProductFormOpen, setAdminProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormLoading, setProductFormLoading] = useState(false);
  const [productFormFiles, setProductFormFiles] = useState<FileList | null>(
    null,
  );

  const [siteSettingsDraft, setSiteSettingsDraft] = useState<SiteSettings | null>(
    null,
  );

  const [homeTestimonialsDraft, setHomeTestimonialsDraft] = useState<
    SiteTestimonial[]
  >(defaultTestimonials);
  const [homeFeaturedDraft, setHomeFeaturedDraft] = useState<string[]>([]);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const [heroIndex, setHeroIndex] = useState(0);

  const isAdmin =
    user?.role === "admin" && user.email.toLowerCase() === ADMIN_EMAIL;

  const showToast = (type: Toast["type"], message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  // Persist language preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("srmobile_lang", language);
    }
  }, [language]);

  // Persist cart in localStorage (global cart key)
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("srmobile_cart", JSON.stringify(cart));
    if (user?.uid) {
      window.localStorage.setItem(
        `srmobile_cart_${user.uid}`,
        JSON.stringify(cart),
      );
    }
  }, [cart, user?.uid]);

  // Firebase Auth listener + load user profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        setUser(null);
        setUserOrders([]);
        setWishlistIds([]);
        setInitializing(false);
        return;
      }

      try {
        const email = fbUser.email || "";
        const userRef = doc(db, "users", email);
        let snap = await getDoc(userRef);
        if (!snap.exists()) {
          const role: UserRole =
            email.toLowerCase() === ADMIN_EMAIL ? "admin" : "customer";
          const profile: UserProfile = {
            uid: fbUser.uid,
            name: fbUser.displayName || email.split("@")[0],
            email,
            phone: fbUser.phoneNumber || "",
            address: "",
            city: "",
            zip: "",
            role,
            wishlist: [],
          };
          await setDoc(userRef, {
            ...profile,
            createdAt: serverTimestamp(),
          });
          snap = await getDoc(userRef);
        }
        const data = (snap.data() || {}) as DocumentData;
        const wishlist: string[] = Array.isArray(data.wishlist)
          ? (data.wishlist as string[])
          : [];
        const profile: UserProfile = {
          uid: fbUser.uid,
          name: (data.name as string) || fbUser.displayName || email,
          email,
          phone: (data.phone as string) || fbUser.phoneNumber || "",
          address: (data.address as string) || "",
          city: (data.city as string) || "",
          zip: (data.zip as string) || "",
          role: (data.role as UserRole) ||
            (email.toLowerCase() === ADMIN_EMAIL ? "admin" : "customer"),
          wishlist,
        };
        setUser(profile);
        setWishlistIds(wishlist);

        // Load user-specific cart from localStorage
        if (typeof window !== "undefined") {
          const userCartRaw = window.localStorage.getItem(
            `srmobile_cart_${fbUser.uid}`,
          );
          if (userCartRaw) {
            try {
              const parsed = JSON.parse(userCartRaw) as CartItem[];
              setCart(parsed);
            } catch {
              // ignore
            }
          }
        }

        // Subscribe to user's orders
        const q = query(
          collection(db, "orders"),
          where("userId", "==", fbUser.uid),
        );
        const ordersUnsub = onSnapshot(q, (snapshot) => {
          const list: Order[] = [];
          snapshot.forEach((docSnap) => {
            const o = docSnap.data() as any;
            list.push({
              id: docSnap.id,
              userId: o.userId,
              userName: o.userName,
              email: o.email,
              phone: o.phone,
              items: (o.items || []) as OrderItem[],
              total: o.total || 0,
              deliveryCharge: o.deliveryCharge || 0,
              status: (o.status as OrderStatus) || "pending",
              trackingNumber: o.trackingNumber || "",
              shippingAddress: o.shippingAddress || "",
              city: o.city || "",
              zip: o.zip || "",
              orderDate: o.orderDate?.toDate?.() || null,
              paymentMethod: (o.paymentMethod as any) || "cod",
              notes: o.notes || "",
            });
          });
          setUserOrders(list);
        });

        (auth as any)._ordersUnsub?.();
        (auth as any)._ordersUnsub = ordersUnsub;
      } catch (error) {
        console.error("Error loading user profile", error);
      } finally {
        setInitializing(false);
      }
    });

    return () => {
      unsub();
      const prevOrdersUnsub = (auth as any)._ordersUnsub as
        | (() => void)
        | undefined;
      prevOrdersUnsub?.();
    };
  }, []);

  // Load products (realtime)
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            name: d.name || "",
            brand: d.brand || "",
            model: d.model || "",
            partType: d.partType || "",
            price: Number(d.price) || 0,
            stock: Number(d.stock) || 0,
            images: Array.isArray(d.images) ? (d.images as string[]) : [],
            description: d.description || "",
            specs: d.specs || "",
            compatibility: Array.isArray(d.compatibility)
              ? (d.compatibility as string[])
              : [],
            createdBy: d.createdBy,
            createdAt: d.createdAt?.toDate?.() || null,
            rating: typeof d.rating === "number" ? d.rating : 0,
            popularity: typeof d.popularity === "number" ? d.popularity : 0,
          });
        });
        setProducts(list);
      },
      (error) => {
        console.error("Error loading products", error);
        showToast("error", "Failed to load products.");
      },
    );
    return () => unsub();
  }, []);

  // Load site settings (realtime)
  useEffect(() => {
    const ref = doc(db, "site_settings", "settings");
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) {
          setSiteSettings(defaultSiteSettings);
          setSiteSettingsDraft(defaultSiteSettings);
          setHomeTestimonialsDraft(defaultTestimonials);
          setHomeFeaturedDraft([]);
          return;
        }
        const d = snapshot.data() as any;
        const settings: SiteSettings = {
          deliveryCharge:
            typeof d.deliveryCharge === "number" ? d.deliveryCharge : 500,
          phone: d.phone || "0726306039",
          address: d.address || "GALLE, Sri Lanka",
          heroImage: d.heroImage || "",
          aboutText:
            d.aboutText ||
            "Premium Phone Parts & Accessories with island-wide delivery.",
          featuredProductIds: Array.isArray(d.featuredProductIds)
            ? (d.featuredProductIds as string[])
            : [],
          testimonials: Array.isArray(d.testimonials)
            ? (d.testimonials as SiteTestimonial[])
            : defaultTestimonials,
        };
        setSiteSettings(settings);
        setSiteSettingsDraft(settings);
        setHomeTestimonialsDraft(settings.testimonials || defaultTestimonials);
        setHomeFeaturedDraft(settings.featuredProductIds || []);
      },
      (error) => {
        console.error("Error loading site settings", error);
      },
    );
    return () => unsub();
  }, []);

  // Admin realtime collections
  useEffect(() => {
    if (!isAdmin) return;

    const ordersUnsub = onSnapshot(
      query(collection(db, "orders"), orderBy("orderDate", "desc")),
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          const o = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            userId: o.userId,
            userName: o.userName,
            email: o.email,
            phone: o.phone,
            items: (o.items || []) as OrderItem[],
            total: o.total || 0,
            deliveryCharge: o.deliveryCharge || 0,
            status: (o.status as OrderStatus) || "pending",
            trackingNumber: o.trackingNumber || "",
            shippingAddress: o.shippingAddress || "",
            city: o.city || "",
            zip: o.zip || "",
            orderDate: o.orderDate?.toDate?.() || null,
            paymentMethod: (o.paymentMethod as any) || "cod",
            notes: o.notes || "",
          });
        });
        setAllOrders(list);
      },
    );

    const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as any;
        list.push({
          uid: d.uid || docSnap.id,
          name: d.name || docSnap.id,
          email: d.email || docSnap.id,
          phone: d.phone || "",
          address: d.address || "",
          city: d.city || "",
          zip: d.zip || "",
          role: (d.role as UserRole) ||
            (docSnap.id.toLowerCase() === ADMIN_EMAIL ? "admin" : "customer"),
          wishlist: Array.isArray(d.wishlist) ? (d.wishlist as string[]) : [],
        });
      });
      setAllUsers(list);
    });

    const newsletterUnsub = onSnapshot(
      collection(db, "newsletter"),
      (snapshot) => {
        const emails: string[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as any;
          emails.push((d.email as string) || docSnap.id);
        });
        setNewsletterList(emails);
      },
    );

    return () => {
      ordersUnsub();
      usersUnsub();
      newsletterUnsub();
    };
  }, [isAdmin]);

  // Hero slider auto-rotation
  const heroSlides = useMemo(
    () => [
      {
        id: "hero1",
        title: t(language, "heroTitle"),
        subtitle: t(language, "heroSubtitle"),
        badge: "Genuine & OEM Parts",
      },
      {
        id: "hero2",
        title: "Same-day dispatch on in-stock parts",
        subtitle: "Place your order before 3PM for faster shipping across Sri Lanka.",
        badge: "Repair Shops Welcome",
      },
      {
        id: "hero3",
        title: "From iPhone to Samsung, we cover every flagship.",
        subtitle:
          "Displays, batteries, housings, cameras, tools, and pro accessories.",
        badge: "SR MOBILE · GALLE",
      },
    ],
    [language],
  );

  const heroCount = heroSlides.length;

  useEffect(() => {
    if (!heroCount) return;
    const timer = setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % heroCount);
    }, 7000);
    return () => clearInterval(timer);
  }, [heroCount]);

  const distinctBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).filter(Boolean),
    [products],
  );

  const distinctModels = useMemo(
    () => {
      if (!selectedBrand) {
        return Array.from(new Set(products.map((p) => p.model))).filter(
          Boolean,
        );
      }
      return Array.from(
        new Set(products.filter((p) => p.brand === selectedBrand).map((p) => p.model)),
      ).filter(Boolean);
    },
    [products, selectedBrand],
  );

  const distinctPartTypes = useMemo(
    () => Array.from(new Set(products.map((p) => p.partType))).filter(Boolean),
    [products],
  );

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (shopSearch.trim()) {
      const s = shopSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.model.toLowerCase().includes(s) ||
          p.brand.toLowerCase().includes(s) ||
          p.partType.toLowerCase().includes(s),
      );
    }

    if (selectedBrand) {
      list = list.filter((p) => p.brand === selectedBrand);
    }
    if (selectedModel) {
      list = list.filter((p) => p.model === selectedModel);
    }
    if (selectedPartType) {
      list = list.filter((p) => p.partType === selectedPartType);
    }

    if (priceRange !== "all") {
      list = list.filter((p) => {
        if (priceRange === "0-5000") return p.price <= 5000;
        if (priceRange === "5000-15000")
          return p.price > 5000 && p.price <= 15000;
        if (priceRange === "15000-30000")
          return p.price > 15000 && p.price <= 30000;
        if (priceRange === "30000+") return p.price > 30000;
        return true;
      });
    }

    if (minRating > 0) {
      list = list.filter((p) => (p.rating || 0) >= minRating);
    }

    list.sort((a, b) => {
      if (sortBy === "popular") {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      if (sortBy === "newest") {
        const at = a.createdAt?.getTime() || 0;
        const bt = b.createdAt?.getTime() || 0;
        return bt - at;
      }
      if (sortBy === "priceLow") {
        return a.price - b.price;
      }
      if (sortBy === "priceHigh") {
        return b.price - a.price;
      }
      return 0;
    });

    return list;
  }, [
    products,
    shopSearch,
    selectedBrand,
    selectedModel,
    selectedPartType,
    priceRange,
    minRating,
    sortBy,
  ]);

  const featuredProducts = useMemo(() => {
    const ids = siteSettings?.featuredProductIds || [];
    if (!ids.length) {
      return products.slice(0, 8);
    }
    return products.filter((p) => ids.includes(p.id));
  }, [products, siteSettings?.featuredProductIds]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  );

  const cartDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    // Simple demo: 10% discount for any applied coupon
    return Math.round(cartSubtotal * 0.1);
  }, [appliedCoupon, cartSubtotal]);

  const deliveryCharge = siteSettings?.deliveryCharge ?? 500;

  const cartTotal = useMemo(
    () => (cart.length ? cartSubtotal - cartDiscount + deliveryCharge : 0),
    [cart.length, cartSubtotal, cartDiscount, deliveryCharge],
  );

  const sitePhoneForWhatsApp = normalizeSriLankaPhone(
    siteSettings?.phone || "0726306039",
  );

  const handleChangeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const requireAuth = () => {
    if (!user) {
      setShowAuthModal(true);
      setAuthMode("login");
      return false;
    }
    return true;
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (!product.id) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id
            ? { ...c, qty: c.qty + quantity }
            : c,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          qty: quantity,
          image: product.images?.[0],
          brand: product.brand,
          model: product.model,
        },
      ];
    });
    setIsCartOpen(true);
    showToast("success", `${product.name} ${t(language, "addToCart").toLowerCase()}`);
  };

  const handleUpdateCartQty = (productId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((c) => c.productId !== productId);
      return prev.map((c) =>
        c.productId === productId
          ? {
              ...c,
              qty,
            }
          : c,
      );
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    // Simple demo: one valid coupon SR10 for 10% off
    if (code === "SR10" || code === "SRMOBILE10") {
      setAppliedCoupon(code);
      showToast("success", "Coupon applied.");
    } else {
      setAppliedCoupon(null);
      showToast("error", "Invalid coupon code.");
    }
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product, 1);
    if (!requireAuth()) return;
    setSelectedProduct(product);
    setPage("checkout");
    scrollToTop();
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    if (!email) return;
    try {
      await setDoc(doc(db, "newsletter", email.toLowerCase()), {
        email: email.toLowerCase(),
        createdAt: serverTimestamp(),
      });
      showToast("success", t(language, "toastSubscribed"));
      form.reset();
    } catch (error) {
      console.error("newsletter error", error);
      showToast("error", t(language, "toastSubscribedError"));
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        setShowAuthModal(false);
        setAuthPassword("");
      } else if (authMode === "register") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          authEmail.trim(),
          authPassword,
        );
        const fbUser = cred.user;
        const role: UserRole =
          authEmail.trim().toLowerCase() === ADMIN_EMAIL
            ? "admin"
            : "customer";
        const profile: UserProfile = {
          uid: fbUser.uid,
          name: authName || authEmail.split("@")[0],
          email: authEmail.trim(),
          phone: authPhone,
          address: "",
          city: "",
          zip: "",
          role,
          wishlist: [],
        };
        await setDoc(doc(db, "users", profile.email), {
          ...profile,
          createdAt: serverTimestamp(),
        });
        setShowAuthModal(false);
        setAuthPassword("");
      } else if (authMode === "forgot") {
        await sendPasswordResetEmail(auth, authEmail.trim());
        showToast("success", t(language, "authResetSent"));
        setShowAuthModal(false);
      }
    } catch (error: any) {
      console.error("auth error", error);
      showToast("error", error.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const fbUser = cred.user;
      const email = fbUser.email || "";
      if (!email) return;
      const userRef = doc(db, "users", email);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const role: UserRole =
          email.toLowerCase() === ADMIN_EMAIL ? "admin" : "customer";
        await setDoc(userRef, {
          uid: fbUser.uid,
          name: fbUser.displayName || email,
          email,
          phone: fbUser.phoneNumber || "",
          address: "",
          city: "",
          zip: "",
          role,
          wishlist: [],
          createdAt: serverTimestamp(),
        });
      }
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("google auth error", error);
      showToast("error", error.message || "Google login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setPage("home");
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!requireAuth() || !user) return;
    try {
      const exists = wishlistIds.includes(productId);
      const updated = exists
        ? wishlistIds.filter((id) => id !== productId)
        : [...wishlistIds, productId];
      setWishlistIds(updated);
      setUser((prev) => (prev ? { ...prev, wishlist: updated } : prev));
      await updateDoc(doc(db, "users", user.email), {
        wishlist: updated,
      });
    } catch (error) {
      console.error("wishlist error", error);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth() || !user) return;
    if (!cart.length) return;
    if (!checkoutName || !checkoutEmail || !checkoutPhone || !checkoutAddress) {
      showToast("error", "Please complete all required fields.");
      return;
    }

    setPlacingOrder(true);
    try {
      const orderItems: OrderItem[] = cart.map((c) => ({
        productId: c.productId,
        name: c.name,
        price: c.price,
        qty: c.qty,
      }));

      const subtotal = cartSubtotal;
      const discount = cartDiscount;
      const total = subtotal - discount + deliveryCharge;

      const orderRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userName: checkoutName,
        email: checkoutEmail,
        phone: checkoutPhone,
        items: orderItems,
        total,
        deliveryCharge,
        status: "pending" as OrderStatus,
        trackingNumber: "",
        shippingAddress: checkoutAddress,
        city: checkoutCity,
        zip: checkoutZip,
        orderDate: serverTimestamp(),
        paymentMethod,
        notes: checkoutNotes,
      });

      const trackingNumber = `SRM-${orderRef.id.slice(-6).toUpperCase()}`;
      await updateDoc(orderRef, { trackingNumber });

      showToast("success", t(language, "orderSuccess"));

      // WhatsApp confirmation to customer
      const normalized = normalizeSriLankaPhone(checkoutPhone);
      if (normalized) {
        const waUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(
          `ඔබේ ඇණවුම භාරගත්තා. ඇණවුම් අංකය: ${trackingNumber}. වැඩිදුර යාවත්කාලීන බලාපොරොත්තු වන්න.`,
        )}`;
        showToast("info", t(language, "whatsappOrderPlaced"));
        window.open(waUrl, "_blank");
      }

      // Simulate emails to admin and customer
      console.log("Simulated order email", {
        toCustomer: checkoutEmail,
        toAdmin: ADMIN_EMAIL,
        trackingNumber,
        total,
      });
      alert(t(language, "emailSimulated"));

      // Optional EmailJS integration (commented):
      // emailjs.send("service_id", "template_id", { ...orderData }, "public_key");

      setCart([]);
      setAppliedCoupon(null);
      setCouponInput("");
      setPage("account");
      scrollToTop();
    } catch (error) {
      console.error("order error", error);
      showToast("error", t(language, "orderFailed"));
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    setTrackLoading(true);
    setTrackOrder(null);
    try {
      const q = query(
        collection(db, "orders"),
        where("trackingNumber", "==", trackInput.trim()),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        showToast("error", t(language, "trackNotFound"));
      } else {
        const docSnap = snapshot.docs[0];
        const o = docSnap.data() as any;
        const order: Order = {
          id: docSnap.id,
          userId: o.userId,
          userName: o.userName,
          email: o.email,
          phone: o.phone,
          items: (o.items || []) as OrderItem[],
          total: o.total || 0,
          deliveryCharge: o.deliveryCharge || 0,
          status: (o.status as OrderStatus) || "pending",
          trackingNumber: o.trackingNumber || "",
          shippingAddress: o.shippingAddress || "",
          city: o.city || "",
          zip: o.zip || "",
          orderDate: o.orderDate?.toDate?.() || null,
          paymentMethod: (o.paymentMethod as any) || "cod",
          notes: o.notes || "",
        };
        setTrackOrder(order);
      }
    } catch (error) {
      console.error("track error", error);
    } finally {
      setTrackLoading(false);
    }
  };

  const handleAdminUpdateOrder = async (order: Order, updates: Partial<Order>) => {
    try {
      const ref = doc(db, "orders", order.id);
      await updateDoc(ref, updates as any);
      const phone = updates.phone || order.phone;
      const status = (updates.status || order.status) as OrderStatus;
      const tracking = updates.trackingNumber || order.trackingNumber;
      if (phone && tracking) {
        const normalized = normalizeSriLankaPhone(phone);
        const waUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(
          `ඔබගේ ඇණවුමේ තත්ත්වය යාවත්කාලීන කර ඇත. අංකය: ${tracking}. නව තත්වය: ${status}.`,
        )}`;
        showToast("info", t(language, "whatsappStatusUpdated"));
        window.open(waUrl, "_blank");
      }
      console.log("Simulated status update email", {
        toCustomer: order.email,
        toAdmin: ADMIN_EMAIL,
        status: updates.status || order.status,
        trackingNumber: tracking,
      });
      alert(t(language, "emailSimulated"));
    } catch (error) {
      console.error("admin update order error", error);
      showToast("error", "Failed to update order.");
    }
  };

  const handleAdminSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const brand = String(formData.get("brand") || "").trim();
    const model = String(formData.get("model") || "").trim();
    const partType = String(formData.get("partType") || "").trim();
    const price = Number(formData.get("price") || 0);
    const stock = Number(formData.get("stock") || 0);
    const description = String(formData.get("description") || "");
    const specs = String(formData.get("specs") || "");
    const compatibilityRaw = String(formData.get("compatibility") || "");
    const compatibility = compatibilityRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!name || !brand || !model || !partType) {
      showToast("error", "Please fill required fields.");
      return;
    }

    setProductFormLoading(true);
    try {
      const images: string[] = editingProduct?.images
        ? [...editingProduct.images]
        : [];

      if (productFormFiles && productFormFiles.length) {
        for (const file of Array.from(productFormFiles)) {
          const ref = storageRef(
            storage,
            `products/${Date.now()}_${file.name.replace(/\s+/g, "_")}`,
          );
          await uploadBytes(ref, file);
          const url = await getDownloadURL(ref);
          images.push(url);
        }
      }

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), {
          name,
          brand,
          model,
          partType,
          price,
          stock,
          description,
          specs,
          compatibility,
          images,
        });
        showToast("success", "Product updated.");
      } else {
        await addDoc(collection(db, "products"), {
          name,
          brand,
          model,
          partType,
          price,
          stock,
          description,
          specs,
          compatibility,
          images,
          createdBy: user?.email || "admin",
          createdAt: serverTimestamp(),
        });
        showToast("success", "Product created.");
      }

      setAdminProductFormOpen(false);
      setEditingProduct(null);
      setProductFormFiles(null);
      form.reset();
    } catch (error) {
      console.error("product save error", error);
      showToast("error", "Failed to save product.");
    } finally {
      setProductFormLoading(false);
    }
  };

  const handleAdminDeleteProduct = async (productId: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      showToast("success", "Product deleted.");
    } catch (error) {
      console.error("product delete error", error);
      showToast("error", "Failed to delete product.");
    }
  };

  const handleAdminUpdateUserRole = async (userEmail: string, role: UserRole) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "users", userEmail), { role });
      showToast("success", "User role updated.");
    } catch (error) {
      console.error("update role error", error);
      showToast("error", "Failed to update user role.");
    }
  };

  const handleAdminDeleteUser = async (userEmail: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this user from Firestore?")) return;
    try {
      await deleteDoc(doc(db, "users", userEmail));
      showToast("success", "User deleted (Firestore only).");
    } catch (error) {
      console.error("delete user error", error);
      showToast("error", "Failed to delete user.");
    }
  };

  const handleAdminSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !siteSettingsDraft) return;
    try {
      await setDoc(doc(db, "site_settings", "settings"), {
        ...siteSettingsDraft,
      });
      showToast("success", "Settings saved.");
    } catch (error) {
      console.error("settings save error", error);
      showToast("error", "Failed to save settings.");
    }
  };

  const handleAdminSaveHomepageContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await setDoc(
        doc(db, "site_settings", "settings"),
        {
          featuredProductIds: homeFeaturedDraft,
          testimonials: homeTestimonialsDraft,
        },
        { merge: true },
      );
      showToast("success", "Homepage content saved.");
    } catch (error) {
      console.error("homepage content error", error);
      showToast("error", "Failed to save homepage content.");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactMessage) return;
    setContactSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        fromEmail: contactEmail,
        name: contactName,
        message: contactMessage,
        date: serverTimestamp(),
      });
      showToast("success", t(language, "contactSent"));
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (error) {
      console.error("contact error", error);
      showToast("error", "Failed to send message.");
    } finally {
      setContactSending(false);
    }
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setPage("product");
    scrollToTop();
  };

  const handleShopByBrand = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel("");
    setSelectedPartType("");
    setShopSearch("");
    setPage("shop");
    scrollToTop();
  };

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds],
  );

  // Sync checkout form from user profile
  useEffect(() => {
    if (!user) return;
    setCheckoutName((prev) => prev || user.name || "");
    setCheckoutEmail((prev) => prev || user.email || "");
    setCheckoutPhone((prev) => prev || user.phone || "");
    setCheckoutAddress((prev) => prev || user.address || "");
    setCheckoutCity((prev) => prev || user.city || "");
    setCheckoutZip((prev) => prev || user.zip || "");
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth() || !user) return;
    try {
      const updated: Partial<UserProfile> = {
        name: checkoutName,
        email: checkoutEmail,
        phone: checkoutPhone,
        address: checkoutAddress,
        city: checkoutCity,
        zip: checkoutZip,
      };
      await updateDoc(doc(db, "users", user.email), updated);
      setUser((prev) => (prev ? { ...prev, ...updated } : prev));
      showToast("success", t(language, "profileUpdated"));
    } catch (error) {
      console.error("profile update error", error);
      showToast("error", "Failed to update profile.");
    }
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="glass-panel flex flex-col items-center gap-4 rounded-2xl px-10 py-8 text-center shadow-xl shadow-cyan-500/20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <div>
            <h1 className="font-heading text-lg font-semibold text-white">
              SR MOBILE
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Initializing secure connection to Firebase...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-slate-100">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800/80 bg-black/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-sky-400 to-emerald-400 text-lg font-bold text-black shadow-lg shadow-cyan-500/40">
              SR
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-lg font-semibold tracking-tight text-white">
                  SR MOBILE
                </span>
                <span className="hidden text-xs text-slate-400 sm:inline">
                  {t(language, "brandTagline")}
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">
                GALLE, Sri Lanka · WhatsApp {siteSettings?.phone || "0726306039"}
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-200 md:flex">
            <button
              className={`transition hover:text-cyan-400 ${page === "home" ? "text-cyan-400" : ""}`}
              onClick={() => {
                setPage("home");
                scrollToTop();
              }}
            >
              {t(language, "navHome")}
            </button>
            <button
              className={`transition hover:text-cyan-400 ${page === "shop" ? "text-cyan-400" : ""}`}
              onClick={() => {
                setPage("shop");
                scrollToTop();
              }}
            >
              {t(language, "navShop")}
            </button>
            <button
              className={`transition hover:text-cyan-400 ${page === "track" ? "text-cyan-400" : ""}`}
              onClick={() => {
                setPage("track");
                scrollToTop();
              }}
            >
              {t(language, "navTrack")}
            </button>
            <button
              className={`transition hover:text-cyan-400 ${page === "contact" ? "text-cyan-400" : ""}`}
              onClick={() => {
                setPage("contact");
                scrollToTop();
              }}
            >
              {t(language, "navContact")}
            </button>
            {user && (
              <button
                className={`transition hover:text-cyan-400 ${page === "account" ? "text-cyan-400" : ""}`}
                onClick={() => {
                  setPage("account");
                  scrollToTop();
                }}
              >
                {t(language, "navAccount")}
              </button>
            )}
            {isAdmin && (
              <button
                className={`transition hover:text-orange-400 ${page === "admin" ? "text-orange-400" : ""}`}
                onClick={() => {
                  setPage("admin");
                  scrollToTop();
                }}
              >
                {t(language, "navAdmin")}
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="hidden items-center rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5 text-xs md:flex">
              <button
                onClick={() => handleChangeLanguage("en")}
                className={`px-2 py-1 rounded-full transition ${language === "en" ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white"}`}
              >
                EN
              </button>
              <button
                onClick={() => handleChangeLanguage("si")}
                className={`px-2 py-1 rounded-full transition ${language === "si" ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white"}`}
              >
                සිං
              </button>
            </div>

            {/* Auth + Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-slate-200 shadow-inner shadow-slate-800/80 ring-1 ring-slate-700/80 transition hover:bg-slate-800 hover:text-cyan-400"
            >
              <span className="sr-only">Cart</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-orange-500 px-1 text-[0.6rem] font-semibold text-black">
                  {cart.reduce((sum, c) => sum + c.qty, 0)}
                </span>
              )}
            </button>
            {user ? (
              <button
                onClick={() => setPage("account")}
                className="hidden items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-800 md:flex"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-400 text-[0.7rem] font-semibold text-black">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[6rem] truncate text-ellipsis">
                  {user.name || user.email}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="hidden rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:from-cyan-400 hover:to-sky-300 md:inline-flex"
              >
                {t(language, "authLogin")}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 lg:px-8 lg:pt-28">
        {/* Home */}
        <section className={page === "home" ? "space-y-16" : "hidden"}>
          {/* Hero */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200 shadow-sm shadow-cyan-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>SR MOBILE · GALLE · ISLAND-WIDE DELIVERY</span>
              </div>
              <div className="space-y-4">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
                  {heroSlides[heroIndex]?.title}
                </h1>
                <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                  {heroSlides[heroIndex]?.subtitle}
                </p>
              </div>
              <form
                className="relative mt-4 flex items-center gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage("shop");
                  scrollToTop();
                }}
              >
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <svg
                      className="h-4 w-4 text-slate-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.65" y1="16.65" x2="21" y2="21" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    placeholder={t(language, "heroSearchPlaceholder")}
                    className="w-full rounded-full border border-slate-700/80 bg-slate-900/80 px-9 py-2 text-sm text-slate-100 shadow-inner shadow-slate-900 outline-none ring-1 ring-transparent transition focus:border-cyan-400/60 focus:ring-cyan-500/40"
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:from-cyan-400 hover:to-sky-300 sm:inline-flex"
                >
                  {t(language, "heroCTA")}
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => handleShopByBrand("Apple")}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 ring-1 ring-slate-700/80 transition hover:ring-cyan-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  Apple / iPhone parts
                </button>
                <button
                  type="button"
                  onClick={() => handleShopByBrand("Samsung")}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 ring-1 ring-slate-700/80 transition hover:ring-cyan-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  Samsung Galaxy parts
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/40 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Lifetime WhatsApp support for repair partners
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setPage("shop");
                    scrollToTop();
                  }}
                  className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/40 p-4 ring-1 ring-slate-700/80 transition hover:ring-cyan-400/80"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      {t(language, "quickCategories")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-50">
                      iPhone, Samsung, Xiaomi, more
                    </p>
                  </div>
                  <svg
                    className="h-6 w-6 text-cyan-400 transition group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleShopByBrand("Apple")}
                  className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-cyan-600/20 via-sky-500/10 to-slate-900/60 p-4 ring-1 ring-cyan-500/40 transition hover:from-cyan-500/40 hover:ring-cyan-400/80"
                >
                  <div>
                    <p className="text-xs font-medium text-cyan-200">
                      iPhone Parts
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-50">
                      Displays, batteries, housings
                    </p>
                  </div>
                  <span className="rounded-full bg-black/40 px-3 py-1 text-[0.65rem] font-semibold text-cyan-200 ring-1 ring-cyan-400/40">
                    OEM & Premium
                  </span>
                </button>
              </div>
            </div>

            <div className="relative h-full">
              <div className="glass-panel relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 shadow-2xl shadow-cyan-500/20">
                <div className="pointer-events-none absolute -left-16 -top-24 h-52 w-52 rounded-full bg-gradient-to-br from-cyan-500/40 via-sky-500/0 to-emerald-500/0 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-orange-500/40 via-fuchsia-500/0 to-sky-500/0 blur-3xl" />
                <div className="relative flex flex-col items-center gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[0.65rem] font-medium text-slate-200 ring-1 ring-slate-700/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    In-house tested parts
                  </div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black">
                    {siteSettings?.heroImage ? (
                      <img
                        src={siteSettings.heroImage}
                        alt="SR MOBILE hero"
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.5),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.4),_transparent_55%)]">
                        <div className="space-y-3 text-center">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            SR MOBILE LAB
                          </p>
                          <p className="text-sm font-medium text-slate-100">
                            Admin can upload a hero banner from the dashboard.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid w-full gap-3 text-xs text-slate-300 sm:grid-cols-3">
                    <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 ring-1 ring-slate-800/80">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-cyan-400">
                        ⚡
                      </span>
                      <div>
                        <p className="font-semibold">Same-day dispatch</p>
                        <p className="text-[0.7rem] text-slate-400">
                          On in-stock items before 3PM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 ring-1 ring-slate-800/80">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-emerald-400">
                        ✅
                      </span>
                      <div>
                        <p className="font-semibold">Quality checked</p>
                        <p className="text-[0.7rem] text-slate-400">
                          Tested before dispatch
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 ring-1 ring-slate-800/80">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-orange-400">
                        📦
                      </span>
                      <div>
                        <p className="font-semibold">Secure packing</p>
                        <p className="text-[0.7rem] text-slate-400">
                          Bubble wrapped & boxed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick categories */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-base font-semibold text-slate-50">
                  {t(language, "quickCategories")}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  One-click shortcuts to the most requested product families.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "iPhone Parts",
                  brand: "Apple",
                  accent: "from-cyan-500/40 to-sky-500/10",
                },
                {
                  label: "Samsung Parts",
                  brand: "Samsung",
                  accent: "from-sky-500/40 to-blue-500/10",
                },
                {
                  label: "Accessories",
                  brand: "Accessories",
                  accent: "from-emerald-500/40 to-teal-500/10",
                },
                {
                  label: "Repair Tools",
                  brand: "Tools",
                  accent: "from-yellow-400/40 to-orange-500/10",
                },
                {
                  label: "Charging",
                  brand: "Charging",
                  accent: "from-fuchsia-500/40 to-purple-500/10",
                },
              ].map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    if (cat.brand === "Accessories") {
                      setSelectedPartType("Accessory");
                    } else if (cat.brand === "Tools") {
                      setSelectedPartType("Tool");
                    } else if (cat.brand === "Charging") {
                      setSelectedPartType("Charger");
                    } else {
                      setSelectedBrand(cat.brand);
                    }
                    setPage("shop");
                    scrollToTop();
                  }}
                  className={`group flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br ${cat.accent} from-10% to-100% p-3 text-left ring-1 ring-slate-800/80 transition hover:ring-cyan-400/70`}
                >
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-400">
                      Category
                    </p>
                    <p className="font-heading text-sm font-semibold text-slate-50">
                      {cat.label}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[0.7rem] text-slate-300">
                    <span>Tap to browse</span>
                    <span className="rounded-full bg-black/30 px-2 py-0.5 text-[0.65rem] text-cyan-200 group-hover:bg-black/60">
                      View
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shop by Phone Model */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-base font-semibold text-slate-50">
                  Shop by Phone Brand
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Quickly jump into your preferred ecosystem.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Apple",
                "Samsung",
                "Google",
                "OnePlus",
                "Xiaomi",
                "Huawei",
                "Oppo",
                "Vivo",
              ].map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleShopByBrand(brand)}
                  className="group flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3 ring-1 ring-slate-800/80 transition hover:bg-slate-900/80 hover:ring-cyan-500/70"
                >
                  <div>
                    <p className="font-heading text-sm font-semibold text-slate-50">
                      {brand}
                    </p>
                    <p className="text-[0.7rem] text-slate-400">
                      Displays · Batteries · Covers
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Featured products */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-base font-semibold text-slate-50">
                  {t(language, "featuredTitle")}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {t(language, "featuredSubtitle")}
                </p>
              </div>
              <button
                onClick={() => {
                  setPage("shop");
                  scrollToTop();
                }}
                className="hidden text-xs font-medium text-cyan-300 hover:text-cyan-200 sm:inline-flex"
              >
                View all
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
                  Admin can mark featured products from the dashboard. For now
                  we will show the newest items once they are added.
                </div>
              )}
              {featuredProducts.map((product) => (
                <article
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-slate-950/70 ring-1 ring-slate-800/80 transition hover:-translate-y-1 hover:ring-cyan-500/80"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenProduct(product)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900"
                  >
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.45),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.5),_transparent_55%)]">
                        <span className="text-xs font-medium text-slate-900">
                          Image will appear after admin upload
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(product.id);
                      }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs text-slate-100 ring-1 ring-slate-700/80 backdrop-blur transition hover:bg-black/90"
                    >
                      <span>{wishlistIds.includes(product.id) ? "♥" : "♡"}</span>
                    </button>
                  </button>
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div className="space-y-1">
                      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
                        {product.brand} · {product.model}
                      </p>
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-50">
                        {product.name}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-cyan-300">
                          {formatCurrencyLKR(product.price)}
                        </p>
                        <p className="text-[0.7rem] text-slate-500">
                          {product.stock > 0 ? `${product.stock} in stock` : "Pre-order"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product, 1)}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-medium text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-800 hover:text-cyan-300"
                        >
                          <span>{t(language, "addToCart")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickViewProduct(product)}
                          className="inline-flex items-center gap-1 text-[0.65rem] text-slate-400 hover:text-cyan-200"
                        >
                          <span>{t(language, "quickView")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Trust bar & testimonials & newsletter */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    icon: "🚚",
                    title: t(language, "trustFreeDelivery"),
                    desc: "Fast courier anywhere in Sri Lanka.",
                  },
                  {
                    icon: "↩️",
                    title: t(language, "trustReturns"),
                    desc: "Hassle-free returns on eligible parts.",
                  },
                  {
                    icon: "🔒",
                    title: t(language, "trustSecure"),
                    desc: "Secure payment and invoicing.",
                  },
                  {
                    icon: "📱",
                    title: t(language, "trustWhatsApp"),
                    desc: `WhatsApp ${siteSettings?.phone || "0726306039"}`,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-2 rounded-2xl bg-slate-950/70 p-3 ring-1 ring-slate-800/80"
                  >
                    <span className="mt-0.5 text-lg">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[0.7rem] text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-semibold text-slate-50">
                    Testimonials
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(siteSettings?.testimonials || defaultTestimonials).map(
                    (testi) => (
                      <figure
                        key={testi.id}
                        className="relative overflow-hidden rounded-2xl bg-slate-950/70 p-4 ring-1 ring-slate-800/80"
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
                        <blockquote className="text-xs text-slate-300">
                          “{testi.text}”
                        </blockquote>
                        <figcaption className="mt-3 flex items-center justify-between text-[0.7rem] text-slate-400">
                          <div>
                            <p className="font-semibold text-slate-100">
                              {testi.name}
                            </p>
                            {testi.role && <p>{testi.role}</p>}
                          </div>
                          <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[0.65rem] text-cyan-200">
                            Verified customer
                          </span>
                        </figcaption>
                      </figure>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-6 ring-1 ring-slate-800/80">
              <h2 className="font-heading text-base font-semibold text-slate-50">
                {t(language, "newsletterTitle")}
              </h2>
              <p className="text-xs text-slate-400">
                {t(language, "newsletterSubtitle")}
              </p>
              <form className="mt-3 space-y-3" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={t(language, "newsletterPlaceholder")}
                  className="w-full rounded-full border border-slate-700/80 bg-slate-950/80 px-4 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:from-cyan-400 hover:to-sky-300"
                >
                  {t(language, "newsletterButton")}
                </button>
              </form>
              <p className="pt-1 text-[0.65rem] text-slate-500">
                We respect your inbox. Only important stock alerts and launch
                news.
              </p>
            </div>
          </div>
        </section>

        {/* Shop / Product Listing */}
        <section className={page === "shop" ? "space-y-8" : "hidden"}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                SR MOBILE
              </p>
              <h1 className="font-heading text-xl font-semibold text-slate-50">
                {t(language, "shopTitle")}
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Filter by brand, model, and part type to find the exact match
                for your device.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline">Home</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-medium text-slate-100">Shop</span>
              <span className="mx-1 h-5 w-px bg-slate-700/80" />
              <span>{filteredProducts.length} items</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            {/* Filters */}
            <aside className="space-y-4 rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t(language, "filtersTitle")}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand("");
                    setSelectedModel("");
                    setSelectedPartType("");
                    setPriceRange("all");
                    setMinRating(0);
                    setShopSearch("");
                  }}
                  className="text-[0.7rem] text-slate-500 hover:text-cyan-300"
                >
                  Reset
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="mb-1 block text-[0.7rem] font-medium text-slate-400">
                    {t(language, "filterBrand")}
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      setSelectedModel("");
                    }}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  >
                    <option value="">All brands</option>
                    {distinctBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[0.7rem] font-medium text-slate-400">
                    {t(language, "filterModel")}
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  >
                    <option value="">All models</option>
                    {distinctModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[0.7rem] font-medium text-slate-400">
                    {t(language, "filterPartType")}
                  </label>
                  <select
                    value={selectedPartType}
                    onChange={(e) => setSelectedPartType(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  >
                    <option value="">All parts</option>
                    {distinctPartTypes.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[0.7rem] font-medium text-slate-400">
                    {t(language, "filterPrice")}
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  >
                    <option value="all">Any price</option>
                    <option value="0-5000">Up to Rs.5,000</option>
                    <option value="5000-15000">Rs.5,000 - Rs.15,000</option>
                    <option value="15000-30000">Rs.15,000 - Rs.30,000</option>
                    <option value="30000+">Above Rs.30,000</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[0.7rem] font-medium text-slate-400">
                    {t(language, "filterRating")}
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  >
                    <option value={0}>Any rating</option>
                    <option value={3}>3★ & up</option>
                    <option value={4}>4★ & up</option>
                    <option value={4.5}>4.5★ & up</option>
                  </select>
                </div>
              </div>
            </aside>

            {/* Product grid */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 min-w-[180px]">
                  <input
                    type="search"
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    placeholder={t(language, "heroSearchPlaceholder")}
                    className="w-full rounded-full border border-slate-700/80 bg-slate-950/80 px-9 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <svg
                      className="h-4 w-4 text-slate-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.65" y1="16.65" x2="21" y2="21" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-[0.7rem] text-slate-400 sm:inline">
                    {t(language, "sortLabel")}:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  >
                    <option value="popular">
                      {t(language, "sortPopular")}
                    </option>
                    <option value="newest">
                      {t(language, "sortNewest")}
                    </option>
                    <option value="priceLow">
                      {t(language, "sortPriceLowHigh")}
                    </option>
                    <option value="priceHigh">
                      {t(language, "sortPriceHighLow")}
                    </option>
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/70 p-8 text-center text-xs text-slate-400">
                  {t(language, "emptyProducts")}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <article
                      key={product.id}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-slate-950/80 ring-1 ring-slate-800/80 transition hover:-translate-y-1 hover:ring-cyan-500/80"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenProduct(product)}
                        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900"
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.45),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.5),_transparent_55%)]">
                            <span className="text-[0.65rem] font-medium text-slate-900">
                              Awaiting image upload
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(product.id);
                          }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs text-slate-100 ring-1 ring-slate-700/80 backdrop-blur transition hover:bg-black/90"
                        >
                          <span>
                            {wishlistIds.includes(product.id) ? "♥" : "♡"}
                          </span>
                        </button>
                      </button>
                      <div className="flex flex-1 flex-col justify-between p-3">
                        <div className="space-y-1">
                          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
                            {product.brand} · {product.model}
                          </p>
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-50">
                            {product.name}
                          </h3>
                          <p className="text-[0.7rem] text-slate-500">
                            {product.partType}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-cyan-300">
                              {formatCurrencyLKR(product.price)}
                            </p>
                            <p className="text-[0.7rem] text-slate-500">
                              {product.stock > 0
                                ? `${product.stock} in stock`
                                : "Pre-order"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product, 1)}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-medium text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-800 hover:text-cyan-300"
                            >
                              <span>{t(language, "addToCart")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickViewProduct(product)}
                              className="inline-flex items-center gap-1 text-[0.65rem] text-slate-400 hover:text-cyan-200"
                            >
                              <span>{t(language, "quickView")}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Product Detail */}
        <section className={page === "product" && selectedProduct ? "space-y-8" : "hidden"}>
          {selectedProduct && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              {/* Gallery */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => setPage("shop")}
                    className="hover:text-cyan-300"
                  >
                    Shop
                  </button>
                  <span>/</span>
                  <span className="text-slate-300">{selectedProduct.name}</span>
                </div>
                <div className="glass-panel relative overflow-hidden rounded-3xl bg-slate-950/80 p-4">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-900">
                    <img
                      src={
                        selectedProduct.images?.[0] ||
                        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={selectedProduct.name}
                      className="h-full w-full object-cover object-center transition duration-500 hover:scale-105"
                    />
                  </div>
                  {selectedProduct.images?.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto text-[0.6rem] text-slate-400">
                      {selectedProduct.images.map((img, idx) => (
                        <button
                          key={img + idx}
                          type="button"
                          onClick={() => {
                            const copy = [...selectedProduct.images];
                            const [first] = copy.splice(idx, 1);
                            if (first) copy.unshift(first);
                            setSelectedProduct({ ...selectedProduct, images: copy });
                          }}
                          className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900"
                        >
                          <img
                            src={img}
                            alt={selectedProduct.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-400">
                    {selectedProduct.brand} · {selectedProduct.model}
                  </p>
                  <h1 className="font-heading text-xl font-semibold text-slate-50">
                    {selectedProduct.name}
                  </h1>
                  <p className="text-xs text-slate-400">
                    {selectedProduct.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-cyan-300">
                      {formatCurrencyLKR(selectedProduct.price)}
                    </p>
                    <p className="text-[0.7rem] text-slate-500">
                      {selectedProduct.stock > 0
                        ? `${selectedProduct.stock} in stock`
                        : "Available on order"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[0.7rem] text-slate-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Genuine / Premium grade
                    </span>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
                  <p className="text-xs font-semibold text-slate-100">
                    Compatibility checker
                  </p>
                  <p className="text-[0.7rem] text-slate-400">
                    Confirm this part matches your device model.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[0.7rem]">
                    <select
                      value={selectedBrand || selectedProduct.brand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                    >
                      <option value={selectedProduct.brand}>
                        {selectedProduct.brand}
                      </option>
                      {distinctBrands
                        .filter((b) => b !== selectedProduct.brand)
                        .map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                    </select>
                    <select
                      value={selectedModel || selectedProduct.model}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                    >
                      <option value={selectedProduct.model}>
                        {selectedProduct.model}
                      </option>
                      {distinctModels
                        .filter((m) => m !== selectedProduct.model)
                        .map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const queryKey = `${selectedBrand || selectedProduct.brand} ${selectedModel || selectedProduct.model}`.toLowerCase();
                        const isCompatible =
                          selectedProduct.compatibility?.some((c) =>
                            String(c).toLowerCase().includes(queryKey),
                          ) ||
                          !selectedProduct.compatibility?.length;
                        if (isCompatible) {
                          showToast(
                            "success",
                            "This part is compatible with your selection.",
                          );
                        } else {
                          showToast(
                            "error",
                            "Compatibility not confirmed. Please contact support.",
                          );
                        }
                      }}
                      className="rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-4 py-1.5 text-[0.7rem] font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:from-cyan-400 hover:to-sky-300"
                    >
                      Check compatibility
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(selectedProduct, 1)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-900 hover:text-cyan-300"
                  >
                    <span>{t(language, "addToCart")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBuyNow(selectedProduct)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-orange-500/40 transition hover:from-orange-400 hover:to-amber-300"
                  >
                    <span>{t(language, "buyNow")}</span>
                  </button>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
                  <details open className="group">
                    <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-slate-100">
                      Description
                      <span className="text-slate-500 group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <p className="mt-2 text-[0.75rem] text-slate-300">
                      {selectedProduct.description ||
                        "Detailed description will be managed by the admin from the dashboard."}
                    </p>
                  </details>
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-slate-100">
                      Specs
                      <span className="text-slate-500 group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap text-[0.75rem] text-slate-300">
                      {selectedProduct.specs ||
                        "Technical specs such as compatible model numbers, quality grade, and warranty information can be configured from the admin panel."}
                    </p>
                  </details>
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-slate-100">
                      Reviews
                      <span className="text-slate-500 group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <p className="mt-2 text-[0.75rem] text-slate-400">
                      Reviews and ratings can be integrated later; this template
                      reserves space for Firestore-driven review data.
                    </p>
                  </details>
                </div>

                {/* Frequently bought together */}
                <div className="space-y-3 rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-semibold text-slate-100">
                      Frequently bought together
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {products
                      .filter(
                        (p) =>
                          p.id !== selectedProduct.id &&
                          p.brand === selectedProduct.brand,
                      )
                      .slice(0, 3)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddToCart(p, 1)}
                          className="flex items-center gap-3 rounded-xl bg-slate-900/80 p-2 text-left ring-1 ring-slate-800/80 transition hover:ring-cyan-500/70"
                        >
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                            {p.images?.[0] && (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="h-full w-full object-cover object-center"
                              />
                            )}
                          </div>
                          <div className="flex-1 text-[0.7rem]">
                            <p className="line-clamp-2 font-medium text-slate-100">
                              {p.name}
                            </p>
                            <p className="mt-1 text-[0.65rem] text-cyan-200">
                              {formatCurrencyLKR(p.price)}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Checkout (includes full cart summary) */}
        <section className={page === "checkout" ? "space-y-8" : "hidden"}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                SR MOBILE
              </p>
              <h1 className="font-heading text-xl font-semibold text-slate-50">
                {t(language, "checkoutTitle")}
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Delivery charge is kept live from site settings. Current:
                {" "}
                <span className="font-semibold text-cyan-300">
                  {formatCurrencyLKR(deliveryCharge)}
                </span>
                .
              </p>
            </div>
            {!user && (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-900 hover:text-cyan-300"
              >
                {t(language, "authLogin")}
              </button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Details */}
            <form
              onSubmit={handlePlaceOrder}
              className="space-y-5 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80"
            >
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t(language, "checkoutCustomerDetails")}
              </h2>
              <div className="grid gap-4 text-xs sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-slate-400">
                    {t(language, "authName")}*
                  </label>
                  <input
                    required
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-slate-400">
                    {t(language, "authEmail")}*
                  </label>
                  <input
                    required
                    type="email"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-slate-400">
                    {t(language, "authPhone")}*
                  </label>
                  <input
                    required
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-slate-400">City</label>
                  <input
                    value={checkoutCity}
                    onChange={(e) => setCheckoutCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
              </div>
              <div className="grid gap-4 text-xs sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-slate-400">
                    Address*
                  </label>
                  <textarea
                    required
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-slate-400">ZIP</label>
                  <input
                    value={checkoutZip}
                    onChange={(e) => setCheckoutZip(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <label className="text-[0.7rem] text-slate-400">Notes</label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                />
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-900/80 p-4 ring-1 ring-slate-800/80">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t(language, "checkoutPaymentMethod")}
                </h2>
                <div className="grid gap-2 text-xs sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ring-1 transition ${paymentMethod === "card" ? "bg-slate-950 ring-cyan-500/80" : "bg-slate-950/40 ring-slate-800/80"}`}
                  >
                    <span>{t(language, "pmCard")}</span>
                    <span className="text-[0.65rem] text-slate-400">
                      Visa / Master
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ring-1 transition ${paymentMethod === "cod" ? "bg-slate-950 ring-cyan-500/80" : "bg-slate-950/40 ring-slate-800/80"}`}
                  >
                    <span>{t(language, "pmCOD")}</span>
                    <span className="text-[0.65rem] text-slate-400">
                      Pay on delivery
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ring-1 transition ${paymentMethod === "bank" ? "bg-slate-950 ring-cyan-500/80" : "bg-slate-950/40 ring-slate-800/80"}`}
                  >
                    <span>{t(language, "pmBank")}</span>
                    <span className="text-[0.65rem] text-slate-400">
                      Bank transfer
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={placingOrder || !cart.length}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-orange-500/40 transition hover:from-orange-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                )}
                <span>{t(language, "placeOrder")}</span>
              </button>
            </form>

            {/* Order Summary */}
            <aside className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t(language, "cartTitle")} · {cart.length} items
              </h2>
              {cart.length === 0 ? (
                <p className="text-xs text-slate-400">
                  {t(language, "cartEmpty")}
                </p>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 rounded-xl bg-slate-900/80 p-3 ring-1 ring-slate-800/80"
                      >
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover object-center"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="line-clamp-2 text-[0.7rem] font-medium text-slate-100">
                            {item.name}
                          </p>
                          <p className="mt-1 text-[0.65rem] text-slate-500">
                            {item.brand} · {item.model}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-1 py-0.5 text-[0.65rem] text-slate-200 ring-1 ring-slate-700/80">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateCartQty(item.productId, item.qty - 1)
                                }
                                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                              >
                                -
                              </button>
                              <span className="px-1">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateCartQty(item.productId, item.qty + 1)
                                }
                                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.productId)}
                              className="text-[0.65rem] text-slate-500 hover:text-red-400"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="text-right text-[0.75rem] text-slate-100">
                          <p>{formatCurrencyLKR(item.price * item.qty)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 rounded-2xl bg-slate-900/80 p-4">
                    <div className="flex items-center justify-between text-[0.75rem] text-slate-300">
                      <span>{t(language, "cartSubtotal")}</span>
                      <span>{formatCurrencyLKR(cartSubtotal)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-[0.75rem] text-emerald-300">
                        <span>Discount ({appliedCoupon})</span>
                        <span>-{formatCurrencyLKR(cartDiscount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[0.75rem] text-slate-300">
                      <span>{t(language, "cartDelivery")}</span>
                      <span>{formatCurrencyLKR(deliveryCharge)}</span>
                    </div>
                    <div className="mt-2 h-px bg-gradient-to-r from-transparent via-slate-700/80 to-transparent" />
                    <div className="flex items-center justify-between text-[0.8rem] font-semibold text-slate-50">
                      <span>{t(language, "cartTotal")}</span>
                      <span>{formatCurrencyLKR(cartTotal)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={t(language, "cartCouponPlaceholder")}
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-[0.7rem] text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-[0.7rem] font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-800 hover:text-cyan-300"
                      >
                        {t(language, "cartApplyCoupon")}
                      </button>
                    </div>
                    <p className="text-[0.65rem] text-slate-500">
                      Demo coupon: <span className="font-mono">SR10</span> for
                      10% off.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

        {/* Order Tracking */}
        <section className={page === "track" ? "space-y-8" : "hidden"}>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              SR MOBILE
            </p>
            <h1 className="font-heading text-xl font-semibold text-slate-50">
              {t(language, "trackTitle")}
            </h1>
            <p className="text-xs text-slate-400">
              Use the tracking number we sent via WhatsApp and email to check
              your order status.
            </p>
          </div>
          <form
            onSubmit={handleTrackOrder}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80"
          >
            <input
              type="text"
              required
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder={t(language, "trackPlaceholder")}
              className="flex-1 min-w-[200px] rounded-full border border-slate-700/80 bg-slate-950/80 px-4 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
            />
            <button
              type="submit"
              disabled={trackLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-6 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:from-cyan-400 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {trackLoading && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              )}
              <span>{t(language, "trackButton")}</span>
            </button>
          </form>

          {trackOrder && (
            <div className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-100">
                    {trackOrder.trackingNumber}
                  </p>
                  <p className="text-[0.7rem] text-slate-400">
                    {trackOrder.userName} · {trackOrder.city}
                  </p>
                </div>
                <div className="text-right text-[0.7rem] text-slate-400">
                  <p>{formatCurrencyLKR(trackOrder.total)}</p>
                  <p>{getStatusLabel(language, trackOrder.status)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-3 text-[0.7rem] text-slate-300 sm:flex-row sm:items-center">
                {statusOrder.map((status) => {
                  const currentIndex = statusOrder.indexOf(trackOrder.status);
                  const thisIndex = statusOrder.indexOf(status);
                  const done = thisIndex <= currentIndex;
                  return (
                    <div
                      key={status}
                      className="flex flex-1 items-center gap-2"
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] ${done ? "bg-gradient-to-br from-cyan-500 to-emerald-400 text-slate-950" : "bg-slate-800 text-slate-400"}`}
                      >
                        {thisIndex + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-[0.7rem] font-semibold text-slate-100">
                          {getStatusLabel(language, status)}
                        </p>
                        <div className="mt-0.5 h-1 rounded-full bg-slate-800">
                          <div
                            className={`h-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all ${done ? "w-full" : "w-0"}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Account Page */}
        <section className={page === "account" ? "space-y-8" : "hidden"}>
          {!user ? (
            <div className="rounded-2xl bg-slate-950/80 p-6 text-center ring-1 ring-slate-800/80">
              <p className="text-xs text-slate-300">
                Please log in to view your orders and manage your profile.
              </p>
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40"
              >
                {t(language, "authLogin")}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                    SR MOBILE
                  </p>
                  <h1 className="font-heading text-xl font-semibold text-slate-50">
                    {t(language, "accountTitle")}
                  </h1>
                  <p className="mt-1 text-xs text-slate-400">
                    Signed in as {user.email}. Role: {user.role}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => setPage("track")}
                    className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-900 hover:text-cyan-300"
                  >
                    {t(language, "navTrack")}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-900 hover:text-orange-300"
                  >
                    {t(language, "authLogout")}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAccountTab("orders")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${accountTab === "orders" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "accountOrders")}
                </button>
                <button
                  type="button"
                  onClick={() => setAccountTab("profile")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${accountTab === "profile" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "accountProfile")}
                </button>
                <button
                  type="button"
                  onClick={() => setAccountTab("wishlist")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${accountTab === "wishlist" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "accountWishlist")}
                </button>
              </div>

              {accountTab === "orders" && (
                <div className="space-y-3 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80">
                  {userOrders.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      You don't have any orders yet.
                    </p>
                  ) : (
                    <div className="space-y-3 text-xs">
                      {userOrders.map((order) => (
                        <div
                          key={order.id}
                          className="space-y-2 rounded-xl bg-slate-900/80 p-3 ring-1 ring-slate-800/80"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-[0.7rem] font-semibold text-slate-100">
                                {order.trackingNumber}
                              </p>
                              <p className="text-[0.65rem] text-slate-400">
                                {order.city} · {order.paymentMethod.toUpperCase()}
                              </p>
                            </div>
                            <div className="text-right text-[0.7rem] text-slate-300">
                              <p>{formatCurrencyLKR(order.total)}</p>
                              <p className="text-[0.65rem] text-cyan-300">
                                {getStatusLabel(language, order.status)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.65rem]">
                            <div className="flex flex-wrap gap-1 text-slate-400">
                              {order.items.slice(0, 3).map((item) => (
                                <span key={item.productId}>
                                  {item.qty}× {item.name}
                                </span>
                              ))}
                              {order.items.length > 3 && (
                                <span>+{order.items.length - 3} more</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setTrackInput(order.trackingNumber || "");
                                  setPage("track");
                                  scrollToTop();
                                }}
                                className="rounded-full bg-slate-950 px-3 py-1 text-[0.65rem] font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-900 hover:text-cyan-300"
                              >
                                {t(language, "navTrack")}
                              </button>
                              {sitePhoneForWhatsApp && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const waUrl = `https://wa.me/${sitePhoneForWhatsApp}?text=${encodeURIComponent(
                                      `Hi SR MOBILE, I want to check my order ${
                                        order.trackingNumber || order.id
                                      }.`,
                                    )}`;
                                    window.open(waUrl, "_blank");
                                  }}
                                  className="rounded-full bg-emerald-500/10 px-3 py-1 text-[0.65rem] font-semibold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/20"
                                >
                                  WhatsApp SR MOBILE
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {accountTab === "profile" && (
                <form
                  onSubmit={handleProfileSave}
                  className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80"
                >
                  <div className="grid gap-4 text-xs sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[0.7rem] text-slate-400">
                        {t(language, "authName")}
                      </label>
                      <input
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.7rem] text-slate-400">
                        {t(language, "authEmail")}
                      </label>
                      <input
                        disabled
                        value={checkoutEmail}
                        className="w-full cursor-not-allowed rounded-lg border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.7rem] text-slate-400">
                        {t(language, "authPhone")}
                      </label>
                      <input
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.7rem] text-slate-400">City</label>
                      <input
                        value={checkoutCity}
                        onChange={(e) => setCheckoutCity(e.target.value)}
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 text-xs sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="space-y-1">
                      <label className="text-[0.7rem] text-slate-400">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        value={checkoutAddress}
                        onChange={(e) => setCheckoutAddress(e.target.value)}
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.7rem] text-slate-400">ZIP</label>
                      <input
                        value={checkoutZip}
                        onChange={(e) => setCheckoutZip(e.target.value)}
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40"
                  >
                    {t(language, "saveChanges")}
                  </button>
                </form>
              )}

              {accountTab === "wishlist" && (
                <div className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80">
                  {wishlistProducts.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Your wishlist is empty.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {wishlistProducts.map((product) => (
                        <article
                          key={product.id}
                          className="group flex flex-col overflow-hidden rounded-2xl bg-slate-950/80 ring-1 ring-slate-800/80 transition hover:-translate-y-1 hover:ring-cyan-500/80"
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenProduct(product)}
                            className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900"
                          >
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                              />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWishlist(product.id);
                              }}
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs text-slate-100 ring-1 ring-slate-700/80 backdrop-blur transition hover:bg-black/90"
                            >
                              ♥
                            </button>
                          </button>
                          <div className="flex flex-1 flex-col justify-between p-3 text-xs">
                            <div className="space-y-1">
                              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
                                {product.brand} · {product.model}
                              </p>
                              <h3 className="line-clamp-2 text-sm font-semibold text-slate-50">
                                {product.name}
                              </h3>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <p className="text-[0.8rem] font-semibold text-cyan-300">
                                {formatCurrencyLKR(product.price)}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product, 1)}
                                className="rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-800 hover:text-cyan-300"
                              >
                                {t(language, "addToCart")}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Contact Page */}
        <section className={page === "contact" ? "space-y-8" : "hidden"}>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              SR MOBILE
            </p>
            <h1 className="font-heading text-xl font-semibold text-slate-50">
              {t(language, "contactTitle")}
            </h1>
            <p className="text-xs text-slate-400">
              Phone: 0726306039 · Address: GALLE, Sri Lanka
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
            <form
              onSubmit={handleContactSubmit}
              className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80"
            >
              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-slate-400">Name</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.7rem] text-slate-400">
                    {t(language, "authEmail")}*
                  </label>
                  <input
                    required
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <label className="text-[0.7rem] text-slate-400">
                  {t(language, "contactMessagePlaceholder")}*
                </label>
                <textarea
                  required
                  rows={5}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                />
              </div>
              <button
                type="submit"
                disabled={contactSending}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {contactSending && (
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                )}
                {t(language, "contactSend")}
              </button>
            </form>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl bg-slate-950/80 ring-1 ring-slate-800/80">
                <iframe
                  title="SR MOBILE - Anuradhapura map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d507346.9776373603!2d80.077!3d8.335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3afcf4f3d4b30f63%3A0x5ecba9c0a2dd2d8!2sAnuradhapura!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div className="space-y-1 rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
                  <p className="text-[0.7rem] font-semibold text-slate-100">
                    Store details
                  </p>
                  <p className="text-[0.7rem] text-slate-400">
                    SR MOBILE
                    <br />
                    {siteSettings?.address || "GALLE, Sri Lanka"}
                    <br />
                    Phone: {siteSettings?.phone || "0726306039"}
                  </p>
                </div>
                <div className="space-y-1 rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
                  <p className="text-[0.7rem] font-semibold text-slate-100">
                    WhatsApp support
                  </p>
                  <p className="text-[0.7rem] text-slate-400">
                    Tap below to open WhatsApp chat with SR MOBILE.
                  </p>
                  {sitePhoneForWhatsApp && (
                    <button
                      type="button"
                      onClick={() => {
                        const waUrl = `https://wa.me/${sitePhoneForWhatsApp}?text=${encodeURIComponent(
                          "Hi SR MOBILE, I have a question.",
                        )}`;
                        window.open(waUrl, "_blank");
                      }}
                      className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-500/10 px-4 py-1.5 text-[0.7rem] font-semibold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/20"
                    >
                      Open WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Panel */}
        <section className={page === "admin" ? "space-y-8" : "hidden"}>
          {!isAdmin ? (
            <div className="rounded-2xl bg-slate-950/80 p-6 text-center ring-1 ring-slate-800/80">
              <p className="text-xs text-slate-300">
                Admin panel is restricted. Please log in with the admin
                account.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-orange-300">
                    ADMIN
                  </p>
                  <h1 className="font-heading text-xl font-semibold text-slate-50">
                    {t(language, "adminTitle")}
                  </h1>
                  <p className="mt-1 text-xs text-slate-400">
                    Logged in as {user?.email}. Use this panel to manage
                    products, orders, users, and site content.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => setPage("home")}
                    className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-900 hover:text-cyan-300"
                  >
                    View storefront
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-900 hover:text-orange-300"
                  >
                    {t(language, "authLogout")}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAdminTab("products")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${adminTab === "products" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "adminProducts")}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("orders")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${adminTab === "orders" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "adminOrders")}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("users")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${adminTab === "users" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "adminUsers")}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("settings")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${adminTab === "settings" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "adminSettings")}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("homepage")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${adminTab === "homepage" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "adminHomeContent")}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("newsletter")}
                  className={`rounded-full px-3 py-1.5 ring-1 transition ${adminTab === "newsletter" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
                >
                  {t(language, "adminNewsletter")}
                </button>
              </div>

              {adminTab === "products" && (
                <div className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-semibold text-slate-100">
                      Products ({products.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setAdminProductFormOpen(true);
                      }}
                      className="rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-4 py-1.5 text-[0.7rem] font-semibold text-slate-950 shadow-lg shadow-cyan-500/40"
                    >
                      Add product
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-auto text-[0.7rem]">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 bg-slate-950">
                        <tr className="border-b border-slate-800 text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">
                          <th className="px-2 py-2">Name</th>
                          <th className="px-2 py-2">Brand</th>
                          <th className="px-2 py-2">Model</th>
                          <th className="px-2 py-2">Part</th>
                          <th className="px-2 py-2">Price</th>
                          <th className="px-2 py-2">Stock</th>
                          <th className="px-2 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-slate-900/80 hover:bg-slate-900/60"
                          >
                            <td className="px-2 py-1.5">
                              <div className="line-clamp-2 max-w-xs text-ellipsis text-[0.7rem] text-slate-100">
                                {p.name}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-slate-300">
                              {p.brand}
                            </td>
                            <td className="px-2 py-1.5 text-slate-300">
                              {p.model}
                            </td>
                            <td className="px-2 py-1.5 text-slate-300">
                              {p.partType}
                            </td>
                            <td className="px-2 py-1.5 text-cyan-300">
                              {formatCurrencyLKR(p.price)}
                            </td>
                            <td className="px-2 py-1.5 text-slate-300">
                              {p.stock}
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex flex-wrap items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setAdminProductFormOpen(true);
                                  }}
                                  className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-100 ring-1 ring-slate-700/80 hover:text-cyan-300"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdminDeleteProduct(p.id)}
                                  className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] text-red-300 ring-1 ring-red-500/40 hover:bg-red-500/10"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Product modal */}
                  {adminProductFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-slate-950 p-5 text-xs ring-1 ring-slate-800">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-semibold text-slate-100">
                            {editingProduct ? "Edit product" : "Add product"}
                          </h2>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminProductFormOpen(false);
                              setEditingProduct(null);
                            }}
                            className="rounded-full bg-slate-900 px-2 py-1 text-[0.7rem] text-slate-400 hover:text-slate-100"
                          >
                            Close
                          </button>
                        </div>
                        <form
                          onSubmit={handleAdminSaveProduct}
                          className="mt-4 space-y-3"
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-[0.7rem] text-slate-400">
                                Name*
                              </label>
                              <input
                                name="name"
                                defaultValue={editingProduct?.name}
                                required
                                className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[0.7rem] text-slate-400">
                                Brand*
                              </label>
                              <input
                                name="brand"
                                defaultValue={editingProduct?.brand}
                                required
                                className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[0.7rem] text-slate-400">
                                Model*
                              </label>
                              <input
                                name="model"
                                defaultValue={editingProduct?.model}
                                required
                                className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[0.7rem] text-slate-400">
                                Part type*
                              </label>
                              <input
                                name="partType"
                                defaultValue={editingProduct?.partType}
                                required
                                className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                              />
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-[0.7rem] text-slate-400">
                                Price (LKR)*
                              </label>
                              <input
                                name="price"
                                type="number"
                                defaultValue={editingProduct?.price}
                                required
                                className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[0.7rem] text-slate-400">
                                Stock*
                              </label>
                              <input
                                name="stock"
                                type="number"
                                defaultValue={editingProduct?.stock ?? 0}
                                required
                                className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[0.7rem] text-slate-400">
                                Compatibility (comma separated)
                              </label>
                              <input
                                name="compatibility"
                                defaultValue={
                                  editingProduct?.compatibility?.join(", ") ||
                                  ""
                                }
                                className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                              />
                            </div>
                          </div>
                          <div className="space-y-1 text-xs">
                            <label className="text-[0.7rem] text-slate-400">
                              Description
                            </label>
                            <textarea
                              name="description"
                              defaultValue={editingProduct?.description}
                              rows={3}
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                            />
                          </div>
                          <div className="space-y-1 text-xs">
                            <label className="text-[0.7rem] text-slate-400">
                              Specs
                            </label>
                            <textarea
                              name="specs"
                              defaultValue={editingProduct?.specs}
                              rows={3}
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                            />
                          </div>
                          <div className="space-y-1 text-xs">
                            <label className="text-[0.7rem] text-slate-400">
                              Images (you can upload multiple)
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => setProductFormFiles(e.target.files)}
                              className="w-full text-[0.7rem] text-slate-300"
                            />
                            {editingProduct?.images?.length ? (
                              <p className="text-[0.65rem] text-slate-500">
                                Existing images: {editingProduct.images.length}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminProductFormOpen(false);
                                setEditingProduct(null);
                              }}
                              className="rounded-full bg-slate-900 px-4 py-1.5 text-[0.7rem] text-slate-200 ring-1 ring-slate-700/80 hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={productFormLoading}
                              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-5 py-1.5 text-[0.7rem] font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {productFormLoading && (
                                <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                              )}
                              Save
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {adminTab === "orders" && (
                <div className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-semibold text-slate-100">
                      Orders ({allOrders.length})
                    </p>
                  </div>
                  <div className="max-h-[420px] overflow-auto text-[0.7rem]">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 bg-slate-950">
                        <tr className="border-b border-slate-800 text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">
                          <th className="px-2 py-2">Tracking</th>
                          <th className="px-2 py-2">Customer</th>
                          <th className="px-2 py-2">Total</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allOrders.map((o) => (
                          <tr
                            key={o.id}
                            className="border-b border-slate-900/80 hover:bg-slate-900/60"
                          >
                            <td className="px-2 py-1.5 text-slate-200">
                              {o.trackingNumber || o.id}
                            </td>
                            <td className="px-2 py-1.5 text-slate-300">
                              <div className="text-[0.7rem] font-medium">
                                {o.userName}
                              </div>
                              <div className="text-[0.65rem] text-slate-500">
                                {o.email}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-cyan-300">
                              {formatCurrencyLKR(o.total)}
                            </td>
                            <td className="px-2 py-1.5 text-slate-300">
                              <select
                                value={o.status}
                                onChange={(e) =>
                                  handleAdminUpdateOrder(o, {
                                    status: e.target.value as OrderStatus,
                                  })
                                }
                                className="rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[0.7rem] text-slate-100 outline-none"
                              >
                                {statusOrder.map((status) => (
                                  <option key={status} value={status}>
                                    {getStatusLabel(language, status)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex flex-wrap items-center gap-1">
                                <input
                                  type="text"
                                  defaultValue={o.trackingNumber}
                                  placeholder="Tracking number"
                                  className="w-28 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[0.65rem] text-slate-100 outline-none"
                                  onBlur={(e) =>
                                    e.target.value &&
                                    handleAdminUpdateOrder(o, {
                                      trackingNumber: e.target.value,
                                    })
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminUpdateOrder(o, {
                                      status: o.status,
                                      trackingNumber: o.trackingNumber,
                                    })
                                  }
                                  className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-100 ring-1 ring-slate-700/80 hover:bg-slate-800"
                                >
                                  Notify
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === "users" && (
                <div className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-semibold text-slate-100">
                      Users ({allUsers.length})
                    </p>
                  </div>
                  <div className="max-h-[420px] overflow-auto text-[0.7rem]">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 bg-slate-950">
                        <tr className="border-b border-slate-800 text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">
                          <th className="px-2 py-2">Name</th>
                          <th className="px-2 py-2">Email</th>
                          <th className="px-2 py-2">Role</th>
                          <th className="px-2 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map((u) => (
                          <tr
                            key={u.email}
                            className="border-b border-slate-900/80 hover:bg-slate-900/60"
                          >
                            <td className="px-2 py-1.5 text-slate-200">
                              {u.name}
                            </td>
                            <td className="px-2 py-1.5 text-slate-300">
                              {u.email}
                            </td>
                            <td className="px-2 py-1.5 text-slate-300">
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  handleAdminUpdateUserRole(
                                    u.email,
                                    e.target.value as UserRole,
                                  )
                                }
                                className="rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[0.7rem] text-slate-100 outline-none"
                              >
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-2 py-1.5">
                              <button
                                type="button"
                                disabled={u.email.toLowerCase() === ADMIN_EMAIL}
                                onClick={() => handleAdminDeleteUser(u.email)}
                                className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] text-red-300 ring-1 ring-red-500/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === "settings" && siteSettingsDraft && (
                <form
                  onSubmit={handleAdminSaveSettings}
                  className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 text-xs"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[0.7rem] text-slate-400">
                        Delivery charge (LKR)
                      </label>
                      <input
                        type="number"
                        value={siteSettingsDraft.deliveryCharge}
                        onChange={(e) =>
                          setSiteSettingsDraft({
                            ...siteSettingsDraft,
                            deliveryCharge: Number(e.target.value || 0),
                          })
                        }
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.7rem] text-slate-400">
                        Phone
                      </label>
                      <input
                        value={siteSettingsDraft.phone}
                        onChange={(e) =>
                          setSiteSettingsDraft({
                            ...siteSettingsDraft,
                            phone: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[0.7rem] text-slate-400">
                        Address
                      </label>
                      <input
                        value={siteSettingsDraft.address}
                        onChange={(e) =>
                          setSiteSettingsDraft({
                            ...siteSettingsDraft,
                            address: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[0.7rem] text-slate-400">
                        Hero image URL
                      </label>
                      <input
                        value={siteSettingsDraft.heroImage || ""}
                        onChange={(e) =>
                          setSiteSettingsDraft({
                            ...siteSettingsDraft,
                            heroImage: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[0.7rem] text-slate-400">
                        About text
                      </label>
                      <textarea
                        rows={3}
                        value={siteSettingsDraft.aboutText || ""}
                        onChange={(e) =>
                          setSiteSettingsDraft({
                            ...siteSettingsDraft,
                            aboutText: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40"
                  >
                    Save settings
                  </button>
                </form>
              )}

              {adminTab === "homepage" && (
                <form
                  onSubmit={handleAdminSaveHomepageContent}
                  className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 text-xs"
                >
                  <div className="space-y-2">
                    <p className="text-[0.7rem] font-semibold text-slate-100">
                      Featured products
                    </p>
                    <p className="text-[0.7rem] text-slate-400">
                      Select products to highlight on the homepage.
                    </p>
                    <div className="grid max-h-48 gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
                      {products.map((p) => {
                        const checked = homeFeaturedDraft.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-start gap-2 rounded-xl bg-slate-900/80 p-2 ring-1 ring-slate-800/80"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...homeFeaturedDraft, p.id]
                                  : homeFeaturedDraft.filter((id) => id !== p.id);
                                setHomeFeaturedDraft(next);
                              }}
                              className="mt-1 h-3 w-3 rounded border-slate-700/80 bg-slate-950 text-cyan-500"
                            />
                            <span className="text-[0.7rem] text-slate-200">
                              {p.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[0.7rem] font-semibold text-slate-100">
                      Testimonials
                    </p>
                    <p className="text-[0.7rem] text-slate-400">
                      Edit testimonials shown on the homepage.
                    </p>
                    <div className="space-y-3">
                      {homeTestimonialsDraft.map((tst, idx) => (
                        <div
                          key={tst.id}
                          className="grid gap-2 rounded-xl bg-slate-900/80 p-3 ring-1 ring-slate-800/80 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
                        >
                          <textarea
                            rows={3}
                            value={tst.text}
                            onChange={(e) => {
                              const copy = [...homeTestimonialsDraft];
                              copy[idx] = { ...copy[idx], text: e.target.value };
                              setHomeTestimonialsDraft(copy);
                            }}
                            className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-[0.7rem] text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                          />
                          <div className="space-y-2">
                            <input
                              value={tst.name}
                              onChange={(e) => {
                                const copy = [...homeTestimonialsDraft];
                                copy[idx] = { ...copy[idx], name: e.target.value };
                                setHomeTestimonialsDraft(copy);
                              }}
                              placeholder="Name"
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-[0.7rem] text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                            />
                            <input
                              value={tst.role || ""}
                              onChange={(e) => {
                                const copy = [...homeTestimonialsDraft];
                                copy[idx] = { ...copy[idx], role: e.target.value };
                                setHomeTestimonialsDraft(copy);
                              }}
                              placeholder="Role (optional)"
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-[0.7rem] text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setHomeTestimonialsDraft((prev) => [
                            ...prev,
                            {
                              id: `t-${Date.now()}`,
                              name: "",
                              text: "",
                            },
                          ])
                        }
                        className="rounded-full bg-slate-900 px-4 py-1.5 text-[0.7rem] text-slate-200 ring-1 ring-slate-700/80 hover:bg-slate-800"
                      >
                        Add testimonial
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40"
                  >
                    Save homepage content
                  </button>
                </form>
              )}

              {adminTab === "newsletter" && (
                <div className="space-y-4 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 text-xs">
                  <p className="text-[0.7rem] font-semibold text-slate-100">
                    Newsletter subscribers ({newsletterList.length})
                  </p>
                  {newsletterList.length === 0 ? (
                    <p className="text-[0.7rem] text-slate-400">
                      No newsletter subscribers yet.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-[0.7rem] text-slate-200">
                      {newsletterList.map((email) => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Cart Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-slate-950/98 shadow-2xl shadow-black/60 ring-1 ring-slate-800/80 transition-transform duration-300 ease-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-100">
              {t(language, "cartTitle")} ({cart.length})
            </h2>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
            {cart.length === 0 ? (
              <p className="text-xs text-slate-400">
                {t(language, "cartEmpty")}
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 rounded-xl bg-slate-900/80 p-3 ring-1 ring-slate-800/80"
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-2 text-[0.7rem] font-medium text-slate-100">
                        {item.name}
                      </p>
                      <p className="text-[0.65rem] text-slate-500">
                        {item.brand} · {item.model}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-1 py-0.5 text-[0.65rem] text-slate-200 ring-1 ring-slate-700/80">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCartQty(item.productId, item.qty - 1)
                            }
                            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                          >
                            -
                          </button>
                          <span className="px-1">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCartQty(item.productId, item.qty + 1)
                            }
                            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="text-[0.65rem] text-slate-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-[0.75rem] text-slate-100">
                      <p>{formatCurrencyLKR(item.price * item.qty)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-slate-800 bg-slate-950/95 p-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[0.75rem] text-slate-300">
                <span>{t(language, "cartSubtotal")}</span>
                <span>{formatCurrencyLKR(cartSubtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-[0.75rem] text-emerald-300">
                  <span>Discount ({appliedCoupon})</span>
                  <span>-{formatCurrencyLKR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[0.75rem] text-slate-300">
                <span>{t(language, "cartDelivery")}</span>
                <span>{formatCurrencyLKR(deliveryCharge)}</span>
              </div>
              <div className="mt-1 h-px bg-gradient-to-r from-transparent via-slate-700/80 to-transparent" />
              <div className="flex items-center justify-between text-[0.8rem] font-semibold text-slate-50">
                <span>{t(language, "cartTotal")}</span>
                <span>{formatCurrencyLKR(cartTotal)}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={!cart.length}
              onClick={() => {
                setIsCartOpen(false);
                setPage("checkout");
                scrollToTop();
              }}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t(language, "cartProceedCheckout")}
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-slate-950 p-5 text-xs ring-1 ring-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                {quickViewProduct.name}
              </h2>
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="rounded-full bg-slate-900 px-2 py-1 text-[0.7rem] text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-900">
                  {quickViewProduct.images?.[0] && (
                    <img
                      src={quickViewProduct.images[0]}
                      alt={quickViewProduct.name}
                      className="h-full w-full object-cover object-center"
                    />
                  )}
                </div>
                <p className="text-[0.7rem] text-slate-400">
                  {quickViewProduct.description}
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                  {quickViewProduct.brand} · {quickViewProduct.model}
                </p>
                <p className="text-sm font-semibold text-cyan-300">
                  {formatCurrencyLKR(quickViewProduct.price)}
                </p>
                <p className="text-[0.7rem] text-slate-500">
                  {quickViewProduct.stock > 0
                    ? `${quickViewProduct.stock} in stock`
                    : "Available on order"}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(quickViewProduct, 1);
                      setQuickViewProduct(null);
                    }}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-[0.7rem] font-semibold text-slate-100 ring-1 ring-slate-700/80 hover:bg-slate-800 hover:text-cyan-300"
                  >
                    {t(language, "addToCart")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleBuyNow(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-[0.7rem] font-semibold text-slate-950 shadow-lg shadow-orange-500/40"
                  >
                    {t(language, "buyNow")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 p-5 text-xs ring-1 ring-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                {authMode === "login" && t(language, "authLogin")}
                {authMode === "register" && t(language, "authRegister")}
                {authMode === "forgot" && t(language, "authForgot")}
              </h2>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="rounded-full bg-slate-900 px-2 py-1 text-[0.7rem] text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[0.7rem]">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`rounded-full px-3 py-1.5 ring-1 transition ${authMode === "login" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
              >
                {t(language, "authLogin")}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`rounded-full px-3 py-1.5 ring-1 transition ${authMode === "register" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
              >
                {t(language, "authRegister")}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("forgot")}
                className={`rounded-full px-3 py-1.5 ring-1 transition ${authMode === "forgot" ? "bg-slate-50 text-slate-900 ring-slate-300" : "bg-slate-950 text-slate-200 ring-slate-800"}`}
              >
                {t(language, "authForgot")}
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
              {(authMode === "login" || authMode === "register") && (
                <>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] text-slate-400">
                      {t(language, "authEmail")}
                    </label>
                    <input
                      required
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] text-slate-400">
                      {t(language, "authPassword")}
                    </label>
                    <input
                      required
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                    />
                  </div>
                </>
              )}
              {authMode === "register" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] text-slate-400">
                      {t(language, "authName")}
                    </label>
                    <input
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] text-slate-400">
                      {t(language, "authPhone")}
                    </label>
                    <input
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                    />
                  </div>
                </>
              )}
              {authMode === "forgot" && (
                <div className="space-y-2">
                  <p className="text-[0.7rem] text-slate-300">
                    {t(language, "authResetInfo")}
                  </p>
                  <input
                    required
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400/70 focus:ring-cyan-500/40"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authLoading && (
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                )}
                <span>
                  {authMode === "login" && t(language, "authLogin")}
                  {authMode === "register" && t(language, "authRegister")}
                  {authMode === "forgot" && t(language, "authForgot")}
                </span>
              </button>
            </form>
            {authMode === "login" && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-100 ring-1 ring-slate-700/80 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>G</span>
                  <span>{t(language, "authLoginGoogle")}</span>
                </button>
                <div className="mt-3 text-[0.7rem] text-slate-400">
                  <p>
                    Admin account: <span className="font-mono">{ADMIN_EMAIL}</span>
                  </p>
                  <p>
                    Initial password: <span className="font-mono">admin</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4 sm:top-24 sm:justify-end sm:px-8">
        <div className="space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex max-w-xs items-start gap-3 rounded-2xl px-3 py-2 text-xs shadow-lg shadow-black/50 ring-1 ${
                toast.type === "success"
                  ? "bg-emerald-500/10 ring-emerald-500/40 text-emerald-100"
                  : toast.type === "error"
                  ? "bg-red-500/10 ring-red-500/40 text-red-100"
                  : "bg-slate-900/90 ring-slate-700/80 text-slate-100"
              }`}
            >
              <span className="mt-0.5 text-sm">
                {toast.type === "success" && "✓"}
                {toast.type === "error" && "!"}
                {toast.type === "info" && "i"}
              </span>
              <p className="flex-1 text-[0.7rem] leading-snug">{toast.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-black/80 py-6 text-[0.7rem] text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 sm:flex-row sm:items-center lg:px-8">
          <div>
            <p className="font-heading text-sm font-semibold text-slate-100">
              SR MOBILE
            </p>
            <p className="text-[0.7rem] text-slate-500">
              {t(language, "brandTagline")} · {siteSettings?.address || "GALLE, Sri Lanka"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[0.7rem]">
            <span>Phone: {siteSettings?.phone || "0726306039"}</span>
            <span className="hidden h-3 w-px bg-slate-700/80 sm:inline" />
            <span>Email: smartzonelk101@gmail.com</span>
            <span className="hidden h-3 w-px bg-slate-700/80 sm:inline" />
            <span>© {new Date().getFullYear()} SR MOBILE. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
