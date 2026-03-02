"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const Heart = ({
  width = 24,
  height = 24,
  stroke = "currentColor",
  ...props
}) => {
  const controls = useAnimation();

  return (
    <div
      style={{
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={() => controls.start("animate")}
      onMouseLeave={() => controls.start("normal")}
    >
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
        {...props}
      >
        <motion.path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          variants={{
            normal: { scale: 1 },
            animate: {
              scale: [1, 1.1, 1],
              fill: ["rgba(0,0,0,0)", "rgba(255,0,0,0.5)", "rgba(0,0,0,0)"],
            },
          }}
          transition={{ duration: 0.4 }}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { Heart };
