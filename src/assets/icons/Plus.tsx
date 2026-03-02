export const Plus = ({ width = 24, height = 24, stroke = "currentColor", className = "" }) => (
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
    className={`plus-icon ${className}`}
  >
    <style>
      {`
        @keyframes plus-expand {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes plus-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(90deg); }
        }
        
        @keyframes line-glow {
          0%, 100% { opacity: 1; stroke-width: 2; }
          50% { opacity: 0.8; stroke-width: 3; }
        }
        
        .plus-icon:hover {
          animation: plus-rotate 0.3s ease-out forwards;
          transform-origin: center;
        }
        
        .plus-icon:hover line {
          animation: line-glow 1s ease-in-out infinite;
        }
      `}
    </style>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
