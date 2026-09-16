import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DeleteButtonProps {
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  title?: string;
}

export function DeleteButton({
  onConfirm,
  onCancel,
  className,
  size = "md",
  disabled = false,
  title = "Eliminar",
}: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          setIsOpen(false);
          onCancel?.();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCancel]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        onCancel?.();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isProcessing) return;
    if (!isOpen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      onCancel?.();
    }
  };

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isProcessing) return;
    setIsProcessing(true);
    setIsConfirmed(true);
    try {
      await onConfirm();
    } finally {
      setTimeout(() => {
        setIsConfirmed(false);
        setIsProcessing(false);
        setIsOpen(false);
      }, 500);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isProcessing) return;
    setIsOpen(false);
    onCancel?.();
  };

  // Dimensions based on size prop
  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  const paddingClass =
    size === "sm"
      ? "p-1.5"
      : size === "lg"
      ? "p-2.5"
      : "p-2";

  return (
    <div
      ref={containerRef}
      className={cn("inline-flex items-center select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "relative flex items-center rounded-2xl border transition-colors shadow-xs",
          isOpen
            ? "bg-slate-900 dark:bg-slate-950 border-rose-500/40 shadow-md shadow-rose-950/20"
            : "bg-slate-100 hover:bg-rose-50 dark:bg-slate-900/90 dark:hover:bg-rose-950/30 border-slate-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30"
        )}
      >
        {/* Main Bin Button / Indicator */}
        <button
          type="button"
          onClick={handleOpenClick}
          disabled={disabled || isProcessing}
          aria-label={title}
          title={isOpen ? "Cancelar eliminación" : title}
          className={cn(
            "flex items-center justify-center rounded-xl cursor-pointer transition-colors focus:outline-hidden",
            paddingClass,
            isOpen
              ? "text-rose-400"
              : "text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
          )}
        >
          {isConfirmed ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check size={iconSize} className="text-emerald-400" strokeWidth={2.5} />
            </motion.div>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Rare UI Animated Trash SVG */}
              <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
              >
                {/* Trash Lid (Animated lifting and tilting) */}
                <motion.g
                  animate={{
                    y: isOpen || isHovered ? -3 : 0,
                    rotate: isOpen || isHovered ? -14 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{ transformOrigin: "4px 6px" }}
                >
                  <path
                    d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.g>
                {/* Trash Body & Lines */}
                <path
                  d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="10"
                  y1="11"
                  x2="10"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="14"
                  y1="11"
                  x2="14"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </button>

        {/* Action Reveal Panel (Check & Cancel) */}
        <AnimatePresence>
          {isOpen && !isConfirmed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="flex items-center overflow-hidden pr-1 gap-1"
            >
              {/* Confirm Check Button */}
              <motion.button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                title="Confirmar eliminación"
                aria-label="Confirmar eliminación"
                className="p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 cursor-pointer transition-colors flex items-center justify-center shadow-xs"
              >
                <Check size={size === "sm" ? 12 : 14} strokeWidth={2.6} />
              </motion.button>

              {/* Cancel Cross Button */}
              <motion.button
                type="button"
                onClick={handleCancel}
                disabled={isProcessing}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                title="Cancelar"
                aria-label="Cancelar"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 cursor-pointer transition-colors flex items-center justify-center"
              >
                <X size={size === "sm" ? 12 : 14} strokeWidth={2.4} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
