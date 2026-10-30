"use client";

// Date of Birth picker: shadcn Calendar + Popover for easy month/year/day
// selection, plus a free-typing input for fast manual entry. Both are kept
// in sync: a valid typed date updates the calendar, a picked date fills the
// input. The value is stored as a local `YYYY-MM-DD` string (or "" when
// empty), matching the profile schema.
//
// The calendar's month/year dropdowns use the shadcn calendar's default
// themed <select> styling (native element, themed trigger).

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseLocalDate, toLocalDateString } from "@/lib/utils/date";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
    if (!DATE_REGEX.test(value)) return false;
    const date = parseLocalDate(value);
    return (
        date.getFullYear() === Number(value.slice(0, 4)) &&
        date.getMonth() === Number(value.slice(5, 7)) - 1 &&
        date.getDate() === Number(value.slice(8, 10))
    );
}

/** Returns true when the date is after today (local midnight). */
function isFutureDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
}

/** Returns true when the date is older than the oldest realistic age. */
function isTooOld(date: Date): boolean {
    const oldest = new Date();
    oldest.setHours(0, 0, 0, 0);
    oldest.setFullYear(oldest.getFullYear() - 120);
    return date < oldest;
}

export function getDateOfBirthError(value: string): string | null {
    if (!value) return null;
    if (!isValidDate(value)) {
        return "Enter a valid date in YYYY-MM-DD format.";
    }
    const date = parseLocalDate(value);
    if (isFutureDate(date)) return "Date of birth cannot be in the future.";
    if (isTooOld(date)) return "Date of birth looks too far in the past.";
    return null;
}

interface DateOfBirthInputProps {
    value: string;
    onChange: (value: string) => void;
    id?: string;
    className?: string;
}

export function DateOfBirthInput({
    value,
    onChange,
    id,
    className,
}: DateOfBirthInputProps) {
    const [typed, setTyped] = useState<string | null>(null);

    // While the user is typing we show exactly what they typed; once a
    // calendar pick or blur commits a valid value we switch back to the
    // canonical stored value.
    const inputValue = typed ?? value;

    const handleInputChange = (next: string) => {
        setTyped(next);
        if (isValidDate(next)) {
            onChange(next);
        } else if (next === "") {
            onChange("");
        }
    };

    const handleBlur = () => {
        if (typed !== null) {
            if (isValidDate(typed)) onChange(typed);
            setTyped(null);
        }
    };

    const handleSelect = (date: Date | undefined) => {
        onChange(date ? toLocalDateString(date) : "");
        setTyped(null);
    };

    const error = getDateOfBirthError(value);

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex gap-2">
                <Input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY-MM-DD"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleBlur}
                    aria-invalid={!!error}
                    aria-describedby={id ? `${id}-hint` : undefined}
                />
                <Popover>
                    <PopoverTrigger
                        render={
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                aria-label="Open calendar"
                            />
                        }
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            startMonth={new Date(new Date().getFullYear() - 120, 0)}
                            endMonth={new Date()}
                            selected={isValidDate(value) ? parseLocalDate(value) : undefined}
                            onSelect={handleSelect}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            {error ? (
                <p id={id ? `${id}-hint` : undefined} className="text-[11px] font-medium text-destructive">
                    {error}
                </p>
            ) : (
                <p id={id ? `${id}-hint` : undefined} className="text-[11px] text-muted-foreground">
                    Type directly as YYYY-MM-DD or pick from the calendar.
                </p>
            )}
        </div>
    );
}
