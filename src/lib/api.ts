import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage, type UserProfile } from "./firebase";
import type { Order, OrderStatus, PayHereSettings, Product, SiteSettings, Testimonial } from "./types";

export function settingsRef() {
  return doc(db, "site_settings", "settings");
}

export function payhereRef() {
  return doc(db, "site_settings", "payhere");
}

export function subscribeSettings(cb: (s: SiteSettings) => void): Unsubscribe {
  return onSnapshot(settingsRef(), (snap) => {
    const data = (snap.data() ?? {}) as Partial<SiteSettings>;
    cb({
      deliveryCharge: data.deliveryCharge ?? 500,
      phone: data.phone ?? "0726306039",
      address: data.address ?? "Galle, Sri Lanka",
      heroImage: data.heroImage ?? "",
      aboutText: data.aboutText ?? "",
      featuredProductIds: data.featuredProductIds ?? [],
      testimonials: (data.testimonials ?? []) as Testimonial[],
    });
  });
}

export async function updateSettings(patch: Partial<SiteSettings>) {
  await setDoc(settingsRef(), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribePayHere(cb: (s: PayHereSettings) => void): Unsubscribe {
  return onSnapshot(payhereRef(), (snap) => {
    const data = (snap.data() ?? {}) as Partial<PayHereSettings>;
    cb({
      enabled: data.enabled ?? false,
      merchantId: data.merchantId ?? "",
      merchantSecret: data.merchantSecret ?? "",
      sandbox: data.sandbox ?? true,
      returnUrl: data.returnUrl ?? window.location.href,
      cancelUrl: data.cancelUrl ?? window.location.href,
      notifyUrl: data.notifyUrl ?? window.location.href,
    });
  });
}

export async function updatePayHere(patch: Partial<PayHereSettings>) {
  await setDoc(payhereRef(), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeProducts(cb: (items: Product[]) => void): Unsubscribe {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const arr: Product[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;

      // Support both legacy `imageUrl` (string) and new `images` (array).
      // Many existing products were saved with imageUrl before the images[] field was added.
      let images: string[] = [];
      if (Array.isArray(data.images) && data.images.length > 0) {
        images = data.images as string[];
      } else if (typeof data.imageUrl === "string" && data.imageUrl.trim()) {
        images = [data.imageUrl.trim()];
      }

      arr.push({
        id: d.id,
        name: data.name ?? "",
        brand: data.brand ?? "",
        model: data.model ?? "",
        partType: data.partType ?? data.category ?? "",
        price: Number(data.price ?? 0),
        stock: Number(data.stock ?? 0),
        images,
        description: data.description ?? "",
        specs: data.specs ?? "",
        compatibility: (data.compatibility ?? []) as string[],
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        rating: data.rating,
        ratingCount: data.ratingCount,
      });
    });
    cb(arr);
  });
}

export async function createProduct(payload: Omit<Product, "id">) {
  const ref = await addDoc(collection(db, "products"), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(productId: string, patch: Partial<Product>) {
  const { id: _ignore, ...rest } = patch as any;
  // Strip undefined values — Firestore rejects them
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
  await updateDoc(doc(db, "products", productId), { ...clean, updatedAt: serverTimestamp() });
}

export async function deleteProduct(productId: string) {
  await deleteDoc(doc(db, "products", productId));
}

export async function uploadProductImages(productId: string, files: File[]) {
  const urls: string[] = [];
  for (const f of files) {
    const path = `products/${productId}/${Date.now()}_${f.name}`;
    const r = ref(storage, path);
    await uploadBytes(r, f);
    const url = await getDownloadURL(r);
    urls.push(url);
  }
  return urls;
}

export async function addMessage(fromEmail: string, message: string) {
  await addDoc(collection(db, "messages"), { fromEmail, message, date: serverTimestamp() });
}

export async function addNewsletter(email: string) {
  await setDoc(doc(db, "newsletter", email), { email, date: serverTimestamp() }, { merge: true });
}

export async function listNewsletter() {
  const snap = await getDocs(collection(db, "newsletter"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function createOrder(payload: Omit<Order, "id">) {
  const ref = await addDoc(collection(db, "orders"), {
    ...payload,
    orderDate: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeMyOrders(email: string, cb: (orders: Order[]) => void) {
  const q = query(collection(db, "orders"), where("email", "==", email), orderBy("orderDate", "desc"));
  return onSnapshot(q, (snap) => {
    const arr: Order[] = [];
    snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
    cb(arr);
  });
}

export function subscribeAllOrders(cb: (orders: Order[]) => void) {
  const q = query(collection(db, "orders"), orderBy("orderDate", "desc"));
  return onSnapshot(q, (snap) => {
    const arr: Order[] = [];
    snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
    cb(arr);
  });
}

export async function updateOrder(orderId: string, patch: Partial<Order>) {
  const { id: _ignore, ...rest } = patch as any;
  await updateDoc(doc(db, "orders", orderId), { ...rest, updatedAt: serverTimestamp() });
}

export async function findOrderByTracking(trackingNumber: string): Promise<Order | null> {
  const q = query(collection(db, "orders"), where("trackingNumber", "==", trackingNumber));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  return { id: first.id, ...(first.data() as any) } as Order;
}

export async function listUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function updateUserRole(email: string, role: UserProfile["role"]) {
  await updateDoc(doc(db, "users", email), { role, updatedAt: serverTimestamp() });
}

export async function deleteUser(email: string) {
  await deleteDoc(doc(db, "users", email));
}

export async function getProduct(productId: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", productId));
  if (!snap.exists()) return null;
  const d = snap.data() as any;

  // Support both legacy `imageUrl` (string) and new `images` (array).
  let images: string[] = [];
  if (Array.isArray(d.images) && d.images.length > 0) {
    images = d.images as string[];
  } else if (typeof d.imageUrl === "string" && d.imageUrl.trim()) {
    images = [d.imageUrl.trim()];
  }

  return {
    id: snap.id,
    name: d.name ?? "",
    brand: d.brand ?? "",
    model: d.model ?? "",
    partType: d.partType ?? d.category ?? "",
    price: Number(d.price ?? 0),
    stock: Number(d.stock ?? 0),
    images,
    description: d.description ?? "",
    specs: d.specs ?? "",
    compatibility: (d.compatibility ?? []) as string[],
    createdBy: d.createdBy,
    createdAt: d.createdAt,
    rating: d.rating,
    ratingCount: d.ratingCount,
  } as Product;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber: string) {
  await updateDoc(doc(db, "orders", orderId), { status, trackingNumber, updatedAt: serverTimestamp() });
}
