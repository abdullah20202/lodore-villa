/**
 * Floating support button for WhatsApp and Phone
 * Appears on all pages for easy access to support
 */
import React, { useState } from "react";

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = "0552211308";
  const whatsappNumber = "966552211308"; // International format for WhatsApp

  return (
    <>
      {/* Overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          style={{ background: "rgba(0, 0, 0, 0.3)" }}
        />
      )}

      {/* Contact options menu */}
      {isOpen && (
        <div
          className="fixed z-50 transition-all duration-300"
          style={{
            bottom: "90px",
            right: "20px",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <div
            className="flex flex-col gap-3 p-2"
            style={{
              background: "linear-gradient(to bottom, #FFFFFF, #FEFDFB)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(196, 149, 90, 0.2)",
              border: "1px solid rgba(212, 167, 106, 0.3)",
            }}
          >
            {/* WhatsApp Button */}
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                color: "#FFFFFF",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 211, 102, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(37, 211, 102, 0.3)";
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                  fill="currentColor"
                />
              </svg>
              <div className="text-right flex-1">
                <p className="text-sm font-bold">واتساب</p>
                <p className="text-xs opacity-90" style={{ direction: "ltr" }}>
                  {phoneNumber}
                </p>
              </div>
            </a>

            {/* Phone Call Button */}
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #D4A76A 0%, #C4955A 100%)",
                color: "#FFFFFF",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(196, 149, 90, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(196, 149, 90, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(196, 149, 90, 0.3)";
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"
                  fill="currentColor"
                />
              </svg>
              <div className="text-right flex-1">
                <p className="text-sm font-bold">اتصال مباشر</p>
                <p className="text-xs opacity-90" style={{ direction: "ltr" }}>
                  {phoneNumber}
                </p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Main floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-50 transition-all duration-300"
        style={{
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: isOpen
            ? "linear-gradient(135deg, #B8904F 0%, #A8803F 100%)"
            : "linear-gradient(135deg, #D4A76A 0%, #C4955A 100%)",
          boxShadow: "0 6px 24px rgba(196, 149, 90, 0.5), 0 3px 12px rgba(0, 0, 0, 0.3)",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          cursor: "pointer",
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(196, 149, 90, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(196, 149, 90, 0.5), 0 3px 12px rgba(0, 0, 0, 0.3)";
          }
        }}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: "auto" }}>
            <path d="M18 6L6 18M6 6l12 12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "auto" }}>
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="12" cy="11" r="1" fill="#FFFFFF" />
            <circle cx="16" cy="11" r="1" fill="#FFFFFF" />
            <circle cx="8" cy="11" r="1" fill="#FFFFFF" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
