import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
}

export function ShimmerButton({
  children,
  shimmerColor = "#ffffff",
  shimmerSize = "0.05em",
  borderRadius = "0.5rem",
  shimmerDuration = "3s",
  background = "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(168, 85, 247, 1))",
  className,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--border-radius": borderRadius,
          "--shimmer-duration": shimmerDuration,
          "--background": background,
        } as React.CSSProperties
      }
      className={cn(
        "group relative overflow-hidden rounded-[--border-radius] px-6 py-2.5 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_var(--shimmer-duration)_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-[var(--shimmer-color)] before:to-transparent",
        "before:opacity-30",
        className
      )}
      style={{
        background: "var(--background)",
      }}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
