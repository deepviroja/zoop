import React from 'react';

interface MapPinProps {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export const MapPin: React.FC<MapPinProps> = ({ 
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
    className={`mappin-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes pin-drop {
          0% { transform: translateY(-10px); opacity: 0; }
          50% { transform: translateY(0); opacity: 1; }
          65% { transform: translateY(-3px); }
          80% { transform: translateY(0); }
          90% { transform: translateY(-1px); }
          100% { transform: translateY(0); }
        }
        
        @keyframes pin-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        
        @keyframes location-ping {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        .mappin-icon:hover .pin-body {
          animation: pin-drop 1s ease-out;
        }
        
        .mappin-icon:hover .pin-center {
          animation: pin-pulse 1.5s ease-in-out infinite;
          transform-origin: center;
        }
      `}
    </style>
    
    <path 
      className="pin-body"
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" 
    />
    <circle 
      className="pin-center"
      cx="12" 
      cy="10" 
      r="3" 
    />
  </svg>
);
