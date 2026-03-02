"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const Dress = ({
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
                    d="M8 2h8l2 6-2 1-2-1v12H10V8L8 9 6 8l2-6Z"
                    variants={{
                        normal: { scale: 1 },
                        animate: { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                    }}
                    animate={controls}
                />
            </svg>
        </div>
    );
};

export { Dress };
