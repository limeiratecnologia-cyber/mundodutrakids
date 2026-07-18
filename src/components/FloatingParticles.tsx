import React from "react";
import { motion } from "motion/react";

export default function FloatingParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 40 + 15,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15,
    type: i % 2 === 0 ? "balloon" : "bubble",
    color: i % 3 === 0 ? "bg-pink-300/40" : i % 3 === 1 ? "bg-indigo-300/40" : "bg-teal-300/40"
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => {
        if (p.type === "balloon") {
          return (
            <motion.div
              key={p.id}
              initial={{ y: "110vh", x: `${p.x}vw` }}
              animate={{
                y: "-10vh",
                x: [`${p.x}vw`, `${p.x + (Math.random() * 10 - 5)}vw`, `${p.x}vw`]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut"
              }}
              className={`absolute rounded-t-full ${p.color} flex flex-col items-center`}
              style={{
                width: p.size,
                height: p.size * 1.3,
                borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%"
              }}
            >
              {/* Balloon string */}
              <div className="w-0.5 h-8 bg-gray-400/40 mt-auto translate-y-full"></div>
            </motion.div>
          );
        } else {
          return (
            <motion.div
              key={p.id}
              initial={{ y: "110vh", x: `${p.x}vw`, opacity: 0.2 }}
              animate={{
                y: "-10vh",
                opacity: [0.2, 0.7, 0.2],
                scale: [1, 1.2, 0.8]
              }}
              transition={{
                duration: p.duration - 3,
                repeat: Infinity,
                delay: p.delay,
                ease: "linear"
              }}
              className={`absolute rounded-full border border-white/40 shadow-inner ${p.color}`}
              style={{
                width: p.size,
                height: p.size
              }}
            />
          );
        }
      })}
    </div>
  );
}
