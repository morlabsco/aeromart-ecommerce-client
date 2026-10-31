"use client"

import { useMemo } from "react"
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
import { BD_UPAZILAS } from "@/lib/data/bd-upazilas"

interface UpazilaComboboxProps {
  /** Chosen district — upazilas are district-scoped, so this is required. */
  district: string
  /** Selected upazila name, or "" when nothing is chosen yet. */
  value: string
  /** Called with the upazila name ("") when cleared. */
  onChange: (upazila: string) => void
  /** Marks the field invalid (validation error styling). */
  invalid?: boolean
  /** Accessible name for the trigger button. */
  "aria-label"?: string
}

/**
 * Upazila picker — the district-scoped sibling of DistrictCombobox (same
 * always-below dropdown, in-options search and brand active treatment).
 * Options come from the static BD_UPAZILAS map; switching the district
 * resets the choice (handled by the parent) since names rarely overlap.
 */
export function UpazilaCombobox({
  district,
  value,
  onChange,
  invalid,
  "aria-label": ariaLabel = "Upazila",
}: UpazilaComboboxProps) {
  const upazilas = useMemo(
    () => BD_UPAZILAS[district] ?? [],
    [district]
  )

  return (
    <Combobox
      items={upazilas}
      value={value || null}
      onValueChange={(upazila) =>
        onChange(typeof upazila === "string" ? upazila : "")
      }
      autoHighlight
      disabled={!district}
    >
      <ComboboxTrigger
        aria-label={ariaLabel}
        disabled={!district}
        title={
          district
            ? undefined
            : "Select a district first — upazilas follow the district"
        }
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-4 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow,border-color] outline-none",
          "focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-ring/25",
          "data-popup-open:border-brand/50 data-popup-open:ring-2 data-popup-open:ring-ring/25",
          "[&>svg]:transition-transform data-popup-open:[&>svg]:rotate-180",
          "data-placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-60",
          invalid &&
            "border-destructive data-popup-open:border-destructive data-popup-open:ring-destructive/25",
          "dark:bg-input/30 dark:hover:bg-input/50"
        )}
      >
        <ComboboxValue
          placeholder={district ? "Select your upazila" : "Select district first"}
        />
      </ComboboxTrigger>

      <ComboboxContent
        side="bottom"
        sideOffset={8}
        align="start"
        collisionAvoidance={{ side: "shift", fallbackAxisSide: "none" }}
        className="min-w-0"
      >
        <ComboboxInput
          showTrigger={false}
          placeholder="Search upazila…"
          aria-label="Search upazila"
        />
        <ComboboxList>
          {(upazila: string) => (
            <ComboboxItem key={upazila} value={upazila}>
              <span className="flex items-center gap-2">
                <MapPin className="size-3.5 text-muted-foreground/60" />
                {upazila}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
        <ComboboxEmpty>
          <span className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
            <SearchX className="size-5 text-muted-foreground/50" />
            <span className="text-sm font-semibold text-foreground">
              No upazila found
            </span>
            <span className="text-xs text-muted-foreground">
              {district
                ? `Check the spelling — every upazila of ${district} is listed.`
                : "Select a district first."}
            </span>
          </span>
        </ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}
