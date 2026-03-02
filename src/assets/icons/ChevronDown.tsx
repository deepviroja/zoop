"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const ChevronDown = ({
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
                    d="m6 9 6 6 6-6"
                    variants={{
                        normal: { y: 0 },
                        animate: { y: [0, 2, 0] },
                    }}
                    animate={controls}
                />
            </svg>
        </div>
    );
};

export { ChevronDown };
