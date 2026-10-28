"use client"

import { MapPin, SearchX } from "lucide-react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { BD_DISTRICTS } from "@/lib/data/bd-districts"

interface DistrictComboboxProps {
  /** Selected district name, or "" when nothing is chosen yet. */
  value: string
  /** Called with the district name ("") when cleared. */
  onChange: (district: string) => void
  /** Marks the field invalid (validation error styling). */
  invalid?: boolean
  /** Accessible name for the trigger button. */
  "aria-label"?: string
}

/**
 * District picker — a select-style field that ALWAYS drops its options below
 * the input (never flips above: `collisionAvoidance.side: "shift"` keeps the
 * requested bottom side), with a small gap under the trigger and a search box
 * inside the options so the 64 districts are easy to scan. The trigger gets
 * the brand active treatment while the popup is open.
 */
export function DistrictCombobox({
  value,
  onChange,
  invalid,
  "aria-label": ariaLabel = "District",
}: DistrictComboboxProps) {
  return (
    <Combobox
      items={BD_DISTRICTS}
      value={value || null}
      onValueChange={(district) => onChange(typeof district === "string" ? district : "")}
      autoHighlight
    >
      <ComboboxTrigger
        aria-label={ariaLabel}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-4 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow,border-color] outline-none",
          "focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-ring/25",
          "data-popup-open:border-brand/50 data-popup-open:ring-2 data-popup-open:ring-ring/25",
          "[&>svg]:transition-transform data-popup-open:[&>svg]:rotate-180",
          "data-placeholder:text-muted-foreground",
          invalid && "border-destructive data-popup-open:border-destructive data-popup-open:ring-destructive/25",
          "dark:bg-input/30 dark:hover:bg-input/50"
        )}
      >
        <ComboboxValue placeholder="Select your district" />
      </ComboboxTrigger>

      <ComboboxContent
        side="bottom"
        sideOffset={8}
        align="start"
        collisionAvoidance={{ side: "shift", fallbackAxisSide: "none" }}
        /* The wrapper's default popup min-width (anchor + 28px) would make
           the options box WIDER than this full-width field — drop it so the
           dropdown matches the trigger width exactly. */
        className="min-w-0"
      >
        {/* Search box pinned at the top of the options */}
        <ComboboxInput
          showTrigger={false}
          placeholder="Search district…"
          aria-label="Search district"
        />
        <ComboboxList>
          {(district: string) => (
            <ComboboxItem key={district} value={district}>
              <span className="flex items-center gap-2">
                <MapPin className="size-3.5 text-muted-foreground/60" />
                {district}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
        <ComboboxEmpty>
          <span className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
            <SearchX className="size-5 text-muted-foreground/50" />
            <span className="text-sm font-semibold text-foreground">
              No district found
            </span>
            <span className="text-xs text-muted-foreground">
              Check the spelling or try another name — all 64 districts are listed.
            </span>
          </span>
        </ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}
