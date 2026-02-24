/**
 * /management/login — Management login page
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffLogin } from "../api/staff";
import { setTokens } from "../api/client";
import Logo from "../components/Logo";

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await staffLogin(username, password);
      if (data.ok) {
        setTokens({ access: data.access, refresh: data.refresh });
        localStorage.setItem("management_username", data.username);
        navigate("/management/dashboard", { replace: true });
      } else {
        setError(data.message || "Login failed.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Invalid credentials or server error."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg flex items-center justify-center p-4" style={{ minHeight: "100vh" }}>
      <div className="w-full max-w-sm">
        <Logo subtitle="Management Access" />

        <div className="luxury-card p-8">
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: "#2C2416" }}>
            Management Login
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="mb-4">
              <label
                className="block text-xs mb-2 text-left font-medium"
                style={{ color: "#A8803F", letterSpacing: "0.03em" }}
              >
                Username
              </label>
              <input
                type="text"
                className="vip-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                className="block text-xs mb-2 text-left font-medium"
                style={{ color: "#A8803F", letterSpacing: "0.03em" }}
              >
                Password
              </label>
              <input
                type="password"
                className="vip-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(180,50,50,0.06)",
                  border: "1px solid rgba(180,50,50,0.18)",
                  color: "#B43232",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
