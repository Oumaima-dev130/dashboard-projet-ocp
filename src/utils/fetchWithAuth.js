const API_BASE_URL = '/api';

/**
 * Wrapper autour de fetch qui :
 * - préfixe automatiquement l'URL avec /api
 * - ajoute le token JWT (localStorage) dans le header Authorization
 * - n'ajoute PAS Content-Type: application/json si le body est un FormData
 * - parse la réponse JSON et jette une erreur lisible si la requête échoue
 *
 * Usage:
 *   const data = await fetchWithAuth('/projects');
 *   const data = await fetchWithAuth('/projects', { method: 'POST', body: JSON.stringify({...}) });
 *   const data = await fetchWithAuth('/reports', { method: 'POST', body: formData }); // FormData
 */
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token'); // ⚠️ adapte la clé si tu stockes le token ailleurs

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const message = data?.message || `Erreur ${response.status}`;
    throw new Error(message);
  }

  return data;
};

export default fetchWithAuth;
