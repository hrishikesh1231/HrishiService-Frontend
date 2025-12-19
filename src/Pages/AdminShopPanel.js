// src/Pages/AdminShopPanel.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminShopPanel.css";

/* helpers */
function normalizeName(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  return s.replace(/,+\s*$/, "");
}
function safeJsonParse(maybe) {
  try {
    return JSON.parse(maybe);
  } catch (e) {
    return null;
  }
}
function extractItemsObjects(order) {
  if (Array.isArray(order.itemsObjects) && order.itemsObjects.length) {
    return order.itemsObjects.map((it) => ({
      name: normalizeName(it.name ?? it?.itemName ?? ""),
      qty: Number(it.qty ?? it?.quantity ?? 1),
      price: it.price != null && it.price !== 0 ? Number(it.price) : "",
    }));
  }
  if (
    Array.isArray(order.items) &&
    order.items.length &&
    typeof order.items[0] === "object"
  ) {
    return order.items.map((it) => ({
      name: normalizeName(it.name ?? it?.itemName ?? ""),
      qty: Number(it.qty ?? it?.quantity ?? 1),
      price: it.price != null && it.price !== 0 ? Number(it.price) : "",
    }));
  }
  if (
    Array.isArray(order.items) &&
    order.items.length &&
    typeof order.items[0] === "string"
  ) {
    const first = String(order.items[0]).trim();
    if (
      (first.startsWith("[") || first.startsWith("{")) &&
      (first.includes('"name"') || first.includes('"qty"'))
    ) {
      const parsed = safeJsonParse(first);
      if (Array.isArray(parsed) && parsed.length) {
        if (typeof parsed[0] === "object") {
          return parsed.map((it) => ({
            name: normalizeName(it.name ?? it?.itemName ?? ""),
            qty: Number(it.qty ?? it?.quantity ?? 1),
            price: it.price != null && it.price !== 0 ? Number(it.price) : "",
          }));
        } else if (typeof parsed[0] === "string") {
          return parsed.map((name) => ({
            name: normalizeName(name),
            qty: 1,
            price: "",
          }));
        }
      }
    }
    return order.items.map((name) => ({
      name: normalizeName(name),
      qty: 1,
      price: "",
    }));
  }
  if (typeof order.items === "string") {
    const trimmed = order.items.trim();
    const parsed = safeJsonParse(trimmed);
    if (parsed) {
      if (Array.isArray(parsed) && parsed.length) {
        if (typeof parsed[0] === "object") {
          return parsed.map((it) => ({
            name: normalizeName(it.name ?? it?.itemName ?? ""),
            qty: Number(it.qty ?? it?.quantity ?? 1),
            price: it.price != null && it.price !== 0 ? Number(it.price) : "",
          }));
        } else if (typeof parsed[0] === "string") {
          return parsed.map((name) => ({
            name: normalizeName(name),
            qty: 1,
            price: "",
          }));
        }
      }
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return [
          {
            name: normalizeName(parsed.name ?? parsed.itemName ?? ""),
            qty: Number(parsed.qty ?? parsed.quantity ?? 1),
            price:
              parsed.price != null && parsed.price !== 0
                ? Number(parsed.price)
                : "",
          },
        ];
      }
    }
  }
  return [];
}

/* component */
export default function AdminShopPanel() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState({});
  // 🔥 delete modal state
