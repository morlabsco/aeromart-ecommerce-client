import { Skeleton } from "@/components/ui/skeleton";

/**
 * Home page loading skeleton — mirrors the real page structure section by
 * section (cream hero banner with its inset rounded artwork, the white
 * categories tile row, a product shelf with the heading + card grid, the
 * cream features panel, testimonials and the newsletter panel) so the load
 * never flashes a layout that doesn't match.
 */
export function HomeSkeleton() {
    const shelfCards = Array.from({ length: 5 });
    const categoryTiles = Array.from({ length: 6 });

    return (
        <main>
            {/* Hero banner — cream surface, inset rounded artwork (matches
                banner.tsx: max-w-[1400px], aspect-clamped) */}
            <section className="bg-hero-surface pb-4 sm:pb-6">
                <div className="mx-auto w-full max-w-[1400px] px-3 pt-3 sm:px-5 sm:pt-4 lg:px-8 lg:pt-6">
                    <Skeleton className="aspect-[16/9] w-full rounded-lg sm:aspect-[16/8] lg:aspect-[14/5]" />
                </div>
            </section>

            {/* Categories — white section, centered tile row */}
            <section className="bg-background py-8 sm:py-10 lg:py-12">
                <div className="mx-auto flex max-w-7xl justify-center gap-4 overflow-hidden px-4 sm:px-6 lg:px-8">
                    {categoryTiles.map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="size-28 rounded-2xl sm:size-32 lg:size-36" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Product shelf (Trending) — cream surface, heading row + grid */}
            <section className="bg-hero-surface py-10 sm:py-12 lg:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex items-end gap-3">
                            <Skeleton className="h-8 w-36" />
                            <Skeleton className="h-1.5 w-10 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                        {shelfCards.map((_, i) => (
                            <div
                                key={i}
                                className="rounded-xl bg-card p-3 shadow-sm sm:p-4"
                            >
                                <Skeleton className="aspect-square rounded-lg" />
                                <Skeleton className="mt-4 h-3 w-1/2" />
                                <Skeleton className="mt-2 h-4 w-3/4" />
                                <Skeleton className="mt-3 h-4 w-1/3" />
                                <Skeleton className="mt-4 h-10 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features bar — cream panel, 1 → 2 → 4 columns */}
            <section className="bg-background py-8 sm:py-10 lg:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 rounded-2xl border border-border/40 bg-hero-surface sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-center gap-4 border-b border-border/50 px-6 py-6 last:border-b-0 sm:border-b-0 lg:py-8"
                            >
                                <Skeleton className="size-11 shrink-0 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials — heading + three cards */}
            <section className="bg-hero-surface py-10 sm:py-12 lg:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-center gap-3">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-1.5 w-10 rounded-full" />
                    </div>
                    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-44 rounded-2xl bg-card"
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter — white section, cream centered panel */}
            <section className="bg-background py-8 sm:py-10 lg:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-border/40 bg-hero-surface px-6 py-10 text-center sm:px-10 lg:py-12">
                        <Skeleton className="mx-auto size-12 rounded-full" />
                        <Skeleton className="mx-auto mt-5 h-7 w-52" />
                        <Skeleton className="mx-auto mt-3 h-4 w-72 max-w-full" />
                        <div className="mx-auto mt-6 flex max-w-md flex-col justify-center gap-3 sm:flex-row">
                            <Skeleton className="h-11 flex-1 rounded-lg" />
                            <Skeleton className="h-11 w-full rounded-lg sm:w-32" />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
