import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return <div className={cn("grid w-full auto-rows-[22rem] grid-cols-3 gap-4", className)}>{children}</div>;
}

interface BentoCardProps {
  name: string;
  className: string;
  background?: ReactNode;
  Icon?: any;
  description?: string;
  href?: string;
  cta?: string;
}

export function BentoCard({ name, className, background, Icon, description, href, cta }: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
        "bg-card border border-border/50 hover:border-primary/50",
        "transform-gpu transition-all duration-500 ease-out hover:shadow-2xl",
        className
      )}
    >
      <div>{background}</div>
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300">
        {Icon && <Icon className="h-12 w-12 origin-left transform-gpu text-primary transition-all duration-300 ease-in-out group-hover:scale-110" />}
        <h3 className="text-xl font-semibold text-foreground">{name}</h3>
        <p className="max-w-lg text-muted-foreground">{description}</p>
      </div>

      {href && (
        <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button className="pointer-events-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">{cta}</button>
        </div>
      )}
    </div>
  );
}
