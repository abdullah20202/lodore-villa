/**
 * /book — Protected booking page
 *
 * Displays Calendly inline embed after JWT validation.
 * Calls /api/auth/me to get phone, then renders CalendlyEmbed.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/auth";
import { clearTokens } from "../api/client";
import CalendlyEmbed from "../components/CalendlyEmbed";
import Logo from "../components/Logo";

export default function BookPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((data) => {
        setPhone(data.phone);
        setLoading(false);
      })
      .catch(() => {
        // Token invalid or expired — redirect to verify
        navigate("/verify", { replace: true });
      });
  }, [navigate]);

  const handleLogout = () => {
    clearTokens();
    navigate("/verify", { replace: true });
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(196,149,90,0.3)", borderTopColor: "#C4955A" }}
          />
          <p className="text-sm" style={{ color: "#B8A080" }}>جارٍ تحميل صفحة الحجز...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg py-10 px-4" style={{ minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto">

        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <Logo size="sm" />
          <button
            onClick={handleLogout}
            className="text-xs mt-3 transition-colors"
            style={{ color: "#C8B99A" }}
            onMouseEnter={(e) => (e.target.style.color = "#7A6550")}
            onMouseLeave={(e) => (e.target.style.color = "#C8B99A")}
          >
            خروج
          </button>
        </div>

        {/* Welcome strip */}
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-6"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(196,149,90,0.18)",
            boxShadow: "0 2px 16px rgba(196,149,90,0.06)",
          }}
        >
          {/* Checkmark badge */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
            style={{
              background: "rgba(196,149,90,0.10)",
              border: "1px solid rgba(196,149,90,0.25)",
            }}
          >
            ✓
          </div>
          <div className="text-right flex-1">
            <p className="text-sm font-semibold" style={{ color: "#2C2416" }}>
              مرحباً بك في لودور فيلا
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#B8A080", direction: "ltr" }}>
              {phone}
            </p>
          </div>
        </div>

        {/* Section title */}
        <div className="mb-5">
          <h2 className="text-lg font-bold mb-1" style={{ color: "#2C2416" }}>
             احجز موعدك  
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#7A6550" }}>
            اختر الوقت المناسب لك من التقويم أدناه. يرجى ملء البيانات المطلوبة لتأكيد حجزك.
          </p>

          {/* Steps */}
          <ul className="mt-3 space-y-1.5">
            {[
              "اختر اليوم والوقت المناسبين",
              "أدخل اسمك وبريدك الإلكتروني",
              "ستصلك رسالة تأكيد فور إتمام الحجز",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "#9A8060" }}>
                <span style={{ color: "#C4955A", fontSize: "0.6rem" }}>◆</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Calendly embed */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(196,149,90,0.15)",
            boxShadow: "0 4px 32px rgba(196,149,90,0.08)",
          }}
        >
          <CalendlyEmbed phone={phone} />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#C8B99A" }}>
          لودور فيلا © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
