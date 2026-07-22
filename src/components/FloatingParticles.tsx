import React, { useMemo } from "react";
import { motion } from "motion/react";

function FloatingParticles() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isMobile ? 6 : 10;

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 25 + 15),
      x: Math.floor((i * (100 / count)) + Math.random() * 8),
      delay: Math.floor(Math.random() * 4),
      duration: Math.floor(Math.random() * 8 + 14),
      type: i % 2 === 0 ? "balloon" : "bubble",
      color: i % 3 === 0 ? "bg-pink-300/35" : i % 3 === 1 ? "bg-indigo-300/35" : "bg-teal-300/35"
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {particles.map((p) => {
        if (p.type === "balloon") {
          return (
            <motion.div
              key={p.id}
              initial={{ y: "105vh", x: `${p.x}vw` }}
              animate={{
                y: "-10vh",
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut"
              }}
              className={`absolute rounded-t-full ${p.color} flex flex-col items-center will-change-transform`}
              style={{
                width: p.size,
                height: p.size * 1.3,
                borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%"
              }}
            >
              <div className="w-0.5 h-6 bg-gray-400/30 mt-auto translate-y-full"></div>
            </motion.div>
          );
        } else {
          return (
            <motion.div
              key={p.id}
              initial={{ y: "105vh", x: `${p.x}vw`, opacity: 0.2 }}
              animate={{
                y: "-10vh",
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "linear"
              }}
              className={`absolute rounded-full border border-white/30 shadow-xs ${p.color} will-change-transform`}
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

export default React.memo(FloatingParticles);
