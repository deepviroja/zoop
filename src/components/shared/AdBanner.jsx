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

const AdBanner = ({ type = "horizontal", slotId: slotIdProp = "", size = "default" }) => {
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
      : size === "hero"
        ? "group relative block h-[190px] w-full overflow-hidden rounded-[1.4rem] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_16px_34px_rgba(42,32,15,0.1)] sm:h-[210px] md:h-[300px] lg:h-[360px] xl:h-[390px] my-4 md:my-5"
        : "group relative block h-[180px] w-full overflow-hidden rounded-[1.4rem] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_16px_34px_rgba(42,32,15,0.1)] sm:h-[190px] md:h-[260px] lg:h-[280px] xl:h-[300px] my-4 md:my-5";

  const isSidebar = type === "sidebar";

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
          } catch (err) {
            console.error("Ad dismissal failed:", err);
          }
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
        <>
          <img
            src={optimizeCloudinaryUrl(displayAd.mediaUrl, { width: 1600 })}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35 blur-xl scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
            aria-hidden="true"
          />
        </>
      )}
      <div
        className={`absolute inset-0 ${isSidebar ? "bg-gradient-to-t from-[#111111]/88 via-[#111111]/56 to-[#111111]/10" : "bg-gradient-to-r from-[#111111]/88 via-[#111111]/58 to-[#111111]/15"}`}
      />
      <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_top_left,_rgba(183,232,75,0.45),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,214,153,0.24),_transparent_28%)]" />
      {isSidebar ? (
        <div className="absolute left-4 right-4 top-4 bottom-4 z-[2] flex flex-col justify-between text-white md:left-6 md:right-6 md:top-5 md:bottom-5 xl:left-7 xl:right-7 xl:top-6 xl:bottom-6">
          {displayAd.mediaType !== "video" ? (
            <div className="flex justify-end pr-10">
              <div className="flex h-[96px] w-[144px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/15 bg-[linear-gradient(135deg,rgba(250,248,242,0.96),rgba(238,232,221,0.9))] shadow-[0_16px_32px_rgba(15,15,15,0.2)]">
                <img
                  src={optimizeCloudinaryUrl(displayAd.mediaUrl, { width: 900 })}
                  alt={displayAd.title || "Ad"}
                  className="h-full w-full object-cover drop-shadow-[0_10px_20px_rgba(17,17,17,0.18)]"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-2.5 max-w-full">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/65">
              Sponsored
            </p>
            <p className="max-w-2xl text-xl font-black leading-[1.06] sm:text-2xl line-clamp-3">
              {displayAd.title}
            </p>
            {displayAd.description && (
              <p className="max-w-2xl text-[11px] text-white/82 sm:text-xs md:text-sm line-clamp-4">
                {displayAd.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 md:gap-3">
              <span className="inline-flex w-fit rounded-full bg-white dark:glass-card px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#111111] dark:text-white transition-transform group-hover:translate-x-1 md:px-5 md:py-2.5 md:text-xs md:tracking-[0.2em]">
                {displayAd.cta || "Explore now"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-[2] grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)] items-center gap-5 p-5 sm:p-6 md:p-8 lg:p-10">
          <div className="flex h-full flex-col justify-center text-white">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/65 sm:text-[11px]">
              Sponsored
            </p>
            <p className="max-w-[30rem] font-black leading-[0.98] text-2xl sm:text-[2rem] md:text-[2.4rem] lg:text-[3.1rem] line-clamp-3">
              {displayAd.title}
            </p>
            {displayAd.description && (
              <p className="mt-3 max-w-[28rem] text-sm leading-6 text-white/80 md:text-base line-clamp-3">
                {displayAd.description}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-white dark:glass-card px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#111111] dark:text-white transition-transform group-hover:translate-x-1">
                {displayAd.cta || "Explore now"}
              </span>
            </div>
          </div>
          {displayAd.mediaType !== "video" && (
            <div className="relative hidden h-full min-h-[180px] md:flex items-center justify-center">
              <div className="absolute inset-[8%] rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgba(250,248,242,0.96),rgba(238,232,221,0.9))] shadow-[0_22px_55px_rgba(15,15,15,0.22)]" />
              <div className="absolute inset-[8%] rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(183,232,75,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.08),transparent_26%)]" />
              <div className="relative z-[1] h-[70%] w-[70%] overflow-hidden rounded-[1.5rem] shadow-[0_20px_35px_rgba(17,17,17,0.18)]">
                <img
                  src={optimizeCloudinaryUrl(displayAd.mediaUrl, { width: 1600 })}
                  alt={displayAd.title || "Ad"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}
        </div>
      )}
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
