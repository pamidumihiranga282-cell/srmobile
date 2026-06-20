import { useState } from "react";
import { Button, Card, Container, Divider, Input, Textarea } from "@/components/ui";
import type { SiteSettings } from "@/lib/types";
import { addMessage } from "@/lib/api";
import toast from "react-hot-toast";

export function ContactPage(props: { settings: SiteSettings }) {
  const [fromEmail, setFromEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    if (!fromEmail.trim() || !message.trim()) {
      toast.error("Please fill email and message");
      return;
    }
    await addMessage(fromEmail.trim(), message.trim());
    setMessage("");
    toast.success("Message sent!");
  }

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">Home / Contact</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-4 sm:p-6">
            <div className="text-sm font-semibold text-white">Store Details</div>
            <Divider className="my-3" />
            <div className="space-y-2 text-sm text-white/70">
              <div>
                <span className="text-white/50">Brand:</span> SR MOBILE
              </div>
              <div>
                <span className="text-white/50">Phone:</span> {props.settings.phone || "0726306039"}
              </div>
              <div>
                <span className="text-white/50">Address:</span> {props.settings.address || "Galle, Sri Lanka"}
              </div>
              <div>
                <span className="text-white/50">Support:</span> WhatsApp 24/7
              </div>
            </div>

            <Divider className="my-4" />
            <div className="text-sm font-semibold text-white">Send a message</div>
            <div className="mt-3 grid gap-3">
              <div>
                <div className="text-xs font-semibold text-white/70">Your Email</div>
                <Input value={fromEmail} onChange={setFromEmail} placeholder="you@email.com" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white/70">Message</div>
                <Textarea value={message} onChange={setMessage} placeholder="How can we help?" rows={5} />
              </div>
              <Button onClick={submit}>Send</Button>
            </div>
            <p className="mt-3 text-xs text-white/40">
              Messages are stored in Firestore at <code>messages</code>.
            </p>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4">
              <div className="text-sm font-semibold text-white">Find us on map</div>
              <div className="text-xs text-white/50">Google Maps (Anuradhapura)</div>
            </div>
            <div className="aspect-[16/12] w-full bg-white/5">
              <iframe
                title="Map"
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Anuradhapura%2C%20Sri%20Lanka&output=embed"
              />
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
