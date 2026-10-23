"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { isErrorResult } from "@/lib/utils/result";

interface InstantStatusSelectProps<T extends string> {
    value: T;
    options: { value: T; label: string }[];
    onUpdate: (value: T) => Promise<{ message?: string } | Error>;
    /** Called after a successful update so the page can refresh its data. */
    onSuccess?: () => void;
    /** Class for the select trigger, e.g. sizing/width. */
    className?: string;
}

/**
 * A compact inline Select that calls the given service action on change and
 * revalidates via the service's revalidateTag. Shows a toast on success/failure.
 * Stays in sync when the row's server data changes (e.g. after router.refresh).
 */
export function InstantStatusSelect<T extends string>({
    value,
    options,
    onUpdate,
    onSuccess,
    className,
}: InstantStatusSelectProps<T>) {
    const [isPending, startTransition] = useTransition();
    const [current, setCurrent] = useState<T>(value);

    // Sync local state when the server-provided value changes.
    useEffect(() => {
        setCurrent(value);
    }, [value]);

    const handleChange = (next: T) => {
        startTransition(async () => {
            const result = await onUpdate(next);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            setCurrent(next);
            toast.success(result.message ?? "Updated successfully");
            onSuccess?.();
        });
    };

    return (
        <Select
            value={current}
            onValueChange={(next) => handleChange((next ?? current) as T)}
            disabled={isPending}
        >
            <SelectTrigger className={className ?? "h-7 w-32"}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
