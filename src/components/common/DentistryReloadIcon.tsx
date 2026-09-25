interface DentistryReloadIconProps {
  className?: string;
  size?: number;
  loading?: boolean;
}

/** Served from /public so the 650KB GIF is not part of the JS module graph. */
const DENTISTRY_GIF = "/dentistry.gif";

export function DentistryReloadIcon({
  className = "",
  size = 20,
  loading = false,
}: DentistryReloadIconProps) {
  return (
    <img
      src={DENTISTRY_GIF}
      alt="Recargar"
      width={size}
      height={size}
      decoding="async"
      className={`inline-block object-contain transition-transform duration-300 pointer-events-none select-none ${
        loading ? "scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "group-hover:scale-115"
      } ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

export default DentistryReloadIcon;
