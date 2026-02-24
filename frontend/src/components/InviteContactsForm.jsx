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
      // Convert Arabic numerals to English
      newContacts[index][field] = convertArabicToEnglish(value);
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
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2" style={{ color: "#2C2416" }}>
         ترشيح ضيوف لمشاركة التجربة
        </h2>
        <p className="text-sm" style={{ color: "#7A6550" }}>
         يمكنك ترشيح حتى 3 أشخاص ليتم دعوتهم إلى الفعالية (اختياري)
        </p>
      </div>

      <div className="gold-divider mb-6" />

      {/* Success Message */}
      {success && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-sm text-center"
          style={{
            background: "rgba(76,175,80,0.08)",
            border: "1px solid rgba(76,175,80,0.22)",
            color: "#4CAF50",
          }}
        >
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-sm text-center"
          style={{
            background: "rgba(180,50,50,0.06)",
            border: "1px solid rgba(180,50,50,0.18)",
            color: "#B43232",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Contact Inputs */}
        {contacts.map((contact, index) => (
          <div key={index} className="mb-5">
            <label
              className="block text-xs mb-2 text-right font-medium"
              style={{ color: "#A8803F", letterSpacing: "0.06em" }}
            >
              جهة الاتصال {index + 1}
            </label>

            <div className="space-y-2">
              <input
                type="text"
                className="vip-input text-right"
                placeholder="الاسم"
                value={contact.name}
                onChange={(e) => handleChange(index, "name", e.target.value)}
                disabled={loading}
              />
              <input
                type="tel"
                inputMode="numeric"
                className="vip-input text-right"
                placeholder="رقم الجوال (05xxxxxxxx)"
                value={contact.phone}
                onChange={(e) => handleChange(index, "phone", e.target.value)}
                disabled={loading}
                style={{ direction: "ltr" }}
              />
            </div>
          </div>
        ))}

        {/* Buttons */}
        <div className="space-y-3 mt-6">
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
              "إرسال الدعوات"
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ color: "#9A8060" }}
            onMouseEnter={(e) => !loading && (e.target.style.color = "#C4955A")}
            onMouseLeave={(e) => !loading && (e.target.style.color = "#9A8060")}
          >
            تخطي
          </button>
        </div>
      </form>
    </div>
  );
}
