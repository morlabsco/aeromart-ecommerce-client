"use client"

import { useMemo, useState } from "react";
import { Phone, SearchX } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { DIAL_CODES, findDialCode } from "@/lib/data/dial-codes";

/* ---------------------------------------------------------------------------
 * PhoneInput — a validated phone field: country-code combobox (name + code,
 * searchable, clearable — Bangladesh +880 default) beside the local number.
 *
 * The customer keeps typing the number the way they know it ("01712…"), and
 * the component merges it into ONE clean international number:
 *   +880 + 01712345678 → +8801712345678 (the trunk "0" is stripped).
 * Validation: BD numbers must be a local 01XXXXXXXXX (or without the 0);
 * other countries accept 6–14 digits. onChange fires with the FULL unified
 * number ("" when incomplete) and validity rides on aria-invalid.
 * ------------------------------------------------------------------------- */

/** Validates a local (code-stripped) number for the given dial code. */
export function validateLocalNumber(code: string, local: string): boolean {
  const digits = local.replace(/\D/g, "");
  if (code === "+880") {
    // Bangladeshi mobiles: 01XXXXXXXXX (with trunk) or 1XXXXXXXXX (without).
    return /^01[3-9]\d{8}$/.test(digits) || /^1[3-9]\d{8}$/.test(digits);
  }
  return digits.length >= 6 && digits.length <= 14;
}

/** Merges a code + whatever the user typed into one unified number. */
export function mergePhoneNumber(code: string, typed: string): string {
  const dial = findDialCode(code);
  let digits = typed.replace(/\D/g, "");
  // Strip the trunk prefix exactly once (017… → 17… under +880).
  if (dial.trunk && digits.startsWith(dial.trunk)) {
    digits = digits.slice(dial.trunk.length);
  }
  // Guard against the user pasting the FULL number with code.
  const bareCode = dial.code.replace("+", "");
  if (digits.startsWith(bareCode)) {
    digits = digits.slice(bareCode.length);
  }
  if (!digits) return "";
  return `${dial.code}${digits}`;
}

/** Validates a FULL unified number ("+8801712345678"). */
export function isValidFullPhone(full: string): boolean {
  const match = full.match(/^(\+\d{1,4})(\d{6,14})$/);
  if (!match) return false;
  if (match[1] === "+880") return /^1[3-9]\d{8}$/.test(match[2]);
  return true;
}

interface PhoneInputProps {
  /** Current FULL number ("+8801712345678") — "" when empty. */
  value: string;
  /** Fires with the full unified number ("" when cleared/incomplete). */
  onChange: (full: string) => void;
  invalid?: boolean;
  "aria-label"?: string;
  placeholder?: string;
  className?: string;
  /** Disables the country selector (kept for future flows). */
  lockCountry?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  invalid,
  "aria-label": ariaLabel = "Phone number",
  placeholder = "01XXXXXXXXX",
  className,
  lockCountry,
}: PhoneInputProps) {
  // Split the incoming full number back into code + local part.
  const initial = useMemo(() => {
    const match = value.match(/^(\+\d{1,4})(.*)$/);
    if (!match) return { code: "+880", local: value ?? "" };
    const code = match[1];
    const known = DIAL_CODES.some((entry) => entry.code === code);
    return known
      ? { code, local: match[2] ?? "" }
      : { code: "+880", local: value ?? "" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [code, setCode] = useState(initial.code);
  const [local, setLocal] = useState(initial.local);

  const dial = findDialCode(code);
  const isValid = validateLocalNumber(code, local);

  const emit = (nextCode: string, nextLocal: string) => {
    const full = mergePhoneNumber(nextCode, nextLocal);
    onChange(
      validateLocalNumber(nextCode, nextLocal) ? full : full || "",
    );
  };

  const items = useMemo(
    () => DIAL_CODES.map((entry) => `${entry.name} (${entry.code})`),
    [],
  );
  const selectedLabel = `${dial.name} (${dial.code})`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-stretch gap-2 sm:flex-nowrap",
        className,
      )}
    >
      {/* Country code picker — searchable + clearable (back to Bangladesh). */}
      <Combobox
        items={items}
        value={selectedLabel}
        onValueChange={(selected) => {
          const label = typeof selected === "string" ? selected : "";
          const next =
            DIAL_CODES.find(
              (entry) => `${entry.name} (${entry.code})` === label,
            ) ?? DIAL_CODES[0];
          setCode(next.code);
          emit(next.code, local);
        }}
        disabled={lockCountry}
      >
        <ComboboxTrigger
          aria-label="Country code"
          className={cn(
            "h-11 w-full max-w-[13rem] shrink-0 cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-3 text-sm font-semibold shadow-xs transition-[color,box-shadow,border-color] outline-none sm:w-[12.5rem]",
            "focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-ring/25",
            "data-popup-open:border-brand/50 data-popup-open:ring-2 data-popup-open:ring-ring/25",
            "[&>svg]:transition-transform data-popup-open:[&>svg]:rotate-180",
            "dark:bg-input/30 dark:hover:bg-input/50",
          )}
        >
          <ComboboxValue placeholder="Code" />
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
            showClear
            placeholder="Search country or code…"
            aria-label="Search country code"
          />
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                <span className="flex items-center gap-2">
                  <Phone className="size-3.5 text-muted-foreground/60" />
                  <span className="truncate">{item}</span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>
            <span className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
              <SearchX className="size-5 text-muted-foreground/50" />
              <span className="text-sm font-semibold text-foreground">
                No country found
              </span>
              <span className="text-xs text-muted-foreground">
                Try a name or a +code.
              </span>
            </span>
          </ComboboxEmpty>
        </ComboboxContent>
      </Combobox>

      {/* Local number — the user's natural format, unified on change. */}
      <input
        type="tel"
        inputMode="tel"
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          emit(code, e.target.value);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid || (local.length > 0 && !isValid)}
        className={cn(
          "h-11 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-4 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground/60 md:text-sm",
          "focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-ring/25",
          (invalid || (local.length > 0 && !isValid)) &&
            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25",
          "dark:bg-input/30",
        )}
      />
    </div>
  );
}
