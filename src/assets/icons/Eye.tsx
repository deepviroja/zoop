export const Eye = ({ width = 24, height = 24, stroke = "currentColor", className = "" }) => (
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
    className={`eye-icon ${className}`}
  >
    <style>
      {`
        @keyframes eye-blink {
          0%, 90%, 100% { transform: scaleY(1); opacity: 1; }
          95% { transform: scaleY(0.1); opacity: 0.5; }
        }
        
        @keyframes pupil-look {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(1px, -1px); }
          50% { transform: translate(-1px, 0); }
          75% { transform: translate(0, 1px); }
        }
        
        @keyframes iris-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .eye-icon:hover .eye-shape {
          animation: eye-blink 3s ease-in-out infinite;
          transform-origin: center;
        }
        
        .eye-icon:hover .pupil {
          animation: pupil-look 2s ease-in-out infinite, iris-pulse 1.5s ease-in-out infinite;
          transform-origin: center;
        }
      `}
    </style>
    <path className="eye-shape" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle className="pupil" cx="12" cy="12" r="3" />
  </svg>
);
