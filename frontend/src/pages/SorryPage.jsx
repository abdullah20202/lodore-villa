/**
 * /sorry — Generic "not eligible" page
 * Does NOT reveal whether the phone is in the VIP list.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import SupportButton from "../components/SupportButton";

export default function SorryPage() {
  const navigate = useNavigate();

  return (
    <div className="page-bg flex items-center justify-center p-4" style={{ minHeight: "100vh" }}>
      <div className="w-full max-w-sm">
        <Logo />

        <div className="luxury-card p-8 text-center">
          {/* Decorative moon icon */}
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl"
            style={{
              background: "rgba(196,149,90,0.08)",
              border: "1px solid rgba(196,149,90,0.22)",
            }}
          >
            🌙
          </div>

          <h2 className="text-xl font-bold mb-3" style={{ color: "#2C2416" }}>
            شكراً لاهتمامك
          </h2>

          <p className="text-sm leading-relaxed mb-2" style={{ color: "#7A6550" }}>
            عذراً، لا يمكننا متابعة طلبك في الوقت الحالي.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#9A8060" }}>
            هذا الحدث دعوة حصرية خاصة.
            <br />
            للاستفسار، تواصل مع المنظمين مباشرة.
          </p>

          <div className="gold-divider my-7" />

          <button
            type="button"
            onClick={() => navigate("/verify")}
            className="text-sm underline underline-offset-2 transition-colors"
            style={{ color: "#C4955A" }}
            onMouseEnter={(e) => (e.target.style.color = "#A8803F")}
            onMouseLeave={(e) => (e.target.style.color = "#C4955A")}
          >
            حاول برقم آخر
          </button>
        </div>
      </div>

      <SupportButton />
    </div>
  );
}
