import React from 'react';

interface MessageCircleProps {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export const MessageCircle: React.FC<MessageCircleProps> = ({ 
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
    className={`message-icon ${className}`}
    {...props}
  >
    <style>
      {`
        @keyframes message-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.05); }
        }
        
        @keyframes dots-typing {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes bubble-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .message-icon:hover .message-bubble {
          animation: message-bounce 1s ease-in-out infinite;
        }
        
        .message-icon:hover .dot-1 {
          animation: dots-typing 1.4s ease-in-out infinite;
        }
        
        .message-icon:hover .dot-2 {
          animation: dots-typing 1.4s ease-in-out 0.2s infinite;
        }
        
        .message-icon:hover .dot-3 {
          animation: dots-typing 1.4s ease-in-out 0.4s infinite;
        }
      `}
    </style>
    
    {/* Message bubble */}
    <path 
      className="message-bubble"
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
    />
    
    {/* Typing dots */}
    <g opacity="0.7">
      <circle className="dot-1" cx="9" cy="11" r="1" fill={stroke} />
      <circle className="dot-2" cx="12" cy="11" r="1" fill={stroke} />
      <circle className="dot-3" cx="15" cy="11" r="1" fill={stroke} />
    </g>
  </svg>
);
