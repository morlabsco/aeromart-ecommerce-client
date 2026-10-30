"use client";

import { Columns2, Rows } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Form layout toggle — switches a dashboard form between its two-column
 * layout (fields left, image gallery right) and a single-column stack.
 * Used by the product create/update forms; safe to reuse on any long form.
 * ------------------------------------------------------------------------- */

export type FormLayout = "two" | "single";

export function FormLayoutToggle({
    value,
    onChange,
}: {
    value: FormLayout;
    onChange: (layout: FormLayout) => void;
}) {
    const options: { key: FormLayout; label: string; icon: typeof Columns2 }[] = [
        { key: "two", label: "Two columns", icon: Columns2 },
        { key: "single", label: "Single column", icon: Rows },
    ];

    return (
        <div
            role="group"
            aria-label="Form layout"
            className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1"
        >
            {options.map(({ key, label, icon: Icon }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    aria-pressed={value === key}
                    title={label}
                    className={cn(
                        "flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors",
                        value === key
                            ? "bg-header-nav text-header-nav-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                >
                    <Icon className="size-4" />
                    <span className="sr-only">{label}</span>
                </button>
            ))}
        </div>
    );
}