const [deleteTarget, setDeleteTarget] = useState(null);



  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/orders");
      const json = await res.json();
      if (json && json.success && Array.isArray(json.orders)) {
        // ✅ DO NOT FORCE status to "pending"
        const forced = json.orders.map((o) => ({
          ...o,
          status: o.status || "pending",
        }));
        setOrders(forced);
        const init = {};
        forced.forEach((o) => {
          init[o._id] = {
            items: extractItemsObjects(o),
            deliveryCharge:
              o.deliveryCharge != null ? Number(o.deliveryCharge) : 0,
            sending: false,
          };
        });
        setEditing(init);
      } else {
        setOrders([]);
        console.error("GET /api/orders returned unexpected:", json);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function computeSubtotal(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, it) => {
      const qty = Number(it.qty || 0);
      const price =
        it.price === "" || it.price == null ? 0 : Number(it.price || 0);
      return sum + qty * price;
    }, 0);
  }

  async function saveOrderDetails(orderId, details) {
    try {
      const res = await fetch(
        `http://localhost:5000/api/orders/${orderId}/update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(details),
        }
      );
      return await res.json().catch(() => null);
    } catch (err) {
      console.warn("saveOrderDetails failed:", err);
      return null;
    }
  }

  async function updateStatusServer(orderId, status) {
    try {
      await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn("updateStatusServer failed:", err);
    }
  }
  
//   async function deleteOrder(orderId) {
//   const ok = window.confirm("Are you sure you want to delete this order?");
//   if (!ok) return;

//   try {
//     await fetch(`http://localhost:5000/api/orders/${orderId}`, {
//       method: "DELETE",
//     });

//     // remove from UI only (no reload)
//     setOrders((prev) => prev.filter((o) => o._id !== orderId));
//   } catch (err) {
//     alert("Failed to delete order");
//     console.error(err);
//   }
// }


  /** -------- OPEN WHATSAPP WITH ORDER SUMMARY (no Cloud API) -------- */
  function openWhatsApp(order, edit) {
    const cleanedItems = (edit.items || []).filter(
      (it) => it.name && Number(it.qty) > 0
    );

    const itemsList =
      cleanedItems.length > 0
        ? cleanedItems
            .map(
              (it) =>
                `- ${it.name} (${it.qty} × ₹${it.price || 0}) = ₹${
                  Number(it.qty || 0) * Number(it.price || 0)
                }`
            )
            .join("\n")
        : "- No items set";

    const subtotal = computeSubtotal(edit.items);
    const delivery = Number(edit.deliveryCharge || 0);
    const total = subtotal + delivery;

    const message =
      `Hi ${order.customerName || ""}! Your order is ready for confirmation.\n\n` +
      `Items:\n${itemsList}\n\n` +
      `Delivery charge: ₹${delivery}\n` +
      `Total: ₹${total}\n\n` +
      `Please reply:\n` +
      `YES → to confirm\n` +
      `NO → to cancel`;

    // ensure phone is like 91XXXXXXXXXX (no +)
    const phone = String(order.customerPhone || "").replace(/^\+/, "");
    if (!phone) {
      alert("Customer phone number is missing.");
      return;
    }

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");

    // ✅ Mark as "requested" locally + in DB
    setOrders((prev) =>
      prev.map((o) =>
        o._id === order._id ? { ...o, status: "requested" } : o
      )
    );
    updateStatusServer(order._id, "requested").catch(() => {});
  }
  /** ------------------------------------------------------------------ */

  /** -------- Mark as DELIVERED when ✅ button clicked -------- */
  async function handleDelivered(orderId) {
    // local update
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: "delivered" } : o
      )
    );
    // save to backend so it persists on refresh
    await updateStatusServer(orderId, "delivered");
  }
  /** ------------------------------------------------------------------ */

  function updateEditItem(orderId, idx, partial) {
    setEditing((prev) => {
      const copy = { ...prev };
      copy[orderId] = copy[orderId] || {
        items: [],
        deliveryCharge: 0,
        sending: false,
      };
      copy[orderId].items = copy[orderId].items.slice();
      copy[orderId].items[idx] = {
        ...copy[orderId].items[idx],
        ...partial,
      };
      return copy;
    });
  }

  function addNewItem(orderId) {
    setEditing((prev) => {
      const copy = { ...prev };
      copy[orderId] = copy[orderId] || {
        items: [],
        deliveryCharge: 0,
        sending: false,
      };
      copy[orderId].items = (copy[orderId].items || []).concat([
        { name: "", qty: 1, price: "" },
      ]);
      return copy;
    });
  }
  async function confirmDeleteOrder() {
  if (!deleteTarget) return;

  try {
    await fetch(`http://localhost:5000/api/orders/${deleteTarget}`, {
      method: "DELETE",
    });

    setOrders((prev) => prev.filter((o) => o._id !== deleteTarget));
    setDeleteTarget(null);
  } catch (err) {
    console.error(err);
    alert("Unable to delete order");
  }
}


  function removeItem(orderId, idx) {
    setEditing((prev) => {
      const copy = { ...prev };
      copy[orderId] = copy[orderId] || {
        items: [],
        deliveryCharge: 0,
        sending: false,
      };
      copy[orderId].items = copy[orderId].items.slice();
      copy[orderId].items.splice(idx, 1);
      return copy;
    });
  }

  if (loading) return <div className="admin-center">Loading orders...</div>;

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div>
          <h1>Admin Panel</h1>
          <p className="admin-address">
            All orders (exact item name & qty shown)
          </p>
        </div>

        <button
          className="admin-logout"
          onClick={() => {
            localStorage.removeItem("shop_admin_token");
            navigate("/");
          }}
        >
          Logout
        </button>
      </header>

      <section className="admin-card">
        <h3>All Orders</h3>

        {orders.length === 0 ? (
          <div className="admin-empty">No orders found.</div>
        ) : (
          <div className="admin-orders">
            {orders.map((o) => {
              const edit = editing[o._id] || {
                items: [],
                deliveryCharge: 0,
                sending: false,
              };
              const subtotal = computeSubtotal(edit.items);
              const delivery = Number(edit.deliveryCharge || 0);
              const total = subtotal + delivery;

              return (
                <div key={o._id} className="admin-order compact">
                  <div className="admin-order-left">
                    <div className="admin-name">{o.customerName || "—"}</div>
                    <div className="admin-shop">
                      {o.shopName || "Unknown shop"}
                    </div>
                  </div>

                  <div className="admin-order-center">
                    <button
                      className="view-btn"
                      onClick={() => {
                        if (!editing[o._id]) {
                          setEditing((prev) => ({
                            ...prev,
                            [o._id]: {
                              items: extractItemsObjects(o),
                              deliveryCharge:
                                o.deliveryCharge != null
                                  ? Number(o.deliveryCharge)
                                  : 0,
                              sending: false,
                            },
                          }));
                        }
                        setExpanded((s) => ({
                          ...s,
                          [o._id]: !s[o._id],
                        }));
                      }}
                    >
                      {expanded[o._id] ? "Hide" : "View"}
                    </button>
                  </div>

                  <div className="admin-order-right">
                    <span
                      className={`status-badge ${o.status || "pending"}`}
                    >
                      {(o.status || "pending").toUpperCase()}
                    </span>

                    {/* ✅ Delivered button (tick) */}
                    <button
                      className="status-icon-btn"
                      title="Mark as delivered"
                      onClick={() => handleDelivered(o._id)}
                    >
                      ✓
                    </button>
                      <button
                        className="delete-icon-btn"
                        title="Delete order"
                        onClick={() => setDeleteTarget(o._id)}
                      >
                        ✕
                      </button>

                  </div>

                  {expanded[o._id] && (
                    <div className="admin-order-expanded">
                      <div className="items-title">Items</div>

                      <div className="items-table">
                        <div className="items-row header">
                          <div className="col name">Name</div>
                          <div className="col qty">Qty</div>
                          <div className="col price">Price (set)</div>
                          <div className="col subtotal">Subtotal</div>
                          <div className="col actions"></div>
                        </div>

                        {(edit.items.length === 0
                          ? [{ name: "", qty: 1, price: "" }]
                          : edit.items
                        ).map((it, idx) => (
                          <div className="items-row" key={idx}>
                            <div className="col name">
                              <input
                                value={it.name}
                                onChange={(e) =>
                                  updateEditItem(o._id, idx, {
                                    name: e.target.value,
                                  })
                                }
                                className="cell-input"
                              />
                            </div>

                            <div className="col qty">
                              <input
                                type="number"
                                min="1"
                                value={it.qty}
                                onChange={(e) =>
                                  updateEditItem(o._id, idx, {
                                    qty: Math.max(
                                      1,
                                      Number(e.target.value || 1)
                                    ),
                                  })
                                }
                                className="cell-input"
                              />
                            </div>

                            <div className="col price">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={it.price === "" ? "" : it.price}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const v = raw === "" ? "" : Number(raw);
                                  updateEditItem(o._id, idx, { price: v });
                                }}
                                className="cell-input"
                                placeholder="₹"
                              />
                            </div>

                            <div className="col subtotal">
                              ₹
                              {(
                                Number(it.qty || 0) *
                                (it.price === ""
                                  ? 0
                                  : Number(it.price || 0))
                              ).toFixed(2)}
                            </div>

                            <div className="col actions">
                              <button
                                className="small-remove"
                                onClick={() => removeItem(o._id, idx)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}

                        <div style={{ marginTop: 8 }}>
                          <button
                            className="admin-btn"
                            onClick={() => addNewItem(o._id)}
                          >
                            + Add item
                          </button>
                        </div>
                      </div>

                      <div className="totals-row">
                        <div className="totals-left">
                          <label
                            style={{ display: "block", marginBottom: 6 }}
                          >
                            Delivery charge:
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={edit.deliveryCharge ?? 0}
                            onChange={(e) => {
                              const v = Number(e.target.value || 0);
                              setEditing((prev) => {
                                const copy = { ...prev };
                                copy[o._id] = copy[o._id] || {
                                  items: [],
                                  deliveryCharge: 0,
                                  sending: false,
                                };
                                copy[o._id].deliveryCharge = v;
                                return copy;
                              });
                            }}
                            className="cell-input small"
                            placeholder="Enter delivery amount"
                          />
                        </div>

                        <div className="totals-right">
                          <div>Subtotal: ₹{subtotal.toFixed(2)}</div>
                          <div>Delivery: ₹{delivery.toFixed(2)}</div>
                          <div style={{ fontWeight: 700 }}>
                            Total: ₹{total.toFixed(2)}
                          </div>

                          <div style={{ marginTop: 8 }}>
                            {/* SEND → open WhatsApp with summary & mark requested */}
                            <button
                              className="admin-btn"
                              onClick={() => openWhatsApp(o, edit)}
                            >
                              Send
                            </button>

                            {/* SAVE only updates DB, no WhatsApp */}
                            <button
                              className="admin-btn-outline"
                              style={{ marginLeft: 8 }}
                              onClick={async () => {
                                const details = {
                                  itemsObjects: edit.items.map((it) => ({
                                    name: it.name,
                                    qty: Number(it.qty),
                                    price:
                                      it.price === ""
                                        ? 0
                                        : Number(it.price),
                                  })),
                                  deliveryCharge: Number(
                                    edit.deliveryCharge || 0
                                  ),
                                  total,
                                };
                                setOrders((prev) =>
                                  prev.map((x) =>
                                    x._id === o._id
                                      ? {
                                          ...x,
                                          itemsObjects: details.itemsObjects,
                                          deliveryCharge:
                                            details.deliveryCharge,
                                        }
                                      : x
                                  )
                                );
                                await saveOrderDetails(o._id, details);
                                alert("Saved locally");
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
      {deleteTarget && (
  <div className="delete-overlay">
    <div className="delete-modal">
      <div className="delete-icon">⚠️</div>

      <h2>Delete Order?</h2>

      <p>
        This order will be permanently removed.
        <br />
        <span>You cannot undo this action.</span>
      </p>

      <div className="delete-actions">
        <button
          className="admin-btn-outline"
          onClick={() => setDeleteTarget(null)}
        >
          Cancel
        </button>

        <button
          className="admin-btn delete-danger"
          onClick={confirmDeleteOrder}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
