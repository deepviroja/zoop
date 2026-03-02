import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adsApi } from "../../services/api";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";

const SLOT_BY_TYPE = {
  horizontal: "home_top",
  sidebar: "search_sidebar",
};

const AdBanner = ({ type = "horizontal", slotId: slotIdProp = "" }) => {
  const [ads, setAds] = useState([]);
  const slotId = slotIdProp || SLOT_BY_TYPE[type] || "home_top";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await adsApi.getPublicBySlot(slotId);
        if (!cancelled) setAds(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setAds([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slotId]);

  const activeAd = useMemo(() => (ads.length > 0 ? ads[0] : null), [ads]);

  const wrapperClass =
    type === "sidebar"
      ? "relative block rounded-2xl overflow-hidden aspect-[4/5] border border-gray-100"
      : "relative block rounded-2xl overflow-hidden aspect-[16/5] border border-gray-100 my-8";

  // No active ad — render nothing (don't show placeholder text to users)
  if (!activeAd) return null;

  const content = (
    <>
      {activeAd.mediaType === "video" ? (
        <video
          src={optimizeCloudinaryUrl(activeAd.mediaUrl)}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={optimizeCloudinaryUrl(activeAd.mediaUrl, { width: 1400 })}
          alt={activeAd.title || "Ad"}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute bottom-3 left-3 right-3 text-white">
        <p className="text-xs font-black uppercase tracking-widest opacity-90">
          Sponsored
        </p>
        <p className="text-sm md:text-base font-black line-clamp-2">
          {activeAd.title}
        </p>
      </div>
    </>
  );

  if (activeAd.targetUrl && String(activeAd.targetUrl).trim()) {
    const href = String(activeAd.targetUrl);
    const internal = href.startsWith("/");
    return internal ? (
      <Link to={href} className={wrapperClass}>
        {content}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer" className={wrapperClass}>
        {content}
      </a>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
};

export default AdBanner;
