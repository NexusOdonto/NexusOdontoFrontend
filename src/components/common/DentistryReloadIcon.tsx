import dentistryGif from "../../assets/icons/dentistry.gif";

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
      className={`inline-flex items-center justify-center pointer-events-none select-none ${
        loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500 ease-out"
      }`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={dentistryGif}
        alt="Recargar"
        width={size}
        height={size}
        className={`object-contain transition-all duration-300 ${
          loading
            ? "scale-110 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.85)] brightness-110"
            : "group-hover:scale-110 group-hover:brightness-110"
        } ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </span>
  );
}

export default DentistryReloadIcon;


