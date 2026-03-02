import React from 'react';

interface LogOutProps {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export const LogOut: React.FC<LogOutProps> = ({ 
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
    className={`logout-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes door-swing {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-3px); }
        }
        
        @keyframes arrow-slide {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(5px); opacity: 0.6; }
        }
        
        .logout-icon:hover .door {
          animation: door-swing 0.8s ease-in-out infinite;
        }
        
        .logout-icon:hover .arrow {
          animation: arrow-slide 1s ease-in-out infinite;
        }
      `}
    </style>
    
    <path 
      className="door"
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" 
    />
    <g className="arrow">
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </g>
  </svg>
);
