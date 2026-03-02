import React from "react";
import { ChevronLeft } from "../../assets/icons/ChevronLeft";
import { ChevronRight } from "../../assets/icons/ChevronRight";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisibleButtons = 5; // e.g., 1 ... 4 5 6 ... 10

    if (totalPages <= maxVisibleButtons + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Determine range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if near start
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      }
      // Adjust if near end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Add ellipsis before start if needed
      if (startPage > 2) {
        pages.push("...");
      }

      // Add range
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis after end if needed
      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="mt-12 flex flex-wrap justify-center items-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft width={16} height={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex flex-wrap justify-center gap-2">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold select-none"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zoop-moss/50 ${
                currentPage === page
                  ? "bg-zoop-moss text-zoop-obsidian shadow-md transform scale-105"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent hover:bg-gray-100 transition-colors"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight width={16} height={16} />
      </button>
    </div>
  );
};

export default Pagination;
