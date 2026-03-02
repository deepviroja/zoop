"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const cartVariants: Variants = {
    normal: { scale: 1 },
    animate: { scale: [1, 1.1, 1], transition: { duration: 0.5 } },
};

const wheelVariants: Variants = {
    normal: { rotate: 0 },
    animate: { rotate: 360, transition: { duration: 0.5, ease: "linear" } },
};

const ShoppingCart = ({
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
                <motion.g variants={cartVariants} animate={controls}>
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </motion.g>
            </svg>
        </div>
    );
};

export { ShoppingCart };
