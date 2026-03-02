export const normalizeDocumentUrl = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return "";

  let resolved = raw;
  if (!/^https?:\/\//i.test(resolved)) {
    resolved = `https://${resolved.replace(/^\/+/, "")}`;
  }

  // Some older records may contain non-viewable Cloudinary URL variants.
  resolved = resolved.replace("/upload/fl_attachment:false/", "/upload/");

  // PDFs uploaded under image resource_type can fail in browser viewers.
  // Prefer raw delivery URL when path clearly points to a PDF.
  if (/res\.cloudinary\.com/i.test(resolved) && /\.pdf(?:\?|#|$)/i.test(resolved)) {
    resolved = resolved.replace("/image/upload/", "/raw/upload/");
  }

  return resolved;
};

