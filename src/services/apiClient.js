import { API_BASE_URL } from "../config/appConfig";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function createUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

export async function requestJson(path, options = {}) {
  const { body, signal, method = "GET", headers } = options;
  const response = await fetch(createUrl(path), {
    method,
    headers: body ? { ...DEFAULT_HEADERS, ...headers } : headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}
