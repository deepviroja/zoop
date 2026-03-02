"use client";

import { motion, useAnimation } from "motion/react";

const ClipboardList = ({
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
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <motion.path
                    d="M12 11h4"
                    variants={{ normal: { pathLength: 1 }, animate: { pathLength: [0, 1] } }}
                    animate={controls}
                />
                <motion.path
                    d="M12 16h4"
                    variants={{ normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { delay: 0.1 } } }}
                    animate={controls}
                />
                <motion.path
                    d="M8 11h.01"
                    variants={{ normal: { scale: 1 }, animate: { scale: [0, 1.5, 1] } }}
                    animate={controls}
                />
                <motion.path
                    d="M8 16h.01"
                    variants={{ normal: { scale: 1 }, animate: { scale: [0, 1.5, 1], transition: { delay: 0.1 } } }}
                    animate={controls}
                />
            </svg>
        </div>
    );
};

export { ClipboardList };
