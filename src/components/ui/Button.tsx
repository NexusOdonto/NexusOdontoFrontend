import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn.ts";

type ButtonVariant = "default" | "ghost";

type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center",
        "transition-colors duration-200",
        "focus:outline-none",
        {
          "bg-[#00A8CC] text-white hover:bg-[#008B9B]":
            variant === "default",

          "bg-transparent hover:bg-[#EEF9FB]":
            variant === "ghost",

          "h-10 px-4": size === "default",
          "h-9 px-3 text-sm": size === "sm",
          "h-11 px-6": size === "lg",
          "h-10 w-10 p-0": size === "icon",
        },
        className
      )}
      {...props}
    />
  );
}