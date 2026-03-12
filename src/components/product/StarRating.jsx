import React from "react";

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z";

const SingleStar = ({ size, fillPercent }) => {
  const safe = Math.max(0, Math.min(100, fillPercent));
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path d={STAR_PATH} fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.6" />
      </svg>
      {safe > 0 && (
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${safe}%` }}>
          <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
            <path d={STAR_PATH} fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.6" />
          </svg>
        </span>
      )}
    </span>
  );
};

const StarRating = ({ rating = 0, totalReviews, size = 18 }) => {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const whole = Math.floor(safeRating);
  const fraction = safeRating - whole;

  return (
    <div className="inline-flex items-center gap-2" aria-label={`Rated ${safeRating.toFixed(1)} out of 5`}>
      <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1.5">
        {[0, 1, 2, 3, 4].map((index) => {
          let fillPercent = 0;
          if (index < whole) fillPercent = 100;
          if (index === whole) fillPercent = Math.round(fraction * 100);
          return <SingleStar key={index} size={size} fillPercent={fillPercent} />;
        })}
      </div>
      <div className="inline-flex items-center gap-1.5">
        <span className="text-sm font-black text-zoop-obsidian dark:text-white tabular-nums">{safeRating.toFixed(1)}</span>
        {totalReviews !== undefined && (
          <span className="text-xs font-medium text-gray-500 tabular-nums">
            ({Number(totalReviews || 0).toLocaleString()} reviews)
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;
