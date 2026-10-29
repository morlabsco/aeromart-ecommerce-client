import { cn } from "@/lib/utils"

/**
 * Decorative segmented color rule that separates the home page's product
 * sections — four short rounded bars in the brand palette (orange, emerald,
 * pink, teal). Purely visual (aria-hidden); renders as a sibling BELOW a
 * section so it disappears together with it when a section hides itself.
 */
export function SectionRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center justify-center gap-1.5 py-2", className)}
    >
      <span className="h-1 w-7 rounded-full bg-brand" />
      <span className="h-1 w-7 rounded-full bg-success" />
      <span className="h-1 w-7 rounded-full bg-highlight" />
      <span className="h-1 w-7 rounded-full bg-teal" />
    </div>
  )
}
