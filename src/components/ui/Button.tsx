import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn.ts";

// Props reutilizables para nuestro botón
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "ghost";
}

// Componente Button reutilizable
export function Button({
  children,
  variant = "default",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Estilos base del botón
        "inline-flex items-center justify-center rounded-md transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[#00A8CC]/30",

        // Variante principal
        variant === "default" &&
          "bg-[#00A8CC] text-white hover:bg-[#008B9B]",

        // Variante transparente para botones del Sidebar
        variant === "ghost" &&
          "bg-transparent text-[#6B7C8A] hover:bg-[#E8F8FB] hover:text-[#00A8CC]",

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}