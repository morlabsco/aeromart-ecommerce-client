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
import type { SettingsAbout, SettingsAboutStat } from "@/lib/types/backend";

/** Maximum stats shown in the about section. */
const MAX_STATS = 10;

interface AboutImageEditorProps {
    about: SettingsAbout;
    onSave: (about: SettingsAbout, images: (File | null)[]) => void;
    saving: boolean;
}

export function AboutImageEditor({ about, onSave, saving }: AboutImageEditorProps) {
    const [story, setStory] = useState(about.story);
    const [mission, setMission] = useState(about.mission);
    const [stats, setStats] = useState<SettingsAboutStat[]>(about.stats);
    // images[0] → about.image.
    const [image, setImage] = useState<File | null>(null);

    const updateStat = (index: number, patch: Partial<SettingsAboutStat>) => {
        setStats((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const addStat = () => {
        if (stats.length >= MAX_STATS) {
            toast.info(`You can add up to ${MAX_STATS} stats. Remove one first to add another.`);
            return;
        }
        setStats((prev) => [...prev, { label: "", value: "" }]);
    };
    const removeStat = (index: number) => setStats((prev) => prev.filter((_, i) => i !== index));

    return (
        <div className="space-y-4">
            <SectionCard title="Story & Mission" description="About section content.">
                <Field label="Story">
                    <Textarea value={story} onChange={(e) => setStory(e.target.value)} rows={4} />
                </Field>
                <Field label="Mission">
                    <Textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={3} />
                </Field>
                <ImageFileField
                    label="About Image"
                    currentUrl={about.image || undefined}
                    onChange={setImage}
                    size="lg"
                    allowJpeg
                    hint="PNG, SVG, JPEG or WebP."
                />
            </SectionCard>

            <SectionCard title="Stats" description="Key numbers shown in the about section.">
                {stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={stat.label}
                            onChange={(e) => updateStat(index, { label: e.target.value })}
                            placeholder="Label"
                            className="flex-1"
                        />
                        <Input
                            value={stat.value}
                            onChange={(e) => updateStat(index, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeStat(index)}
                            aria-label="Remove stat"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStat}
                    disabled={stats.length >= MAX_STATS}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Stat
                </Button>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {stats.length}/{MAX_STATS} stats added , up to {MAX_STATS} can be shown.
                </p>
            </SectionCard>

            <SaveButton
                onSave={() => onSave({ story, mission, image: about.image, stats }, [image])}
                saving={saving}
            />
        </div>
    );
}
