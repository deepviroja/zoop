"use client";

import { motion, useAnimation, type Variants } from "motion/react";

const lineVariants: Variants = {
    normal: { rotate: 0, translateY: 0, opacity: 1 },
    animate: { opacity: 1 },
};

const Menu = ({
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
                <motion.line
                    x1="4" y1="12" x2="20" y2="12"
                    variants={{
                        normal: { scaleX: 1 },
                        animate: { scaleX: [1, 1.2, 1] }
                    }}
                    animate={controls}
                />
                <motion.line
                    x1="4" y1="6" x2="20" y2="6"
                    variants={{
                        normal: { translateY: 0 },
                        animate: { translateY: -2 }
                    }}
                    animate={controls}
                />
                <motion.line
                    x1="4" y1="18" x2="20" y2="18"
                    variants={{
                        normal: { translateY: 0 },
                        animate: { translateY: 2 }
                    }}
                    animate={controls}
                />
            </svg>
        </div>
    );
};

export { Menu };
