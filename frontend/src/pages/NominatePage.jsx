/**
 * /nominate — Nomination page for people who already visited
 *
 * Allows visitors to nominate up to 3 contacts
 * Optionally provide their own phone number
 * No verification required - open to anyone with the link
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import SupportButton from "../components/SupportButton";
import { submitVisitorNominations } from "../api/auth";

/** Convert Arabic numerals to English */
function convertArabicToEnglish(str) {
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  const englishNumerals = '0123456789';
  return str.split('').map(char => {
    const index = arabicNumerals.indexOf(char);
    return index !== -1 ? englishNumerals[index] : char;
  }).join('');
}

/** Client-side phone normalizer */
function normalizePhone(raw) {
  if (!raw) return null;
  let phone = convertArabicToEnglish(raw);
  phone = phone.replace(/[\s\-\(\)]/g, "").trim();
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (phone.startsWith("966")) phone = "0" + phone.slice(3);
  if (/^5\d{8}$/.test(phone)) phone = "0" + phone;
  if (/^05\d{8}$/.test(phone)) return phone;
  return null;
}

export default function NominatePage() {
  const navigate = useNavigate();
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [contacts, setContacts] = useState([
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContactChange = (index, field, value) => {
    const newContacts = [...contacts];
    newContacts[index][field] = value;
    setContacts(newContacts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate: at least one contact must be filled
    const filledContacts = contacts.filter(c => c.name.trim() && c.phone.trim());

    if (filledContacts.length === 0) {
      setError("يرجى إدخال معلومات جهة اتصال واحدة على الأقل");
      return;
    }

    // Normalize and validate phone numbers
    const normalizedContacts = [];
    for (const contact of filledContacts) {
      if (!contact.name.trim()) {
        setError("يرجى إدخال الاسم لجميع جهات الاتصال");
        return;
      }

      const normalizedPhone = normalizePhone(contact.phone);
      if (!normalizedPhone) {
        setError(`رقم جوال غير صالح: ${contact.phone}. يرجى إدخال رقم سعودي صحيح`);
        return;
      }

      normalizedContacts.push({
        name: contact.name.trim(),
        phone: normalizedPhone,
      });
    }

    // Validate submitter phone if provided
    let normalizedSubmitterPhone = null;
    if (submitterPhone.trim()) {
      normalizedSubmitterPhone = normalizePhone(submitterPhone);
      if (!normalizedSubmitterPhone) {
        setError("رقم جوالك غير صالح. يرجى إدخال رقم سعودي صحيح أو اتركه فارغاً");
        return;
      }
    }

    setLoading(true);
    try {
      const data = await submitVisitorNominations({
        submitter_phone: normalizedSubmitterPhone,
        contacts: normalizedContacts,
      });

      if (data.ok) {
        // Success - show success message or redirect
        navigate("/nominate-success", { replace: true });
      } else {
        setError(data.message || "حدث خطأ. يرجى المحاولة مجدداً");
      }
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || "حدث خطأ غير متوقع. يرجى المحاولة مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg py-10 px-4" style={{ minHeight: "100vh" }}>
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <Logo />

        {/* Invitation card */}
        <div className="luxury-card p-7 mb-4" style={{ textAlign: "right" }}>
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span
              className="text-xs px-4 py-1 rounded-full tracking-widest"
              style={{
                background: "rgba(196,149,90,0.10)",
                border: "1px solid rgba(196,149,90,0.30)",
                color: "#A8803F",
                letterSpacing: "0.15em",
              }}
            >
              شارك التجربة مع من تحب
            </span>
          </div>

          {/* Arabic message */}
          <p className="text-sm leading-loose mb-4" style={{ color: "#3C2E1E" }}>
            السلام عليكم،
          </p>
          <p className="text-sm leading-loose mb-4" style={{ color: "#3C2E1E" }}>
            معكم <strong>سلطان الشعيبي</strong> مؤسس <strong>لودوريه</strong>.
          </p>
          <p className="text-sm leading-loose mb-4" style={{ color: "#3C2E1E" }}>
            نظرًا لكونكم من الذين سبق لهم الحجز لتجربة <strong>لودوريه فيلا</strong>، وحرصًا
            منا على أن تبقى هذه التجربة بدعوات محدودة ومختارة بعناية، يسعدني استقبال
            ترشيحاتكم لأشخاص ترون أنهم يليقون بحضور هذه التجربة الخاصة.
          </p>

          <div className="gold-divider my-5" />

          {/* Signature */}
          <p className="text-sm leading-loose text-right" style={{ color: "#3C2E1E" }}>
            مع خالص التقدير،
          </p>
          <p className="text-sm font-semibold text-right" style={{ color: "#2C2416" }}>
            سلطان الشعيبي
          </p>
          <p className="text-xs text-right mt-0.5" style={{ color: "#A8803F" }}>
            L'Odore
          </p>

          <div className="gold-divider my-5" />

          {/* English message */}
          <div style={{ textAlign: "left", direction: "ltr" }}>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#7A6550", fontStyle: "italic" }}>
              Peace be upon you,
            </p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#7A6550", fontStyle: "italic" }}>
              This is <strong>Sultan Alsheaibi</strong>, founder of <strong>L'Odore</strong>.
            </p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#7A6550", fontStyle: "italic" }}>
              As you are among those who have previously booked the <strong>L'Odore Villa</strong> experience,
              and in our commitment to keeping this experience exclusive with carefully selected invitations,
              I am pleased to welcome your nominations for individuals you believe would be worthy of
              attending this special experience.
            </p>

            <div className="gold-divider my-5" />

            <p className="text-xs leading-relaxed text-left" style={{ color: "#7A6550", fontStyle: "italic" }}>
              With sincere appreciation,
            </p>
            <p className="text-xs font-semibold mt-2" style={{ color: "#2C2416" }}>
              Sultan Alsheaibi
            </p>
            <p className="text-xs text-left mt-0.5" style={{ color: "#A8803F" }}>
              L'Odore
            </p>
          </div>
          <div className="gold-divider my-5" />
        </div>

        {/* Nomination form */}
        <div className="luxury-card p-7">
          <p
            className="text-center text-xs mb-6 tracking-wide"
            style={{ color: "#A8803F", letterSpacing: "0.08em" }}
          >
            — معلومات من ترغب بترشيحهم —
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Contact fields */}
            {contacts.map((contact, index) => (
              <div key={index} className="mb-6">
                <p className="text-xs mb-3 font-semibold" style={{ color: "#A8803F" }}>
                  الشخص {index === 0 ? "الأول" : index === 1 ? "الثاني" : "الثالث"} {index > 0 && "(اختياري)"}
                </p>

                <div className="mb-3">
                  <label
                    className="block text-xs mb-2 text-right font-medium"
                    style={{ color: "#A8803F", letterSpacing: "0.06em" }}
                  >
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    className="vip-input"
                    placeholder="الاسم الكامل"
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, "name", e.target.value)}
                    disabled={loading}
                    dir="rtl"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs mb-2 text-right font-medium"
                    style={{ color: "#A8803F", letterSpacing: "0.06em" }}
                  >
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    className="vip-input"
                    placeholder="05XXXXXXXX"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={15}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>

                {index < contacts.length - 1 && (
                  <div className="gold-divider my-5" style={{ opacity: 0.3 }} />
                )}
              </div>
            ))}

            <div className="gold-divider my-6" />

            {/* Optional: Submitter's phone */}
            <div className="mb-5">
              <label
                className="block text-xs mb-2 text-right font-medium"
                style={{ color: "#A8803F", letterSpacing: "0.06em" }}
              >
                رقم جوالك (اختياري)
              </label>
              <input
                type="tel"
                className="vip-input"
                placeholder="05XXXXXXXX"
                value={submitterPhone}
                onChange={(e) => setSubmitterPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                maxLength={15}
                disabled={loading}
                dir="ltr"
              />
              <p className="text-xs mt-2 text-right" style={{ color: "#A8803F", opacity: 0.7 }}>
                يمكنك تركه فارغاً إذا كنت لا تفضل مشاركة رقمك
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
                style={{
                  background: "rgba(180,50,50,0.06)",
                  border: "1px solid rgba(180,50,50,0.18)",
                  color: "#B43232",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }}
                  />
                  جارٍ الإرسال...
                </span>
              ) : (
                "إرسال الترشيحات"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#E8DCC8", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          شكراً لمشاركتك هذه التجربة
        </p>
      </div>

      <SupportButton />
    </div>
  );
}
