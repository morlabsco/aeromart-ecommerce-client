"use client";

import { useState } from "react";
import { Plus, X, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Field,
    SaveButton,
    SectionCard,
} from "@/components/dashboard/settings/settings-manager";
import { ImageFileField } from "@/components/dashboard/settings/image-file-field";
import type { HeroSlide } from "@/lib/types/backend";

/** Maximum hero slides the UX supports (backend allows up to 20). */
const MAX_SLIDES = 10;

interface HeroEditorProps {
    slides: HeroSlide[];
    onSave: (slides: HeroSlide[], images: (File | null)[]) => void;
    saving: boolean;
}

export function HeroImageEditor({ slides, onSave, saving }: HeroEditorProps) {
    const [items, setItems] = useState<HeroSlide[]>(slides);
    // Positional files: items[i].image = files[i] (per backend contract).
    const [files, setFiles] = useState<(File | null)[]>(
        slides.map(() => null)
    );

    const update = (index: number, patch: Partial<HeroSlide>) => {
        setItems((prev) =>
            prev.map((s, i) => (i === index ? { ...s, ...patch, order: i } : s))
        );
    };

    const add = () => {
        if (items.length >= MAX_SLIDES) {
            toast.info(`You can add up to ${MAX_SLIDES} slides. Remove one first to add another.`);
            return;
        }
        setItems((prev) => [
            ...prev,
            {
                image: "",
                headline: "",
                subtext: "",
                ctaText: "Shop Now",
                ctaLink: "/products",
                order: prev.length,
            },
        ]);
        setFiles((prev) => [...prev, null]);
    };

    const remove = (index: number) => {
        setItems((prev) =>
            prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
        );
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No slides yet, add one below.
                </p>
            )}

            {items.map((slide, index) => (
                <SectionCard
                    key={index}
                    title={`Slide ${index + 1}`}
                    description="Image, headline, subtext and call-to-action."
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <ImageFileField
                                label="Slide Image"
                                currentUrl={slide.image || undefined}
                                onChange={(file) =>
                                    setFiles((prev) => {
                                        const next = [...prev];
                                        next[index] = file;
                                        return next;
                                    })
                                }
                                size="lg"
                                allowJpeg
                                hint="PNG, SVG, JPEG or WebP."
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            aria-label="Remove slide"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <Field label="Headline">
                        <Input
                            value={slide.headline}
                            onChange={(e) => update(index, { headline: e.target.value })}
                        />
                    </Field>
                    <Field label="Subtext">
                        <Textarea
                            value={slide.subtext}
                            onChange={(e) => update(index, { subtext: e.target.value })}
                            rows={2}
                        />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="CTA Text">
                            <Input
                                value={slide.ctaText}
                                onChange={(e) => update(index, { ctaText: e.target.value })}
                            />
                        </Field>
                        <Field label="CTA Link">
                            <Input
                                value={slide.ctaLink}
                                onChange={(e) => update(index, { ctaLink: e.target.value })}
                                placeholder="/products"
                            />
                        </Field>
                    </div>
                </SectionCard>
            ))}

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={add}
                    disabled={items.length >= MAX_SLIDES}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slide
                </Button>
                <SaveButton
                    onSave={() => onSave(items, files)}
                    saving={saving}
                />
            </div>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {items.length}/{MAX_SLIDES} slides added, up to {MAX_SLIDES} slides can be shown
                in the hero carousel.
            </p>
        </div>
    );
}
