import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// IMPORTANT: Use exactly this config (provided by the client)
export const firebaseConfig = {
  apiKey: "AIzaSyDaKFHWjMFfabGw0l1NILs_kb8hF5FCRhU",
  authDomain: "srmobile-6091e.firebaseapp.com",
  projectId: "srmobile-6091e",
  storageBucket: "srmobile-6091e.firebasestorage.app",
  messagingSenderId: "977403967748",
  appId: "1:977403967748:web:a90a347b40126ec50f3851",
  measurementId: "G-WLRJ826P2L"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

export type UserRole = "admin" | "customer";

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
};

export const ADMIN_EMAIL = "smartzonelk101@gmail.com";

export async function ensureUserDoc(u: User): Promise<UserProfile> {
  const email = u.email ?? "";
  const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const ref = doc(db, "users", email);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  // If no Firestore profile exists yet (common for Google login or pre-created admin), create one.
  const profile: UserProfile = {
    name: u.displayName || (isAdminEmail ? "Admin" : "Customer"),
    email,
    phone: "",
    address: "",
    role: isAdminEmail ? "admin" : "customer",
  };

  await setDoc(ref, { ...profile, createdAt: serverTimestamp() }, { merge: true });
  return profile;
}

export async function registerWithEmailPassword(params: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}) {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  if (params.name) await updateProfile(cred.user, { displayName: params.name });

  const profile: UserProfile = {
    name: params.name,
    email: params.email,
    phone: params.phone ?? "",
    address: params.address ?? "",
    role: params.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "customer",
  };

  await setDoc(doc(db, "users", params.email), { ...profile, createdAt: serverTimestamp() }, { merge: true });
  return cred.user;
}

export async function loginWithEmailPassword(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export async function forgotPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export function subscribeAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

// Small helper for strict typing at call-sites.
export function asData<T extends DocumentData>(d: DocumentData | undefined | null) {
  return d as T;
}
