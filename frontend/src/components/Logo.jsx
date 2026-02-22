/**
 * Lodore Villa Logo component
 * Uses the real logo image from /public/logo.png
 * Falls back to elegant text if image is missing.
 */
import React, { useState } from "react";

export default function Logo({ subtitle = "", size = "md" }) {
  const [imgFailed, setImgFailed] = useState(false);

  const imgHeight = size === "sm" ? "h-16" : size === "lg" ? "h-32" : "h-24";

  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      {/* Logo image or fallback */}
      {!imgFailed ? (
        <img
          src="/logo.png"
          alt="Lodore Villa"
          className={`${imgHeight} w-auto object-contain`}
          onError={() => setImgFailed(true)}
        />
      ) : (
        /* Fallback text logo if image not found */
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center mb-1">
            <div className="h-px w-10" style={{ background: "linear-gradient(to right, transparent, #C4955A)" }} />
            <span style={{ color: "#C4955A", fontSize: "0.75rem" }}>✦</span>
            <div className="h-px w-10" style={{ background: "linear-gradient(to left, transparent, #C4955A)" }} />
          </div>
          <h1
            className="font-bold tracking-widest"
            style={{
              fontSize: "2rem",
              fontFamily: "'Cormorant Garamond', 'Tajawal', serif",
              color: "#C4955A",
              letterSpacing: "0.12em",
            }}
          >
            Lodore Villa
          </h1>
          <p className="text-xs tracking-widest mt-0.5" style={{ color: "#A8803F", letterSpacing: "0.3em" }}>
            لودوريه فيلا
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="gold-divider w-24" />

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm font-light" style={{ color: "#A8803F", letterSpacing: "0.05em" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
