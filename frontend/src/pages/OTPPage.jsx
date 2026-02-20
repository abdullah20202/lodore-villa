/**
 * /otp — OTP verification page
 *
 * Expects location.state: { phone, requestId }
 * Redirects to /verify if state is missing.
 * On success: stores JWT tokens → /book
 * On failure: shows error + retry
 * Resend: cooldown handled by backend
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOTP, requestOTP } from "../api/auth";
import { setTokens } from "../api/client";
import Logo from "../components/Logo";

const RESEND_COOLDOWN = 60;

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Guard: must come from /verify with state
  const { phone, requestId: initialRequestId } = location.state || {};
  if (!phone || !initialRequestId) {
    navigate("/verify", { replace: true });
    return null;
  }

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(initialRequestId);

  // Resend cooldown
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    startCooldown();
    return () => clearInterval(timerRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!code || code.length < 4) {
      setError("يرجى إدخال رمز التحقق كاملاً.");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOTP(phone, requestId, code);
      if (data.ok) {
        setTokens({ access: data.access, refresh: data.refresh });
        navigate("/book", { replace: true });
      } else {
        const remaining = data.attemptsRemaining;
        setError(
          remaining !== undefined
            ? `رمز التحقق غير صحيح. المحاولات المتبقية: ${remaining}`
            : "رمز التحقق غير صحيح أو انتهت صلاحيته."
        );
        setCode("");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        setError("تم تجاوز الحد المسموح به من المحاولات. يرجى طلب رمز جديد.");
      } else {
        setError(
          err?.response?.data?.message || "حدث خطأ. يرجى المحاولة مجدداً."
        );
      }
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      const data = await requestOTP(phone);
      if (data.ok) {
        setRequestId(data.requestId);
        setCode("");
        startCooldown();
      } else if (data.cooldownRemaining) {
        setCooldown(data.cooldownRemaining);
        startCooldown();
        setError(`يرجى الانتظار ${data.cooldownRemaining} ثانية.`);
      } else {
        navigate("/sorry", { replace: true });
      }
    } catch {
      setError("تعذر إعادة الإرسال. حاول مجدداً.");
    } finally {
      setResending(false);
    }
  };

  // Mask phone for display: 05****5678
  const maskedPhone = phone
    ? phone.slice(0, 3) + "****" + phone.slice(7)
    : "";

  return (
    <div className="page-bg flex items-center justify-center p-4" style={{ minHeight: "100vh" }}>
      <div className="w-full max-w-sm">
        <Logo subtitle="التحقق برمز OTP" />

        <div className="luxury-card p-8">
          {/* Phone indicator */}
          <div className="text-center mb-6">
            <p className="text-sm mb-1" style={{ color: "#7A6550" }}>
              تم إرسال رمز التحقق إلى
            </p>
            <p
              className="font-bold text-lg tracking-widest"
              style={{ color: "#C4955A", direction: "ltr", display: "inline-block" }}
            >
              {maskedPhone}
            </p>
          </div>

          {/* Divider */}
          <div className="gold-divider mb-6" />

          <form onSubmit={handleVerify} noValidate>
            <div className="mb-5">
              <label
                className="block text-xs mb-2 text-right font-medium"
                style={{ color: "#A8803F", letterSpacing: "0.06em" }}
              >
                رمز التحقق
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="vip-input text-center text-3xl tracking-[0.6em] font-bold"
                placeholder="· · · · · ·"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                maxLength={8}
                autoFocus
                disabled={loading}
                autoComplete="one-time-code"
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
              disabled={loading || code.length < 4}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }}
                  />
                  جارٍ التأكيد...
                </span>
              ) : (
                "تأكيد الرمز"
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 text-center">
            {cooldown > 0 ? (
              <p className="text-sm" style={{ color: "#B8A080" }}>
                إعادة الإرسال خلال{" "}
                <span className="font-bold" style={{ color: "#C4955A" }}>{cooldown}</span>
                {" "}ثانية
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm underline underline-offset-2 transition-colors disabled:opacity-50"
                style={{ color: "#C4955A" }}
              >
                {resending ? "جارٍ الإرسال..." : "إعادة إرسال الرمز"}
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/verify")}
          className="w-full mt-4 text-sm text-center transition-colors"
          style={{ color: "#B8A080" }}
          onMouseEnter={(e) => (e.target.style.color = "#7A6550")}
          onMouseLeave={(e) => (e.target.style.color = "#B8A080")}
        >
          ← العودة وتغيير الرقم
        </button>
      </div>
    </div>
  );
}
