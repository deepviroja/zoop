export const optimizeCloudinaryUrl = (
  url: string,
  options?: { width?: number; quality?: string },
) => {
  const input = String(url || "").trim();
  if (!input) return input;
  if (!input.includes("res.cloudinary.com")) return input;
  const safe = input.replace(/^http:\/\//i, "https://");
  // Already has optimization transformations — skip double-injection
  if (safe.includes("/upload/q_auto") || safe.includes("/upload/f_auto"))
    return safe;
  const widthPart = options?.width ? `,w_${options.width}` : "";
  // Use q_auto,f_auto — Cloudinary recommended order (quality first, format second)
  return safe.replace("/upload/", `/upload/q_auto,f_auto${widthPart}/`);
};
