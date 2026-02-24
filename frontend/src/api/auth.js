/**
 * Auth API calls
 */
import apiClient from "./client";

/**
 * Request OTP for the given phone number.
 * @param {string} phone - Raw phone number (will be normalized server-side too)
 * @returns {Promise<{ok: boolean, requestId?: string, message?: string, cooldownRemaining?: number}>}
 */
export const requestOTP = async (phone) => {
  const { data } = await apiClient.post("/api/auth/request-otp", { phone });
  return data;
};

/**
 * Verify the OTP code.
 * @param {string} phone
 * @param {string} requestId - Reference ID from requestOTP response
 * @param {string} code - OTP entered by user
 * @returns {Promise<{ok: boolean, access?: string, refresh?: string, message?: string}>}
 */
export const verifyOTP = async (phone, requestId, code) => {
  const { data } = await apiClient.post("/api/auth/verify-otp", {
    phone,
    requestId,
    code,
  });
  return data;
};

/**
 * Refresh JWT access token.
 * @param {string} refresh
 * @returns {Promise<{ok: boolean, access: string, refresh: string}>}
 */
export const refreshToken = async (refresh) => {
  const { data } = await apiClient.post("/api/auth/token/refresh", { refresh });
  return data;
};

/**
 * Get current authenticated session.
 * @returns {Promise<{ok: boolean, phone: string}>}
 */
export const getMe = async () => {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
};

/**
 * Submit invitations for contacts (max 3).
 * @param {Array<{name: string, phone: string}>} contacts - Array of contacts to invite
 * @returns {Promise<{ok: boolean, message: string, created: number, errors: Array}>}
 */
export const submitInvitations = async (contacts) => {
  const { data } = await apiClient.post("/api/auth/invitations", { contacts });
  return data;
};
