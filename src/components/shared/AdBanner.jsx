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
  const displayAd = activeAd?.mediaUrl ? activeAd : null;

  if (!displayAd) {
    return null;
  }

  const wrapperClass =
    type === "sidebar"
      ? "group relative block overflow-hidden rounded-[1.6rem] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_18px_40px_rgba(42,32,15,0.12)] aspect-[5/6] xl:aspect-[4/5]"
      : "group relative block overflow-hidden rounded-[1.4rem] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_16px_34px_rgba(42,32,15,0.1)] min-h-[132px] sm:min-h-[148px] md:min-h-[158px] lg:min-h-[150px] xl:min-h-[156px] my-4 md:my-5";

  const content = (
    <>
      {displayAd.mediaType === "video" ? (
        <video
          src={optimizeCloudinaryUrl(displayAd.mediaUrl)}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <img
          src={optimizeCloudinaryUrl(displayAd.mediaUrl, { width: 1600 })}
          alt={displayAd.title || "Ad"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute -right-8 top-4 h-20 w-20 rounded-full border border-white/20 bg-white/10 blur-md md:-right-10 md:top-6 md:h-28 md:w-28" />
      <div className="absolute bottom-[-18%] right-[-8%] h-28 w-28 rounded-full bg-[#b7e84b]/20 blur-2xl md:h-40 md:w-40" />
      <div className={`absolute inset-0 ${type === "sidebar" ? "bg-gradient-to-t from-[#111111]/88 via-[#111111]/56 to-[#111111]/10" : "bg-gradient-to-r from-[#111111]/88 via-[#111111]/48 to-transparent"}`} />
      <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_top_left,_rgba(183,232,75,0.45),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,214,153,0.24),_transparent_28%)]" />
      <div className="absolute left-4 right-4 top-4 bottom-4 flex flex-col justify-end text-white md:left-6 md:right-6 md:top-5 md:bottom-5 xl:left-7 xl:right-7 xl:top-6 xl:bottom-6">
        <div className={`space-y-2.5 ${type === "sidebar" ? "max-w-full" : "max-w-[30rem] xl:max-w-[34rem]"}`}>
          <p className={`max-w-2xl font-black leading-[1.06] ${type === "sidebar" ? "text-xl sm:text-2xl" : "text-base sm:text-lg md:text-2xl lg:text-[1.7rem] xl:text-[1.9rem]"}`}>
            {displayAd.title}
          </p>
          {displayAd.description && (
            <p className={`max-w-2xl text-[11px] text-white/82 sm:text-xs md:text-sm ${type === "sidebar" ? "line-clamp-4" : "line-clamp-2"}`}>
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
