/**
 * InviteContactsForm - Optional form for inviting up to 3 contacts
 * Shown after successful booking
 */
import { useState } from "react";
import { submitInvitations } from "../api/auth";

/** Convert Arabic numerals to English */
function convertArabicToEnglish(str) {
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  const englishNumerals = '0123456789';
  return str.split('').map(char => {
    const index = arabicNumerals.indexOf(char);
    return index !== -1 ? englishNumerals[index] : char;
  }).join('');
}

export default function InviteContactsForm({ onSkip, onSuccess }) {
  const [contacts, setContacts] = useState([
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (index, field, value) => {
    const newContacts = [...contacts];
    if (field === "phone") {
      // Convert Arabic numerals to English and keep only digits, limit to 10
      const converted = convertArabicToEnglish(value);
      newContacts[index][field] = converted.replace(/\D/g, "").slice(0, 10);
    } else {
      newContacts[index][field] = value;
    }
    setContacts(newContacts);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Filter out empty contacts
    const validContacts = contacts.filter(
      (c) => c.name.trim() && c.phone.trim()
    );

    if (validContacts.length === 0) {
      setError("يرجى إضافة جهة اتصال واحدة على الأقل.");
      return;
    }

    setLoading(true);
    try {
      const result = await submitInvitations(validContacts);
      if (result.ok) {
        setSuccess(result.message);
        // Clear the form
        setContacts([
          { name: "", phone: "" },
          { name: "", phone: "" },
          { name: "", phone: "" },
        ]);
        // Call success callback after 2 seconds
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setError(result.message || "حدث خطأ. حاول مجدداً.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "حدث خطأ. يرجى المحاولة مجدداً."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  return (
    <div className="luxury-card p-8">
      {/* Header with Icon */}
      <div className="text-center mb-6">
        {/* Icon */}
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(228,183,122,0.15) 0%, rgba(196,149,90,0.08) 100%)",
            border: "2px solid rgba(196,149,90,0.25)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#C4955A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="#C4955A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#C4955A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#C4955A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: "#2C2416", letterSpacing: "-0.01em" }}>
         ترشيح ضيوف لمشاركة التجربة
        </h2>
        <p className="text-sm leading-relaxed px-4" style={{ color: "#7A6550" }}>
         يمكنك ترشيح حتى 3 أشخاص ليتم دعوتهم إلى الفعالية
        </p>
        <p className="text-xs mt-1" style={{ color: "#A8803F" }}>
          (اختياري)
        </p>
      </div>

      <div className="gold-divider mb-6" />

      {/* Success Message */}
      {success && (
        <div
          className="mb-6 rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(76,175,80,0.06) 100%)",
            border: "2px solid rgba(76,175,80,0.3)",
            boxShadow: "0 4px 12px rgba(76,175,80,0.15)",
          }}
        >
          <div className="flex items-start gap-3 p-4">
            {/* Success Icon */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4CAF50 0%, #45A049 100%)",
                boxShadow: "0 2px 8px rgba(76,175,80,0.3)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Message */}
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium leading-relaxed text-right" style={{ color: "#2E7D32" }}>
                {success}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(211,47,47,0.12) 0%, rgba(211,47,47,0.06) 100%)",
            border: "2px solid rgba(211,47,47,0.3)",
            boxShadow: "0 4px 12px rgba(211,47,47,0.15)",
          }}
        >
          <div className="flex items-start gap-3 p-4">
            {/* Error Icon */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #D32F2F 0%, #C62828 100%)",
                boxShadow: "0 2px 8px rgba(211,47,47,0.3)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Message */}
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium leading-relaxed text-right" style={{ color: "#C62828" }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Contact Inputs */}
        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="relative"
              style={{
                padding: "20px",
                borderRadius: "16px",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(252,250,247,0.5))",
                border: "1px solid rgba(196,149,90,0.15)",
                boxShadow: "0 2px 8px rgba(196,149,90,0.06)",
              }}
            >
              {/* Contact Number Badge */}
              <div
                className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 2px 6px rgba(196,149,90,0.3)",
                  letterSpacing: "0.05em",
                }}
              >
                ضيف {index + 1}
              </div>

              <div className="space-y-3 mt-2">
                {/* Name Input */}
                <div>
                  <label
                    className="block text-xs mb-1.5 text-right font-medium"
                    style={{ color: "#A8803F", letterSpacing: "0.03em" }}
                  >
                    الاسم 
                  </label>
                  <input
                    type="text"
                    className="vip-input text-right"
                    placeholder="أدخل الاسم"
                    value={contact.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    disabled={loading}
                    style={{
                      fontSize: "14px",
                      padding: "12px 16px",
                    }}
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <label
                    className="block text-xs mb-1.5 text-right font-medium"
                    style={{ color: "#A8803F", letterSpacing: "0.03em" }}
                  >
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="vip-input"
                    placeholder="05XXXXXXXX"
                    value={contact.phone}
                    onChange={(e) => handleChange(index, "phone", e.target.value)}
                    disabled={loading}
                    maxLength={10}
                    style={{
                      direction: "ltr",
                      fontSize: "14px",
                      padding: "12px 16px",
                      textAlign: "left",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3 mt-7">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "rgba(255,255,255,0.4)",
                    borderTopColor: "transparent",
                  }}
                />
                جارٍ الإرسال...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
               اعتماد المرشحين
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              color: "#9A8060",
              background: "rgba(196,149,90,0.04)",
              border: "1px solid rgba(196,149,90,0.15)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.color = "#C4955A";
                e.target.style.background = "rgba(196,149,90,0.08)";
                e.target.style.borderColor = "rgba(196,149,90,0.25)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.color = "#9A8060";
                e.target.style.background = "rgba(196,149,90,0.04)";
                e.target.style.borderColor = "rgba(196,149,90,0.15)";
              }
            }}
          >
            تخطي
          </button>
        </div>

        {/* Helper Text */}
        <div className="mt-5 text-center">
          <p className="text-xs leading-relaxed" style={{ color: "#B8A080" }}>
            سيتم مراجعة الترشيحات من قبل الإدارة قبل إرسال الدعوات
          </p>
        </div>
      </form>
    </div>
  );
}
