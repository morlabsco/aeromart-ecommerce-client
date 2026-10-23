"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ThemedImageProps {
  src: string | undefined;
  alt: string;
  /** Text shown inside the gradient placeholder (usually the product/brand name). */
  fallbackText?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  /** Wrapper class for the gradient placeholder; defaults to absolute inset-0. */
  placeholderClassName?: string;
}

/**
 * Renders an image with a themed gradient placeholder. When the image is
 * missing or fails to load, a `from-primary to-accent` gradient with the
 * fallback text is shown instead of the browser's broken-image icon.
 */
export function ThemedImage({
  src,
  alt,
  fallbackText,
  fill,
  width,
  height,
  sizes,
  className,
  placeholderClassName,
}: ThemedImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-primary/80 to-accent/80",
          fill ? "absolute inset-0" : "",
          placeholderClassName
        )}
      >
        {fallbackText && (
          <span className="line-clamp-3 px-3 text-center font-semibold text-white/95 drop-shadow-sm">
            {fallbackText}
          </span>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
