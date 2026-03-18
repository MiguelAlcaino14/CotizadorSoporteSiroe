const BASE_URL = import.meta.env.VITE_API_URL as string;

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

function getTokenExpiry(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

let refreshPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("No token");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  const data = await res.json();
  localStorage.setItem("auth_token", data.access_token);
  if (data.user) localStorage.setItem("auth_user", JSON.stringify(data.user));
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  // Refresco proactivo: si el token vence en menos de 5 minutos
  const exp = getTokenExpiry();
  if (exp && exp - Date.now() / 1000 < 300) {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    }
    await refreshPromise;
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  // Si 401, intentar refresh y reintentar la petición una vez
  if (res.status === 401 && path !== "/auth/refresh") {
    try {
      await doRefresh();
      const retryToken = getToken();
      const retryHeaders: Record<string, string> = {};
      if (retryToken) retryHeaders["Authorization"] = `Bearer ${retryToken}`;
      if (!isFormData) retryHeaders["Content-Type"] = "application/json";
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: retryHeaders,
        body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
      });
      if (retryRes.status === 204) return undefined as T;
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ error: retryRes.statusText }));
        throw new Error(err.error ?? "Error en la solicitud");
      }
      return retryRes.json();
    } catch {
      throw new Error("Sesión expirada");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Error en la solicitud");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  upload: <T>(path: string, formData: FormData) => request<T>("POST", path, formData, true),
};
