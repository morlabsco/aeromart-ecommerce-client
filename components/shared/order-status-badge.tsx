import { Badge } from "@/components/ui/badge"

type StatusVariant = "success" | "info" | "warning" | "neutral" | "destructive"

/**
 * The canonical order-status → badge-variant map. Every order list, table and
 * detail view in the app (storefront + dashboard) renders status through
 * OrderStatusBadge so pills can never drift apart again.
 */
const ORDER_STATUS_VARIANT: Record<string, StatusVariant> = {
    Completed: "success",
    Delivered: "success",
    Shipped: "info",
    Processing: "warning",
    Pending: "neutral",
    Cancelled: "destructive",
}

export function OrderStatusBadge({
    status,
    className,
}: {
    status: string
    className?: string
}) {
    // Accepts both "Delivered" (dashboard enums) and "delivered" (raw API).
    const key = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    const variant =
        ORDER_STATUS_VARIANT[status] ?? ORDER_STATUS_VARIANT[key] ?? "neutral"
    return (
        <Badge variant={variant} className={className}>
            {status}
        </Badge>
    )
}
