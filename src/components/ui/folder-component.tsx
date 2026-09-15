import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

const themes = {
  black: {
    backFill: "#0f172a",
    backInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.37 0",
    backInsetShadow: "inset 0 0 8px 2px rgba(255,255,255,0.25)",
    flapFill: "#1e293b",
    flapFillOpacity: 0.65,
    flapStroke: "#475569",
    flapInsetColor: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0",
    cardFill: "#ffffff",
    cardStroke: "#cbd5e1",
    cardLineFill: "#e2e8f0",
    cardInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0",
    cardTextColor: "#0f172a",
    tagBg: "#0f172a",
    tagTextColor: "#ffffff",
    accentGlow: "rgba(15, 23, 42, 0.2)",
  },
  white: {
    backFill: "#f8fafc",
    backInsetColor: "0 0 0 0 0.7 0 0 0 0 0.7 0 0 0 0 0.7 0 0 0 0.25 0",
    backInsetShadow: "inset 0 0 8px 2px rgba(148,163,184,0.3)",
    flapFill: "#e2e8f0",
    flapFillOpacity: 0.85,
    flapStroke: "#94a3b8",
    flapInsetColor: "0 0 0 0 0.6 0 0 0 0 0.6 0 0 0 0 0.6 0 0 0 0.15 0",
    cardFill: "#1e293b",
    cardStroke: "#334155",
    cardLineFill: "#334155",
    cardInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0",
    cardTextColor: "#f8fafc",
    tagBg: "#06b6d4",
    tagTextColor: "#082f49",
    accentGlow: "rgba(6, 182, 212, 0.25)",
  },
  blue: {
    backFill: "#0284c7",
    backInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0",
    backInsetShadow: "inset 0 0 8px 2px rgba(255,255,255,0.4)",
    flapFill: "#38bdf8",
    flapFillOpacity: 0.55,
    flapStroke: "#7dd3fc",
    flapInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.12 0",
    cardFill: "#ffffff",
    cardStroke: "#bae6fd",
    cardLineFill: "#e0f2fe",
    cardInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0",
    cardTextColor: "#0369a1",
    tagBg: "#0284c7",
    tagTextColor: "#ffffff",
    accentGlow: "rgba(2, 132, 199, 0.3)",
  },
  teal: {
    backFill: "#0d9488",
    backInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0",
    backInsetShadow: "inset 0 0 8px 2px rgba(255,255,255,0.4)",
    flapFill: "#14b8a6",
    flapFillOpacity: 0.6,
    flapStroke: "#5eead4",
    flapInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0",
    cardFill: "#ffffff",
    cardStroke: "#99f6e4",
    cardLineFill: "#ccfbf1",
    cardInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0",
    cardTextColor: "#115e59",
    tagBg: "#0d9488",
    tagTextColor: "#ffffff",
    accentGlow: "rgba(13, 148, 136, 0.3)",
  },
} as const;

const sizeScales = {
  sm: 0.68,
  md: 1,
  lg: 1.35,
} as const;

export type FolderTheme = keyof typeof themes;
export type FolderSize = keyof typeof sizeScales;

export interface FolderComponentProps extends Omit<React.ComponentProps<"div">, "color"> {
  color?: FolderTheme;
  size?: FolderSize;
  title?: string;
  subtitle?: string;
  items?: { title?: string; tag?: string }[];
  onCardClick?: (index: number) => void;
}

const BASE_WIDTH = 321;
const BASE_HEIGHT = 270;

const FLAP_PATH =
  "M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z";

