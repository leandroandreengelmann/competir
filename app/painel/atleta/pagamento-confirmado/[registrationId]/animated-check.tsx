"use client"

import * as React from "react"
import { motion } from "framer-motion"

export function AnimatedCheckIcon() {
    return (
        <div className="relative flex items-center justify-center w-32 h-32" aria-label="Pagamento confirmado">
            {/* Fase 3: Ring de fundo / Glow (Blur) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.2, scale: 1.15 }}
                transition={{
                    delay: 1.2,
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="absolute inset-0 bg-success rounded-full blur-xl"
            />

            <motion.svg
                viewBox="0 0 100 100"
                className="w-full h-full relative z-10 drop-shadow-sm"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{
                    delay: 1.2,
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Fase 1: Ring de progresso (Stroke Draw) */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="text-success/20"
                />

                <motion.circle
                    cx="50"
                    cy="50"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="text-success"
                    initial={{ pathLength: 0, opacity: 0, rotate: -90 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        duration: 0.7,
                        ease: "easeInOut",
                    }}
                    style={{ originX: "50%", originY: "50%" }}
                />

                {/* Fase 2: Checkmark (Stroke Draw) */}
                <motion.path
                    d="M30 52L44 66L70 34"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-success"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        delay: 0.6,
                        duration: 0.6,
                        ease: "easeOut"
                    }}
                />
            </motion.svg>

            {/* Fase 3: Micro animação de scale (Spring) */}
            <motion.div
                className="absolute inset-0 rounded-full border-4 border-success/30"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 1.05, 1], opacity: [0, 1, 0] }}
                transition={{
                    delay: 1.1,
                    duration: 0.8,
                    ease: "easeOut"
                }}
            />
        </div>
    )
}
