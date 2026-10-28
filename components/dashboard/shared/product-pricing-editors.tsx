"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    CalendarIcon,
    ImagePlus,
    Plus,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseLocalDate, toLocalDateString } from "@/lib/utils/date";
import type {
    ProductColorOption,
    ProductOfferPrice,
    ProductVariant,
    ProductVariantAxis,
} from "@/lib/types/backend";

/* ── Color options editor ── */

export function ColorOptionsEditor({
    value,
    onChange,
}: {
    value: ProductColorOption[];
    onChange: (v: ProductColorOption[]) => void;
}) {
    const add = () => onChange([...value, { name: "", hex: "#000000" }]);
    const update = (i: number, patch: Partial<ProductColorOption>) =>
        onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
    const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Color Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={add}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Color
                </Button>
            </div>
            {value.length === 0 && (
                <p className="text-xs text-muted-foreground">
                    No color options. Leave empty if colors don't apply.
                </p>
            )}
            {value.map((color, i) => (
                <ColorRow
                    key={i}
                    color={color}
                    onChange={(patch) => update(i, patch)}
                    onRemove={() => remove(i)}
                    index={i}
                />
            ))}
        </div>
    );
}

/**
 * A single color row. The native color picker fires `onChange` continuously
 * while dragging the pointer; committing every change to the parent re-renders
 * the whole product form and lags. We keep a local draft hex while the picker
 * is open and only commit when it closes (mouse-up / blur).
 */
function ColorRow({
    color,
    onChange,
    onRemove,
    index,
}: {
    color: ProductColorOption;
    onChange: (patch: Partial<ProductColorOption>) => void;
    onRemove: () => void;
    index: number;
}) {
    const [draftHex, setDraftHex] = useState<string | null>(null);
    const hex = draftHex ?? (color.hex || "#000000");

    const commit = (next: string) => {
        setDraftHex(null);
        if (next !== color.hex) onChange({ hex: next });
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={hex}
                onChange={(e) => setDraftHex(e.target.value)}
                onBlur={(e) => commit(e.target.value)}
                onMouseUp={(e) => commit((e.target as HTMLInputElement).value)}
                onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                        commit((e.target as HTMLInputElement).value);
                    }
                }}
                className="h-9 w-12 shrink-0 cursor-pointer p-1"
                aria-label={`Color ${index + 1} hex`}
            />
            <Input
                value={color.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Black"
                aria-label={`Color ${index + 1} name`}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                aria-label="Remove color"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}

/* ── Attributes editor (variant axes) ── */

const MAX_ATTRIBUTES = 4;
const MAX_ATTRIBUTE_VALUES = 10;

