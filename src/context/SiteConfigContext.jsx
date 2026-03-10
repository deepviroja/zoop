import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { contentApi } from "../services/api";
import {
  DEFAULT_BRAND_NAME,
  normalizeBrandName,
  replaceBrandTokens,
} from "../utils/branding";

const defaultSiteConfig = {
  brandName: DEFAULT_BRAND_NAME,
  brandLogoUrl: "",
  brandTextColor: "#b7e84b",
  brandFontFamily: "inherit",
  brandFontWeight: "900",
  announcementBanner: "Same-Day Delivery active in Surat!",
  homeSameDayCutoffText: "Order before 6 PM for same-day delivery",
  homeHeroHeadline: "Discover Local Gems",
  sellerPanelTitle: "Seller Panel",
  adminPanelTitle: "Admin Control",
};

const SiteConfigContext = createContext(undefined);

export const SiteConfigProvider = ({ children }) => {
  const [siteConfig, setSiteConfig] = useState(defaultSiteConfig);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSiteConfig = useCallback(async () => {
    try {
      const nextConfig = await contentApi.getSiteConfig();
      setSiteConfig((prev) => ({
        ...prev,
        ...(nextConfig || {}),
      }));
    } catch {
      setSiteConfig((prev) => ({ ...defaultSiteConfig, ...prev }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSiteConfig();
  }, [refreshSiteConfig]);

  const brandName = normalizeBrandName(siteConfig?.brandName);
  const value = useMemo(
    () => ({
      siteConfig,
      isLoading,
      refreshSiteConfig,
      brandName,
      replaceBrandText: (text) => replaceBrandTokens(text, brandName),
    }),
    [brandName, isLoading, refreshSiteConfig, siteConfig],
  );

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error("useSiteConfig must be used within SiteConfigProvider");
  }
  return context;
};
