"use client"

import { cn } from "@/lib/utils"

interface CarouselDotsProps {
  count: number
  current: number
  onSelect: (index: number) => void
  /** Positioning/spacing classes for the dot row (e.g. centering). */
  className?: string
}

/**
 * Shared carousel dot navigation (hero banner + testimonials): generous tap
 * targets, the active dot is the wide brand-orange pill, inactive dots grow
 * on hover. Renders nothing for single-slide carousels.
 */
export function CarouselDots({ count, current, onSelect, className }: CarouselDotsProps) {
  if (count < 2) return null

  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          aria-label={`Go to slide ${index + 1}`}
          aria-pressed={index === current}
          className="group flex cursor-pointer items-center justify-center p-2.5"
        >
          <span
            className={cn(
              "block h-2 rounded-full transition-all duration-300",
              index === current
                ? "w-7 bg-brand"
                : "w-2 bg-foreground/30 group-hover:w-4 group-hover:bg-foreground/50"
            )}
          />
        </button>
      ))}
    </div>
  )
}
