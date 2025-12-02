import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
    "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
  ];

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]", className)}>
      <svg className="absolute inset-0 h-full w-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.4)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </linearGradient>
        </defs>
        {paths.map((path, idx) => (
          <motion.path
            key={idx}
            d={path}
            stroke="url(#beam-gradient)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: idx * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}
