"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/utils/date";
import {
    Field,
    SaveButton,
    SectionCard,
} from "@/components/dashboard/settings/settings-manager";
import { ImageFileField } from "@/components/dashboard/settings/image-file-field";
import type { SettingsLimitedOffer } from "@/lib/types/backend";

interface LimitedOfferImageEditorProps {
    offer: SettingsLimitedOffer;
    onSave: (offer: SettingsLimitedOffer, images: (File | null)[]) => void;
    saving: boolean;
}

export function LimitedOfferImageEditor({
    offer,
    onSave,
    saving,
}: LimitedOfferImageEditorProps) {
    const [form, setForm] = useState(offer);
    // images[0] → limitedOffer.image.
    const [image, setImage] = useState<File | null>(null);

    const set = (patch: Partial<SettingsLimitedOffer>) =>
        setForm((prev) => ({ ...prev, ...patch }));

    return (
        <SectionCard title="Limited Offer" description="Banner shown to drive urgency.">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="cursor-pointer">Enabled</Label>
                    <p className="text-[11px] text-muted-foreground">Show the limited-offer banner.</p>
                </div>
                <Switch checked={form.enabled} onCheckedChange={(v) => set({ enabled: v })} />
            </div>

            {form.enabled && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Badge">
                            <Input value={form.badge} onChange={(e) => set({ badge: e.target.value })} />
                        </Field>
                        <Field label="Title">
                            <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
                        </Field>
                    </div>
                    <Field label="Subtitle">
                        <Textarea value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} rows={2} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="CTA Text">
                            <Input value={form.ctaText} onChange={(e) => set({ ctaText: e.target.value })} />
                        </Field>
                        <Field label="CTA Link">
                            <Input value={form.ctaLink} onChange={(e) => set({ ctaLink: e.target.value })} placeholder="/products" />
                        </Field>
                    </div>
                    <ImageFileField
                        label="Banner Image"
                        currentUrl={form.image || undefined}
                        onChange={setImage}
                        size="lg"
                        allowJpeg
                        hint="PNG, SVG, JPEG or WebP."
                    />
                    <Field label="Ends At" hint="Offer ends at 11:59 PM on the selected day.">
                        <Popover>
                            <PopoverTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start gap-2 font-normal",
                                            !form.endsAt && "text-muted-foreground"
                                        )}
                                    />
                                }
                            >
                                <CalendarIcon className="h-4 w-4" />
                                {form.endsAt
                                    ? parseLocalDate(form.endsAt.slice(0, 10)).toLocaleDateString()
                                    : "Pick an end date"}
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={
                                        form.endsAt
                                            ? parseLocalDate(form.endsAt.slice(0, 10))
                                            : undefined
                                    }
                                    onSelect={(date) => {
                                        if (!date) return;
                                        // Convert to mongoose-compatible ISO timestamp at end-of-day.
                                        set({
                                            endsAt: new Date(
                                                date.getFullYear(),
                                                date.getMonth(),
                                                date.getDate(),
                                                23,
                                                59,
                                                59
                                            ).toISOString(),
                                        });
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </Field>
                </div>
            )}

            <SaveButton
                onSave={() =>
                    onSave(
                        {
                            ...form,
                            // Keep the stored image unless a new one replaces it.
                            image: form.image,
                        },
                        [image]
                    )
                }
                saving={saving}
            />
        </SectionCard>
    );
}
