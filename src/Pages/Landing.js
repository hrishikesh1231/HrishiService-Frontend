import React, { useMemo, useState } from "react";
import "./Landing.css";
import ShopCard from "./ShopCard";

// sample shops data — replace with real API later
const SAMPLE_SHOPS = [
  {
    id: "s1",
    name: "Nagvekar Medical",
    category: "Medical",
    phone: "+91 98xxxxxxx",
    address: "Main Road, Talawade",
    image: "https://plus.unsplash.com/premium_photo-1672759455907-bdaef741cd88?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWVkaWNhbCUyMGltYWdlc3xlbnwwfHwwfHx8MA%3D%3D",
    deliveryCharge: 20,
  },
  // {
  //   id: "s2",
  //   name: "Shree Prasad Grocery",
  //   category: "Grocery",
  //   phone: "+91 98xxxxxxx",
  //   address: "Market Lane, Talawade",
  //   image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
  //   deliveryCharge: 15,
  // },
  // {
  //   id: "s3",
  //   name: "Lucky Fruits",
  //   category: "Fruits",
  //   phone: "+91 98xxxxxxx",
  //   address: "Near Bus Stand",
  //   image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=1200&auto=format&fit=crop",
  //   deliveryCharge: 10,
  // },
  // {
  //   id: "s4",
  //   name: "Aniket Bakery",
  //   category: "Bakery",
  //   phone: "+91 98xxxxxxx",
  //   address: "Shop No. 5",
  //   image: "https://images.unsplash.com/photo-1542831371-d531d36971e6?q=80&w=1200&auto=format&fit=crop",
  //   deliveryCharge: 12,
  // },
];

const Landing = ({ shops = SAMPLE_SHOPS, onOpenShop }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => ["All", ...new Set(shops.map((s) => s.category))], [shops]);

  function isShopOpen(shopId) {
    try {
      const v = localStorage.getItem(`shop_open_${shopId}`);
      if (v === null) return true; // default open
      return v === "true";
    } catch (err) {
      return true;
    }
  }

  const filtered = shops.filter((s) => {
    const q = query.trim().toLowerCase();
    if (category !== "All" && s.category !== category) return false;
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  return (
    <main className="landing-root">
      <header className="landing-header">
        <div className="brand">
          <div className="logo">🛒</div>
          <div>
            <h1 className="brand-title">LocalCart — Order on WhatsApp</h1>
            <p className="brand-sub">Fast local orders & delivery in your neighbourhood</p>
          </div>
        </div>

        {/* Controls Section (search, category filter + admin button) */}
        <div className="controls">
          <input
            aria-label="Search shops"
            className="search"
            placeholder="Search shops, category or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            aria-label="Filter by category"
            className="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* ADMIN BUTTON */}
          <button
            className="admin-btn"
            onClick={() => (window.location.href = "/admin")}
          >
            Admin
          </button>
        </div>
      </header>

      <section className="shops-grid-section">
        {filtered.length === 0 ? (
          <div className="empty">No shops found. Try a different search.</div>
        ) : (
          <div className="shops-grid" role="list">
            {filtered.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                isOpen={isShopOpen(shop.id)}
                onClick={() =>
                  onOpenShop
                    ? onOpenShop(shop)
                    : (window.location.href = `/order?shop=${shop.id}`)
                }
              />
            ))}
          </div>
        )}
      </section>

      <footer className="landing-footer">
        <small>© {new Date().getFullYear()} LocalCart • Built for your neighbourhood</small>
      </footer>
    </main>
  );
};

export default Landing;
