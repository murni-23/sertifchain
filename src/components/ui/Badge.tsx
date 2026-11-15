import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "yellow" | "pink" | "mint" | "white" | "black" | "success" | "error";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({
  children,
  variant = "yellow",
  className,
  ...props
}: BadgeProps) {
  const variantClasses = {
    yellow: "bg-yellow text-slate-700",
    pink: "bg-pink text-[#81465d]",
    mint: "bg-mint text-[#28634d]",
    white: "bg-white text-slate-700",
    black: "bg-slate-700 text-white",
    success: "bg-mint text-[#28634d]",
    error: "bg-red-500 text-white",
  };

  return (
    <span
      className={cn("badge-brutal", variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
