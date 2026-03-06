import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adsApi } from "../../services/api";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";

const SLOT_BY_TYPE = {
  horizontal: "home_top",
  sidebar: "search_sidebar",
};

const FALLBACK_ADS = {
  home_top: {
    title: "Launch Your Storefront on Zoop",
    description: "Run visual campaigns, drive category traffic, and turn local discovery into daily orders.",
    targetUrl: "/seller/onboarding",
    cta: "Start selling",
    theme: "from-[#111111] via-[#2a1d0f] to-[#7c4d22]",
    accent: "text-zoop-moss",
  },
  home_mid: {
    title: "Fresh Picks. Faster Delivery.",
    description: "Explore city-ready products, stronger offers, and curated finds built for repeat shoppers.",
    targetUrl: "/products?type=Local",
    cta: "Shop local",
    theme: "from-[#0d1b2a] via-[#15395b] to-[#286f6c]",
    accent: "text-[#b7e84b]",
  },
  home_bottom: {
    title: "Need More Reach? Book a Featured Banner.",
    description: "Premium ad space for launches, deals, and seasonal drops. Built to stand out on every device.",
    targetUrl: "/seller/dashboard",
    cta: "Book ad space",
    theme: "from-[#20110c] via-[#7a3d1d] to-[#d98324]",
    accent: "text-[#ffe7c2]",
  },
  search_sidebar: {
    title: "Promote What Matters Most",
    description: "Put your product in front of ready-to-buy shoppers.",
    targetUrl: "/seller/dashboard",
    cta: "Create campaign",
    theme: "from-[#0d1117] via-[#28313b] to-[#485563]",
    accent: "text-white",
  },
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
  const fallbackAd = FALLBACK_ADS[slotId] || FALLBACK_ADS[SLOT_BY_TYPE[type]] || FALLBACK_ADS.home_top;
  const displayAd = activeAd?.mediaUrl ? activeAd : fallbackAd;
  const isFallback = !activeAd?.mediaUrl;

  const wrapperClass =
    type === "sidebar"
      ? "group relative block overflow-hidden rounded-[1.6rem] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_18px_40px_rgba(42,32,15,0.12)] aspect-[5/6] xl:aspect-[4/5]"
      : "group relative block overflow-hidden rounded-[1.55rem] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_18px_40px_rgba(42,32,15,0.12)] min-h-[170px] sm:min-h-[190px] md:min-h-[220px] lg:min-h-[240px] xl:min-h-[250px] my-4 md:my-5";

  const content = (
    <>
      {isFallback ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${displayAd.theme}`} />
      ) : displayAd.mediaType === "video" ? (
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
      <div className="absolute left-4 right-4 top-4 bottom-4 flex flex-col justify-between text-white md:left-6 md:right-6 md:top-6 md:bottom-6 xl:left-8 xl:right-8 xl:top-7 xl:bottom-7">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em] backdrop-blur md:px-3 md:text-[10px]">
            {isFallback ? "Featured" : "Sponsored"}
          </span>
          <span className="hidden sm:inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur">
            {slotId.replace(/_/g, " ")}
          </span>
        </div>
        <div className={`space-y-2.5 ${type === "sidebar" ? "max-w-full" : "max-w-[30rem] xl:max-w-[34rem]"}`}>
          <div className={`text-[10px] font-black uppercase tracking-[0.24em] md:text-xs md:tracking-[0.28em] ${displayAd.accent || "text-zoop-moss"}`}>
            Zoop visibility
          </div>
          <p className={`max-w-2xl font-black leading-[1.06] ${type === "sidebar" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl md:text-3xl lg:text-[2rem] xl:text-4xl"}`}>
            {displayAd.title}
          </p>
          {displayAd.description && (
            <p className={`max-w-2xl text-xs text-white/82 sm:text-sm md:text-base ${type === "sidebar" ? "line-clamp-4" : "line-clamp-3"}`}>
              {displayAd.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 md:gap-3">
            <span className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#111111] transition-transform group-hover:translate-x-1 md:px-5 md:py-2.5 md:text-xs md:tracking-[0.2em]">
              {displayAd.cta || "Explore now"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 md:text-xs md:tracking-[0.22em]">
              Built for mobile and desktop
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
