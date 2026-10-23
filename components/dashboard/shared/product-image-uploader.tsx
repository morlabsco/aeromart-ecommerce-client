"use client";

import { useCallback, useRef, useState } from "react";
import { GripVertical, ImagePlus, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types/backend";

interface ExistingImageItem {
  publicId: string;
  url: string;
  order: number;
}

/** Stable identity for every tile: existing images use publicId, files use a uid. */
interface GalleryItem {
  id: string;
  /** Set when this tile is a newly added file. */
  file?: File;
  url: string;
}

interface ProductImageUploaderProps {
  /** Existing (remote) images , objects now (order: 0 = cover). */
  existingImages?: (ExistingImageItem | string)[];
  /** Newly added/uploaded files. */
  files: File[];
  onChange: (files: File[]) => void;
  /** Reports which existing images to keep (with new order) and which to remove. */
  onExistingChange?: (payload: {
    keep: { publicId: string; order: number }[];
    removed: string[];
  }) => void;
  maxImages?: number;
}

const MAX_IMAGES = 10;

let fileUid = 0;

function toExistingItem(img: ExistingImageItem | string): ExistingImageItem {
  if (typeof img === "string") {
    return { publicId: img, url: img, order: 0 };
  }
  return img;
}

/**
 * Upload + reorder image gallery for product forms.
 * - Accepts multiple image files (up to maxImages total).
 * - Existing images live in an internal `orderedExisting` state seeded from
 *   props, so dragging existing images persists (the prop itself never
 *   changes while the user edits). New files are tracked by reference.
 * - Every reorder/removal reports `keepImages` + `removedImageIds` (guide §7.4).
 * - The first tile is the cover (order 0).
 */
export function ProductImageUploader({
    existingImages = [],
    files,
    onChange,
    onExistingChange,
    maxImages = MAX_IMAGES,
}: ProductImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const [removedExisting, setRemovedExisting] = useState<Set<string>>(new Set());
    // Internal working copy of existing images so reordering persists even
    // though the parent's `existingImages` prop stays fixed while editing.
    const [orderedExisting, setOrderedExisting] = useState<ExistingImageItem[]>(
        () => existingImages.map(toExistingItem)
    );

    // Stable per-File identity + cached object URLs, keyed by File reference
    // (files may share names, so identity is by object, not name).
    const fileMetaRef = useRef<Map<File, { id: string; url: string }>>(new Map());

    const getFileMeta = (file: File) => {
        let meta = fileMetaRef.current.get(file);
        if (!meta) {
            meta = { id: `file-${++fileUid}`, url: URL.createObjectURL(file) };
            fileMetaRef.current.set(file, meta);
        }
        return meta;
    };

    // Drop metadata for files that are no longer in the list.
    const reconcileFileRefs = (list: File[]) => {
        const current = new Set(list);
        for (const key of fileMetaRef.current.keys()) {
            if (!current.has(key)) fileMetaRef.current.delete(key);
        }
    };
    reconcileFileRefs(files);

    const visibleExisting = orderedExisting.filter(
        (img) => !removedExisting.has(img.publicId)
    );

    // Visible tiles: visible existing images first, then live files.
    const items: GalleryItem[] = [
        ...visibleExisting.map((img) => ({
            id: `existing-${img.publicId}`,
            url: img.url,
        })),
        ...files.map((file) => ({
            id: getFileMeta(file).id,
            file,
            url: getFileMeta(file).url,
        })),
    ];

    const reportExisting = useCallback(
        (visible: ExistingImageItem[], removed: Set<string>) => {
            if (!onExistingChange) return;
            onExistingChange({
                keep: visible.map((img, i) => ({
                    publicId: img.publicId,
                    order: i,
                })),
                removed: Array.from(removed),
            });
        },
        [onExistingChange]
    );

    const removeImage = useCallback(
        (index: number) => {
            const target = items[index];
            if (!target) return;
            if (target.file) {
                // Remove a newly added file by reference (no index math).
                onChange(files.filter((f) => f !== target.file));
            } else {
                // Remove an existing image (tracked for removedImageIds).
                const publicId = target.id.replace("existing-", "");
                setRemovedExisting((prev) => {
                    const next = new Set(prev);
                    next.add(publicId);
                    reportExisting(visibleExisting, next);
                    return next;
                });
            }
        },
        [items, files, visibleExisting, onChange, reportExisting]
    );

    const onFilesSelected = useCallback(
        (list: FileList | null) => {
            if (!list) return;
            const added = Array.from(list).filter((f) =>
                f.type.startsWith("image/")
            );
            if (added.length === 0) return;
            const next = [...files, ...added].slice(0, maxImages);
            onChange(next);
        },
        [files, maxImages, onChange]
    );

    const handleDragStart = (index: number) => (e: React.DragEvent) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
        const el = e.currentTarget as HTMLElement;
        if (el && "setDragImage" in e.dataTransfer) {
            e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
        }
    };

    const handleDragOver = (index: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overIndex !== index) setOverIndex(index);
    };

    const handleDrop = (index: number) => (e: React.DragEvent) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null);
            setOverIndex(null);
            return;
        }
        const next = [...items];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(index, 0, moved);

        // Split back into existing (reorder) + files, preserving the new order.
        const newVisibleIds = next
            .filter((it) => !it.file)
            .map((it) => it.id.replace("existing-", ""));
        const newVisible = visibleExisting
            .filter((img) => newVisibleIds.includes(img.publicId))
            .sort(
                (a, b) =>
                    newVisibleIds.indexOf(a.publicId) -
                    newVisibleIds.indexOf(b.publicId)
            );
        const newFiles = next
            .filter((it): it is typeof it & { file: File } => !!it.file)
            .map((it) => it.file);

        // Persist the new existing-image order locally so the UI stays in sync.
        setOrderedExisting(newVisible);
        setRemovedExisting((prev) => {
            reportExisting(newVisible, prev);
            return prev;
        });
        onChange(newFiles);

        setDragIndex(null);
        setOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setOverIndex(null);
    };

    const totalCount = visibleExisting.length + files.length;

    return (
        <div className="space-y-4">
            <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 cursor-pointer border-dashed"
            >
                <ImagePlus className="mr-2 h-4 w-4" />
                {files.length > 0
                    ? `Add more images (${totalCount}/${maxImages})`
                    : existingImages.length > 0
                    ? "Choose replacement images"
                    : "Choose images"}
            </Button>
            <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                    onFilesSelected(e.target.files);
                    e.target.value = "";
                }}
            />

            {items.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={handleDragStart(index)}
                            onDragOver={handleDragOver(index)}
                            onDrop={handleDrop(index)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                "relative aspect-square rounded-md border overflow-hidden group",
                                dragIndex === index && "opacity-40",
                                overIndex === index &&
                                    dragIndex !== null &&
                                    dragIndex !== index &&
                                    "ring-2 ring-primary"
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.url}
                                alt={item.file?.name ?? "product image"}
                                className="h-full w-full object-cover pointer-events-none"
                            />
                            {index === 0 && (
                                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    Cover
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute top-1 left-1 rounded bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-3.5 w-3.5" />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                aria-label={
                                    item.file
                                        ? `Remove ${item.file.name}`
                                        : "Remove existing image"
                                }
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>
                        <span className="font-medium text-foreground">
                            Reminder:
                        </span>{" "}
                        the first image is the product cover. Drag to reorder,
                        use the × to remove an image before saving.
                    </p>
                </div>
            </div>

            {totalCount >= maxImages && (
                <p className="text-xs text-muted-foreground">
                    Maximum {maxImages} images reached.
                </p>
            )}
            {totalCount > 1 && (
                <p className="text-xs text-muted-foreground">
                    Drag images to reorder them. The first image is the cover.
                </p>
            )}
        </div>
    );
}
