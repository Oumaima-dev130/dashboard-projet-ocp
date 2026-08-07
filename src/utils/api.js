export const API_BASE_URL =
  "https://dashboard-projet-ocp-production.up.railway.app/api";

export const SERVER_BASE_URL =
  "https://dashboard-projet-ocp-production.up.railway.app";

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUser = () => {
  const user = localStorage.getItem("user");

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData
      ? {}
      : {
          "Content-Type": "application/json",
        }),

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...(options.headers || {}),
  };

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${
        endpoint.startsWith("/") ? endpoint : `/${endpoint}`
      }`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    window.location.href = "/login";
    return null;
  }

  if (!response.ok) {
    let message = `Erreur ${response.status}`;

    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // réponse non JSON
    }

    throw new Error(message);
  }

  return response;
};