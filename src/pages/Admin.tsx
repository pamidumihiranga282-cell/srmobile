import { useEffect, useMemo, useState } from "react";
import type { Order, PayHereSettings, Product, SiteSettings, Testimonial } from "@/lib/types";
import type { UserProfile } from "@/lib/firebase";
import {
  createProduct,
  deleteMessage,
  deleteOrder,
  deleteProduct,
  listMessages,
  listNewsletter,
  listUsers,
  subscribeAllOrders,
  updateOrder,
  updateOrderStatus,
  updatePayHere,
  updateProduct,
  updateSettings,
  uploadProductImages,
} from "@/lib/api";
import { Button, Card, Container, Divider, Input, Modal, Select, Spinner, Textarea } from "@/components/ui";
import toast from "react-hot-toast";

function wa(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const waPhone = digits.startsWith("94") ? digits : digits.startsWith("0") ? `94${digits.slice(1)}` : `94${digits}`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, "_blank");
}

export function AdminPage(props: {
  products: Product[];
  settings: SiteSettings;
  payhere: PayHereSettings;
  profile: UserProfile;
}) {
  const [tab, setTab] = useState<
    "products" | "orders" | "users" | "settings" | "home" | "newsletter" | "payhere" | "messages"
  >("products");

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    setOrdersLoading(true);
    const unsub = subscribeAllOrders((arr) => {
      setOrders(arr as any);
      setOrdersLoading(false);
    });
    return () => unsub();
  }, []);

  // Users
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  async function reloadUsers() {
    setUsersLoading(true);
    try {
      const list = await listUsers();
      setUsers(list);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "users") reloadUsers();
  }, [tab]);

  // Newsletter
  const [newsletter, setNewsletter] = useState<any[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  async function reloadNewsletter() {
    setNewsletterLoading(true);
    try {
      const list = await listNewsletter();
      setNewsletter(list);
    } finally {
      setNewsletterLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "newsletter") reloadNewsletter();
  }, [tab]);

  // Messages
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  async function reloadMessages() {
    setMessagesLoading(true);
    try {
      const list = await listMessages();
      setMessages(list);
    } finally {
      setMessagesLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "messages") reloadMessages();
  }, [tab]);

  // Product modal
  const [productOpen, setProductOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pName, setPName] = useState("");
  const [pBrand, setPBrand] = useState("");
  const [pModel, setPModel] = useState("");
  const [pPartType, setPPartType] = useState("");
  const [pPrice, setPPrice] = useState("0");
  const [pStock, setPStock] = useState("0");
  const [pDesc, setPDesc] = useState("");
  const [pSpecs, setPSpecs] = useState("");
  const [pCompat, setPCompat] = useState("");
  const [pFiles, setPFiles] = useState<File[]>([]);
  const [pImages, setPImages] = useState<string[]>([]);

  // Order edit modal
  const [orderOpen, setOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [oName, setOName] = useState("");
  const [oEmail, setOEmail] = useState("");
  const [oPhone, setOPhone] = useState("");
  const [oAddress, setOAddress] = useState("");
  const [oCity, setOCity] = useState("");
  const [oZip, setOZip] = useState("");
  const [oNotes, setONotes] = useState("");
  const [oTotal, setOTotal] = useState("0");
  const [oPaymentMethod, setOPaymentMethod] = useState<Order["paymentMethod"]>("Cash on Delivery");
  const [oStatus, setOStatus] = useState<Order["status"]>("pending");
  const [oTracking, setOTracking] = useState("");

  function openEditOrder(o: Order) {
    setEditingOrder(o);
    setOName(o.userName ?? "");
    setOEmail(o.email ?? "");
    setOPhone(o.phone ?? "");
    setOAddress(o.shippingAddress ?? "");
    setOCity(o.city ?? "");
    setOZip(o.zip ?? "");
    setONotes(o.notes ?? "");
    setOTotal(String(o.total ?? 0));
    setOPaymentMethod(o.paymentMethod ?? "Cash on Delivery");
    setOStatus(o.status ?? "pending");
    setOTracking(o.trackingNumber ?? "");
    setOrderOpen(true);
  }

  async function saveOrderDetails() {
    if (!editingOrder) return;
    try {
      await updateOrder(editingOrder.id, {
        userName: oName,
        email: oEmail,
        phone: oPhone,
        shippingAddress: oAddress,
        city: oCity,
        zip: oZip,
        notes: oNotes,
        total: Number(oTotal),
        paymentMethod: oPaymentMethod,
        status: oStatus,
        trackingNumber: oTracking,
      });
      toast.success("Order details updated successfully");
      setOrderOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save order");
    }
  }

  function openNewProduct() {
    setEditing(null);
    setPName("");
    setPBrand("");
    setPModel("");
    setPPartType("");
    setPPrice("0");
    setPStock("0");
    setPDesc("");
    setPSpecs("");
    setPCompat("");
    setPImages([]);
    setPFiles([]);
    setProductOpen(true);
  }

  function openEditProduct(p: Product) {
    setEditing(p);
    setPName(p.name);
    setPBrand(p.brand);
    setPModel(p.model);
    setPPartType(p.partType);
    setPPrice(String(p.price));
    setPStock(String(p.stock));
    setPDesc(p.description);
    setPSpecs(p.specs);
    setPCompat((p.compatibility ?? []).join(", "));
    setPImages(p.images ?? []);
    setPFiles([]);
    setProductOpen(true);
  }

  async function saveProduct() {
    try {
      if (!pName.trim()) return toast.error("Name required");
      const payload = {
        name: pName.trim(),
        brand: pBrand.trim(),
        model: pModel.trim(),
        partType: pPartType.trim(),
        price: Number(pPrice || 0),
        stock: Number(pStock || 0),
        images: pImages,
        description: pDesc,
        specs: pSpecs,
        compatibility: pCompat
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        createdBy: props.profile.email,
      } as any;

      let productId = editing?.id;
      if (!productId) {
        productId = await createProduct(payload);
      } else {
        await updateProduct(productId, payload);
      }

      if (pFiles.length) {
        const urls = await uploadProductImages(productId, pFiles);
        const merged = [...pImages, ...urls];
        await updateProduct(productId, { images: merged } as any);
      }

      toast.success(editing ? "Product updated" : "Product created");
      setProductOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  // Settings
  const [sDelivery, setSDelivery] = useState(String(props.settings.deliveryCharge ?? 500));
  const [sPhone, setSPhone] = useState(props.settings.phone ?? "0726306039");
  const [sAddress, setSAddress] = useState(props.settings.address ?? "Galle, Sri Lanka");
  const [sHero, setSHero] = useState(props.settings.heroImage ?? "");
  const [sAbout, setSAbout] = useState(props.settings.aboutText ?? "");

  useEffect(() => {
    setSDelivery(String(props.settings.deliveryCharge ?? 500));
    setSPhone(props.settings.phone ?? "0726306039");
    setSAddress(props.settings.address ?? "Galle, Sri Lanka");
    setSHero(props.settings.heroImage ?? "");
    setSAbout(props.settings.aboutText ?? "");
  }, [props.settings]);

  async function saveSettings() {
    try {
      await updateSettings({
        deliveryCharge: Number(sDelivery || 500),
        phone: sPhone,
        address: sAddress,
        heroImage: sHero,
        aboutText: sAbout,
      });
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  // Homepage content
  const [featuredIds, setFeaturedIds] = useState<string[]>(props.settings.featuredProductIds ?? []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(props.settings.testimonials ?? []);

  useEffect(() => {
    setFeaturedIds(props.settings.featuredProductIds ?? []);
    setTestimonials(props.settings.testimonials ?? []);
  }, [props.settings.featuredProductIds, props.settings.testimonials]);

  async function saveHomeContent() {
    try {
      await updateSettings({ featuredProductIds: featuredIds, testimonials });
      toast.success("Homepage content updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  // PayHere
  const [phEnabled, setPhEnabled] = useState(props.payhere.enabled);
  const [phMerchantId, setPhMerchantId] = useState(props.payhere.merchantId);
  const [phSecret, setPhSecret] = useState(props.payhere.merchantSecret);
  const [phSandbox, setPhSandbox] = useState(props.payhere.sandbox);
  const [phReturn, setPhReturn] = useState(props.payhere.returnUrl);
  const [phCancel, setPhCancel] = useState(props.payhere.cancelUrl);
  const [phNotify, setPhNotify] = useState(props.payhere.notifyUrl);

  useEffect(() => {
    setPhEnabled(props.payhere.enabled);
    setPhMerchantId(props.payhere.merchantId);
    setPhSecret(props.payhere.merchantSecret);
    setPhSandbox(props.payhere.sandbox);
    setPhReturn(props.payhere.returnUrl);
    setPhCancel(props.payhere.cancelUrl);
    setPhNotify(props.payhere.notifyUrl);
  }, [props.payhere]);

  async function savePayHere() {
    try {
      await updatePayHere({
        enabled: phEnabled,
        merchantId: phMerchantId,
        merchantSecret: phSecret,
        sandbox: phSandbox,
        returnUrl: phReturn,
        cancelUrl: phCancel,
        notifyUrl: phNotify,
      });
      toast.success("PayHere settings saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  const productOptions = useMemo(() => props.products.map((p) => ({ id: p.id, label: `${p.name} (${p.brand} ${p.model})` })), [props.products]);

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">Home / Admin</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["products", "Manage Products"],
            ["orders", "Manage Orders"],
            ["users", "Manage Users"],
            ["messages", "Messages"],
            ["settings", "Site Settings"],
            ["home", "Homepage Content"],
            ["newsletter", "Newsletter"],
            ["payhere", "PayHere Setup"],
          ].map(([k, label]) => (
            <button
              key={k}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === k ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10"}`}
              onClick={() => setTab(k as any)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === "products" ? (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Products</div>
                  <div className="text-xs text-white/50">Add, edit, delete. Images uploaded to Firebase Storage.</div>
                </div>
                <Button onClick={openNewProduct}>Add New</Button>
              </div>

              <Divider className="my-3" />

              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead className="text-xs text-white/60">
                    <tr>
                      <th className="py-2">Name</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.products.map((p) => (
                      <tr key={p.id} className="border-t border-white/10">
                        <td className="py-2 pr-3 text-white">{p.name}</td>
                        <td className="text-white/70">{p.brand}</td>
                        <td className="text-white/70">{p.model}</td>
                        <td className="text-white/70">{p.partType}</td>
                        <td className="text-white/70">Rs. {Number(p.price).toLocaleString()}</td>
                        <td className="text-white/70">{p.stock}</td>
                        <td className="py-2 text-right">
                          <div className="inline-flex gap-2">
                            <Button variant="secondary" onClick={() => openEditProduct(p)}>
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              onClick={async () => {
                                if (!confirm("Delete product?")) return;
                                await deleteProduct(p.id);
                                toast.success("Deleted");
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {tab === "orders" ? (
            <Card className="p-4">
              <div className="text-sm font-semibold text-white">Orders</div>
              <Divider className="my-3" />
              {ordersLoading ? <Spinner label="Loading orders..." /> : null}
              <div className="overflow-auto">
                <table className="min-w-[1100px] w-full text-left text-sm">
                  <thead className="text-xs text-white/60">
                    <tr>
                      <th className="py-2">Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Tracking</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <OrderRow key={o.id} o={o} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {tab === "users" ? (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Users</div>
                <Button variant="secondary" onClick={reloadUsers}>
                  Refresh
                </Button>
              </div>
              <Divider className="my-3" />
              {usersLoading ? <Spinner label="Loading users..." /> : null}
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead className="text-xs text-white/60">
                    <tr>
                      <th className="py-2">Email</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <UserRow key={u.email} u={u} />
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-white/40">
                Note: Deleting a user here removes only the Firestore profile doc (Auth user deletion requires server/admin SDK).
              </p>
            </Card>
          ) : null}

          {tab === "settings" ? (
            <Card className="p-4 sm:p-6">
              <div className="text-sm font-semibold text-white">Site Settings</div>
              <Divider className="my-3" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-white/70">Delivery Charge (default 500)</div>
                  <Input value={sDelivery} onChange={setSDelivery} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70">Phone</div>
                  <Input value={sPhone} onChange={setSPhone} />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-white/70">Address</div>
                  <Input value={sAddress} onChange={setSAddress} />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-white/70">Hero Image URL</div>
                  <Input value={sHero} onChange={setSHero} placeholder="https://..." />
                  <div className="mt-1 text-xs text-white/40">If empty, homepage uses built-in placeholders.</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-white/70">About Text</div>
                  <Textarea value={sAbout} onChange={setSAbout} rows={5} />
                </div>
              </div>
              <Button onClick={saveSettings} className="mt-4">
                Save Settings
              </Button>
            </Card>
          ) : null}

          {tab === "home" ? (
            <Card className="p-4 sm:p-6">
              <div className="text-sm font-semibold text-white">Homepage Content</div>
              <Divider className="my-3" />

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold text-white">Featured Products</div>
                  <div className="mt-2 max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    {productOptions.map((p) => {
                      const checked = featuredIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex cursor-pointer items-center gap-2 py-2 text-sm text-white/80">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setFeaturedIds((prev) =>
                                prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                              );
                            }}
                          />
                          <span className="truncate">{p.label}</span>
                        </label>
                      );
                    })}
                    {!productOptions.length ? <div className="text-sm text-white/60">No products yet.</div> : null}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">Testimonials</div>
                    <Button
                      variant="secondary"
                      onClick={() => setTestimonials((prev) => [...prev, { name: "", text: "", rating: 5 }])}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-3">
                    {testimonials.map((t, i) => (
                      <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="grid gap-2">
                          <Input
                            value={t.name}
                            onChange={(v) =>
                              setTestimonials((prev) => prev.map((x, idx) => (idx === i ? { ...x, name: v } : x)))
                            }
                            placeholder="Name"
                          />
                          <Textarea
                            value={t.text}
                            onChange={(v) =>
                              setTestimonials((prev) => prev.map((x, idx) => (idx === i ? { ...x, text: v } : x)))
                            }
                            placeholder="Testimonial text"
                            rows={3}
                          />
                          <Select
                            value={String(t.rating ?? 5)}
                            onChange={(v) =>
                              setTestimonials((prev) =>
                                prev.map((x, idx) => (idx === i ? { ...x, rating: Number(v) } : x))
                              )
                            }
                            options={["5", "4", "3", "2", "1"].map((x) => ({ value: x, label: `${x} stars` }))}
                          />
                          <Button
                            variant="danger"
                            onClick={() => setTestimonials((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!testimonials.length ? <div className="text-sm text-white/60">No testimonials yet.</div> : null}
                  </div>
                </div>
              </div>

              <Button onClick={saveHomeContent} className="mt-4">
                Save Homepage Content
              </Button>
            </Card>
          ) : null}

          {tab === "newsletter" ? (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Newsletter List</div>
                  <div className="text-xs text-white/50">Stored as newsletter/{`{email}`}</div>
                </div>
                <Button variant="secondary" onClick={reloadNewsletter}>
                  Refresh
                </Button>
              </div>
              <Divider className="my-3" />
              {newsletterLoading ? <Spinner label="Loading..." /> : null}
              <div className="grid gap-2">
                {newsletter.map((n) => (
                  <div key={n.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/80">
                    {n.email}
                  </div>
                ))}
                {!newsletterLoading && !newsletter.length ? <div className="text-sm text-white/60">No signups.</div> : null}
              </div>
            </Card>
          ) : null}

          {tab === "messages" ? (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Customer Messages</div>
                  <div className="text-xs text-white/50">Messages sent via the Contact page</div>
                </div>
                <Button variant="secondary" onClick={reloadMessages}>
                  Refresh
                </Button>
              </div>
              <Divider className="my-3" />
              {messagesLoading ? <Spinner label="Loading..." /> : null}
              <div className="grid gap-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[#00b4d8]">{m.fromEmail}</div>
                        <div className="mt-0.5 text-xs text-white/40">
                          {m.date?.toDate ? m.date.toDate().toLocaleString() : ""}
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        onClick={async () => {
                          if (!confirm("Delete this message?")) return;
                          await deleteMessage(m.id);
                          toast.success("Deleted");
                          await reloadMessages();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                    <p className="text-sm text-white/80">{m.message}</p>
                  </div>
                ))}
                {!messagesLoading && !messages.length ? (
                  <div className="text-sm text-white/60">No messages yet.</div>
                ) : null}
              </div>
            </Card>
          ) : null}

          {tab === "payhere" ? (
            <Card className="p-4 sm:p-6">
              <div className="text-sm font-semibold text-white">PayHere Setup (Separate Page)</div>
              <p className="mt-1 text-sm text-white/60">
                Configure PayHere merchant details. For best security, generate the hash on a backend.
              </p>
              <Divider className="my-4" />
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={phEnabled} onChange={(e) => setPhEnabled(e.target.checked)} /> Enable PayHere
              </label>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-white/70">Merchant ID</div>
                  <Input value={phMerchantId} onChange={setPhMerchantId} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70">Merchant Secret</div>
                  <Input value={phSecret} onChange={setPhSecret} />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-white/80">
                    <input type="checkbox" checked={phSandbox} onChange={(e) => setPhSandbox(e.target.checked)} /> Use Sandbox
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-white/70">Return URL</div>
                  <Input value={phReturn} onChange={setPhReturn} />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-white/70">Cancel URL</div>
                  <Input value={phCancel} onChange={setPhCancel} />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-white/70">Notify URL</div>
                  <Input value={phNotify} onChange={setPhNotify} />
                  <div className="mt-1 text-xs text-white/40">
                    PayHere sends payment status to notify_url (server callback). For static hosting, this must point to a backend.
                  </div>
                </div>
              </div>

              <Button onClick={savePayHere} className="mt-4">
                Save PayHere
              </Button>
            </Card>
          ) : null}
        </div>
      </Container>

      <Modal open={productOpen} onClose={() => setProductOpen(false)} title={editing ? "Edit Product" : "Add Product"}>
        <div className="grid gap-3">
          <div>
            <div className="text-xs font-semibold text-white/70">Name *</div>
            <Input value={pName} onChange={setPName} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs font-semibold text-white/70">Brand</div>
              <Input value={pBrand} onChange={setPBrand} placeholder="Apple" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white/70">Model</div>
              <Input value={pModel} onChange={setPModel} placeholder="iPhone 13" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-white/70">Part Type</div>
            <Input value={pPartType} onChange={setPPartType} placeholder="Screen / Battery / Accessories" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs font-semibold text-white/70">Price</div>
              <Input value={pPrice} onChange={setPPrice} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white/70">Stock</div>
              <Input value={pStock} onChange={setPStock} />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-white/70">Compatibility (comma separated: Brand|Model)</div>
            <Input value={pCompat} onChange={setPCompat} placeholder="Apple|iPhone 13, Apple|iPhone 13 Pro" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/70">Description</div>
            <Textarea value={pDesc} onChange={setPDesc} rows={4} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/70">Specs</div>
            <Textarea value={pSpecs} onChange={setPSpecs} rows={4} />
          </div>
          {pImages.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-white/70">Current Images</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {pImages.map((url, idx) => (
                  <div key={url} className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <img src={url} alt="product" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white hover:bg-red-600 transition"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-white/70">Images (upload to Firebase Storage)</div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15"
            />
            <div className="mt-1 text-xs text-white/40">Select multiple images. They will be uploaded and saved to product.images[]</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProduct}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal open={orderOpen} onClose={() => setOrderOpen(false)} title="Edit Order Details">
        <div className="grid gap-3">
          {editingOrder && (
            <div>
              <div className="text-xs font-semibold text-white/70">Order ID</div>
              <div className="mt-1 font-mono text-sm text-[#00b4d8] font-bold">{editingOrder.id}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-white/70">Customer Name *</div>
            <Input value={oName} onChange={setOName} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs font-semibold text-white/70">Email *</div>
              <Input value={oEmail} onChange={setOEmail} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white/70">Phone *</div>
              <Input value={oPhone} onChange={setOPhone} />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-white/70">Shipping Address *</div>
            <Input value={oAddress} onChange={setOAddress} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs font-semibold text-white/70">City *</div>
              <Input value={oCity} onChange={setOCity} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white/70">ZIP Code</div>
              <Input value={oZip} onChange={setOZip} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs font-semibold text-white/70">Payment Method</div>
              <Select
                value={oPaymentMethod}
                onChange={(v) => setOPaymentMethod(v as any)}
                options={[
                  { value: "Card", label: "Card" },
                  { value: "Cash on Delivery", label: "Cash on Delivery" },
                  { value: "Bank Transfer", label: "Bank Transfer" },
                  { value: "PayHere", label: "PayHere" },
                ]}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-white/70">Order Total (Rs.)</div>
              <Input value={oTotal} onChange={setOTotal} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs font-semibold text-white/70">Status</div>
              <Select
                value={oStatus}
                onChange={(v) => setOStatus(v as any)}
                options={[
                  { value: "pending", label: "pending" },
                  { value: "processing", label: "processing" },
                  { value: "shipped", label: "shipped" },
                  { value: "delivered", label: "delivered" },
                ]}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-white/70">Tracking Number</div>
              <Input value={oTracking} onChange={setOTracking} />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-white/70">Order Notes</div>
            <Textarea value={oNotes} onChange={setONotes} rows={3} />
          </div>
          {editingOrder && (
            <div>
              <div className="text-xs font-semibold text-white/70">Ordered Items</div>
              <div className="mt-1 max-h-[120px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-2 text-xs space-y-1">
                {editingOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-white/80">
                    <span className="truncate pr-2">{item.qty}× {item.name}</span>
                    <span className="shrink-0">Rs. {(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOrderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveOrderDetails}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  function OrderRow({ o }: { o: Order }) {
    const [status, setStatus] = useState<Order["status"]>(o.status);
    const [tracking, setTracking] = useState(o.trackingNumber ?? "");
    const [saving, setSaving] = useState(false);

    async function save() {
      setSaving(true);
      try {
        await updateOrderStatus(o.id, status, tracking);
        toast.success("Order updated");
        // Notify customer
        if (o.phone) {
          wa(o.phone, `Your order ${o.id} status is now: ${status}. Tracking: ${tracking || "N/A"}`);
        }
        // Simulate email
        console.log("[EMAIL] Order updated", { orderId: o.id, status, tracking, email: o.email });
      } catch (e: any) {
        toast.error(e?.message ?? "Failed");
      } finally {
        setSaving(false);
      }
    }

    return (
      <tr className="border-t border-white/10">
        <td className="py-2 pr-3">
          <div className="font-mono text-xs text-white">{o.id}</div>
          <div className="text-xs text-white/50">{o.paymentMethod}</div>
        </td>
        <td className="text-white/70">
          <div className="text-white">{o.userName}</div>
          <div className="text-xs text-white/50">{o.email}</div>
        </td>
        <td className="text-white/70">Rs. {Number(o.total).toLocaleString()}</td>
        <td className="text-white/70">
          <Select
            value={status}
            onChange={(v) => setStatus(v as any)}
            options={[
              { value: "pending", label: "pending" },
              { value: "processing", label: "processing" },
              { value: "shipped", label: "shipped" },
              { value: "delivered", label: "delivered" },
            ]}
          />
        </td>
        <td className="text-white/70">
          <Input value={tracking} onChange={setTracking} placeholder="Tracking number" />
        </td>
        <td className="py-2 text-right">
          <div className="inline-flex gap-2">
            <Button variant="secondary" onClick={() => wa(o.phone, `Hi ${o.userName}, your order ${o.id} is ${status}.`)}>
              WhatsApp
            </Button>
            <Button variant="secondary" onClick={() => openEditOrder(o)}>
              Edit
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirm(`Are you sure you want to delete order ${o.id}?`)) return;
                try {
                  await deleteOrder(o.id);
                  toast.success("Order deleted");
                } catch (e: any) {
                  toast.error(e?.message ?? "Failed to delete order");
                }
              }}
            >
              Delete
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  function UserRow({ u }: { u: UserProfile }) {
    const [role, setRole] = useState<UserProfile["role"]>(u.role);
    const [saving, setSaving] = useState(false);

    return (
      <tr className="border-t border-white/10">
        <td className="py-2 pr-3 text-white">{u.email}</td>
        <td className="text-white/70">{u.name}</td>
        <td className="text-white/70">{u.phone}</td>
        <td className="text-white/70">
          <Select
            value={role}
            onChange={(v) => setRole(v as any)}
            options={[
              { value: "customer", label: "customer" },
              { value: "admin", label: "admin" },
            ]}
          />
        </td>
        <td className="py-2 text-right">
          <div className="inline-flex gap-2">
            <Button
              onClick={async () => {
                setSaving(true);
                try {
                  // Lazy import to avoid adding more API surface
                  const { updateUserRole } = await import("@/lib/api");
                  await updateUserRole(u.email, role);
                  toast.success("Role updated");
                  await reloadUsers();
                } catch (e: any) {
                  toast.error(e?.message ?? "Failed");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              Save
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirm("Delete user profile doc?")) return;
                const { deleteUser } = await import("@/lib/api");
                await deleteUser(u.email);
                toast.success("Deleted");
                await reloadUsers();
              }}
            >
              Delete
            </Button>
          </div>
        </td>
      </tr>
    );
  }
}
