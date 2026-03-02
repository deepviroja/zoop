import React from 'react';

interface StoreProps {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export const Store: React.FC<StoreProps> = ({ 
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
    className={`store-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes store-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes door-open {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.9); }
        }
        
        @keyframes roof-shine {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .store-icon:hover .store-body {
          animation: store-bounce 1s ease-in-out infinite;
        }
        
        .store-icon:hover .store-door {
          animation: door-open 1.2s ease-in-out infinite;
          transform-origin: center;
        }
      `}
    </style>
    
    <g className="store-body">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </g>
    <polyline 
      className="store-door"
      points="9 22 9 12 15 12 15 22" 
    />
  </svg>
);
