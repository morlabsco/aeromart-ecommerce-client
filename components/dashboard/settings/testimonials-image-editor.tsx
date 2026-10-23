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
import type { TestimonialItem } from "@/lib/types/backend";

/** Maximum testimonials the UX supports (backend allows up to 20). */
const MAX_TESTIMONIALS = 20;

interface TestimonialsImageEditorProps {
    heading: string;
    items: TestimonialItem[];
    onSave: (heading: string, items: TestimonialItem[], images: (File | null)[]) => void;
    saving: boolean;
}

export function TestimonialsImageEditor({
    heading,
    items,
    onSave,
    saving,
}: TestimonialsImageEditorProps) {
    const [title, setTitle] = useState(heading);
    const [list, setList] = useState<TestimonialItem[]>(items);
    // Positional files: items[i].avatar = files[i].
    const [files, setFiles] = useState<(File | null)[]>(items.map(() => null));

    const update = (index: number, patch: Partial<TestimonialItem>) => {
        setList((prev) =>
            prev.map((s, i) => (i === index ? { ...s, ...patch, order: i } : s))
        );
    };

    const add = () => {
        if (list.length >= MAX_TESTIMONIALS) {
            toast.info(`You can add up to ${MAX_TESTIMONIALS} testimonials. Remove one first to add another.`);
            return;
        }
        setList((prev) => [
            ...prev,
            { name: "", role: "", quote: "", rating: 5, avatar: "", order: prev.length },
        ]);
        setFiles((prev) => [...prev, null]);
    };

    const remove = (index: number) => {
        setList((prev) =>
            prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
        );
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <SectionCard title="Section Heading" description="Title shown above the testimonials.">
                <Field label="Heading">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
            </SectionCard>

            {list.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No testimonials yet, add one below.
                </p>
            )}

            {list.map((item, index) => (
                <SectionCard key={index} title={`Testimonial ${index + 1}`} description="Customer quote, rating and avatar.">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <ImageFileField
                                label="Avatar"
                                currentUrl={item.avatar || undefined}
                                onChange={(file) =>
                                    setFiles((prev) => {
                                        const next = [...prev];
                                        next[index] = file;
                                        return next;
                                    })
                                }
                                size="sm"
                                hint="PNG or SVG (transparent kept)."
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            aria-label="Remove testimonial"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Name">
                            <Input value={item.name} onChange={(e) => update(index, { name: e.target.value })} />
                        </Field>
                        <Field label="Role">
                            <Input value={item.role} onChange={(e) => update(index, { role: e.target.value })} />
                        </Field>
                    </div>
                    <Field label="Quote">
                        <Textarea value={item.quote} onChange={(e) => update(index, { quote: e.target.value })} rows={2} />
                    </Field>
                    <Field label="Rating (1-5)">
                        <Input
                            type="number"
                            min={1}
                            max={5}
                            value={item.rating}
                            onChange={(e) =>
                                update(index, {
                                    rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)),
                                })
                            }
                        />
                    </Field>
                </SectionCard>
            ))}

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={add}
                    disabled={list.length >= MAX_TESTIMONIALS}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Testimonial
                </Button>
                <SaveButton onSave={() => onSave(title, list, files)} saving={saving} />
            </div>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {list.length}/{MAX_TESTIMONIALS} testimonials added, up to {MAX_TESTIMONIALS} can be shown.
            </p>
        </div>
    );
}
