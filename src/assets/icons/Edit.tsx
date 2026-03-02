export const Edit = ({ width = 24, height = 24, stroke = "currentColor", className = "" }) => (
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
    className={`edit-icon ${className}`}
  >
    <style>
      {`
        @keyframes pencil-write {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1px, -1px) rotate(-5deg); }
          50% { transform: translate(1px, 1px) rotate(5deg); }
          75% { transform: translate(-1px, 1px) rotate(-3deg); }
        }
        
        @keyframes paper-shake {
          0%, 100% { transform: translateX(0); }
          25%, 75% { transform: translateX(-1px); }
          50% { transform: translateX(1px); }
        }
        
        .edit-icon:hover .pencil {
          animation: pencil-write 1s ease-in-out infinite;
          transform-origin: 18px 3px;
        }
        
        .edit-icon:hover .paper {
          animation: paper-shake 0.5s ease-in-out infinite;
        }
      `}
    </style>
    <path className="paper" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path className="pencil" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
