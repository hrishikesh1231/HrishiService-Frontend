// src/Pages/Admin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_PASSWORD = "admin123"; // demo password — replace for production

export default function Admin() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        // mark admin as logged in (demo)
        try {
          localStorage.setItem("shop_admin_token", "demo-admin"); // existing token key you used elsewhere
          localStorage.setItem("order_receiver", "admin"); // <-- important: indicates orders should go to admin
        } catch (err) {
          console.warn("localStorage not available", err);
        }

        // navigate to admin dashboard (admin "me" page)
        const target = "/admin/me";
        try {
          navigate(target);
        } catch (err) {
          window.location.href = target;
        }
      } else {
        setError("Incorrect password.");
        setLoading(false);
      }
    }, 300);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* single "You / Admin" option — explained above the fields */}
          <div style={{ fontSize: 14, color: "#334155", marginBottom: 6 }}>
            You are logging in as <strong>Admin (receive all orders)</strong>
          </div>

          <label style={styles.label}>
            Password
            <div style={styles.passwordRow}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Enter admin password"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleBtn}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submit} disabled={loading}>
            {loading ? "Checking..." : "Login as Admin"}
          </button>

          <div style={styles.hint}>
            Demo admin password: <code>*****</code> (replace in production)
          </div>
        </form>
      </div>
    </div>
  );
}

/* styles copied/adapted from your previous file for consistent look */
const styles = {
  page: {
    minHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    background: "#f8fafc",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  title: {
    marginBottom: 14,
    fontSize: 22,
    fontWeight: 600,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: 14,
    fontWeight: 500,
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #d4d4d8",
    borderRadius: 8,
    fontSize: 14,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d4d4d8",
    fontSize: 14,
    flex: 1,
  },
  passwordRow: {
    display: "flex",
    gap: 8,
  },
  toggleBtn: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d4d4d8",
    background: "#f1f5f9",
    cursor: "pointer",
  },
  submit: {
    padding: "12px 16px",
    borderRadius: 8,
    background: "#0ea5e9",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    color: "red",
    background: "#ffecec",
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 13,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
  },
};
