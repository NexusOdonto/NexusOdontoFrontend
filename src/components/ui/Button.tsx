import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn.ts";

type ButtonVariant = "primary" | "secondary" | "ghost" | "default";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "default",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const activeVariant = variant === "default" ? "primary" : variant;

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-200",
        "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-teal-600 hover:bg-teal-500 text-white": activeVariant === "primary",
          "bg-slate-700 hover:bg-slate-600 text-white": activeVariant === "secondary",
          "bg-transparent hover:bg-slate-800 text-slate-300": activeVariant === "ghost",

          "h-10 px-4 text-sm rounded-xl": size === "default",
          "h-9 px-3 text-sm rounded-lg": size === "sm",
          "h-11 px-6 text-base rounded-xl": size === "lg",
          "h-10 w-10 p-0 rounded-xl": size === "icon",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}