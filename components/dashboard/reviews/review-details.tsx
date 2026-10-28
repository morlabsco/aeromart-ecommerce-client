"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Trash2, Flag, FlagOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/shared/star-rating";
import { deleteReview, toggleReviewFlag } from "@/lib/services/review";
import { isErrorResult } from "@/lib/utils/result";
import type { Review } from "@/lib/types/backend";

export function ReviewDetails({ review }: { review: Review }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [flagReason, setFlagReason] = useState(review.flaggedReason ?? "");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleFlag = () => {
        if (!review.isFlagged && !flagReason.trim()) {
            toast.error("Please provide a reason for flagging.");
            return;
        }
        startTransition(async () => {
            const result = await toggleReviewFlag(
                review._id,
                review.isFlagged ? undefined : flagReason.trim()
            );
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(
                result.message ?? (review.isFlagged ? "Review unflagged" : "Review flagged")
            );
            router.refresh();
        });
    };

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteReview(review._id);
            setConfirmDelete(false);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(result.message ?? "Review deleted");
            router.push("/dashboard/admin/reviews");
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-2 -ml-2 text-muted-foreground"
                        render={<Link href="/dashboard/admin/reviews" />}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Reviews
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Review Details
                    </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={review.isFlagged ? "outline" : "secondary"}
                        onClick={handleFlag}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : review.isFlagged ? (
                            <FlagOff className="mr-2 h-4 w-4" />
                        ) : (
                            <Flag className="mr-2 h-4 w-4" />
                        )}
                        {review.isFlagged ? "Unflag" : "Flag Review"}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setConfirmDelete(true)}
                        disabled={isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>{review.product?.name ?? "Product"}</span>
                        <StarRating rating={review.rating} size="lg" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                            {review.user?.name ?? "Anonymous"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                            {review.user?.email}
                        </span>
                        <div className="flex flex-wrap gap-1.5 ml-auto">
                            {review.isVerifiedPurchase && (
                                <Badge variant="success">Verified Purchase</Badge>
                            )}
                            {review.isFlagged ? (
                                <Badge variant="destructive">Flagged</Badge>
                            ) : (
                                <Badge variant="outline">Active</Badge>
                            )}
                        </div>
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                        &ldquo;{review.description}&rdquo;
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Submitted</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(review.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Last updated</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(review.updatedAt).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="flagReason">
                            {review.isFlagged ? "Flag reason" : "Flag reason (required to flag)"}
                        </Label>
                        <Textarea
                            id="flagReason"
                            rows={3}
                            value={flagReason}
                            onChange={(e) => setFlagReason(e.target.value)}
                            placeholder="e.g. Offensive content, suspicious review..."
                            disabled={review.isFlagged}
                        />
                        {review.isFlagged && review.flaggedReason && (
                            <p className="text-xs text-muted-foreground">
                                Current reason: {review.flaggedReason}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently deletes the review and recalculates the
                            product rating. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Review"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
