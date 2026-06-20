import type { Timestamp } from "firebase/firestore";

export type Product = {
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
  createdAt?: Timestamp;
  // Optional fields to support rating filter/sort.
  rating?: number;
  ratingCount?: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export type Order = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  total: number;
  deliveryCharge: number;
  status: OrderStatus;
  trackingNumber: string;
  shippingAddress: string;
  city: string;
  zip: string;
  orderDate?: Timestamp;
  paymentMethod: "Card" | "Cash on Delivery" | "Bank Transfer" | "PayHere";
  notes: string;
};

export type Testimonial = {
  name: string;
  text: string;
  rating: number;
};

export type SiteSettings = {
  deliveryCharge: number;
  phone: string;
  address: string;
  heroImage: string;
  aboutText: string;
  featuredProductIds?: string[];
  testimonials?: Testimonial[];
};

export type PayHereSettings = {
  enabled: boolean;
  merchantId: string;
  merchantSecret: string;
  sandbox: boolean;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
};
