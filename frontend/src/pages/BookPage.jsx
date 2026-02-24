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
import SupportButton from "../components/SupportButton";
import InviteContactsForm from "../components/InviteContactsForm";

export default function BookPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);

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

  const handleEventScheduled = () => {
    // Show invitation form after successful booking
    setShowInviteForm(true);
  };

  const handleInviteSkip = () => {
    setShowInviteForm(false);
  };

  const handleInviteSuccess = () => {
    setShowInviteForm(false);
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(228,183,122,0.3)", borderTopColor: "#E4B77A" }}
          />
          <p className="text-sm" style={{ color: "#E8DCC8", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>جارٍ تحميل صفحة الحجز...</p>
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
            style={{ color: "#E8DCC8", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            onMouseEnter={(e) => {
              e.target.style.color = "#E4B77A";
              e.target.style.textShadow = "0 2px 6px rgba(228,183,122,0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#E8DCC8";
              e.target.style.textShadow = "0 1px 3px rgba(0,0,0,0.3)";
            }}
          >
            خروج
          </button>
        </div>

        {/* Welcome strip */}
        <div
          className="flex items-center gap-4 px-6 py-5 rounded-2xl mb-6"
          style={{
            background: "linear-gradient(to bottom, #FFFFFF, #FEFDFB)",
            border: "1px solid rgba(212,167,106,0.25)",
            boxShadow: "0 4px 24px rgba(196,149,90,0.15), 0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Checkmark badge */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)",
              boxShadow: "0 4px 12px rgba(196,149,90,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
              border: "2px solid rgba(255,255,255,0.5)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-right flex-1">
            <p className="text-base font-bold" style={{ color: "#2C2416", letterSpacing: "0.01em" }}>
              مرحباً بك في لودوريه فيلا
            </p>
            <p className="text-xs mt-1" style={{ color: "#9A8060", direction: "ltr", fontWeight: "500" }}>
              {phone}
            </p>
          </div>
        </div>

        {/* Section title */}
        <div className="mb-5">
          <h2 className="text-lg font-bold mb-1" style={{ color: "#F5EFE7", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
             احجز موعدك
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#E8DCC8", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
            اختر الوقت المناسب لك من التقويم أدناه. يرجى ملء البيانات المطلوبة لتأكيد حجزك.
          </p>

          {/* Steps */}
          <ul className="mt-3 space-y-1.5">
            {[
              "اختر اليوم والوقت المناسبين",
              "أدخل اسمك وبريدك الإلكتروني",
              "ستصلك رسالة تأكيد فور إتمام الحجز",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "#D8CDB8", textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                <span style={{ color: "#E4B77A", fontSize: "0.6rem" }}>◆</span>
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
          <CalendlyEmbed phone={phone} onEventScheduled={handleEventScheduled} />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#D8CDB8", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          لودوريه فيلا © {new Date().getFullYear()}
        </p>
      </div>

      <SupportButton />

      {/* Invitation Form Modal */}
      {showInviteForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(26, 52, 73, 0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="w-full max-w-md">
            <InviteContactsForm
              onSkip={handleInviteSkip}
              onSuccess={handleInviteSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