export function AttributesEditor({
    value,
    onChange,
}: {
    value: ProductVariantAxis[];
    onChange: (v: ProductVariantAxis[]) => void;
}) {
    // Never treat "Color" as a manual attribute (swatch-driven, guide §7.3).
    const visible = value.filter(
        (a) => a.key.trim().toLowerCase() !== "color"
    );

    const add = () =>
        onChange([...visible, { key: "", values: [""] }]);
    const update = (i: number, patch: Partial<ProductVariantAxis>) =>
        onChange(
            visible.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
        );
    const remove = (i: number) =>
        onChange(visible.filter((_, idx) => idx !== i));

    const addValue = (i: number) => {
        if ((visible[i]?.values.length ?? 0) >= MAX_ATTRIBUTE_VALUES) return;
        onChange(
            visible.map((a, idx) =>
                idx === i ? { ...a, values: [...a.values, ""] } : a
            )
        );
    };
    const updateValue = (i: number, vi: number, val: string) =>
        onChange(
            visible.map((a, idx) =>
                idx === i
                    ? { ...a, values: a.values.map((v, x) => (x === vi ? val : v)) }
                    : a
            )
        );
    const removeValue = (i: number, vi: number) =>
        onChange(
            visible.map((a, idx) =>
                idx === i
                    ? { ...a, values: a.values.filter((_, x) => x !== vi) }
                    : a
            )
        );

    // "Color" is handled by the dedicated Color Options section and auto-added
    // as a "Color" axis, never let it be entered here (prevents duplicates
    // that grow on every save, e.g. "White" × 5).
    const updateKey = (i: number, key: string) => {
        if (key.trim().toLowerCase() === "color") {
            toast.info('Use the "Color Options" section above for colors.');
            return;
        }
        update(i, { key });
    };

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Attributes</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={add}
                    disabled={visible.length >= MAX_ATTRIBUTES}
                >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Attribute
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Define the variant dimensions (e.g. Size). Each attribute has a
                name and the allowed values variants can pick from. Color is
                handled separately in the Color Options section.
            </p>

            {visible.length === 0 && (
                <p className="text-xs text-muted-foreground">
                    No attributes yet. Add one to start defining variants.
                </p>
            )}

            {visible.map((attr, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center gap-2">
                        <Input
                            value={attr.key}
                            onChange={(e) => updateKey(i, e.target.value)}
                            placeholder="e.g. Size"
                            className="h-8 text-xs flex-1"
                            aria-label={`Attribute ${i + 1} name`}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(i)}
                            aria-label="Remove attribute"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="space-y-1.5">
                        {attr.values.map((val, vi) => (
                            <div key={vi} className="flex items-center gap-2">
                                <Input
                                    value={val}
                                    onChange={(e) =>
                                        updateValue(i, vi, e.target.value)
                                    }
                                    placeholder="Value (e.g. M, L, XL)"
                                    className="h-8 text-xs flex-1"
                                    aria-label={`${attr.key || "Attribute"} value ${vi + 1}`}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeValue(i, vi)}
                                    aria-label="Remove value"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addValue(i)}
                            disabled={attr.values.length >= MAX_ATTRIBUTE_VALUES}
                        >
                            <Plus className="h-3 w-3 mr-1" /> Add Value
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Variants editor ── */

export function VariantsEditor({
    hasVariants,
    onHasVariantsChange,
    value,
    onChange,
    attributes,
    colors,
    onImagesChange,
}: {
    hasVariants: boolean;
    onHasVariantsChange: (v: boolean) => void;
    value: ProductVariant[];
    onChange: (v: ProductVariant[]) => void;
    /** Attribute axes (from AttributesEditor) variants pick their values from. */
    attributes: ProductVariantAxis[];
    /** Color options (from ColorOptionsEditor) variants pick from, as a "Color" axis. */
    colors: ProductColorOption[];
    /** Reports each variant's uploaded image files (flat pool, variant order). */
    onImagesChange: (images: { variantIndex: number; files: File[] }[]) => void;
}) {
    const [variantImages, setVariantImages] = useState<
        { variantIndex: number; files: File[] }[]
    >([]);
    // Drag state for variant image reordering: which variant's slots are
    // being dragged and the slot index currently under the cursor.
    const [dragImage, setDragImage] = useState<{
        variantIndex: number;
        slotIndex: number;
    } | null>(null);
    const [dragOver, setDragOver] = useState<{
        variantIndex: number;
        slotIndex: number;
    } | null>(null);

    const reportImages = (next: { variantIndex: number; files: File[] }[]) => {
        setVariantImages(next);
        onImagesChange(next);
    };

    const axes = attributes.filter((a) => a.key.trim());

    // Color options become a selectable "Color" axis so variants can pick one.
    const colorNames = colors
        .map((c) => c.name.trim())
        .filter(Boolean);
    const colorAxis: ProductVariantAxis | null =
        colorNames.length > 0
            ? { key: "Color", values: colorNames }
            : null;
    const effectiveAxes: ProductVariantAxis[] = colorAxis
        ? [colorAxis, ...axes]
        : axes;

    const add = () => {
        onChange([
            ...value,
            { sku: "", attributes: {}, price: undefined, stock: 0, imageUrls: [] },
        ]);
    };
    const remove = (i: number) => {
        onChange(value.filter((_, idx) => idx !== i));
        reportImages(
            variantImages
                .filter((v) => v.variantIndex !== i)
                .map((v) =>
                    v.variantIndex > i
                        ? { ...v, variantIndex: v.variantIndex - 1 }
                        : v
                )
        );
    };
    const update = (i: number, patch: Partial<ProductVariant>) =>
        onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

    const pickValue = (i: number, key: string, val: string) => {
        onChange(
            value.map((v, idx) =>
                idx === i
                    ? { ...v, attributes: { ...v.attributes, [key]: val } }
                    : v
            )
        );
    };

    /** Existing image slots of a variant (stored objects). */
    const existingSlots = (i: number) =>
        (value[i]?.imageUrls ?? []).filter(
            (slot): slot is { publicId: string; url?: string; order?: number } =>
                !!slot && "publicId" in slot && !!slot.publicId
        );

    const moveImage = (i: number, from: number, to: number) => {
        const slots = existingSlots(i);
        if (from === to || to < 0 || to >= slots.length) return;
        const next = [...slots];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        update(i, { imageUrls: next });
    };

    const removeExistingImage = (i: number, slotIndex: number) => {
        update(i, {
            imageUrls: existingSlots(i).filter((_, x) => x !== slotIndex),
        });
    };

    const onSlotDragStart = (
        variantIndex: number,
        slotIndex: number
    ) => (e: React.DragEvent) => {
        setDragImage({ variantIndex, slotIndex });
        e.dataTransfer.effectAllowed = "move";
        const el = e.currentTarget as HTMLElement;
        if (el && "setDragImage" in e.dataTransfer) {
            e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
        }
    };
    const onSlotDragOver = (
        variantIndex: number,
        slotIndex: number
    ) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (
            dragOver?.variantIndex !== variantIndex ||
            dragOver.slotIndex !== slotIndex
        ) {
            setDragOver({ variantIndex, slotIndex });
        }
    };
    const onSlotDrop = (variantIndex: number, slotIndex: number) => (
        e: React.DragEvent
    ) => {
        e.preventDefault();
        if (dragImage && dragImage.variantIndex === variantIndex) {
            moveImage(variantIndex, dragImage.slotIndex, slotIndex);
        }
        setDragImage(null);
        setDragOver(null);
    };
    const onSlotDragEnd = () => {
        setDragImage(null);
        setDragOver(null);
    };

    const addVariantFiles = (variantIndex: number, list: FileList | null) => {
        if (!list) return;
        const added = Array.from(list).filter((f) => f.type.startsWith("image/"));
        if (added.length === 0) return;
        reportImages(
            (() => {
                const existing = variantImages.find(
                    (v) => v.variantIndex === variantIndex
                );
                const next = existing
                    ? { ...existing, files: [...existing.files, ...added] }
                    : { variantIndex, files: added };
                return [
                    ...variantImages.filter(
                        (v) => v.variantIndex !== variantIndex
                    ),
                    next,
                ];
            })()
        );
    };

    const removeVariantFile = (variantIndex: number, fileIndex: number) => {
        reportImages(
            variantImages
                .map((v) =>
                    v.variantIndex === variantIndex
                        ? {
                              ...v,
                              files: v.files.filter((_, i) => i !== fileIndex),
                          }
                        : v
                )
                .filter((v) => v.files.length > 0)
        );
    };

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Variants</Label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Has variants</span>
                    <Switch
                        checked={hasVariants}
                        onCheckedChange={onHasVariantsChange}
                    />
                </div>
            </div>

            {!hasVariants ? (
                <p className="text-xs text-muted-foreground">
                    Disabled. Turn on "Has variants" to define SKUs.
                </p>
            ) : (
                <>
                    {effectiveAxes.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            Define colors or attributes above first, each
                            variant picks a value per dimension.
                        </p>
                    )}

                    {value.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            No variants yet.
                        </p>
                    )}

                    <div className="space-y-3">
                        {value.map((variant, i) => (
                            <div
                                key={i}
                                className="space-y-2 rounded-md border p-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">
                                        Variant {i + 1}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => remove(i)}
                                        aria-label="Remove variant"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Input
                                        value={variant.sku}
                                        onChange={(e) =>
                                            update(i, { sku: e.target.value })
                                        }
                                        placeholder="SKU (leave empty to auto-generate)"
                                        className="h-8 text-xs flex-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Price</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={variant.price ?? ""}
                                            onChange={(e) =>
                                                update(i, {
                                                    price:
                                                        e.target.value === ""
                                                            ? undefined
                                                            : Number(e.target.value),
                                                })
                                            }
                                            placeholder="Overrides base"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Stock</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={variant.stock}
                                            onChange={(e) =>
                                                update(i, {
                                                    stock: Number(e.target.value),
                                                })
                                            }
                                            placeholder="0"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                {effectiveAxes.length > 0 && (
                                    <div className="space-y-2">
                                        {effectiveAxes.map((axis) => {
                                            const isColor = axis.key === "Color";
                                            return (
                                                <div
                                                    key={axis.key}
                                                    className="space-y-1"
                                                >
                                                    <Label className="text-xs">
                                                        {axis.key}
                                                    </Label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {axis.values
                                                            .filter((v) =>
                                                                v.trim()
                                                            )
                                                            .map((val) => {
                                                                const active =
                                                                    variant
                                                                        .attributes[
                                                                        axis.key
                                                                    ] === val;
                                                                const colorHex =
                                                                    isColor
                                                                        ? colors.find(
                                                                              (c) =>
                                                                                  c.name ===
                                                                                  val
                                                                          )
                                                                              ?.hex
                                                                        : undefined;
                                                                return (
                                                                    <button
                                                                        key={val}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            pickValue(
                                                                                i,
                                                                                axis.key,
                                                                                active
                                                                                    ? ""
                                                                                    : val
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            "h-7 rounded-md border px-2.5 text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5",
                                                                            active
                                                                                ? "border-primary bg-primary text-primary-foreground"
                                                                                : "border-border hover:bg-muted"
                                                                        )}
                                                                    >
                                                                        {colorHex && (
                                                                            <span
                                                                                className="h-3 w-3 rounded-full border"
                                                                                style={{
                                                                                    background:
                                                                                        colorHex,
                                                                                }}
                                                                            />
                                                                        )}
                                                                        {val}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Variant images: existing slots + new uploads,
                                    with order controls (order normalized 0,1,2…) */}
                                <div className="space-y-1.5 rounded-md border border-dashed p-2">
                                    <Label className="text-xs">
                                        Variant Images
                                    </Label>
                                    {existingSlots(i).length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap gap-3">
                                                {existingSlots(i).map(
                                                    (slot, si) => {
                                                        const isDragging =
                                                            dragImage?.variantIndex ===
                                                                i &&
                                                            dragImage.slotIndex ===
                                                                si;
                                                        const isOver =
                                                            dragOver?.variantIndex ===
                                                                i &&
                                                            dragOver.slotIndex ===
                                                                si &&
                                                            !isDragging;
                                                        return (
                                                            <div
                                                                key={slot.publicId}
                                                                draggable
                                                                onDragStart={onSlotDragStart(
                                                                    i,
                                                                    si
                                                                )}
                                                                onDragOver={onSlotDragOver(
                                                                    i,
                                                                    si
                                                                )}
                                                                onDrop={onSlotDrop(
                                                                    i,
                                                                    si
                                                                )}
                                                                onDragEnd={
                                                                    onSlotDragEnd
                                                                }
                                                                className={cn(
                                                                    "group relative h-20 w-20 overflow-hidden rounded-md border",
                                                                    isDragging &&
                                                                        "opacity-40",
                                                                    isOver &&
                                                                        "ring-2 ring-primary"
                                                                )}
                                                            >
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={
                                                                        slot.url ??
                                                                        ""
                                                                    }
                                                                    alt="variant"
                                                                    className="h-full w-full object-cover pointer-events-none"
                                                                />
                                                                <span
                                                                    className={cn(
                                                                        "absolute bottom-0.5 left-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-scrim-foreground",
                                                                        si === 0
                                                                            ? "bg-primary"
                                                                            : "bg-scrim/60"
                                                                    )}
                                                                >
                                                                    {si === 0
                                                                        ? "Cover"
                                                                        : si ===
                                                                          existingSlots(
                                                                              i
                                                                          ).length -
                                                                              1
                                                                        ? "Last"
                                                                        : `${si + 1}`}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeExistingImage(
                                                                            i,
                                                                            si
                                                                        )
                                                                    }
                                                                    className="absolute right-0.5 top-0.5 rounded-full bg-scrim/60 p-0.5 text-scrim-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-scrim/80"
                                                                    aria-label="Remove variant image"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                            {existingSlots(i).length > 1 && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    Drag to reorder, the first
                                                    image is the cover. Order:{" "}
                                                    {existingSlots(i)
                                                        .map((_, x) => x + 1)
                                                        .join(" → ")}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {(variantImages.find(
                                        (v) => v.variantIndex === i
                                    )?.files ?? []).length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {variantImages
                                                .find((v) => v.variantIndex === i)
                                                ?.files.map((file, fi) => (
                                                    <div
                                                        key={`${file.name}-${fi}`}
                                                        className="relative h-20 w-20 overflow-hidden rounded-md border"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={URL.createObjectURL(
                                                                file
                                                            )}
                                                            alt={file.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeVariantFile(
                                                                    i,
                                                                    fi
                                                                )
                                                            }
                                                            className="absolute right-0.5 top-0.5 rounded-full bg-scrim/60 p-0.5 text-scrim-foreground"
                                                            aria-label="Remove variant upload"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        id={`variant-images-${i}`}
                                        onChange={(e) => {
                                            addVariantFiles(i, e.target.files);
                                            e.target.value = "";
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    `variant-images-${i}`
                                                )
                                                ?.click()
                                        }
                                    >
                                        <ImagePlus className="h-3 w-3 mr-1" />
                                        Add images
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={add}
                            className="w-full"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

/* ── Offer price editor ── */

function OfferDateField({
    label,
    value,
    onChange,
    minDate,
}: {
    label: string;
    value?: string;
    onChange: (value: string | undefined) => void;
    minDate?: Date;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    render={
                        <Button
                            type="button"
                            variant="outline"
                            className={cn(
                                "w-full justify-start gap-2 font-normal",
                                !value && "text-muted-foreground"
                            )}
                        />
                    }
                >
                    <CalendarIcon className="h-4 w-4" />
                    {value
                        ? parseLocalDate(value.slice(0, 10)).toLocaleDateString()
                        : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={value ? parseLocalDate(value.slice(0, 10)) : undefined}
                        onSelect={(date) => {
                            setOpen(false);
                            onChange(date ? toLocalDateString(date) : undefined);
                        }}
                        disabled={(date) => (minDate ? date < minDate : false)}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function OfferPriceEditor({
    value,
    onChange,
}: {
    value: ProductOfferPrice | null;
    onChange: (v: ProductOfferPrice | null) => void;
}) {
    const [enabled, setEnabled] = useState(!!value);

    const set = (patch: Partial<ProductOfferPrice>) =>
        onChange({
            type: value?.type ?? "flat",
            value: value?.value ?? 0,
            startAt: value?.startAt,
            endAt: value?.endAt,
            isActive: true,
            ...patch,
        });

    const invalidRange =
        !!value?.startAt &&
        !!value?.endAt &&
        parseLocalDate(value.startAt.slice(0, 10)) >=
            parseLocalDate(value.endAt.slice(0, 10));

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Offer / Sale Price</Label>
                <Switch
                    checked={enabled}
                    onCheckedChange={(v) => {
                        setEnabled(v);
                        if (!v) onChange(null);
                        else set({ type: "flat", value: 0 });
                    }}
                />
            </div>

            {enabled && value && (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Type</Label>
                            <Select
                                value={value.type}
                                onValueChange={(v) =>
                                    set({
                                        type: (v ?? "flat") as ProductOfferPrice["type"],
                                    })
                                }
                            >
                                <SelectTrigger className="h-9 w-full cursor-pointer">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="flat" label="Flat amount off">
                                        Flat amount off
                                    </SelectItem>
                                    <SelectItem value="percentage" label="Percentage off">
                                        Percentage off
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                {value.type === "percentage" ? "Percent" : "Amount"}
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                max={value.type === "percentage" ? 100 : undefined}
                                step={value.type === "percentage" ? 1 : 0.01}
                                value={value.value}
                                onChange={(e) =>
                                    set({ value: Number(e.target.value) })
                                }
                                placeholder={
                                    value.type === "percentage" ? "10" : "5.00"
                                }
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <OfferDateField
                            label="Starts (optional)"
                            value={value.startAt}
                            onChange={(d) => set({ startAt: d })}
                        />
                        <OfferDateField
                            label="Ends (optional)"
                            value={value.endAt}
                            onChange={(d) => set({ endAt: d })}
                            minDate={
                                value.startAt
                                    ? parseLocalDate(value.startAt.slice(0, 10))
                                    : undefined
                            }
                        />
                    </div>
                    {invalidRange && (
                        <p className="text-[11px] font-medium text-destructive">
                            End date must be after the start date.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
