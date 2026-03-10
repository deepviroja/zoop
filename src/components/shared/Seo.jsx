import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteConfig } from "../../context/SiteConfigContext";
import {
  replaceBrandTokens,
  replaceBrandTokensDeep,
} from "../../utils/branding";

const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://zoop-88df6.web.app").replace(/\/$/, "");
const DEFAULT_IMAGE = "/brand-mark.svg";

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const upsertLink = (selector, rel, href) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const upsertScript = (id, payload) => {
  const existingScript = document.getElementById(id);
  if (existingScript) existingScript.remove();
  if (!payload) return;

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.text = JSON.stringify(payload);
  document.head.appendChild(script);
};

const Seo = ({
  title,
  description,
  image = DEFAULT_IMAGE,
  keywords = "",
  robots = "index,follow",
  canonicalPath = "",
  jsonLd = null,
  type = "website",
}) => {
  const location = useLocation();
  const { brandName } = useSiteConfig();

  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${canonicalPath || location.pathname}${location.search || ""}`;
    const imageUrl = image?.startsWith("http") ? image : `${SITE_URL}${image || DEFAULT_IMAGE}`;
    const resolvedTitle = replaceBrandTokens(title, brandName);
    const resolvedDescription = replaceBrandTokens(description, brandName);
    const resolvedKeywords = replaceBrandTokens(keywords, brandName);
    const resolvedJsonLd = replaceBrandTokensDeep(jsonLd, brandName);

    document.title = resolvedTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: resolvedDescription });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: resolvedKeywords });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
    upsertMeta('meta[name="theme-color"]', { name: "theme-color", content: "#101010" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: resolvedTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: resolvedDescription });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: brandName });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: resolvedTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: resolvedDescription });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    upsertLink('link[rel="canonical"]', "canonical", canonicalUrl);
    upsertScript("zoop-jsonld", resolvedJsonLd);

    return () => {
      const currentScript = document.getElementById("zoop-jsonld");
      if (currentScript) currentScript.remove();
    };
  }, [title, description, image, keywords, robots, canonicalPath, jsonLd, location.pathname, location.search, type, brandName]);

  return null;
};

export default Seo;
