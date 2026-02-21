/**
 * CalendlyEmbed — Using official react-calendly library
 *
 * Provides better control over embed settings including:
 *   - Cookie/GDPR banner hiding
 *   - Custom styling
 *   - Prefill data
 */
import { useEffect } from "react";
import { InlineWidget } from "react-calendly";

export default function CalendlyEmbed({ phone = "" }) {
  const baseUrl = import.meta.env.VITE_CALENDLY_EVENT_URL || "";

  // Force browser to use 12-hour format locale
  useEffect(() => {
    // Override browser timezone to America/New_York (uses 12h by default)
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const OriginalDateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function(...args) {
        // Force options to use 12-hour format
        if (args[1]) {
          args[1].hour12 = true;
        } else {
          args[1] = { hour12: true };
        }
        // Use en-US locale which defaults to 12-hour
        args[0] = 'en-US';
        return new OriginalDateTimeFormat(...args);
      };
      Intl.DateTimeFormat.prototype = OriginalDateTimeFormat.prototype;
      Intl.DateTimeFormat.supportedLocalesOf = OriginalDateTimeFormat.supportedLocalesOf;
    }

    // Replace "Baghdad" with "Riyadh" in the DOM
    const replaceTimezone = () => {
      const elements = document.querySelectorAll("*");
      elements.forEach(el => {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && el.textContent?.includes("Baghdad")) {
          el.textContent = el.textContent.replace("Baghdad", "Riyadh");
        }
      });
    };

    const interval = setInterval(replaceTimezone, 500);

    return () => clearInterval(interval);
  }, []);

  if (!baseUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-dark-800 rounded-xl border border-gold-400/10">
        <p className="text-gray-500 text-sm">
          VITE_CALENDLY_EVENT_URL غير مضبوط في ملف .env
        </p>
      </div>
    );
  }

  // Build URL with timezone parameters
  const params = new URLSearchParams({
    timezone: 'Asia/Riyadh',
  });

  if (phone) {
    params.set('a1', phone);
  }

  const urlWithParams = `${baseUrl}?${params.toString()}`;

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .calendly-inline-widget iframe {
          /* Hide timezone text - cannot change "Baghdad" to "Riyadh" as it's controlled by Calendly account settings */
        }
      `}</style>
      <InlineWidget
        url={urlWithParams}
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
        }}
        utm={{
          utmContent: phone, // Pass phone for webhook
        }}
      />
    </div>
  );
}
