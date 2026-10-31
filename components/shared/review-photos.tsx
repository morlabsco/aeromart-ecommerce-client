"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";

/* ---------------------------------------------------------------------------
 * Review photos — shared thumbnail strip for customer-submitted review
 * photos (max 3). Clicking a thumbnail opens a centered lightbox dialog.
 * Used by the storefront product page, the dashboard review details and
 * customer my-reviews.
 * ------------------------------------------------------------------------- */

const MAX_REVIEW_PHOTOS = 3;

export function ReviewPhotos({
    photoUrls,
    size = "sm",
}: {
    photoUrls?: string[];
    size?: "sm" | "md";
}) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const photos = (photoUrls ?? []).filter(Boolean).slice(0, MAX_REVIEW_PHOTOS);
    if (photos.length === 0) return null;

    const thumb = size === "md" ? "size-20" : "size-16";

    return (
        <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <Camera
                    aria-hidden="true"
                    className={
                        size === "md"
                            ? "size-4 text-muted-foreground"
                            : "size-3.5 text-muted-foreground"
                    }
                />
                {photos.map((url, i) => (
                    <button
                        key={url}
                        type="button"
                        onClick={() => setOpenIndex(i)}
                        aria-label={`View review photo ${i + 1}`}
                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-muted transition-all hover:border-brand hover:shadow-md"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={url}
                            alt={`Review photo ${i + 1}`}
                            loading="lazy"
                            className={`${thumb} object-cover transition-transform duration-300 group-hover:scale-105`}
                        />
                    </button>
                ))}
            </div>

            <Dialog
                open={openIndex !== null}
                onOpenChange={(open) => !open && setOpenIndex(null)}
            >
                <DialogContent
                    className="max-w-lg overflow-hidden p-0 sm:rounded-2xl"
                    aria-describedby={undefined}
                >
                    <DialogTitle className="sr-only">
                        Review photo {(openIndex ?? 0) + 1}
                    </DialogTitle>
                    {openIndex !== null && photos[openIndex] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={photos[openIndex]}
                            alt={`Review photo ${openIndex + 1}`}
                            className="max-h-[75vh] w-full bg-muted object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
