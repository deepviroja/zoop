import React from 'react';

interface PhoneProps {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export const Phone: React.FC<PhoneProps> = ({ 
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
    className={`phone-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes phone-ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-15deg); }
          20%, 40% { transform: rotate(15deg); }
          50% { transform: rotate(0deg); }
        }
        
        @keyframes signal-pulse {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        .phone-icon:hover .phone-body {
          animation: phone-ring 2s ease-in-out infinite;
          transform-origin: center;
        }
        
        .phone-icon:hover .phone-signal {
          animation: signal-pulse 1.5s ease-in-out infinite;
        }
      `}
    </style>
    
    {/* Phone body */}
    <path 
      className="phone-body"
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
    />
    
    {/* Signal waves */}
    <g className="phone-signal" opacity="0.6">
      <circle cx="18" cy="6" r="1" fill={stroke} />
      <circle cx="20" cy="4" r="0.8" fill={stroke} />
      <circle cx="16" cy="4" r="0.8" fill={stroke} />
    </g>
  </svg>
);
