/**
 * /success — Post-booking success page with invitation form
 * Shows after successful Calendly booking
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/auth";
import { clearTokens } from "../api/client";
import Logo from "../components/Logo";
import SupportButton from "../components/SupportButton";
import InviteContactsForm from "../components/InviteContactsForm";

export default function SuccessPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(true);

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
          <p className="text-sm" style={{ color: "#E8DCC8", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>جارٍ التحميل...</p>
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

        {/* Success Message Card */}
        <div
          className="luxury-card p-8 mb-6 text-center"
        >
          {/* Success Icon */}
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)",
              boxShadow: "0 6px 20px rgba(196,149,90,0.4), inset 0 1px 0 rgba(255,255,255,0.4)",
              border: "3px solid rgba(255,255,255,0.5)",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-3" style={{ color: "#2C2416" }}>
            تم تأكيد حجزك بنجاح
          </h2>

          <p className="text-sm leading-relaxed mb-2" style={{ color: "#7A6550" }}>
            نتطلع لاستقبالك في <strong>لودوريه فيلا</strong>
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#9A8060", direction: "ltr" }}>
            {phone}
          </p>

          <div className="gold-divider my-6" />

          <p className="text-sm leading-relaxed" style={{ color: "#7A6550" }}>
            تم إرسال رسالة تأكيد إلى بريدك الإلكتروني تحتوي على تفاصيل الموعد.
          </p>
        </div>

        {/* Invitation Form */}
        {showInviteForm ? (
          <InviteContactsForm
            onSkip={handleInviteSkip}
            onSuccess={handleInviteSuccess}
          />
        ) : (
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: "#E8DCC8", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
              شكراً لك! نراك قريباً.
            </p>
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "#D8CDB8", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          لودوريه فيلا © {new Date().getFullYear()}
        </p>
      </div>

      <SupportButton />
    </div>
  );
}
