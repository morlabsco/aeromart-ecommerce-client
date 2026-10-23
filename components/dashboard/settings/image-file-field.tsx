"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/svg+xml"];

/** Maximum settings image upload size (backend rejects anything larger). */
export const MAX_SETTINGS_IMAGE_SIZE = 1024 * 1024; // 1 MB

export function isValidSettingsImage(file: File): boolean {
    return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/** Human-readable size for error messages, e.g. "1 MB". */
function formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(bytes / 1024)} KB`;
}

interface ImageFileFieldProps {
    label: string;
    /** Current value shown when no new file is chosen (URL from settings). */
    currentUrl?: string;
    /** Callback with the selected file (or null when cleared). */
    onChange: (file: File | null) => void;
    hint?: string;
    /** Preview box size: "sm" for favicon-like, "md" default, "lg" for hero/about. */
    size?: "sm" | "md" | "lg";
    /** Allow JPEG too (hero/about photos where transparency isn't required). */
    allowJpeg?: boolean;
}

/**
 * File-upload input with live preview. PNG/SVG by default (transparency kept);
 * set `allowJpeg` for photographic sections (hero, about, limited offer).
 */
export function ImageFileField({
    label,
    currentUrl,
    onChange,
    hint,
    size = "md",
    allowJpeg = false,
}: ImageFileFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const boxClass =
        size === "sm"
            ? "h-12 w-12 rounded-md"
            : size === "lg"
            ? "h-28 w-28 rounded-lg"
            : "h-16 w-16 rounded-lg";

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const ok = allowJpeg
            ? ALLOWED_IMAGE_TYPES.includes(file.type) ||
              file.type === "image/jpeg" ||
              file.type === "image/webp"
            : isValidSettingsImage(file);
        if (!ok) {
            toast.error(
                allowJpeg
                    ? "Unsupported image type. Use PNG, SVG, JPEG or WebP."
                    : "Unsupported image type. Use PNG or SVG (transparent background kept)."
            );
            return;
        }
        if (file.size > MAX_SETTINGS_IMAGE_SIZE) {
            toast.error(
                `Image is too large (${formatSize(file.size)}). Maximum size is 1 MB.`
            );
            return;
        }
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        onChange(file);
    };

    const clear = () => {
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        onChange(null);
    };

    const accept = allowJpeg
        ? "image/png,image/svg+xml,image/jpeg,image/webp"
        : "image/png,image/svg+xml";

    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex shrink-0 items-center justify-center overflow-hidden border bg-muted",
                        boxClass
                    )}
                >
                    {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={previewUrl}
                            alt={`${label} preview`}
                            className="h-full w-full object-contain"
                        />
                    ) : currentUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={currentUrl}
                            alt={`Current ${label.toLowerCase()}`}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <span className="px-1 text-center text-[10px] text-muted-foreground">
                            None
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => inputRef.current?.click()}
                    >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {previewUrl
                            ? "Replace image"
                            : currentUrl
                            ? "Change image"
                            : "Upload image"}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                        {hint ??
                            (allowJpeg
                                ? "PNG, SVG, JPEG or WebP, up to 1 MB."
                                : "PNG or SVG only, up to 1 MB (transparent background kept).")}
                    </p>
                </div>
                {(previewUrl || currentUrl) && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={clear}
                        aria-label={`Clear ${label}`}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
                <Input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleSelect}
                />
            </div>
        </div>
    );
}
