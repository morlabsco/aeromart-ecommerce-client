/* ---------------------------------------------------------------------------
 * Dashboard v4 shared page skeleton — the loading state every dashboard page
 * shows while its data streams in. Three shapes cover the whole dashboard:
 *   table  — list pages (products, orders, users, reviews, activities…)
 *   form   — create/update pages and settings sections
 *   detail — [id] detail pages and the profile
 * Rendered inside the v4 canvas, so the blocks sit on the same light-gray
 * surface the real content will occupy — no layout flash.
 * ------------------------------------------------------------------------- */

const Bar = ({ className }: { className?: string }) => (
    <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />
);

function TableSkeleton() {
    return (
        <div className="space-y-5">
            {/* header + toolbar */}
            <div className="flex items-center justify-between gap-4">
                <Bar className="h-8 w-52" />
                <Bar className="h-9 w-32" />
            </div>
            <div className="flex items-center gap-3">
                <Bar className="h-10 w-full max-w-sm" />
                <Bar className="ml-auto h-9 w-28" />
            </div>
            {/* stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="space-y-3 rounded-xl border border-border/60 bg-card p-5 shadow-sm"
                    >
                        <Bar className="h-5 w-24" />
                        <Bar className="h-7 w-20" />
                        <Bar className="h-3 w-32" />
                    </div>
                ))}
            </div>
            {/* table card */}
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                <div className="flex gap-6 border-b border-border/60 bg-muted/40 px-5 py-3.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Bar key={i} className="h-3 w-20" />
                    ))}
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-6 border-b border-border/40 px-5 py-4 last:border-0"
                    >
                        <Bar className="size-9 rounded-lg" />
                        <Bar className="h-4 flex-1" />
                        <Bar className="h-4 w-16" />
                        <Bar className="h-4 w-20" />
                        <Bar className="h-8 w-24 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function FormSkeleton() {
    return (
        <div className="space-y-5">
            <Bar className="h-8 w-52" />
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Bar className="h-3.5 w-24" />
                                <Bar className="h-11 w-full" />
                            </div>
                        ))}
                    </div>
                    <Bar className="h-24 w-full" />
                    <div className="flex justify-end">
                        <Bar className="h-10 w-32" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <Bar className="h-8 w-52" />
                <Bar className="h-9 w-28" />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <Bar className="mx-auto size-24 rounded-full" />
                    <Bar className="mx-auto h-5 w-32" />
                    <Bar className="mx-auto h-3.5 w-44" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex justify-between gap-4">
                            <Bar className="h-3.5 w-20" />
                            <Bar className="h-3.5 w-24" />
                        </div>
                    ))}
                </div>
                <div className="space-y-5 xl:col-span-2">
                    <div className="space-y-5 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                        <Bar className="h-5 w-36" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Bar className="h-3.5 w-24" />
                                    <Bar className="h-11 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PageSkeleton({
    variant = "table",
}: {
    variant?: "table" | "form" | "detail";
}) {
    if (variant === "form") return <FormSkeleton />;
    if (variant === "detail") return <DetailSkeleton />;
    return <TableSkeleton />;
}
