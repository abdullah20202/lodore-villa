/**
 * CalendlyEmbed — Using official react-calendly library
 *
 * Provides better control over embed settings including:
 *   - Cookie/GDPR banner hiding
 *   - Custom styling
 *   - Prefill data
 */
import React from "react";
import { InlineWidget } from "react-calendly";

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
    <InlineWidget
      url={baseUrl}
      styles={{
        height: "700px",
        minWidth: "320px",
      }}
      pageSettings={{
        backgroundColor: "ffffff",
        hideEventTypeDetails: false,
        hideLandingPageDetails: false,
        primaryColor: "c4955a",
        textColor: "2c2416",
        hideGdprBanner: true,
        timeFormat: "12h",
      }}
      prefill={{
        customAnswers: {
          a1: phone, // Prefill phone in first custom question
        },
      }}
      utm={{
        utmContent: phone, // Pass phone for webhook
      }}
    />
  );
}
