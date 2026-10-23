import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface SectionHeaderProps {
  title: string
  /** When provided, renders the orange "View All" link on the right. */
  viewAllHref?: string
}

/**
 * Nittonova section heading: bold title with an orange underline dash and
 * an optional orange "View All" link. Shared across home shelves and ready
 * for reuse on any page.
 */
export function SectionHeader({ title, viewAllHref }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between sm:mb-8">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <span className="mt-2 block h-1 w-12 rounded-full bg-brand" aria-hidden="true" />
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
