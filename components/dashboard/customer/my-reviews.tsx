"use client";

import { useState } from "react";
import { Star, MessageSquare, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/types/backend";

function Stars({ value }: { value: number }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        "h-4 w-4",
                        i < Math.round(value)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                    )}
                />
            ))}
        </span>
    );
}

export function MyReviews({ reviews }: { reviews: Review[] }) {
    const [filter, setFilter] = useState<"all" | "verified">("all");
    const visible =
        filter === "all"
            ? reviews
            : reviews.filter((r) => r.isVerifiedPurchase);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        My Reviews
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {reviews.length} review{reviews.length === 1 ? "" : "s"} you&apos;ve written
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter("all")}
                        className={cn(
                            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                            filter === "all"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All ({reviews.length})
                    </button>
                    <button
                        onClick={() => setFilter("verified")}
                        className={cn(
                            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                            filter === "verified"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Verified ({reviews.filter((r) => r.isVerifiedPurchase).length})
                    </button>
                </div>
            </div>

            {visible.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold">No reviews yet</h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            When you write a review on a product, it will show
                            up here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {visible.map((review) => (
                        <Card key={review._id}>
                            <CardContent className="p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {review.product?.name ?? "Product"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    review.createdAt
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Stars value={review.rating} />
                                        {review.isVerifiedPurchase && (
                                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                Verified
                                            </Badge>
                                        )}
                                        {review.isFlagged && (
                                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                Flagged
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    &ldquo;{review.description}&rdquo;
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
