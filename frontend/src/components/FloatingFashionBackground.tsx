"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shirt, Glasses, Watch, ShoppingBag, Diamond, Footprints, Crown } from "lucide-react";

// # Step 2: The Fashion Asset Configuration
// Each item is assigned a distinct "zone" on the screen (Top-Left, Mid-Right, etc.)
// with limited drift to ensure they never collide.
const floatingItems = [
    {
        id: "item-1",
        icon: Shirt,
        initialX: "15%", // Top-Left
        initialY: "15%",
        scale: 1.2,
        opacity: 0.15,
        animationDuration: 22,
        yDrift: -30,
        xDrift: 20,
        rotate: 10,
    },
    {
        id: "item-2",
        icon: Glasses,
        initialX: "80%", // Top-Right
        initialY: "20%",
        scale: 1.5,
        opacity: 0.2,
        animationDuration: 28,
        yDrift: 40,
        xDrift: -30,
        rotate: -15,
    },
    {
        id: "item-4",
        icon: ShoppingBag,
        initialX: "10%", // Mid-Left
        initialY: "50%",
        scale: 1.3,
        opacity: 0.1,
        animationDuration: 25,
        yDrift: 50,
        xDrift: -20,
        rotate: -10,
    },
    {
        id: "item-5",
        icon: Diamond,
        initialX: "85%", // Mid-Right
        initialY: "50%",
        scale: 0.9,
        opacity: 0.2,
        animationDuration: 30,
        yDrift: -40,
        xDrift: 30,
        rotate: 15,
    },
    {
        id: "item-3",
        icon: Watch,
        initialX: "20%", // Bottom-Left
        initialY: "85%",
        scale: 1.1,
        opacity: 0.25,
        animationDuration: 18,
        yDrift: -50,
        xDrift: 40,
        rotate: 20,
    },
    {
        id: "item-6",
        icon: Footprints,
        initialX: "75%", // Bottom-Right
        initialY: "80%",
        scale: 1.4,
        opacity: 0.15,
        animationDuration: 20,
        yDrift: 30,
        xDrift: -40,
        rotate: -20,
    },
    {
        id: "item-7",
        icon: Crown,
        initialX: "calc(50% - 60px)", // True Center for 120px icon
        initialY: "calc(50% - 60px)",
        scale: 1.6,
        opacity: 0.1,
        animationDuration: 24,
        yDrift: -60,  // Float noticeably higher
        xDrift: 40,   // Drift further right
        rotate: 15,
    },
];

export default function FloatingFashionBackground() {
    return (
        // # Step 1: The Container & Glow Layers
        <div className="fixed inset-0 z-[-10] overflow-hidden bg-background pointer-events-none">
            {/* Glow Orbs */}
            <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-[#ff4d4d]/20 rounded-full blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-rose-600/20 rounded-full blur-[120px] mix-blend-screen" />

            {/* # Step 3: Framer Motion Floating Physics */}
            {floatingItems.map((item, index) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={item.id}
                        className="absolute text-on-surface"
                        style={{
                            left: item.initialX,
                            top: item.initialY,
                            scale: item.scale,
                            opacity: item.opacity,
                        }}
                        animate={{
                            y: [0, item.yDrift, 0], // Drifts much higher/lower
                            x: [0, item.xDrift, 0],  // Sweeps left/right
                            rotate: [0, item.rotate, -item.rotate * 0.5, 0], // Bigger spin
                        }}
                        transition={{
                            duration: item.animationDuration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.5, // stagger start times slightly
                        }}
                    >
                        <Icon size={120} strokeWidth={1} />
                    </motion.div>
                );
            })}
        </div>
    );
}
