const API_URL = "http://localhost:8080";

export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("token");
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}