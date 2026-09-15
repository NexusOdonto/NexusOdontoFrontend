import { useState } from "react";
import { Blobatar } from "@blobatar/react";
import "blobatar/motion.css";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: "hover" | "idle" | false;
  traits?: any;
}

export function getInitials(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({
  avatar,
  name,
  className = "w-full h-full rounded-xl object-cover",
  fallbackClassName = "w-full h-full flex items-center justify-center rounded-xl overflow-hidden select-none",
  animate = "hover",
  traits,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const isValidUrl =
    Boolean(avatar) &&
    typeof avatar === "string" &&
    (avatar.startsWith("data:image/") ||
      avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("blob:"));

  if (isValidUrl && !hasError) {
    return (
      <img
        src={avatar!}
        alt={name || "Usuario"}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  const effectiveName = (name && name.trim().length > 0) ? name.trim() : "Nexus Odonto";

  return (
    <div
      className={`${fallbackClassName} relative flex items-center justify-center p-0.5 transition-transform duration-200`}
      title={effectiveName}
    >
      <Blobatar
        name={effectiveName}
        animate={animate ? (animate as any) : undefined}
        traits={traits}
        className="w-full h-full object-contain pointer-events-auto transition-transform hover:scale-105"
      />
    </div>
  );
}
