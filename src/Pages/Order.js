import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Order.css";

// If you already use a backend, remove SAMPLE_SHOPS and fetch /api/shop/:id
const SAMPLE_SHOPS = [
  { id: "s1", name: "Nagvekar Medical", category: "Medical", address: "Main Road", deliveryCharge: 20, phone: "919999999999" },
  { id: "s2", name: "Shree Prasad Grocery", category: "Grocery", address: "Market Lane", deliveryCharge: 15 },
  { id: "s3", name: "Lucky Fruits", category: "Fruits", address: "Near Bus Stand", deliveryCharge: 10 },
  { id: "s4", name: "Aniket Bakery", category: "Bakery", address: "Shop No. 5", deliveryCharge: 12 },
];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const AVAILABLE_SHOP_ID = "s1"; // Only this shop can place orders

// simple canvas-based compressor
async function compressImageFile(file, maxWidth = 1200, quality = 0.75) {
  if (!file || !file.type.startsWith("image/")) return file;

  const image = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("Image compression failed");

  const newFile = new File([blob], (file.name || "photo").replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
  return newFile;
}

const Order = () => {
  const q = useQuery();
  const navigate = useNavigate();
  const shopId = q.get("shop");
  const phoneFromQ = q.get("phone") || "";

  const [shop, setShop] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);

  // form state (NO price fields)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(phoneFromQ);
  const [address, setAddress] = useState("");
  const [items, setItems] = useState([{ name: "", qty: 1 }]);
  const [note, setNote] = useState(""); // short optional note
  const [prescription, setPrescription] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // success modal control
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadShop = async () => {
      setLoadingShop(true);
      try {
        // If you have backend, uncomment this fetch:
        // const res = await fetch(`/api/shop/${shopId}`);
        // if (res.ok) { const data = await res.json(); setShop(data); }
        // else fallback:
        const found = SAMPLE_SHOPS.find((s) => s.id === shopId);
        if (found) setShop(found);
        else setShop(null);
      } catch (err) {
        setShop(null);
      } finally {
        setLoadingShop(false);
      }
    };
    loadShop();
  }, [shopId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }
  function addItem() {
    setItems((p) => [...p, { name: "", qty: 1 }]);
  }
  function removeItem(i) {
    setItems((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setPrescription(null);
      return;
    }

    const initialLimit = 30 * 1024 * 1024;
    if (file.size > initialLimit) {
      setError("Selected file is too large. Please use a smaller file or take a lower-resolution photo.");
      fileRef.current.value = "";
      return;
    }

    setError("");
    if (file.type === "application/pdf") {
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      setPrescription(file);
      return;
    }

    try {
      const compressed = await compressImageFile(file, 1200, 0.75);

      const finalLimit = 10 * 1024 * 1024;
      if (compressed.size > finalLimit) {
        setError("Image is still too large after compression. Try retaking with lower resolution or use gallery selection.");
        fileRef.current.value = "";
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setPrescription(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("File processing error:", err);
      setError("Could not process the photo. Try again or upload from files.");
      fileRef.current.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!shop) return setError("Invalid shop selected.");
    if (shop.id !== AVAILABLE_SHOP_ID) return setError("Ordering is not available for this shop.");
    if (!name.trim()) return setError("Please enter your name.");
    if (!phone.trim()) return setError("Please enter your phone number.");
    if (!address.trim()) return setError("Please enter delivery address.");
    if (items.length === 0 || items.some(it => !it.name.trim())) return setError("Please add at least one item with a name.");

    const formData = new FormData();
    formData.append("shopId", shop.id);
    formData.append("shopName", shop.name);
    formData.append("customerName", name);
    formData.append("customerPhone", phone);
    formData.append("address", address);
    formData.append("note", note || "");
    formData.append("items", JSON.stringify(items.map(it => ({ name: it.name, qty: Number(it.qty || 1) }))));

    if (prescription) formData.append("prescription", prescription);

    setSubmitting(true);
    try {
      // Replace this with actual backend call
      // const res = await fetch("/api/orders", { method: "POST", body: formData });
      // ... handle response ...
      const id = "ORD" + Date.now().toString().slice(-6);
      await new Promise(r => setTimeout(r, 700));
      setResult({ ok: true, orderId: id });

      // RESET ALL INPUTS AFTER SUCCESS
      setName("");
      setPhone(phoneFromQ || "");
      setAddress("");
      setItems([{ name: "", qty: 1 }]);
      setNote("");
      setPrescription(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);

      if (fileRef.current) fileRef.current.value = "";

      // show success animation/modal
      setShowSuccess(true);
      // auto-hide success modal after 3.2s
      setTimeout(() => setShowSuccess(false), 3200);

    } catch (err) {
      setError(err.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingShop) return <div className="order-root"><p>Loading shop...</p></div>;
  if (!shop) return (
    <div className="order-root">
      <div className="no-shop">Shop not found. <button onClick={() => navigate("/")}>Back to shops</button></div>
    </div>
  );

  if (shop.id !== AVAILABLE_SHOP_ID) {
    const contactText = `Hi ${shop.name}, are you accepting orders via this app?`;
    return (
      <main className="order-root">
        <header className="order-header">
          <button className="back" onClick={() => navigate(-1)}>← Back</button>
          <div>
            <h2 className="shop-title">{shop.name}</h2>
            <p className="shop-sub">{shop.category} • {shop.address}</p>
          </div>
        </header>

        <section className="order-card">
          <div className="order-form" style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>Service not available</h3>
            <p>We're sorry — ordering via this app is currently available only for <strong>Nagvekar Medical</strong>. Please contact the shop directly or check back later.</p>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="submit-btn" onClick={() => navigate("/")}>Back to shops</button>

              {shop.phone ? (
                <button
                  className="add-item"
                  onClick={() => {
                    const text = encodeURIComponent(contactText);
                    window.open(`https://wa.me/${shop.phone}?text=${text}`, "_blank");
                  }}
                >
                  Contact shop (WhatsApp)
                </button>
              ) : (
                <button className="add-item" disabled title="No phone available">Contact shop</button>
              )}
            </div>
          </div>

          <aside className="order-help">
            <h4>Why?</h4>
            <p className="small">We are gradually enabling shops. Nagvekar Medical is currently enabled for demo. If you want us to enable more shops, let the shop owner register and we'll connect them.</p>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="order-root">
      <header className="order-header">
        <button className="back" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h2 className="shop-title">{shop.name}</h2>
          <p className="shop-sub">{shop.category} • {shop.address}</p>
        </div>
      </header>

      <section className="order-card">
        <form onSubmit={handleSubmit} className="order-form" encType="multipart/form-data">
          <div className="form-row">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div className="form-row">
            <label>Phone (Whatsapp Number)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" />
          </div>

          <div className="form-row">
            <label>Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" />
          </div>

          <div className="items-section">
            <label>Items (name, qty)</label>
            {items.map((it, idx) => (
              <div key={idx} className="item-row">
                <input className="it-name" placeholder="Item name" value={it.name} onChange={(e) => updateItem(idx, "name", e.target.value)} />
                <input className="it-qty" type="number" min="1" value={it.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} />
                <button type="button" className="remove" onClick={() => removeItem(idx)}>✕</button>
              </div>
            ))}
            <div className="items-actions">
              <button type="button" className="add-item" onClick={addItem}>+ Add item</button>
            </div>
          </div>

          <div className="form-row">
            <label>Short note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. delivery instructions, substitute allowed" />
          </div>

          <div className="form-row">
            <label>Upload prescription (optional)</label>

            {/* Camera-friendly button + hidden input */}
            <label className="camera-btn" style={{ display: "inline-block" }}>
              📷 Take photo / Upload prescription
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>

            {previewUrl ? (
              <div className="pres-preview fade-in">
                <img src={previewUrl} alt="prescription preview" />
                <button type="button" className="remove-pres" onClick={() => { setPrescription(null); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } if (fileRef.current) fileRef.current.value = ""; }}>Remove</button>
              </div>
            ) : prescription ? (
              <div className="pres-file fade-in">
                <span>{prescription.name}</span>
                <button type="button" className="remove-pres" onClick={() => { setPrescription(null); setPreviewUrl(null); if (fileRef.current) fileRef.current.value = ""; }}>Remove</button>
              </div>
            ) : null}
          </div>

          {error && <div className="error">{error}</div>}

          <div className="submit-row">
            <button type="submit" disabled={submitting} className={`submit-btn ${submitting ? "btn-loading" : ""}`}>
              {submitting ? "Placing..." : `Place Order`}
            </button>
          </div>
        </form>

        <aside className="order-help">
          <h4>How it works</h4>
          <ol>
            <li>We send an order summary to your WhatsApp.</li>
            <li>Reply <code>CONFIRM &lt;ORDERID&gt;</code> or click confirm on the WhatsApp link to accept.</li>
            <li>Shop prepares your order, you pay COD or UPI as requested.</li>
          </ol>
          <p className="small">Note: This demo simulates order submission. Connect to your backend <code>/api/orders</code> to make real orders. Backend should accept multipart/form-data with fields: shopId, customerName, customerPhone, address, note, items (JSON string) and optional file 'prescription'.</p>
        </aside>
      </section>

      {/* success modal + overlay */}
      {showSuccess && result && (
        <>
          <div className="overlay" />
          <div className="success-modal slide-up">
            <svg className="checkmark" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" />
              <path className="check" fill="none" d="M14 27l7 7 17-17" />
            </svg>
            <h3>Order placed</h3>
            <p className="small">Order ID: <strong>{result.orderId}</strong></p>
          </div>
        </>
      )}

      {result && !showSuccess && (
        // small persistent result card (optional)
        <div className="order-result">
          <h3>Order Submitted</h3>
          <p>Order ID: <strong>{result.orderId}</strong></p>
          <p>We have sent a confirmation on WhatsApp (demo). The shop will contact you soon.</p>
          <div className="result-actions">
            <button onClick={() => { setResult(null); navigate("/"); }}>Back to shops</button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Order;
