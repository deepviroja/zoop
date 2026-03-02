export const Filter = ({ width = 24, height = 24, stroke = "currentColor", className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`filter-icon ${className}`}
  >
    <style>
      {`
        @keyframes filter-flow {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(3px); opacity: 0.7; }
        }
        
        @keyframes funnel-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }
        
        .filter-icon:hover polygon {
          animation: filter-flow 1.5s ease-in-out infinite, funnel-shake 2s ease-in-out infinite;
          transform-origin: center;
        }
      `}
    </style>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
