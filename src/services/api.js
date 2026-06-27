const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const FALLBACK_API_URL = "http://localhost:3000/api";
const USE_LOCAL_FALLBACK = import.meta.env.DEV && API_URL !== FALLBACK_API_URL;

async function request(path, options = {}) {
  const { headers, ...requestConfig } = options;
  const requestOptions = {
    cache: "no-store",
    ...requestConfig,
    headers: {
      "Content-Type": "application/json",
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

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const error = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : { message: await response.text().catch(() => "") };

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
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  signup: (data) => request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  getClients: () => request("/clients"),
  createClient: (data) => request("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getEmployees: () => request("/employees"),
  createEmployee: (data, role = "Admin") =>
    request("/employees", {
      method: "POST",
      headers: { "x-user-role": role },
      body: JSON.stringify({ ...data, requestedByRole: role }),
    }),
  updateEmployee: (id, data, role = "Admin") =>
    request(`/employees/${id}`, {
      method: "PATCH",
      headers: { "x-user-role": role },
      body: JSON.stringify({ ...data, requestedByRole: role }),
    }),
  updateEmployeeProfile: (id, data) =>
    request(`/employees/${id}/profile`, { method: "PATCH", body: JSON.stringify(data) }),
  getSpecialties: () => request("/employees/specialties"),
  createSpecialty: (name, role = "Admin") =>
    request("/employees/specialties", {
      method: "POST",
      headers: { "x-user-role": role },
      body: JSON.stringify({ name, requestedByRole: role }),
    }),
  deleteSpecialty: (name, role = "Admin") =>
    request(`/employees/specialties/${encodeURIComponent(name)}`, {
      method: "DELETE",
      headers: { "x-user-role": role },
    }),

  getTreatments: () => request("/treatments"),
  getAppointments: () => request("/appointments"),
  createAppointment: (data) => request("/appointments", { method: "POST", body: JSON.stringify(data) }),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: "PATCH" }),
};
