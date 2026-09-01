import { useState } from "react";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
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
  fallbackClassName = "w-full h-full flex items-center justify-center font-bold text-teal-400 bg-teal-500/15 border border-teal-500/30 select-none",
  size = "md",
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const isValidUrl =
    Boolean(avatar) &&
    typeof avatar === "string" &&
    (avatar.startsWith("data:image/") ||
      avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("blob:"));

  const initials = getInitials(name);

  const sizeTextClass =
    size === "sm"
      ? "text-xs"
      : size === "md"
      ? "text-sm"
      : size === "lg"
      ? "text-base font-extrabold"
      : "text-lg font-black";

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

  return (
    <div
      className={`${fallbackClassName} ${sizeTextClass} rounded-xl`}
      title={name || "Usuario"}
    >
      <span>{initials}</span>
    </div>
  );
}
