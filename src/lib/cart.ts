export type CartItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  isDigital?: boolean;
};

export type CartState = {
  items: CartItem[];
  coupon?: string;
};

const LS_KEY = "sr_cart";
const LS_WISHLIST = "sr_wishlist";

export function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState;
    return { items: parsed.items ?? [], coupon: parsed.coupon };
  } catch {
    return { items: [] };
  }
}

export function saveCart(cart: CartState) {
  localStorage.setItem(LS_KEY, JSON.stringify(cart));
}

export function cartCount(cart: CartState) {
  return cart.items.reduce((a, b) => a + (b.qty ?? 0), 0);
}

export function cartSubtotal(cart: CartState) {
  return cart.items.reduce((a, b) => a + b.price * b.qty, 0);
}

export function computeDiscount(cart: CartState) {
  // Simple demo coupon system. Admin can extend this later.
  const code = (cart.coupon ?? "").trim().toUpperCase();
  const subtotal = cartSubtotal(cart);
  if (!code) return 0;
  if (code === "SR10") return Math.round(subtotal * 0.1);
  return 0;
}

export function addToCart(cart: CartState, item: Omit<CartItem, "qty">, qty = 1): CartState {
  const next = structuredClone(cart) as CartState;
  const found = next.items.find((x) => x.productId === item.productId);
  if (found) found.qty += qty;
  else next.items.push({ ...item, qty });
  return next;
}

export function setQty(cart: CartState, productId: string, qty: number): CartState {
  const next = structuredClone(cart) as CartState;
  const it = next.items.find((x) => x.productId === productId);
  if (!it) return next;
  it.qty = Math.max(1, Math.floor(qty));
  return next;
}

export function removeFromCart(cart: CartState, productId: string): CartState {
  const next = structuredClone(cart) as CartState;
  next.items = next.items.filter((x) => x.productId !== productId);
  return next;
}

export function clearCart(): CartState {
  return { items: [] };
}

export function loadWishlist(): string[] {
  try {
    const raw = localStorage.getItem(LS_WISHLIST);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWishlist(ids: string[]) {
  localStorage.setItem(LS_WISHLIST, JSON.stringify(ids));
}

export function toggleWishlist(ids: string[], productId: string) {
  const set = new Set(ids);
  if (set.has(productId)) set.delete(productId);
  else set.add(productId);
  return Array.from(set);
}
