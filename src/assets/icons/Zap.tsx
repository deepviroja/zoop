"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const Zap = ({
  width = 24,
  height = 24,
  stroke = "currentColor",
  fill = "none",
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
        <motion.polygon
          points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
          variants={{
            normal: { opacity: 1 },
            animate: {
              scale: [1, 1.1, 1],
              fill: ["rgba(0,0,0,0)", "rgba(255,215,0,0.5)", "rgba(0,0,0,0)"],
            },
          }}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { Zap };
