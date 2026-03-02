"use client";

import { motion, useAnimation } from "motion/react";

const Wallet = ({
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
                    d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h1.5"
                    variants={{
                        normal: { y: 0 },
                        animate: { y: -2 }
                    }}
                    animate={controls}
                />
                <rect x="3" y="8" width="18" height="13" rx="2" />
                <motion.path
                    d="M16 14h.01"
                    variants={{
                        normal: { scale: 1 },
                        animate: { scale: [1, 1.5, 1] }
                    }}
                    animate={controls}
                />
            </svg>
        </div>
    );
};

export { Wallet };
