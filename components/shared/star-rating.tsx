import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  /** Review count shown in parentheses next to the stars. */
  count?: number
  /**
   * "compact" — the Nittonova shelf-card row: one brand star, the value and
   * the count. "stars" — the classic five-star row with muted empties.
   */
  mode?: "compact" | "stars"
  size?: "sm" | "lg"
  className?: string
}

/**
 * The one star rating for the whole app (brand-orange fills, token colors).
 * Replaces the per-page amber/zinc star markup that kept drifting.
 */
export function StarRating({
  rating,
  count,
  mode = "stars",
  size = "sm",
  className,
}: StarRatingProps) {
  const starSize = size === "lg" ? "size-5" : "size-3.5"
  const textSize = size === "lg" ? "text-sm" : "text-xs"

  if (mode === "compact") {
    return (
      <span className={cn("flex items-center gap-1", className)}>
        <Star className={cn(starSize, "fill-brand text-brand")} />
        <span className={cn(textSize, "font-bold text-foreground")}>{rating}</span>
        {count !== undefined && (
          <span className={cn(textSize, "text-muted-foreground")}>({count})</span>
        )}
      </span>
    )
  }

  return (
    <span
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`Rated ${rating} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            starSize,
            i < Math.round(rating)
              ? "fill-brand text-brand"
              : "fill-muted-foreground/30 text-muted-foreground/30"
          )}
        />
      ))}
      {count !== undefined && (
        <span className={cn("ml-1", textSize, "text-muted-foreground")}>
          ({count})
        </span>
      )}
    </span>
  )
}
