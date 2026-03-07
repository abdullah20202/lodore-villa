/**
 * /nominate-success — Success page after submitting nominations
 */
import React from "react";
import Logo from "../components/Logo";

export default function NominateSuccessPage() {
  return (
    <div className="page-bg py-10 px-4" style={{ minHeight: "100vh" }}>
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <Logo />

        {/* Success card */}
        <div className="luxury-card p-8" style={{ textAlign: "center" }}>
          {/* Success icon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(196,149,90,0.15) 0%, rgba(196,149,90,0.25) 100%)",
                border: "2px solid rgba(196,149,90,0.4)",
              }}
            >
              <span className="text-3xl">✓</span>
            </div>
          </div>

          {/* Arabic message */}
          <h1 className="text-xl font-bold mb-4" style={{ color: "#2C2416" }}>
            تم إرسال ترشيحاتك بنجاح
          </h1>

          <p className="text-sm leading-relaxed mb-4" style={{ color: "#3C2E1E" }}>
            شكراً لك على مشاركة تجربة <strong>لودوريه فيلا</strong> مع من تحب.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: "#3C2E1E" }}>
            سنتواصل مع من رشحتهم قريباً لدعوتهم إلى هذه التجربة الفريدة.
          </p>

          <div className="gold-divider my-6" />

          {/* English message */}
          <div style={{ textAlign: "center" }}>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#7A6550", fontStyle: "italic" }}>
              Thank you for sharing the <strong>L'Odore Villa</strong> experience
              with your loved ones.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#7A6550", fontStyle: "italic" }}>
              We will reach out to your nominees soon to invite them to this
              unique experience.
            </p>
          </div>

          <div className="gold-divider my-6" />

          <p className="text-sm font-semibold" style={{ color: "#2C2416" }}>
            سلطان الشعيبي
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#A8803F" }}>
            لودوريه
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#E8DCC8", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          نقدر لك وقتك واهتمامك
        </p>
      </div>
    </div>
  );
}
