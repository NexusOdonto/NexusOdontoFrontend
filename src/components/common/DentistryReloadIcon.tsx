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
    <img
      src={dentistryGif}
      alt="Recargar"
      width={size}
      className={`inline-block object-contain transition-transform duration-300 pointer-events-none select-none ${
        loading ? "scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "group-hover:scale-115"
      } ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

export default DentistryReloadIcon;
