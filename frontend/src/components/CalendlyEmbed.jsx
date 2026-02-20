/**
 * CalendlyEmbed — direct iframe with prefill.
 *
 * Calendly prefill query params:
 *   name        → prefills the Name field
 *   email       → prefills the Email field
 *   a1          → prefills the 1st custom question (e.g. Phone Number)
 *   a2          → prefills the 2nd custom question
 *   utm_content → passed to webhook for VIP identification
 *
 * If your phone question is not the 1st custom question, change a1 → a2 etc.
 */
import React from "react";

function buildUrl(base, phone) {
  try {
    const url = new URL(base);

    if (phone) {
      // Prefill the phone into the first custom question field (a1)
      // Change to a2, a3 etc. if your phone question is not first
      url.searchParams.set("a1", phone);

      // Also pass via utm_content for backend webhook extraction
      url.searchParams.set("utm_content", phone);
    }

    url.searchParams.set("hide_gdpr_banner", "1");
    url.searchParams.set("hide_cookie_banner", "1");
    return url.toString();
  } catch {
    return base;
  }
}

export default function CalendlyEmbed({ phone = "" }) {
  const baseUrl = import.meta.env.VITE_CALENDLY_EVENT_URL || "";

  if (!baseUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-dark-800 rounded-xl border border-gold-400/10">
        <p className="text-gray-500 text-sm">
          VITE_CALENDLY_EVENT_URL غير مضبوط في ملف .env
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={buildUrl(baseUrl, phone)}
      width="100%"
      height="700"
      frameBorder="0"
      title="Lodore Villa Booking"
      style={{ minWidth: "320px", border: "none" }}
    />
  );
}
