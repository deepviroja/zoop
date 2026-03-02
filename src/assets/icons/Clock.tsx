export const Clock = ({ width = 24, height = 24, stroke = "currentColor", className = "" }) => (
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
    className={`clock-icon ${className}`}
  >
    <style>
      {`
        @keyframes clock-tick {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(6deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(-6deg); }
        }
        
        @keyframes minute-hand {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes hour-hand {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(30deg); }
        }
        
        @keyframes clock-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        
        .clock-icon:hover circle {
          animation: clock-pulse 2s ease-in-out infinite;
          transform-origin: center;
        }
        
        .clock-icon:hover .clock-hands {
          animation: clock-tick 1s ease-in-out infinite;
          transform-origin: 12px 12px;
        }
      `}
    </style>
    <circle cx="12" cy="12" r="10" />
    <polyline className="clock-hands" points="12 6 12 12 16 14" />
  </svg>
);
