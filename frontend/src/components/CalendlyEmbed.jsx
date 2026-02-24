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

export default function CalendlyEmbed({ phone = "", onEventScheduled = null }) {
  const baseUrl = import.meta.env.VITE_CALENDLY_EVENT_URL || "";

  // Listen for Calendly events
  useEffect(() => {
    if (!onEventScheduled) return;

    const handleMessage = (e) => {
      if (e.data.event && e.data.event === 'calendly.event_scheduled') {
        onEventScheduled();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEventScheduled]);

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

    // Replace "Baghdad" with "Riyadh" in the DOM using MutationObserver
    const replaceTimezone = () => {
      // Try to replace in all text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        if (node.nodeValue && node.nodeValue.includes("Baghdad")) {
          node.nodeValue = node.nodeValue.replace(/Baghdad/g, "Riyadh");
        }
      }
    };

    // Run immediately
    replaceTimezone();

    // Run on interval for dynamic content
    const interval = setInterval(replaceTimezone, 500);

    // Also observe DOM changes
    const observer = new MutationObserver(replaceTimezone);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
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

  // Build URL with timezone and locale parameters
  const params = new URLSearchParams({
    timezone: 'Asia/Riyadh',
    locale: 'en-US',
  });

  if (phone) {
    params.set('a1', phone);
  }

  const urlWithParams = `${baseUrl}?${params.toString()}`;

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <style>{`
        .calendly-inline-widget {
          position: relative;
          min-height: 700px;
          overflow: hidden;
        }
        .calendly-inline-widget iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          min-height: 700px;
        }
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .calendly-inline-widget {
            min-height: 650px;
          }
          .calendly-inline-widget iframe {
            min-height: 650px;
          }
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
