import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adsApi } from "../../services/api";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";
import { X } from "../../assets/icons/X";

const SLOT_BY_TYPE = {
  horizontal: "home_top",
  sidebar: "search_sidebar",
};
const DISMISSED_ADS_KEY = "zoop_dismissed_ads_session";

const AdBanner = ({ type = "horizontal", slotId: slotIdProp = "" }) => {
  const [ads, setAds] = useState([]);
  const [dismissedAds, setDismissedAds] = useState(() => {
    try {
      const stored = sessionStorage.getItem(DISMISSED_ADS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
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

  const activeAd = useMemo(
    () =>
      ads.find((ad) => {
        const adKey = String(ad.id || ad.mediaUrl || "");
        return adKey && !dismissedAds.includes(adKey);
      }) || null,
    [ads, dismissedAds],
  );
  const displayAd = activeAd?.mediaUrl ? activeAd : null;

  if (!displayAd) {
    return null;
  }

  const wrapperClass =
    type === "sidebar"
      ? "group relative block h-[235px] overflow-hidden rounded-[1.6rem] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_18px_40px_rgba(42,32,15,0.12)] xl:h-[255px]"
      : "group relative block h-[180px] w-full overflow-hidden rounded-[1.4rem] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_16px_34px_rgba(42,32,15,0.1)] sm:h-[190px] md:h-[260px] lg:h-[280px] xl:h-[300px] my-4 md:my-5";

  const content = (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const adKey = String(displayAd.id || displayAd.mediaUrl || "");
          if (!adKey) return;
          const next = Array.from(new Set([...dismissedAds, adKey]));
          setDismissedAds(next);
          try {
            sessionStorage.setItem(DISMISSED_ADS_KEY, JSON.stringify(next));
          } catch {}
        }}
        className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/80 backdrop-blur hover:bg-black/55"
        aria-label="Close ad"
      >
        <X width={16} height={16} />
      </button>
      {displayAd.mediaType === "video" ? (
        <video
          src={optimizeCloudinaryUrl(displayAd.mediaUrl)}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <img
          src={optimizeCloudinaryUrl(displayAd.mediaUrl, { width: 1600 })}
          alt={displayAd.title || "Ad"}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute -right-8 top-4 h-20 w-20 rounded-full border border-white/20 bg-white/10 blur-md md:-right-10 md:top-6 md:h-28 md:w-28" />
      <div className="absolute bottom-[-18%] right-[-8%] h-28 w-28 rounded-full bg-[#b7e84b]/20 blur-2xl md:h-40 md:w-40" />
      <div
        className={`absolute inset-0 ${type === "sidebar" ? "bg-gradient-to-t from-[#111111]/88 via-[#111111]/56 to-[#111111]/10" : "bg-gradient-to-r from-[#111111]/88 via-[#111111]/48 to-transparent"}`}
      />
      <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_top_left,_rgba(183,232,75,0.45),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,214,153,0.24),_transparent_28%)]" />
      <div className="absolute left-4 right-4 top-4 bottom-4 flex flex-col justify-end text-white md:left-6 md:right-6 md:top-5 md:bottom-5 xl:left-7 xl:right-7 xl:top-6 xl:bottom-6">
        <div
          className={`space-y-2.5 ${type === "sidebar" ? "max-w-full" : "max-w-[30rem] xl:max-w-[34rem]"}`}
        >
          <p
            className={`max-w-2xl font-black leading-[1.06] ${type === "sidebar" ? "text-xl sm:text-2xl line-clamp-3" : "text-base sm:text-lg md:text-2xl lg:text-[1.85rem] xl:text-[2rem] line-clamp-3"}`}
          >
            {displayAd.title}
          </p>
          {displayAd.description && (
            <p
              className={`max-w-2xl text-[11px] text-white/82 sm:text-xs md:text-sm ${type === "sidebar" ? "line-clamp-4" : "line-clamp-2"}`}
            >
              {displayAd.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 md:gap-3">
            <span className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#111111] transition-transform group-hover:translate-x-1 md:px-5 md:py-2.5 md:text-xs md:tracking-[0.2em]">
              {displayAd.cta || "Explore now"}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  if (displayAd.targetUrl && String(displayAd.targetUrl).trim()) {
    const href = String(displayAd.targetUrl);
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
