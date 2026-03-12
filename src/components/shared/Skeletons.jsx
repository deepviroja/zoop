import React from "react";

export const Skeleton = ({
  className,
  width,
  height,
  variant = "rect", // rect, circle, text
}) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-white/20";
  const variantClasses = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white dark:glass-card rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] p-3">
      <div className="aspect-4-5 bg-gray-200 dark:bg-white/20 rounded-xl mb-3 animate-pulse relative">
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/50"></div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-2/3 animate-pulse"></div>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-white/20 rounded w-1/2 animate-pulse"></div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-gray-200 dark:bg-white/20 rounded w-1/3 animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-white/20 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export const ProductListSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6 max-w-[1600px] mx-auto">
      <Skeleton className="w-full h-12 mb-6" />
      <div className="flex gap-6">
        <Skeleton className="hidden lg:block w-64 h-[500px]" />
        <div className="flex-1">
          <ProductListSkeleton />
        </div>
      </div>
    </div>
  );
};

export const ProductDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-white dark:glass-card">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Gallery Skeleton */}
          <div className="flex-1 space-y-4">
            <Skeleton className="w-full aspect-4-5 rounded-2xl" />
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-xl" />
              <Skeleton className="w-20 h-20 rounded-xl" />
              <Skeleton className="w-20 h-20 rounded-xl" />
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="flex-1 space-y-6">
            <Skeleton className="w-1/3 h-6" variant="text" />
            <Skeleton className="w-3/4 h-10" variant="text" />
            <div className="flex gap-4 items-center">
              <Skeleton className="w-32 h-8" />
              <Skeleton className="w-24 h-6" />
            </div>
            <Skeleton className="w-full h-32 rounded-xl" />
            <div className="space-y-4 pt-6">
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
