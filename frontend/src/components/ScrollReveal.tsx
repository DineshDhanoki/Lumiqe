"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScrollRevealProps {
    children: React.ReactNode;
    delay?: number;
    width?: "fit-content" | "100%";
}

const scrollRevealVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
};

const ScrollReveal = React.memo(function ScrollReveal({
    children,
    delay = 0,
    width = "100%",
}: ScrollRevealProps) {
    return (
        <div style={{ width }} className="overflow-hidden">
            <motion.div
                variants={scrollRevealVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
            >
                {children}
            </motion.div>
        </div>
    );
});

export default ScrollReveal;
