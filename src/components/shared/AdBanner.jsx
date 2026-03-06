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
      ? "group relative block rounded-[1.9rem] overflow-hidden aspect-[4/5] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_20px_50px_rgba(42,32,15,0.14)]"
      : "group relative block rounded-[1.9rem] overflow-hidden min-h-[210px] md:min-h-[280px] border border-[#ddd3c2] bg-[#f9f4ea] shadow-[0_20px_50px_rgba(42,32,15,0.14)] my-6";

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
      <div className="absolute -right-10 top-6 h-28 w-28 rounded-full border border-white/20 bg-white/10 blur-md" />
      <div className="absolute bottom-[-20%] right-[-5%] h-40 w-40 rounded-full bg-[#b7e84b]/20 blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/88 via-[#111111]/48 to-transparent" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,_rgba(183,232,75,0.5),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,214,153,0.28),_transparent_28%)]" />
      <div className="absolute left-4 right-4 top-4 bottom-4 flex flex-col justify-between text-white md:left-8 md:right-8 md:top-7 md:bottom-7">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] backdrop-blur">
            {isFallback ? "Featured" : "Sponsored"}
          </span>
          <span className="hidden sm:inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur">
            {slotId.replace(/_/g, " ")}
          </span>
        </div>
        <div className="max-w-[34rem] space-y-3">
          <div className={`text-xs font-black uppercase tracking-[0.28em] ${displayAd.accent || "text-zoop-moss"}`}>
            Zoop visibility
          </div>
          <p className="max-w-2xl text-2xl font-black leading-[1.05] md:text-4xl">
            {displayAd.title}
          </p>
          {displayAd.description && (
            <p className="max-w-2xl text-sm text-white/82 md:text-base line-clamp-3">
              {displayAd.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="inline-flex w-fit rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-[#111111] transition-transform group-hover:translate-x-1">
              {displayAd.cta || "Explore now"}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
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
