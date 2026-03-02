import React from 'react';

interface CheckCircleProps {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export const CheckCircle: React.FC<CheckCircleProps> = ({ 
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
    className={`check-circle-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes check-draw {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes circle-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes success-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .check-circle-icon:hover .check-mark {
          animation: check-draw 0.6s ease-out forwards;
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
        }
        
        .check-circle-icon:hover .circle-path {
          animation: success-pulse 1s ease-in-out infinite;
          transform-origin: center;
        }
      `}
    </style>
    
    <path 
      className="circle-path"
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14" 
    />
    <polyline 
      className="check-mark"
      points="22 4 12 14.01 9 11.01" 
    />
  </svg>
);
