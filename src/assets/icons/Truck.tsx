import React from 'react';

interface TruckProps {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export const Truck: React.FC<TruckProps> = ({ 
  width = 24, 
  height = 24, 
  stroke = "currentColor",
  className = "",
  ...props 
}) => (
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
    className={`truck-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes truck-drive {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        
        @keyframes wheel-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        
        @keyframes truck-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        .truck-icon:hover .truck-body {
          animation: truck-drive 1s ease-in-out infinite, truck-bounce 0.5s ease-in-out infinite;
        }
        
        .truck-icon:hover .wheel {
          animation: wheel-spin 1s linear infinite;
          transform-origin: center;
        }
      `}
    </style>
    
    <g className="truck-body">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    </g>
    <circle 
      className="wheel"
      cx="5.5" 
      cy="18.5" 
      r="2.5" 
    />
    <circle 
      className="wheel"
      cx="18.5" 
      cy="18.5" 
      r="2.5" 
    />
  </svg>
);
