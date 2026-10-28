"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | "...")[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <nav
      className="flex items-center justify-center gap-1.5 py-6"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-sm transition-colors cursor-pointer",
          currentPage <= 1
            ? "border-border/60 text-muted-foreground/40 cursor-not-allowed"
            : "border-border text-muted-foreground hover:border-brand hover:text-brand",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`e${i}`}
            className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              "h-9 w-9 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
              p === currentPage
                ? "bg-header-nav text-header-nav-foreground"
                : "border border-border bg-card text-muted-foreground hover:border-brand hover:text-brand",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-sm transition-colors cursor-pointer",
          currentPage >= totalPages
            ? "border-border/60 text-muted-foreground/40 cursor-not-allowed"
            : "border-border text-muted-foreground hover:border-brand hover:text-brand",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
