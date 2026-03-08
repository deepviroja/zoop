/**
 * API Base URL — environment-aware
 *
 * Development: uses VITE_API_URL from .env (default http://localhost:5000/api)
 * Production:  set VITE_API_URL=https://<your-render-app>.onrender.com/api
 *              in your Firebase Hosting environment or .env.production file.
 */
const DEV_FALLBACK = "http://localhost:5000/api";
const PROD_FALLBACK = "https://zoop-t2bs.onrender.com/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PROD_FALLBACK : DEV_FALLBACK);

