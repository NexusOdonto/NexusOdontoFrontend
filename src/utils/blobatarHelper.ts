import { blobatar } from "blobatar";

/**
 * Generates a PNG data URI for a given user name using Blobatar SVG and Canvas.
 */
export function generateBlobatarPng(name: string, size = 64): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve("");
      return;
    }
    try {
      const cleanName = name && name.trim().length > 0 ? name.trim() : "Nexus Odonto";
      const svg = blobatar(cleanName, { background: "circle" });
      const img = new window.Image();
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, size, size);
            const dataUrl = canvas.toDataURL("image/png");
            URL.revokeObjectURL(url);
            resolve(dataUrl);
            return;
          }
        } catch {
          // fallback
        }
        URL.revokeObjectURL(url);
        resolve("");
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("");
      };

      img.src = url;
    } catch {
      resolve("");
    }
  });
}
