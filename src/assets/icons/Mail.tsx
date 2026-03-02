import React from 'react';

interface MailProps {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export const Mail: React.FC<MailProps> = ({ 
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
    className={`mail-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes mail-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes envelope-open {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes letter-slide {
          0%, 100% { opacity: 0.8; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-1px); }
        }
        
        .mail-icon:hover .mail-body {
          animation: mail-float 1.5s ease-in-out infinite;
        }
        
        .mail-icon:hover .mail-flap {
          animation: envelope-open 1.5s ease-in-out infinite;
        }
        
        .mail-icon:hover .mail-letter {
          animation: letter-slide 2s ease-in-out infinite;
        }
      `}
    </style>
    
    {/* Mail body */}
    <rect 
      className="mail-body"
      x="3" 
      y="5" 
      width="18" 
      height="14" 
      rx="2"
    />
    
    {/* Mail flap */}
    <path 
      className="mail-flap"
      d="m3 7 9 6 9-6"
    />
    
    {/* Letter lines (decorative) */}
    <g className="mail-letter" opacity="0.5">
      <line x1="7" y1="11" x2="11" y2="11" strokeWidth="1.5" />
      <line x1="7" y1="14" x2="14" y2="14" strokeWidth="1.5" />
    </g>
  </svg>
);
