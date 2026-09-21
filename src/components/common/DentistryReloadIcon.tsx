interface DentistryReloadIconProps {
  className?: string;
  size?: number;
  loading?: boolean;
}

export function DentistryReloadIcon({
  className = "",
  size = 20,
  loading = false,
}: DentistryReloadIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center select-none ${
        loading ? "animate-spin text-cyan-500" : "group-hover:rotate-180 transition-transform duration-500 ease-out text-slate-500 dark:text-slate-400 group-hover:text-cyan-500"
      } ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label="Recargar"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`transition-all duration-300 ${
          loading ? "drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" : ""
        }`}
      >
        {/* Recycled / Curved sync arrows */}
        <path d="M21.5 2v6h-6M2.5 22v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L21.5 8M2.5 16l3.14 2.36A9 9 0 0 0 20.49 15" />
        {/* Centered tooth emblem */}
        <path
          d="M10 10.5c.3-.8.9-1.5 2-1.5s1.7.7 2 1.5c.4 1 .2 2.5-.2 3.5-.3.8-.8 1.5-1 2-.2-.5-.5-1-.8-1.5-.3-.6-.6-1.2-.8-2-.2-.7-.3-1.4-.2-2z"
          fill="currentColor"
          fillOpacity="0.3"
          strokeWidth="1.2"
        />
      </svg>
    </span>
  );
}

export default DentistryReloadIcon;



