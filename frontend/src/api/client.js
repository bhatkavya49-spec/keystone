const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("token");
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error(
      `Cannot connect to the backend at ${API_URL}. Make sure it is running and the URL is correct.`
    );
    error.status = null;
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}