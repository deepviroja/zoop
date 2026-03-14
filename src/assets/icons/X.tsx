"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const X = ({
    width = 24,
    height = 24,
    stroke = "currentColor",
    ...props
}) => {
    const controls = useAnimation();

    return (
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
            onMouseEnter={() => controls.start("animate")}
            onMouseLeave={() => controls.start("normal")}
            {...props}
        >
            <motion.path
                d="M18 6 6 18"
                variants={{
                    normal: { rotate: 0 },
                    animate: { rotate: 90 }
                }}
                animate={controls}
                style={{ originX: "50%", originY: "50%" }}
            />
            <motion.path
                d="m6 6 12 12"
                variants={{
                    normal: { rotate: 0 },
                    animate: { rotate: -90 }
                }}
                animate={controls}
                style={{ originX: "50%", originY: "50%" }}
            />
        </svg>
    );
};

export { X };
