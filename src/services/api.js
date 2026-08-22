import { getAccessToken, logout, saveAccessToken } from "@/data/auth";

const ENV_API_URL = import.meta.env.VITE_API_URL?.trim();
const API_URL = (ENV_API_URL || (import.meta.env.DEV ? "/api" : "")).replace(/\/$/, "");
const FALLBACK_API_URL = "http://localhost:3000/api";
const USE_LOCAL_FALLBACK = import.meta.env.DEV && API_URL !== FALLBACK_API_URL;
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        const { token } = await response.json();
        saveAccessToken(token);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error("VITE_API_URL is missing in Vercel. Add your Railway backend URL ending with /api and redeploy.");
  }

  const { headers, ...requestConfig } = options;
  const requestOptions = {
    cache: "no-store",
    credentials: "include",
    ...requestConfig,
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...(headers || {}),
    },
  };

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, requestOptions);
  } catch (error) {
    if (USE_LOCAL_FALLBACK) {
      response = await fetch(`${FALLBACK_API_URL}${path}`, requestOptions);
    } else {
      throw error;
    }
  }

  if (!response.ok && USE_LOCAL_FALLBACK) {
    const contentType = response.headers.get("content-type") || "";
    if (response.status === 404 || !contentType.includes("application/json")) {
      response = await fetch(`${FALLBACK_API_URL}${path}`, requestOptions);
    }
  }

  if (response.status === 401 && !options.skipTokenRefresh) {
    try {
      await refreshAccessToken();
      return request(path, { ...options, skipTokenRefresh: true });
    } catch {
      logout();
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const error = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : { message: await response.text().catch(() => "") };

    if (response.status === 401) logout();
    throw new Error(error.message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "API is not returning JSON. Check VITE_API_URL in Vercel and redeploy the frontend.",
    );
  }

  return response.json();
}

export const api = {
  refreshSession: () => refreshAccessToken(),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  signup: (data) => request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request("/auth/logout", { method: "POST", skipTokenRefresh: true }),
  getLoyaltySettings: () => request("/loyalty-settings"),
  updateLoyaltySettings: (data) => request("/loyalty-settings", { method: "PUT", body: JSON.stringify(data) }),

  getClients: () => request("/clients"),
  getClientStats: () => request("/clients/stats"),
  createClient: (data) => request("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getEmployees: () => request("/employees"),
  createEmployee: (data) =>
    request("/employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEmployee: (id, data) =>
    request(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  updateEmployeeProfile: (id, data) =>
    request(`/employees/${id}/profile`, { method: "PATCH", body: JSON.stringify(data) }),
  updateEmployeeSchedule: (id, schedule) =>
    request(`/employees/${id}/schedule`, {
      method: "PATCH",
      body: JSON.stringify({ schedule }),
    }),
  updateEmployeeVacations: (id, vacations) =>
    request(`/employees/${id}/vacations`, {
      method: "PATCH",
      body: JSON.stringify({ vacations }),
    }),
  updateVacationAllowance: (id, vacationAllowance) =>
    request(`/employees/${id}/vacation-allowance`, {
      method: "PATCH",
      body: JSON.stringify({ vacationAllowance }),
    }),
  deleteEmployee: (id) =>
    request(`/employees/${id}`, { method: "DELETE" }),
  getSpecialties: () => request("/employees/specialties"),
  createSpecialty: (name) =>
    request("/employees/specialties", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deleteSpecialty: (name) =>
    request(`/employees/specialties/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),
  updateSpecialty: (currentName, name) =>
    request(`/employees/specialties/${encodeURIComponent(currentName)}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  getProductOrders: () => request("/product-orders"),
  createProductOrder: (employeeId, text = "") =>
    request(`/product-orders/${employeeId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  updateProductOrder: (employeeId, index, data) =>
    request(`/product-orders/${employeeId}/${index}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProductOrder: (employeeId, index) =>
    request(`/product-orders/${employeeId}/${index}`, { method: "DELETE" }),
  cleanupProductOrders: () =>
    request("/product-orders/cleanup", { method: "POST" }),

  getTreatments: () => request("/treatments"),
  createTreatment: (data) =>
    request("/treatments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTreatment: (id, data) =>
    request(`/treatments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTreatment: (id) =>
    request(`/treatments/${id}`, {
      method: "DELETE",
    }),
  getAppointments: () => request("/appointments"),
  createAppointment: (data) => request("/appointments", { method: "POST", body: JSON.stringify(data) }),
  updateAppointment: (id, data) =>
    request(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: "PATCH" }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: "DELETE" }),

  getReviews: (employee) => request(`/reviews${employee ? `?employee=${encodeURIComponent(employee)}` : ""}`),
  createReview: (employee, data) =>
    request(`/reviews/${encodeURIComponent(employee)}`, { method: "POST", body: JSON.stringify(data) }),
};
