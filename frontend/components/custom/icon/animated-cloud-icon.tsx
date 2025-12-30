"use client"

import { motion } from "framer-motion"

interface AnimatedCloudIconProps {
    size?: number
    className?: string
}

export const AnimatedCloudIcon = ({ size = 40, className = "" }: AnimatedCloudIconProps) => {
    // Lightning bolt path segments for realistic electricity
    const lightningPath1 = "M45 18 L42 28 L48 28 L40 42 L46 42 L35 58"
    const lightningPath2 = "M60 15 L57 25 L62 25 L55 38 L60 38 L52 52"
    const lightningPath3 = "M75 22 L72 30 L77 30 L70 42"

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <svg
                viewBox="0 0 100 70"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                {/* Gradient definitions */}
                <defs>
                    {/* Subtle cloud gradient - more transparent for contrast */}
                    <linearGradient id="cloudGradientSubtle" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="50%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>

                    {/* Cloud outline gradient */}
                    <linearGradient id="cloudOutline" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#334155" />
                    </linearGradient>

                    {/* Electric/lightning gradient - bright cyan to white */}
                    <linearGradient id="electricBolt" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="30%" stopColor="#67e8f9" />
                        <stop offset="70%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>

                    {/* Strong glow filter for lightning */}
                    <filter id="electricGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="3" result="blur1" />
                        <feGaussianBlur stdDeviation="6" result="blur2" />
                        <feMerge>
                            <feMergeNode in="blur2" />
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Extra strong glow for main bolt */}
                    <filter id="mainBoltGlow" x="-150%" y="-150%" width="400%" height="400%">
                        <feGaussianBlur stdDeviation="2" result="blur1" />
                        <feGaussianBlur stdDeviation="4" result="blur2" />
                        <feGaussianBlur stdDeviation="8" result="blur3" />
                        <feMerge>
                            <feMergeNode in="blur3" />
                            <feMergeNode in="blur2" />
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Particle glow */}
                    <filter id="particleGlow" x="-200%" y="-200%" width="500%" height="500%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Cloud shape - darker/more subtle */}
                <motion.path
                    d="M80 55H25C14 55 5 46 5 35C5 24 14 15 25 15C26 15 27 15 28 15.2C32 8 40 3 50 3C63 3 74 12 77 24C78 24 79 24 80 24C90 24 98 32 98 42C98 52 90 55 80 55Z"
                    fill="url(#cloudGradientSubtle)"
                    stroke="url(#cloudOutline)"
                    strokeWidth="1"
                    initial={{ opacity: 0.85 }}
                    animate={{ opacity: [0.85, 0.95, 0.85] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Main lightning bolt 1 - center, largest */}
                <motion.path
                    d={lightningPath1}
                    stroke="url(#electricBolt)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    filter="url(#mainBoltGlow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 0],
                        opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeOut",
                        times: [0, 0.15, 0.5, 0.7],
                        repeatDelay: 0.8
                    }}
                />

                {/* Lightning bolt 1 - white core */}
                <motion.path
                    d={lightningPath1}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 0],
                        opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeOut",
                        times: [0, 0.15, 0.5, 0.7],
                        repeatDelay: 0.8
                    }}
                />

                {/* Lightning bolt 2 - right side */}
                <motion.path
                    d={lightningPath2}
                    stroke="url(#electricBolt)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    filter="url(#electricGlow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 0],
                        opacity: [0, 0.9, 0.9, 0],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeOut",
                        times: [0, 0.2, 0.5, 0.7],
                        delay: 0.5,
                        repeatDelay: 1
                    }}
                />

                {/* Lightning bolt 3 - small right */}
                <motion.path
                    d={lightningPath3}
                    stroke="#67e8f9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    filter="url(#electricGlow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 0],
                        opacity: [0, 0.8, 0.8, 0],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeOut",
                        times: [0, 0.2, 0.5, 0.7],
                        delay: 1,
                        repeatDelay: 1.2
                    }}
                />

                {/* Electric arc connecting bolts */}
                <motion.path
                    d="M38 35 Q50 30 58 35"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#electricGlow)"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [0, 0.7, 0],
                        pathLength: [0, 1, 1]
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.3,
                        repeatDelay: 1.5
                    }}
                />

                {/* Spark particles at lightning endpoints */}
                {[
                    { cx: 35, cy: 58, delay: 0.18, size: 3 },
                    { cx: 52, cy: 52, delay: 0.65, size: 2.5 },
                    { cx: 70, cy: 42, delay: 1.15, size: 2 },
                ].map((spark, index) => (
                    <motion.circle
                        key={`spark-${index}`}
                        cx={spark.cx}
                        cy={spark.cy}
                        r={spark.size}
                        fill="#ffffff"
                        filter="url(#particleGlow)"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.5, 1, 0],
                        }}
                        transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: spark.delay,
                            repeatDelay: 1.6
                        }}
                    />
                ))}

                {/* Floating energy particles */}
                {[
                    { cx: 30, cy: 40, delay: 0.2 },
                    { cx: 65, cy: 35, delay: 0.6 },
                    { cx: 48, cy: 25, delay: 1 },
                    { cx: 78, cy: 38, delay: 1.4 },
                ].map((particle, index) => (
                    <motion.circle
                        key={`particle-${index}`}
                        cx={particle.cx}
                        cy={particle.cy}
                        r="1.5"
                        fill="#67e8f9"
                        filter="url(#particleGlow)"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            y: [0, -12],
                            scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: particle.delay,
                        }}
                    />
                ))}

                {/* Central energy pulse */}
                <motion.circle
                    cx="50"
                    cy="35"
                    r="4"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1"
                    filter="url(#electricGlow)"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                        opacity: [0, 0.6, 0],
                        scale: [0.5, 2, 2.5],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.2
                    }}
                />
            </svg>
        </div>
    )
}

export default AnimatedCloudIcon
