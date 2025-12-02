import { cn } from "@/lib/utils";
import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

interface TextRevealProps {
  text: string;
  className?: string;
}

export function TextReveal({ text, className }: TextRevealProps) {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div ref={ref} variants={container} initial="hidden" animate={controls} className={cn("flex flex-wrap", className)}>
      {words.map((word, idx) => (
        <motion.span variants={{ child }} key={idx} className="mr-2 inline-block">
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
