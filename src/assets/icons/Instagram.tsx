"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const Instagram = ({
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
                <motion.rect
                    x="2" y="2" width="20" height="20" rx="5" ry="5"
                    variants={{
                        normal: { scale: 1 },
                        animate: { scale: [1, 1.1, 1] }
                    }}
                    animate={controls}
                />
                <motion.path
                    d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
                    variants={{
                        normal: { rotate: 0 },
                        animate: { rotate: 360, transition: { duration: 0.5, ease: "linear" } }
                    }}
                    animate={controls}
                />
                <motion.line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
        </div>
    );
};

export { Instagram };
