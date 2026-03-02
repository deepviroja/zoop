export const Home = ({ width = 24, height = 24, stroke = "currentColor", fill = "none", className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`home-icon ${className}`}
  >
    <style>
      {`
        @keyframes home-welcome {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes door-swing {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.95); }
        }
        
        @keyframes roof-shine {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .home-icon:hover .house-body {
          animation: home-welcome 1.5s ease-in-out infinite;
          transform-origin: center bottom;
        }
        
        .home-icon:hover .house-door {
          animation: door-swing 1s ease-in-out infinite;
          transform-origin: center;
        }
      `}
    </style>
    <path className="house-body" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline className="house-door" points="9 22 9 12 15 12 15 22" />
  </svg>
);
