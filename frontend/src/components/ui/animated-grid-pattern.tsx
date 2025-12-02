import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AnimatedGridPatternProps {
  width?: number;
  height?: number;
  numSquares?: number;
  maxOpacity?: number;
  duration?: number;
  className?: string;
}

export function AnimatedGridPattern({ width = 40, height = 40, numSquares = 50, maxOpacity = 0.5, duration = 4, className }: AnimatedGridPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const squares = Array.from({ length: numSquares }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      opacity: Math.random() * maxOpacity,
      delay: Math.random() * duration,
    }));

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      squares.forEach((square) => {
        const progress = ((elapsed + square.delay) % duration) / duration;
        const opacity = Math.sin(progress * Math.PI) * square.opacity;

        ctx.fillStyle = `rgba(139, 92, 246, ${opacity})`;
        ctx.fillRect(square.x, square.y, width, height);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height, numSquares, maxOpacity, duration]);

  return <canvas ref={canvasRef} width={2000} height={2000} className={cn("pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent_85%)]", className)} />;
}
