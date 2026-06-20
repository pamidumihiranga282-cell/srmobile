import { useState } from "react";
import { Button, Input, Modal, Divider } from "./ui";
import toast from "react-hot-toast";
import {
  ensureUserDoc,
  forgotPassword,
  loginWithEmailPassword,
  loginWithGoogle,
  registerWithEmailPassword,
} from "@/lib/firebase";

export function AuthModal(props: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setLoading(true);
    try {
      const u = await loginWithEmailPassword(email.trim(), password);
      await ensureUserDoc(u);
      toast.success("Logged in");
      props.onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister() {
    setLoading(true);
    try {
      const u = await registerWithEmailPassword({ name: name.trim() || "Customer", email: email.trim(), password });
      await ensureUserDoc(u);
      toast.success("Account created");
      props.onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Register failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setLoading(true);
    try {
      const u = await loginWithGoogle();
      await ensureUserDoc(u);
      toast.success("Logged in with Google");
      props.onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Google login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      toast.success("Password reset email sent");
      setMode("login");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={mode === "login" ? "Login" : mode === "register" ? "Register" : "Forgot Password"}
    >
      <div className="grid gap-3">
        {mode === "register" ? (
          <div>
            <div className="text-xs font-semibold text-white/70">Name</div>
            <Input value={name} onChange={setName} placeholder="Your name" />
          </div>
        ) : null}

        <div>
          <div className="text-xs font-semibold text-white/70">Email</div>
          <Input value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
        </div>

        {mode !== "forgot" ? (
          <div>
            <div className="text-xs font-semibold text-white/70">Password</div>
            <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          </div>
        ) : null}

        {mode === "login" ? (
          <Button onClick={onLogin} disabled={loading}>
            Login
          </Button>
        ) : mode === "register" ? (
          <Button onClick={onRegister} disabled={loading}>
            Create account
          </Button>
        ) : (
          <Button onClick={onForgot} disabled={loading}>
            Send reset email
          </Button>
        )}

        <Divider className="my-1" />

        <Button variant="secondary" onClick={onGoogle} disabled={loading}>
          Continue with Google
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
          {mode !== "login" ? (
            <button className="hover:text-white" onClick={() => setMode("login")}>
              Back to Login
            </button>
          ) : (
            <button className="hover:text-white" onClick={() => setMode("register")}>
              Create an account
            </button>
          )}

          {mode !== "forgot" ? (
            <button className="hover:text-white" onClick={() => setMode("forgot")}>
              Forgot password?
            </button>
          ) : null}
        </div>

        <p className="text-[11px] text-white/40">
          Your profile is stored in Firestore at <code>users/{`{email}`}</code>.
        </p>
      </div>
    </Modal>
  );
}
