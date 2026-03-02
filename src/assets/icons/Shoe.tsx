"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const Shoe = ({
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
                    d="M4 16v-5.5C4 8.5 6 6 9.5 6S13 8 13 8l2 2 4 .5V16H4Z"
                    variants={{
                        normal: { x: 0 },
                        animate: { x: [0, 5, 0] }
                    }}
                    animate={controls}
                />
                <path d="M4 16h15a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
            </svg>
        </div>
    );
};

export { Shoe };
