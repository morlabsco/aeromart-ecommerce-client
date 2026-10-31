"use client";

import { useEffect, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Review photos — shared thumbnail strip for customer-submitted review
 * photos (max 3). Clicking a thumbnail opens a lightbox dialog: white card,
 * an explicit close button, previous/next arrows and a thumbnail rail when
 * there is more than one photo (arrow keys work too). Used by the storefront
 * product page, the dashboard review details and customer my-reviews.
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

    // Safe index even if the photos array ever shrinks while open.
    const index = Math.min(openIndex ?? 0, Math.max(photos.length - 1, 0));
    const hasMany = photos.length > 1;
    const atStart = index === 0;
    const atEnd = index === photos.length - 1;

    // Arrow-key navigation while the lightbox is open (Escape is the
    // dialog's own behaviour).
    useEffect(() => {
        if (openIndex === null) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight" && index < photos.length - 1) {
                setOpenIndex(index + 1);
            }
            if (event.key === "ArrowLeft" && index > 0) {
                setOpenIndex(index - 1);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [openIndex, index, photos.length]);

    if (photos.length === 0) return null;

    // Empty photos while open (e.g. a review updated underneath) close the
    // dialog instead of rendering an empty lightbox.
    const isOpen = openIndex !== null && photos.length > 0;

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
                open={isOpen}
                onOpenChange={(open) => !open && setOpenIndex(null)}
            >
                <DialogContent
                    showCloseButton={false}
                    aria-describedby={undefined}
                    className="gap-0 overflow-hidden rounded-2xl bg-card p-0 sm:max-w-2xl"
                >
                    <DialogTitle className="sr-only">
                        Review photo {index + 1}
                        {hasMany ? ` of ${photos.length}` : ""}
                    </DialogTitle>

                    {/* Header — explicit close button users can spot. */}
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <p className="text-sm font-semibold">
                            Photo{" "}
                            <span className="text-muted-foreground">
                                {index + 1} of {photos.length}
                            </span>
                        </p>
                        <DialogClose
                            aria-label="Close photo viewer"
                            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs transition-colors hover:border-brand hover:text-brand"
                        >
                            <X className="size-4" />
                        </DialogClose>
                    </div>

                    {/* Stage — image with side navigation. */}
                    <div className="relative flex min-h-[16rem] items-center justify-center bg-muted/40 p-4 sm:p-6">
                        {photos[index] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={photos[index]}
                                src={photos[index]}
                                alt={`Review photo ${index + 1}`}
                                className="max-h-[62vh] w-auto max-w-full animate-in fade-in-0 rounded-lg object-contain duration-200"
                            />
                        )}

                        {hasMany && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(index - 1)}
                                    disabled={atStart}
                                    aria-label="Previous photo"
                                    className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40 sm:left-3 sm:size-10"
                                >
                                    <ChevronLeft className="size-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(index + 1)}
                                    disabled={atEnd}
                                    aria-label="Next photo"
                                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40 sm:right-3 sm:size-10"
                                >
                                    <ChevronRight className="size-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail rail — jump straight to any photo. */}
                    {hasMany && (
                        <div className="flex items-center justify-center gap-2 border-t px-4 py-3">
                            {photos.map((url, i) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => setOpenIndex(i)}
                                    aria-label={`Show photo ${i + 1}`}
                                    aria-current={i === index}
                                    className={cn(
                                        "cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
                                        i === index
                                            ? "border-brand"
                                            : "border-transparent opacity-60 hover:opacity-100",
                                    )}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt=""
                                        loading="lazy"
                                        className="size-12 object-cover sm:size-14"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
