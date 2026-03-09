import { API_BASE_URL } from "../config/apiBase";
import { auth } from "../firebase";

const API_URL = API_BASE_URL;

// Helper to get auth token
const getAuthToken = async (): Promise<string | null> => {
  const cachedToken = localStorage.getItem('authToken');
  if (cachedToken) return cachedToken;
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    const freshToken = await currentUser.getIdToken();
    if (freshToken) localStorage.setItem("authToken", freshToken);
    return freshToken;
  } catch {
    return null;
  }
};

/** Map raw error → user-friendly message (mirrors errorMessages.js for TS side) */
function friendlyMessage(status: number, raw: string): string {
  const rawText =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && "message" in (raw as any)
        ? String((raw as any).message || "")
        : String(raw || "");
  const msg = rawText.toLowerCase();
  if (msg.includes('email-already-in-use') || msg.includes('email already'))
    return 'This email is already registered. Please log in instead.';
  if (msg.includes('user-not-found') || msg.includes('not found') && msg.includes('user'))
    return 'No account found with this email.';
  if (msg.includes('wrong-password') || msg.includes('invalid credential'))
    return 'Incorrect email or password.';
  if (msg.includes('account has been deleted') || msg.includes('account was deleted'))
    return 'This account has been deleted. Sign up again to create a new account or use the recovery email if available.';
  if (msg.includes('profile not found for this account'))
    return 'This account is no longer available. Sign up again to create a new account.';
  if (msg.includes('too-many-requests') || msg.includes('too many'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (status === 401) return 'Please log in to continue.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested information could not be found.';
  if (status === 409) return 'This email is already registered. Please log in instead.';
  if (status >= 500) return 'Our servers are having trouble. Please try again shortly.';
  return rawText || 'Something went wrong. Please try again.';
}

async function parseError(response: Response): Promise<Error> {
  try {
    const data = await response.json();
    const zodMessage = Array.isArray(data?.error)
      ? data.error[0]?.message
      : Array.isArray(data?.issues)
        ? data.issues[0]?.message
        : "";
    const raw = zodMessage || data?.error || data?.message || 'Request failed';
    const err = new Error(friendlyMessage(response.status, raw));
    (err as any).status = response.status;
    (err as any).raw = raw;
    (err as any).data = data;
    Object.assign(err as any, data || {});
    return err;
  } catch {
    const err = new Error(friendlyMessage(response.status, ''));
    (err as any).status = response.status;
    return err;
  }
}

function networkError(): Error {
  return new Error('No internet connection. Please check your network and try again.');
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers });
      if (!response.ok) throw await parseError(response);
      return response.json();
    } catch (e: any) {
      if (e.message && (e.message.includes('fetch') || e.message.includes('network') || e instanceof TypeError)) {
        if (!e.status) throw networkError();
      }
      throw e;
    }
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) throw await parseError(response);
      return response.json();
    } catch (e: any) {
      if (e instanceof TypeError || (e.message && e.message.includes('fetch'))) {
        if (!e.status) throw networkError();
      }
      throw e;
    }
  },

  /** Upload files as multipart/form-data */
  postForm: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) throw await parseError(response);
      return response.json();
    } catch (e: any) {
      if (e instanceof TypeError || (e.message && e.message.includes('fetch'))) {
        if (!e.status) throw networkError();
      }
      throw e;
    }
  },

  put: async <T>(endpoint: string, body: any): Promise<T> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) throw await parseError(response);
      return response.json();
    } catch (e: any) {
      if (e instanceof TypeError || (e.message && e.message.includes('fetch'))) {
        if (!e.status) throw networkError();
      }
      throw e;
    }
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const response = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE', headers });
      if (!response.ok) throw await parseError(response);
      return response.json();
    } catch (e: any) {
      if (e instanceof TypeError || (e.message && e.message.includes('fetch'))) {
        if (!e.status) throw networkError();
      }
      throw e;
    }
  },
};
