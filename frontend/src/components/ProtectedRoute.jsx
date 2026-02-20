/**
 * ProtectedRoute
 * Wraps a page that requires a valid JWT.
 * - Calls GET /api/auth/me on mount to validate the access token.
 * - If valid: renders children.
 * - If invalid/expired: the axios interceptor will try to refresh;
 *   if refresh fails, it redirects to /verify automatically.
 * - While checking: shows a loading spinner.
 */
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../api/auth";
import { getAccessToken } from "../api/client";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "ok" | "denied"

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setStatus("denied");
      return;
    }

    getMe()
      .then(() => setStatus("ok"))
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">جارٍ التحقق من صلاحية الدخول...</p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/verify" replace />;
  }

  return children;
}
