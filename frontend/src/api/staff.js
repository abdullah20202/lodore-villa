/**
 * Management API calls
 */
import apiClient from "./client";

/**
 * Management login
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ok: boolean, access: string, refresh: string, username: string, is_superuser: boolean}>}
 */
export const staffLogin = async (username, password) => {
  const { data } = await apiClient.post("/api/auth/management/login", {
    username,
    password,
  });
  return data;
};

/**
 * Get nominations list with search/filter/pagination
 * @param {Object} params - { search, status, page, page_size }
 * @returns {Promise<{ok: boolean, results: Array, count: number, page: number, total_pages: number}>}
 */
export const getNominations = async (params = {}) => {
  const { data } = await apiClient.get("/api/auth/management/nominations", { params });
  return data;
};

/**
 * Update nomination status
 * @param {number} nominationId
 * @param {string} status - pending | contacted | invited | confirmed
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export const updateNominationStatus = async (nominationId, status) => {
  const { data} = await apiClient.patch(
    `/api/auth/management/nominations/${nominationId}`,
    { status }
  );
  return data;
};

/**
 * Get reservations list with search/filter/pagination
 * @param {Object} params - { search, status, page, page_size }
 * @returns {Promise<{ok: boolean, results: Array, count: number, page: number, total_pages: number}>}
 */
export const getReservations = async (params = {}) => {
  const { data } = await apiClient.get("/api/auth/management/reservations", { params });
  return data;
};
