"use client";

import { motion, useAnimation } from "motion/react";

const FileText = ({
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
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <motion.path
                    d="M10 9H8"
                    variants={{ normal: { opacity: 1 }, animate: { opacity: [1, 0.5, 1] } }}
                    animate={controls}
                />
                <motion.path
                    d="M16 13H8"
                    variants={{ normal: { opacity: 1 }, animate: { opacity: [1, 0.5, 1], transition: { delay: 0.1 } } }}
                    animate={controls}
                />
                <motion.path
                    d="M16 17H8"
                    variants={{ normal: { opacity: 1 }, animate: { opacity: [1, 0.5, 1], transition: { delay: 0.2 } } }}
                    animate={controls}
                />
            </svg>
        </div>
    );
};

export { FileText };
