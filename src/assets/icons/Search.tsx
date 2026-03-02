export const Search = ({ width = 24, height = 24, className = "", ...props }: { width?: number; height?: number; className?: string; [key: string]: any }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`search-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes search-zoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        
        @keyframes handle-rotate {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-10deg); }
        }
        
        @keyframes scan-pulse {
          0%, 100% { opacity: 1; stroke-width: 2; }
          50% { opacity: 0.6; stroke-width: 3; }
        }
        
        .search-icon:hover .search-circle {
          animation: search-zoom 1s ease-in-out infinite, scan-pulse 2s ease-in-out infinite;
          transform-origin: center;
        }
        
        .search-icon:hover .search-handle {
          animation: handle-rotate 1s ease-in-out infinite;
          transform-origin: 17.5px 17.5px;
        }
      `}
    </style>
    <circle className="search-circle" cx="11" cy="11" r="8" />
    <path className="search-handle" d="m21 21-4.35-4.35" />
  </svg>
);
