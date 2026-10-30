import { Badge } from "@/components/ui/badge"

type BadgeVariant =
    | "info"
    | "highlight"
    | "teal"
    | "success"
    | "warning"
    | "destructive"
    | "neutral"

/** Activity module (Order / Product / …) → status-pill variant, app-wide. */
const MODULE_VARIANT: Record<string, BadgeVariant> = {
    Order: "info",
    Product: "highlight",
    Brand: "teal",
    Category: "info",
    User: "success",
    Coupon: "warning",
    Review: "highlight",
    Settings: "neutral",
    Payment: "info",
}

/** Activity type (create / update / …) → status-pill variant, app-wide. */
const TYPE_VARIANT: Record<string, BadgeVariant> = {
    create: "success",
    update: "warning",
    delete: "destructive",
    status: "info",
    preset: "highlight",
}

export function ActivityModuleBadge({ module }: { module: string }) {
    return (
        <Badge variant={MODULE_VARIANT[module] ?? "neutral"}>{module}</Badge>
    )
}

/** Single-word Proper Case ("create" → "Create") so badges read consistently. */
function properCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

export function ActivityTypeBadge({ type }: { type: string }) {
    return (
        <Badge variant={TYPE_VARIANT[type] ?? "neutral"}>
            {properCase(type)}
        </Badge>
    )
}
