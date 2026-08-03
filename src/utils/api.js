const API_BASE_URL = "http://localhost:5000/api";
export const SERVER_BASE_URL = "http://localhost:5000";

export const getToken = () => localStorage.getItem("token");

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => Boolean(getToken());

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    Authorization: token ? `Bearer ${token}` : "",
    ...options.headers,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    window.location.href = "/login";
    return null;
  }

  return response;
};
