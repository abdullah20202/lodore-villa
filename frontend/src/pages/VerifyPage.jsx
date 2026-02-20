/**
 * /verify — Phone number entry page
 *
 * Accepts: 05xxxxxxxx, 5xxxxxxxx, 9665xxxxxxx, +9665xxxxxxx
 * Normalizes client-side before submitting.
 * On success → /otp (with phone + requestId in location state)
 * On failure → /sorry
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestOTP } from "../api/auth";
import Logo from "../components/Logo";

/** Client-side phone normalizer (mirrors backend logic) */
function normalizePhone(raw) {
  if (!raw) return null;
  let phone = raw.replace(/[\s\-\(\)]/g, "").trim();
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (phone.startsWith("966")) phone = "0" + phone.slice(3);
  if (/^5\d{8}$/.test(phone)) phone = "0" + phone;
  if (/^05\d{8}$/.test(phone)) return phone;
  return null;
}

export default function VerifyPage() {
  const navigate = useNavigate();
  const [rawPhone, setRawPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const phone = normalizePhone(rawPhone);
    if (!phone) {
      setError("يرجى إدخال رقم جوال سعودي صالح (مثال: 0512345678)");
      return;
    }

    setLoading(true);
    try {
      const data = await requestOTP(phone);

      if (data.ok) {
        navigate("/otp", {
          state: { phone, requestId: data.requestId },
          replace: false,
        });
      } else {
        navigate("/sorry", { replace: true });
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403 || status === 404) {
        navigate("/sorry", { replace: true });
      } else if (status === 429) {
        const msg = err?.response?.data?.message;
        setError(msg || "تم تجاوز الحد المسموح به. يرجى الانتظار قبل المحاولة مجدداً.");
      } else {
        setError("حدث خطأ غير متوقع. يرجى المحاولة مجدداً.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg py-10 px-4" style={{ minHeight: "100vh" }}>
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <Logo />

        {/* Invitation letter card */}
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
              دعوة شخصية وخاصة
            </span>
          </div>

          {/* Arabic letter */}
          <p className="text-sm leading-loose mb-4" style={{ color: "#3C2E1E" }}>
            يشرفني دعوتكم إلى <strong>لودوريه فيلا</strong> للاحتفاء بليالي رمضان المباركة
            في أجواء من الخصوصية والرقي، حيث تفوح نفحات عطرية نادرة صيغت بعناية.
          </p>
          <p className="text-sm leading-loose mb-4" style={{ color: "#3C2E1E" }}>
            يسعدني استقبالكم شخصياً ومشاركتكم قصص مجموعة <strong>العود البري</strong>.
          </p>
          <p className="text-sm leading-loose" style={{ color: "#3C2E1E" }}>
            نأمل تفضلكم بحجز موعدكم الخاص لنكون على موعد يليق بكم.
          </p>

          <div className="gold-divider my-5" />

          {/* Signature */}
          <p className="text-sm font-semibold text-right" style={{ color: "#2C2416" }}>
            سلطان الشعيبي
          </p>
          <p className="text-xs text-right mt-0.5" style={{ color: "#A8803F" }}>
            لودوريه
          </p>

          <div className="gold-divider my-5" />

          {/* English letter */}
          <div style={{ textAlign: "left", direction: "ltr" }}>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#7A6550", fontStyle: "italic" }}>
              It is my pleasure to invite you to <strong>L'Odore Villa</strong> in celebration
              of the blessed nights of Ramadan, within an atmosphere of privacy and refined
              elegance, where rare and meticulously crafted fragrances fill the space.
            </p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#7A6550", fontStyle: "italic" }}>
              I would be delighted to personally welcome you and share the stories behind
              the <strong>Wild Oud Collection</strong> and its unique journey.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#7A6550", fontStyle: "italic" }}>
              Kindly reserve your private appointment and allow us the honor of receiving
              you in a setting worthy of your presence.
            </p>
            <p className="text-xs font-semibold mt-4" style={{ color: "#2C2416" }}>
              Sultan Alsheaibi, L'Odore
            </p>
          </div>
        </div>

        {/* Phone verification card */}
        <div className="luxury-card p-7">
          <p
            className="text-center text-xs mb-5 tracking-wide"
            style={{ color: "#A8803F", letterSpacing: "0.08em" }}
          >
            — أدخل رقم جوالك لتأكيد دعوتك —
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Phone field */}
            <div className="mb-5">
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
                value={rawPhone}
                onChange={(e) => setRawPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                maxLength={15}
                disabled={loading}
                dir="ltr"
              />
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
              disabled={loading || !rawPhone.trim()}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }}
                  />
                  جارٍ التحقق...
                </span>
              ) : (
                "تحقق من الرقم"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#C8B99A" }}>
          للاستفسار تواصل مع المنظمين
        </p>
      </div>
    </div>
  );
}