export const FolderComponent = ({
  color = "teal",
  size = "md",
  title,
  subtitle,
  items,
  onCardClick,
  className,
  ...props
}: FolderComponentProps) => {
  const theme = themes[color] ?? themes.teal;
  const scale = sizeScales[size] ?? 1;
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      data-slot="folder"
      className={cn(
        "relative flex flex-col items-center justify-center p-3 group/folder",
        className,
      )}
      {...props}
    >
      <div
        className="relative cursor-pointer select-none transition-transform duration-300"
        style={{
          width: BASE_WIDTH * scale,
          height: BASE_HEIGHT * scale,
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsOpen(false);
        }}
        onClick={() => setIsOpen((o) => !o)}
      >
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
            perspective: 850 * scale,
          }}
        >
          {/* Fondo del Folder */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              style={{
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
                borderRadius: 25,
                backgroundColor: theme.backFill,
                boxShadow: `${theme.backInsetShadow}, 0 10px 25px -5px ${theme.accentGlow}`,
              }}
            />
          </div>

          {/* Tarjetas que se abren en abanico (Fan out) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            {/* Ficha 3 (Derecha) */}
            <motion.div
              className="absolute cursor-pointer"
              onClick={(e) => {
                if (isOpen && onCardClick) {
                  e.stopPropagation();
                  onCardClick(2);
                }
              }}
              animate={{
                y: isOpen ? -165 : isHovered ? -35 : -10,
                x: isOpen ? 75 : 40,
                rotate: isOpen ? 18 : isHovered ? 14 : 10,
              }}
              transition={{
                type: "spring",
                stiffness: 130,
                damping: 14,
                delay: isOpen ? 0.08 : isHovered ? 0.1 : 0,
              }}
            >
              <Card
                id={1}
                cardNumber={3}
                theme={theme}
                label={items?.[2]?.title || "Ficha 3"}
                tag={items?.[2]?.tag || "Legal"}
              />
            </motion.div>

            {/* Ficha 2 (Centro) */}
            <motion.div
              className="absolute cursor-pointer"
              onClick={(e) => {
                if (isOpen && onCardClick) {
                  e.stopPropagation();
                  onCardClick(1);
                }
              }}
              animate={{
                y: isOpen ? -185 : isHovered ? -42 : -20,
                x: isOpen ? 0 : 3,
                rotate: isOpen ? -3 : isHovered ? -1 : 2,
              }}
              transition={{
                type: "spring",
                stiffness: 130,
                damping: 14,
                delay: isOpen ? 0.04 : isHovered ? 0.05 : 0,
              }}
            >
              <Card
                id={2}
                cardNumber={2}
                theme={theme}
                label={items?.[1]?.title || "Ficha 2"}
                tag={items?.[1]?.tag || "Estudio"}
              />
            </motion.div>

            {/* Ficha 1 (Izquierda) */}
            <motion.div
              className="absolute cursor-pointer"
              onClick={(e) => {
                if (isOpen && onCardClick) {
                  e.stopPropagation();
                  onCardClick(0);
                }
              }}
              animate={{
                y: isOpen ? -175 : isHovered ? -48 : -22,
                x: isOpen ? -72 : -40,
                rotate: isOpen ? -15 : isHovered ? -10 : -5,
              }}
              transition={{
                type: "spring",
                stiffness: 130,
                damping: 14,
                delay: 0,
              }}
            >
              <Card
                id={3}
                cardNumber={1}
                theme={theme}
                label={items?.[0]?.title || "Ficha 1"}
                tag={items?.[0]?.tag || "Clínico"}
              />
            </motion.div>
          </div>

          {/* Solapa Frontal 3D con Efecto Glassmorphism */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-4"
            style={{
              transformOrigin: "bottom center",
              transformStyle: "preserve-3d",
              width: 321,
              height: 241,
            }}
            animate={{ rotateX: isOpen ? -55 : isHovered ? -45 : -15 }}
            transition={{ type: "spring", stiffness: 130, damping: 14 }}
          >
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                clipPath: `path('${FLAP_PATH}')`,
                WebkitClipPath: `path('${FLAP_PATH}')`,
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                willChange: "transform",
              }}
            />
            <svg
              className="absolute inset-0"
              width="321"
              height="241"
              viewBox="0 0 321 241"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_i_folder_flap)">
                <path
                  d={FLAP_PATH}
                  fill={theme.flapFill}
                  fillOpacity={theme.flapFillOpacity}
                />
                <path
                  d="M25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216C320.5 229.531 309.531 240.5 296 240.5H25C11.469 240.5 0.5 229.531 0.5 216V25C0.5 11.469 11.469 0.5 25 0.5Z"
                  stroke={theme.flapStroke}
                  strokeWidth="1.5"
                />
              </g>
              <defs>
                <filter
                  id="filter0_i_folder_flap"
                  x="-25.4"
                  y="-25.4"
                  width="371.8"
                  height="291.8"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    result="shape"
                  />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset />
                  <feGaussianBlur stdDeviation="2.65" />
                  <feComposite
                    in2="hardAlpha"
                    operator="arithmetic"
                    k2="-1"
                    k3="1"
                  />
                  <feColorMatrix type="matrix" values={theme.flapInsetColor} />
                  <feBlend
                    mode="normal"
                    in2="shape"
                    result="effect1_innerShadow_flap"
                  />
                </filter>
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>

      {(title || subtitle) && (
        <div className="mt-3 text-center pointer-events-none max-w-[280px]">
          {title && (
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium leading-normal line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export { FolderComponent as Folder };
export default FolderComponent;

type Theme = (typeof themes)[keyof typeof themes];

interface CardProps {
  id: number;
  cardNumber?: number;
  theme: Theme;
  label?: string;
  tag?: string;
}

const Card = ({ id, cardNumber, theme, label, tag }: CardProps) => {
  const filterId = `filter0_i_card_${id}`;
  return (
    <div
      data-slot="folder-card"
      className="relative group/card select-none shadow-md rounded-[20px] transition-shadow duration-200 hover:shadow-xl"
    >
      <svg
        width="164"
        height="214"
        viewBox="0 0 164 214"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#${filterId})`}>
          <rect
            width="163.078"
            height="213.262"
            rx="20"
            fill={theme.cardFill}
          />
        </g>
        <rect
          x="0.5"
          y="0.5"
          width="162.078"
          height="212.262"
          rx="19.5"
          stroke={theme.cardStroke}
          strokeWidth="1.5"
        />
        {/* Cabecera / Líneas de contenido */}
        <rect
          x="12"
          y="42"
          width="140"
          height="8"
          rx="4"
          fill={theme.cardLineFill}
        />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 12 60)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 87.5 60)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 12 75)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 87.5 75)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 12 90)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 87.5 90)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 12 105)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 87.5 105)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 12 120)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 87.5 120)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 12 135)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 87.5 135)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 12 150)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 87.5 150)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 12 165)" fill={theme.cardLineFill} />
        <rect width="64.5" height="5.5" rx="2.75" transform="matrix(1 0 0 1 87.5 165)" fill={theme.cardLineFill} />
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="166.078"
            height="218.262"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="2"
              operator="erode"
              in="SourceAlpha"
              result={`effect1_innerShadow_${id}`}
            />
            <feOffset dx="3" dy="5" />
            <feGaussianBlur stdDeviation="3.05" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values={theme.cardInsetColor} />
            <feBlend
              mode="normal"
              in2="shape"
              result={`effect1_innerShadow_${id}`}
            />
          </filter>
        </defs>
      </svg>

      {/* Etiqueta / Título de la Ficha Clínica con Alto Contraste y Tipografía Nítida */}
      <div className="absolute top-3 left-3 right-3 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center justify-between gap-1">
          <span
            className="text-[10.5px] font-extrabold tracking-tight truncate drop-shadow-xs"
            style={{ color: theme.cardTextColor }}
          >
            {label || `Ficha ${cardNumber || id}`}
          </span>
          {tag && (
            <span
              className="text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded-md shadow-xs shrink-0"
              style={{ backgroundColor: theme.tagBg, color: theme.tagTextColor }}
            >
              {tag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
