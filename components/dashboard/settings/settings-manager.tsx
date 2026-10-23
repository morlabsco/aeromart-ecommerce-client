"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Palette, Plus, Save, Settings2, X, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    updateBrandSettings,
    updateSettingsSection,
    applySettingsPreset,
} from "@/lib/services/settings";
import { NICHE_OPTIONS } from "@/lib/settings-niches";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/utils/date";
import {
    FONT_OPTIONS,
    FONT_SIZE_UNITS,
    fontStack,
    parseCssSize,
    sizeOptionsForUnit,
} from "@/lib/settings-fonts";
import { convertToOklch, oklchToHex } from "@/lib/utils/color";
import { deriveColorSet } from "@/lib/utils/color-theme";
import { isErrorResult } from "@/lib/utils/result";
import type {
    Settings,
    SettingsBrand,
    SettingsColorSet,
    SettingsSectionKey,
    HeroSlide,
    TestimonialItem,
    NavbarLink,
    SettingsFooterColumn,
    SettingsAboutStat,
    ServiceResult,
} from "@/lib/types/backend";

/* ---------------------------------- utils --------------------------------- */

function MoneyishNumber(value: string | number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

/* ------------------------------ shared inputs ------------------------------ */

export function Field({
    label,
    children,
    hint,
}: {
    label: string;
    children: React.ReactNode;
    hint?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
            {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
    );
}

export function SaveButton({
    onSave,
    saving,
    label = "Save Section",
}: {
    onSave: () => void;
    saving: boolean;
    label?: string;
}) {
    return (
        <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    {label}
                </>
            )}
        </Button>
    );
}

export function SectionCard({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    );
}

export function UrlInput({
    value,
    onChange,
    placeholder = "https://...",
    label,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    label: string;
}) {
    return (
        <Field label={label}>
            <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        </Field>
    );
}

/* ---------------------------------- brand ---------------------------------- */

export function BrandEditor({
    brand,
    onSave,
    saving,
}: {
    brand: SettingsBrand;
    onSave: (brand: Partial<SettingsBrand>) => void;
    saving: boolean;
}) {
    const [name, setName] = useState(brand.name);
    const [tagline, setTagline] = useState(brand.tagline);
    const [description, setDescription] = useState(brand.description);
    const [niche, setNiche] = useState(brand.niche);
    const [nicheLabel, setNicheLabel] = useState(brand.nicheLabel);
    const [logo, setLogo] = useState(brand.logo);
    const [favicon, setFavicon] = useState(brand.favicon);

    return (
        <SectionCard title="Brand Identity" description="Store name, tagline, logo and niche.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Brand Name">
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Tagline">
                    <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </Field>
            </div>
            <Field label="Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Niche">
                    <Select value={niche} onValueChange={(v) => setNiche(String(v ?? ""))}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {NICHE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} label={option.label}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Niche Label">
                    <Input value={nicheLabel} onChange={(e) => setNicheLabel(e.target.value)} />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UrlInput label="Logo URL" value={logo} onChange={setLogo} />
                <UrlInput label="Favicon URL" value={favicon} onChange={setFavicon} />
            </div>
            <SaveButton
                onSave={() =>
                    onSave({
                        name,
                        tagline,
                        description,
                        niche,
                        nicheLabel,
                        logo,
                        favicon,
                    })
                }
                saving={saving}
                label="Save Brand"
            />
        </SectionCard>
    );
}

/* ---------------------------------- theme ---------------------------------- */

/**
 * The only colors the admin edits directly. Every other color token is
 * derived from these four so the UI stays minimal while the full set is
 * still sent to the backend.
 */
const CORE_COLOR_KEYS = [
    "primary",
    "secondary",
    "background",
    "foreground",
] as const;

type CoreColorKey = (typeof CORE_COLOR_KEYS)[number];

/** Human-readable labels for the theme color variables. */
const COLOR_LABELS: Record<string, string> = {
    primary: "Primary",
    primaryForeground: "Primary Foreground",
    secondary: "Secondary",
    secondaryForeground: "Secondary Foreground",
    background: "Background",
    foreground: "Foreground",
    accent: "Accent",
    accentForeground: "Accent Foreground",
    muted: "Muted",
    mutedForeground: "Muted Foreground",
    border: "Border",
    destructive: "Destructive",
    ring: "Ring",
    card: "Card",
    cardForeground: "Card Foreground",
    popover: "Popover",
    popoverForeground: "Popover Foreground",
    input: "Input",
    chart1: "Chart 1",
    chart2: "Chart 2",
    chart3: "Chart 3",
    chart4: "Chart 4",
    chart5: "Chart 5",
    sidebar: "Sidebar",
    sidebarForeground: "Sidebar Foreground",
    sidebarPrimary: "Sidebar Primary",
    sidebarPrimaryForeground: "Sidebar Primary Foreground",
    sidebarAccent: "Sidebar Accent",
    sidebarAccentForeground: "Sidebar Accent Foreground",
    sidebarBorder: "Sidebar Border",
    sidebarRing: "Sidebar Ring",
};

/** Common radius presets for the theme. */
const RADIUS_OPTIONS = [
    { value: "0", label: "0 (sharp)" },
    { value: "0.25rem", label: "0.25rem" },
    { value: "0.375rem", label: "0.375rem" },
    { value: "0.5rem", label: "0.5rem" },
    { value: "0.625rem", label: "0.625rem" },
    { value: "0.75rem", label: "0.75rem" },
    { value: "1rem", label: "1rem" },
    { value: "1.25rem", label: "1.25rem" },
    { value: "1.5rem", label: "1.5rem" },
    { value: "2rem", label: "2rem" },
];

/**
 * Color picker that stores the value as oklch (auto-converts via culori).
 *
 * The native picker fires `onChange` continuously while dragging, and the
 * oklch↔hex conversions are not free — committing every change to the parent
 * re-renders the whole theme editor and lags. Keep a local draft while the
 * picker is open and only commit when it closes (mouse-up / blur / Enter),
 * mirroring the product variant color rows.
 */
function ColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [draftHex, setDraftHex] = useState<string | null>(null);
    const [draftText, setDraftText] = useState<string | null>(null);

    const committedHex = oklchToHex(value) ?? "#000000";
    const hex = draftHex ?? committedHex;
    const text = draftText ?? value;

    const commitHex = (next: string) => {
        setDraftHex(null);
        if (next !== committedHex) onChange(convertToOklch(next));
    };

    const commitText = () => {
        if (draftText !== null) {
            onChange(draftText);
            setDraftText(null);
        }
    };

    return (
        <Field
            label={label}
            hint="Picked color is stored as oklch."
        >
            <div className="flex items-center gap-2">
                <label
                    className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border"
                    style={{ background: hex }}
                    title="Pick a color"
                >
                    <input
                        type="color"
                        value={hex}
                        onChange={(e) => setDraftHex(e.target.value)}
                        onBlur={(e) => commitHex(e.target.value)}
                        onMouseUp={(e) => commitHex((e.target as HTMLInputElement).value)}
                        onKeyUp={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") {
                                commitHex((e.target as HTMLInputElement).value);
                            }
                        }}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={`Pick ${label} color`}
                    />
                </label>
                <Input
                    value={text}
                    onChange={(e) => setDraftText(e.target.value)}
                    onBlur={commitText}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.currentTarget.blur();
                        }
                    }}
                    className="font-mono text-xs"
                />
            </div>
        </Field>
    );
}

/** Font family select with a styled preview of each option. */
function FontFamilyField({
    label = "Font Family",
    hint = "Shown on the storefront headings and body text.",
    value,
    onChange,
}: {
    label?: string;
    hint?: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <Field label={label} hint={hint}>
            <Select value={value} onValueChange={(v) => onChange(String(v ?? ""))}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                        <SelectItem
                            key={font.value}
                            value={font.value}
                            label={font.label}
                        >
                            <span style={{ fontFamily: fontStack(font.value) }}>
                                {font.label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    );
}

/** Font size select: pick a unit then a magnitude (px, rem, em, %, pt, vw…) or enter custom. */
function FontSizeField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [customMode, setCustomMode] = useState(false);
    const { amount, unit } = parseCssSize(value);
    const effectiveUnit = FONT_SIZE_UNITS.includes(unit as (typeof FONT_SIZE_UNITS)[number])
        ? (unit as (typeof FONT_SIZE_UNITS)[number])
        : "px";

    const options = sizeOptionsForUnit(effectiveUnit);
    // Ensure the current value is offered.
    const allOptions = options.some((o) => o.value === value)
        ? options
        : [{ value, label: value }, ...options];

    return (
        <Field label={label}>
            {customMode ? (
                <div className="flex items-center gap-1.5">
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="1.25rem"
                        className="font-mono text-xs"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setCustomMode(false)}
                    >
                        Pick
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-1.5">
                    <Select
                        value={effectiveUnit}
                        onValueChange={(u) => {
                            const nextUnit = String(u ?? "px");
                            const nextAmount = amount || "1";
                            onChange(`${nextAmount}${nextUnit}`);
                        }}
                    >
                        <SelectTrigger className="w-20 shrink-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FONT_SIZE_UNITS.map((u) => (
                                <SelectItem key={u} value={u} label={u}>
                                    {u}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={value}
                        onValueChange={(v) => {
                            const next = String(v ?? "");
                            if (next === "__custom__") {
                                setCustomMode(true);
                                return;
                            }
                            onChange(next);
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {allOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                            <SelectItem value="__custom__" label="Custom…">
                                Custom…
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setCustomMode(true)}
                        aria-label={`Custom ${label} size`}
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
        </Field>
    );
}

/** Radius select with common presets + a custom (free-text) option. */
function RadiusField({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [customMode, setCustomMode] = useState(false);
    const isPreset = RADIUS_OPTIONS.some((o) => o.value === value);

    return (
        <Field
            label="Radius"
            hint="Border radius used across the storefront (rounded corners)."
        >
            {customMode || !isPreset ? (
                <div className="flex items-center gap-2">
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="0.625rem"
                        className="font-mono text-xs"
                    />
                    {!isPreset && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={() => {
                                setCustomMode(false);
                                onChange("0.625rem");
                            }}
                        >
                            Use preset
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Select
                        value={value}
                        onValueChange={(v) => {
                            const next = String(v ?? "");
                            if (next === "__custom__") {
                                setCustomMode(true);
                                return;
                            }
                            onChange(next);
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {RADIUS_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                            <SelectItem value="__custom__" label="Custom…">
                                Custom…
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setCustomMode(true)}
                    >
                        Custom
                    </Button>
                </div>
            )}
        </Field>
    );
}

export function ThemeEditor({
    theme,
    onSave,
    saving,
}: {
    theme: Settings["theme"];
    onSave: (theme: Settings["theme"]) => void;
    saving: boolean;
}) {
    const [colors, setColors] = useState<SettingsColorSet>({ ...theme.colors });
    const [darkEnabled, setDarkEnabled] = useState(theme.dark.enabled);
    const [darkColors, setDarkColors] = useState<Partial<SettingsColorSet>>({ ...theme.dark.colors });
    const [fontFamily, setFontFamily] = useState(theme.fonts.family);
    const [fontMono, setFontMono] = useState(theme.fonts.mono ?? "");
    const [sizes, setSizes] = useState({ ...theme.fonts.sizes });
    const [radius, setRadius] = useState(theme.radius);
    const [globalCss, setGlobalCss] = useState(theme.globalCss);

    // The editor only lets the admin tweak the 4 core colors. The rest of
    // the tokens are derived automatically so the backend still receives a
    // complete color set without overwhelming the UI with inputs.
    const updateColor = (key: CoreColorKey, value: string) => {
        setColors((prev) => ({ ...prev, [key]: value }));
    };

    const updateDarkColor = (key: CoreColorKey, value: string) => {
        setDarkColors((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        // Merge the edited core colors with the previously stored full set,
        // then re-derive every derived token from the 4 core colors.
        const lightBase = {
            primary: colors.primary,
            secondary: colors.secondary,
            background: colors.background,
            foreground: colors.foreground,
            destructive: colors.destructive,
        };
        const darkBase = {
            primary: darkColors.primary ?? lightBase.primary,
            secondary: darkColors.secondary ?? lightBase.secondary,
            background: darkColors.background ?? lightBase.background,
            foreground: darkColors.foreground ?? lightBase.foreground,
            destructive: darkColors.destructive ?? lightBase.destructive,
        };

        onSave({
            colors: deriveColorSet(lightBase),
            dark: {
                enabled: darkEnabled,
                colors: deriveColorSet(darkBase),
            },
            fonts: { family: fontFamily, mono: fontMono, sizes },
            radius,
            globalCss,
        });
    };

    return (
        <div className="space-y-4">
            <SectionCard title="Colors" description="Core light theme colors. The remaining CSS variables (muted, border, card, chart, sidebar…) are derived automatically.">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CORE_COLOR_KEYS.map((key) => (
                        <ColorField
                            key={key}
                            label={COLOR_LABELS[key] ?? key}
                            value={colors[key] ?? ""}
                            onChange={(v) => updateColor(key, v)}
                        />
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Dark Mode" description="Toggle and customize dark theme core colors. Derived variables follow the same rules.">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="cursor-pointer">Enable Dark Mode</Label>
                        <p className="text-[11px] text-muted-foreground">
                            Overrides light colors when the storefront uses dark mode.
                        </p>
                    </div>
                    <Switch checked={darkEnabled} onCheckedChange={setDarkEnabled} />
                </div>
                {darkEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {CORE_COLOR_KEYS.map((key) => (
                            <ColorField
                                key={key}
                                label={COLOR_LABELS[key] ?? key}
                                value={darkColors[key] ?? ""}
                                onChange={(v) => updateDarkColor(key, v)}
                            />
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Typography" description="Font family and heading/body sizes.">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FontFamilyField
                        value={fontFamily}
                        onChange={setFontFamily}
                    />
                    <FontFamilyField
                        label="Mono Font"
                        hint="Used for code, prices and technical text."
                        value={fontMono}
                        onChange={setFontMono}
                    />
                    <RadiusField
                        value={radius}
                        onChange={setRadius}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(sizes).map(([key, value]) => (
                        <FontSizeField
                            key={key}
                            label={key}
                            value={value}
                            onChange={(v) =>
                                setSizes((prev) => ({ ...prev, [key]: v }))
                            }
                        />
                    ))}
                </div>
                <Field label="Global CSS" hint="Extra CSS injected into the storefront (optional).">
                    <Textarea
                        value={globalCss}
                        onChange={(e) => setGlobalCss(e.target.value)}
                        rows={4}
                        className="font-mono text-xs"
                    />
                </Field>
            </SectionCard>

            <SaveButton onSave={handleSave} saving={saving} label="Save Theme" />
        </div>
    );
}

/* ---------------------------------- hero ----------------------------------- */

export function HeroEditor({
    slides,
    onSave,
    saving,
}: {
    slides: HeroSlide[];
    onSave: (slides: HeroSlide[]) => void;
    saving: boolean;
}) {
    const [items, setItems] = useState<HeroSlide[]>(slides);

    const update = (index: number, patch: Partial<HeroSlide>) => {
        setItems((prev) =>
            prev.map((s, i) => (i === index ? { ...s, ...patch, order: i } : s))
        );
    };

    const add = () => {
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
    };

    const remove = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
    };

    return (
        <div className="space-y-4">
            {items.map((slide, index) => (
                <SectionCard
                    key={index}
                    title={`Slide ${index + 1}`}
                    description="Headline, subtext and call-to-action."
                >
                    <div className="flex items-start justify-between">
                        <UrlInput label="Image URL" value={slide.image} onChange={(v) => update(index, { image: v })} />
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => remove(index)} aria-label="Remove slide">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <Field label="Headline">
                        <Input value={slide.headline} onChange={(e) => update(index, { headline: e.target.value })} />
                    </Field>
                    <Field label="Subtext">
                        <Textarea value={slide.subtext} onChange={(e) => update(index, { subtext: e.target.value })} rows={2} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="CTA Text">
                            <Input value={slide.ctaText} onChange={(e) => update(index, { ctaText: e.target.value })} />
                        </Field>
                        <UrlInput label="CTA Link" value={slide.ctaLink} onChange={(v) => update(index, { ctaLink: v })} placeholder="/products" />
                    </div>
                </SectionCard>
            ))}
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={add}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slide
                </Button>
                <SaveButton onSave={() => onSave(items)} saving={saving} />
            </div>
        </div>
    );
}

/* ------------------------------ testimonials -------------------------------- */

export function TestimonialsEditor({
    heading,
    items,
    onSave,
    saving,
}: {
    heading: string;
    items: TestimonialItem[];
    onSave: (heading: string, items: TestimonialItem[]) => void;
    saving: boolean;
}) {
    const [title, setTitle] = useState(heading);
    const [list, setList] = useState<TestimonialItem[]>(items);

    const update = (index: number, patch: Partial<TestimonialItem>) => {
        setList((prev) =>
            prev.map((s, i) => (i === index ? { ...s, ...patch, order: i } : s))
        );
    };

    const add = () => {
        setList((prev) => [
            ...prev,
            { name: "", role: "", quote: "", rating: 5, avatar: "", order: prev.length },
        ]);
    };

    const remove = (index: number) => {
        setList((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
    };

    return (
        <div className="space-y-4">
            <SectionCard title="Section Heading" description="Title shown above the testimonials.">
                <Field label="Heading">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
            </SectionCard>

            {list.map((item, index) => (
                <SectionCard key={index} title={`Testimonial ${index + 1}`} description="Customer quote and rating.">
                    <div className="flex items-start justify-between">
                        <UrlInput label="Avatar URL" value={item.avatar} onChange={(v) => update(index, { avatar: v })} />
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => remove(index)} aria-label="Remove testimonial">
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
                            onChange={(e) => update(index, { rating: MoneyishNumber(e.target.value) })}
                        />
                    </Field>
                </SectionCard>
            ))}
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={add}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Testimonial
                </Button>
                <SaveButton onSave={() => onSave(title, list)} saving={saving} />
            </div>
        </div>
    );
}

/* --------------------------------- navbar ----------------------------------- */

/** Maximum top-level links per navbar section (UX limit; backend allows more). */
const MAX_NAVBAR_LINKS = 10;

/** Maximum stats shown in the about section. */
const MAX_STATS = 10;

/** Maximum links per footer column (quick links / contact). */
const MAX_FOOTER_COLUMN_LINKS = 5;

/** Maximum social links in the footer. */
const MAX_FOOTER_SOCIAL_LINKS = 5;

function NavLinkEditor({
    links,
    onChange,
}: {
    links: NavbarLink[];
    onChange: (links: NavbarLink[]) => void;
}) {
    const update = (index: number, patch: Partial<NavbarLink>) => {
        onChange(
            links.map((l, i) => (i === index ? { ...l, ...patch, order: i } : l))
        );
    };

    const add = () => {
        if (links.length >= MAX_NAVBAR_LINKS) {
            toast.info(`You can add up to ${MAX_NAVBAR_LINKS} links. Remove one first to add another.`);
            return;
        }
        onChange([...links, { label: "", url: "/", order: links.length, children: [] }]);
    };

    const remove = (index: number) => {
        onChange(links.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i })));
    };

    return (
        <div className="space-y-2">
            {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input
                        value={link.label}
                        onChange={(e) => update(index, { label: e.target.value })}
                        placeholder="Label"
                        className="flex-1"
                    />
                    <Input
                        value={link.url}
                        onChange={(e) => update(index, { url: e.target.value })}
                        placeholder="/path"
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                        aria-label="Remove link"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={add}
                disabled={links.length >= MAX_NAVBAR_LINKS}
            >
                <Plus className="mr-1 h-4 w-4" />
                Add Link
            </Button>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {links.length}/{MAX_NAVBAR_LINKS} links added , up to {MAX_NAVBAR_LINKS} can be shown in this section.
            </p>
        </div>
    );
}

export function NavbarEditor({
    navbar,
    onSave,
    saving,
}: {
    navbar: Settings["navbar"];
    /** Saves the navbar with the unused "public" group removed. */
    onSave: (navbar: Omit<Settings["navbar"], "groups"> & {
        groups: Omit<Settings["navbar"]["groups"], "public">;
    }) => void;
    saving: boolean;
}) {
    const [links, setLinks] = useState<NavbarLink[]>(navbar.links);
    const [groups, setGroups] = useState<{
        [K in Exclude<keyof Settings["navbar"]["groups"], "public">]: NavbarLink[];
    }>({
        auth: navbar.groups.auth,
        customer: navbar.groups.customer,
        admin: navbar.groups.admin,
    });

    return (
        <div className="space-y-4">
            <SectionCard title="Navbar Links" description="Main navigation items.">
                <NavLinkEditor links={links} onChange={setLinks} />
            </SectionCard>
            {(
                [
                    ["auth", "Signed-out"],
                    ["customer", "Customer"],
                    ["admin", "Admin"],
                ] as const
            ).map(([key, label]) => (
                <SectionCard key={key} title={`${label} Group`} description={`Links shown to ${label.toLowerCase()} visitors.`}>
                    <NavLinkEditor
                        links={groups[key]}
                        onChange={(next) => setGroups((prev) => ({ ...prev, [key]: next }))}
                    />
                </SectionCard>
            ))}
            <SaveButton
                onSave={() => onSave({ links, groups })}
                saving={saving}
            />
        </div>
    );
}

/* --------------------------------- footer ----------------------------------- */

export function FooterEditor({
    footer,
    onSave,
    saving,
}: {
    footer: Settings["footer"];
    onSave: (footer: Settings["footer"]) => void;
    saving: boolean;
}) {
    const [description, setDescription] = useState(footer.description);
    const [copyrightText, setCopyrightText] = useState(footer.copyrightText);
    const [newsletterEnabled, setNewsletterEnabled] = useState(footer.newsletter.enabled);
    const [newsletterHeading, setNewsletterHeading] = useState(footer.newsletter.heading);
    const [columns, setColumns] = useState<SettingsFooterColumn[]>(footer.columns);
    const [socialLinks, setSocialLinks] = useState(footer.socialLinks);

    const updateColumn = (index: number, patch: Partial<SettingsFooterColumn>) => {
        setColumns((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    };

    const addColumn = () => {
        setColumns((prev) => [...prev, { title: "", links: [] }]);
    };

    const removeColumn = (index: number) => {
        setColumns((prev) => prev.filter((_, i) => i !== index));
    };

    const updateColumnLink = (colIndex: number, linkIndex: number, patch: Partial<{ label: string; url: string }>) => {
        setColumns((prev) =>
            prev.map((c, i) =>
                i === colIndex
                    ? {
                          ...c,
                          links: c.links.map((l, j) => (j === linkIndex ? { ...l, ...patch } : l)),
                      }
                    : c
            )
        );
    };

    const addColumnLink = (colIndex: number) => {
        setColumns((prev) => {
            const column = prev[colIndex];
            if (!column || column.links.length >= MAX_FOOTER_COLUMN_LINKS) {
                toast.info(`You can add up to ${MAX_FOOTER_COLUMN_LINKS} links per column. Remove one first to add another.`);
                return prev;
            }
            return prev.map((c, i) =>
                i === colIndex ? { ...c, links: [...c.links, { label: "", url: "/" }] } : c
            );
        });
    };

    const removeColumnLink = (colIndex: number, linkIndex: number) => {
        setColumns((prev) =>
            prev.map((c, i) =>
                i === colIndex ? { ...c, links: c.links.filter((_, j) => j !== linkIndex) } : c
            )
        );
    };

    const updateSocial = (index: number, patch: Partial<{ platform: string; url: string }>) => {
        setSocialLinks((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const addSocial = () => {
        setSocialLinks((prev) => {
            if (prev.length >= MAX_FOOTER_SOCIAL_LINKS) {
                toast.info(`You can add up to ${MAX_FOOTER_SOCIAL_LINKS} social links. Remove one first to add another.`);
                return prev;
            }
            return [...prev, { platform: "", url: "" }];
        });
    };

    const removeSocial = (index: number) => {
        setSocialLinks((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <SectionCard title="Footer" description="Description, copyright and newsletter.">
                <Field label="Description">
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </Field>
                <Field label="Copyright Text">
                    <Input value={copyrightText} onChange={(e) => setCopyrightText(e.target.value)} />
                </Field>
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="cursor-pointer">Enable Newsletter</Label>
                        <p className="text-[11px] text-muted-foreground">Show the newsletter signup box.</p>
                    </div>
                    <Switch checked={newsletterEnabled} onCheckedChange={setNewsletterEnabled} />
                </div>
                {newsletterEnabled && (
                    <Field label="Newsletter Heading">
                        <Input value={newsletterHeading} onChange={(e) => setNewsletterHeading(e.target.value)} />
                    </Field>
                )}
            </SectionCard>

            {columns.map((column, colIndex) => (
                <SectionCard key={colIndex} title={column.title || `Column ${colIndex + 1}`} description="Footer link column.">
                    <div className="flex items-start justify-between gap-2">
                        <Field label="Column Title">
                            <Input value={column.title} onChange={(e) => updateColumn(colIndex, { title: e.target.value })} />
                        </Field>
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeColumn(colIndex)} aria-label="Remove column">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    {column.links.map((link, linkIndex) => (
                        <div key={linkIndex} className="flex items-center gap-2">
                            <Input
                                value={link.label}
                                onChange={(e) => updateColumnLink(colIndex, linkIndex, { label: e.target.value })}
                                placeholder="Label"
                                className="flex-1"
                            />
                            <Input
                                value={link.url}
                                onChange={(e) => updateColumnLink(colIndex, linkIndex, { url: e.target.value })}
                                placeholder="/path"
                                className="flex-1"
                            />
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeColumnLink(colIndex, linkIndex)} aria-label="Remove link">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addColumnLink(colIndex)}
                        disabled={column.links.length >= MAX_FOOTER_COLUMN_LINKS}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Link
                    </Button>
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {column.links.length}/{MAX_FOOTER_COLUMN_LINKS} links , up to {MAX_FOOTER_COLUMN_LINKS} per column.
                    </p>
                </SectionCard>
            ))}
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addColumn}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Column
                </Button>
            </div>

            <SectionCard title="Social Links" description="Footer social media links.">
                {socialLinks.map((social, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={social.platform}
                            onChange={(e) => updateSocial(index, { platform: e.target.value })}
                            placeholder="twitter"
                            className="flex-1"
                        />
                        <Input
                            value={social.url}
                            onChange={(e) => updateSocial(index, { url: e.target.value })}
                            placeholder="https://..."
                            className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeSocial(index)} aria-label="Remove social link">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocial}
                    disabled={socialLinks.length >= MAX_FOOTER_SOCIAL_LINKS}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Social Link
                </Button>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {socialLinks.length}/{MAX_FOOTER_SOCIAL_LINKS} social links , up to {MAX_FOOTER_SOCIAL_LINKS} can be shown.
                </p>
            </SectionCard>

            <SaveButton
                onSave={() =>
                    onSave({
                        description,
                        columns,
                        socialLinks,
                        copyrightText,
                        newsletter: { enabled: newsletterEnabled, heading: newsletterHeading },
                    })
                }
                saving={saving}
            />
        </div>
    );
}

/* --------------------------------- contact ---------------------------------- */

export function ContactEditor({
    contact,
    onSave,
    saving,
}: {
    contact: Settings["contact"];
    onSave: (contact: Settings["contact"]) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState(contact);
    const set = (patch: Partial<Settings["contact"]>) => setForm((prev) => ({ ...prev, ...patch }));
    const setSocial = (patch: Partial<Settings["contact"]["social"]>) =>
        setForm((prev) => ({ ...prev, social: { ...prev.social, ...patch } }));

    return (
        <SectionCard title="Contact" description="Store contact details and map embed.">
            <Field label="Address">
                <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone">
                    <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                </Field>
                <Field label="Email">
                    <Input value={form.email} onChange={(e) => set({ email: e.target.value })} />
                </Field>
            </div>
            <Field label="Hours">
                <Input value={form.hours} onChange={(e) => set({ hours: e.target.value })} />
            </Field>
            <Field label="Map Embed URL">
                <Input value={form.mapEmbedUrl} onChange={(e) => set({ mapEmbedUrl: e.target.value })} placeholder="https://maps.google.com/..." />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UrlInput label="Twitter" value={form.social.twitter} onChange={(v) => setSocial({ twitter: v })} />
                <UrlInput label="Instagram" value={form.social.instagram} onChange={(v) => setSocial({ instagram: v })} />
                <UrlInput label="Facebook" value={form.social.facebook} onChange={(v) => setSocial({ facebook: v })} />
            </div>
            <SaveButton onSave={() => onSave(form)} saving={saving} />
        </SectionCard>
    );
}

/* ---------------------------------- about ----------------------------------- */

export function AboutEditor({
    about,
    onSave,
    saving,
}: {
    about: Settings["about"];
    onSave: (about: Settings["about"]) => void;
    saving: boolean;
}) {
    const [story, setStory] = useState(about.story);
    const [mission, setMission] = useState(about.mission);
    const [image, setImage] = useState(about.image);
    const [stats, setStats] = useState<SettingsAboutStat[]>(about.stats);

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
                <UrlInput label="Image URL" value={image} onChange={setImage} />
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
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeStat(index)} aria-label="Remove stat">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addStat} disabled={stats.length >= MAX_STATS}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Stat
                </Button>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {stats.length}/{MAX_STATS} stats added , up to {MAX_STATS} can be shown.
                </p>
            </SectionCard>

            <SaveButton onSave={() => onSave({ story, mission, image, stats })} saving={saving} />
        </div>
    );
}

/* ------------------------------- limited offer ------------------------------ */

export function LimitedOfferEditor({
    offer,
    onSave,
    saving,
}: {
    offer: Settings["limitedOffer"];
    onSave: (offer: Settings["limitedOffer"]) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState(offer);
    const set = (patch: Partial<Settings["limitedOffer"]>) => setForm((prev) => ({ ...prev, ...patch }));

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
                        <UrlInput label="CTA Link" value={form.ctaLink} onChange={(v) => set({ ctaLink: v })} placeholder="/products" />
                    </div>
                    <UrlInput label="Image URL" value={form.image} onChange={(v) => set({ image: v })} />
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
            <SaveButton onSave={() => onSave(form)} saving={saving} />
        </SectionCard>
    );
}

/* ------------------------------- main manager -------------------------------- */

interface SettingsManagerProps {
    settings: Settings | null;
}

export function SettingsManager({ settings }: SettingsManagerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [savingSection, setSavingSection] = useState<SettingsSectionKey | null>(null);
    const [applyingPreset, setApplyingPreset] = useState(false);

    const runSave = (
        section: SettingsSectionKey,
        action: () => Promise<ServiceResult<Settings>>
    ) => {
        setSavingSection(section);
        startTransition(async () => {
            const result = await action();
            setSavingSection(null);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(result.message ?? "Settings updated successfully");
            router.refresh();
        });
    };

    const saveBrand = (brand: Partial<SettingsBrand>) => {
        runSave("theme", () => updateBrandSettings(brand));
    };

    const saveTheme = (theme: Settings["theme"]) => {
        runSave("theme", () => updateSettingsSection("theme", theme));
    };

    const saveHero = (slides: HeroSlide[]) => {
        runSave("hero", () => updateSettingsSection("hero", { slides }));
    };

    const saveTestimonials = (heading: string, items: TestimonialItem[]) => {
        runSave("testimonials", () => updateSettingsSection("testimonials", { heading, items }));
    };

    const saveNavbar = (
        navbar: Omit<Settings["navbar"], "groups"> & {
            groups: Omit<Settings["navbar"]["groups"], "public">;
        }
    ) => {
        // The navbar editor does not manage the "public" group; carry the
        // existing one through so the saved settings stay complete.
        const fullNavbar: Settings["navbar"] = {
            ...navbar,
            groups: {
                ...navbar.groups,
                public: settings?.navbar.groups.public ?? [],
            },
        };
        runSave("navbar", () => updateSettingsSection("navbar", fullNavbar));
    };

    const saveFooter = (footer: Settings["footer"]) => {
        runSave("footer", () => updateSettingsSection("footer", footer));
    };

    const saveContact = (contact: Settings["contact"]) => {
        runSave("contact", () => updateSettingsSection("contact", contact));
    };

    const saveAbout = (about: Settings["about"]) => {
        runSave("about", () => updateSettingsSection("about", about));
    };

    const saveLimitedOffer = (offer: Settings["limitedOffer"]) => {
        runSave("limitedOffer", () => updateSettingsSection("limitedOffer", offer));
    };

    const handlePreset = (niche: string) => {
        if (!niche) return;
        setApplyingPreset(true);
        startTransition(async () => {
            const result = await applySettingsPreset(niche);
            setApplyingPreset(false);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(result.message ?? "Preset applied successfully");
            router.refresh();
        });
    };

    const saving = (key: SettingsSectionKey) => savingSection === key;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage brand identity, theme and all website sections
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        onValueChange={(v) => handlePreset(String(v ?? ""))}
                        value={undefined}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Apply niche preset" />
                        </SelectTrigger>
                        <SelectContent>
                            {NICHE_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {applyingPreset && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
            </div>

            {!settings && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                            <Palette className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">No Settings Loaded</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            The singleton settings document could not be loaded from the
                            backend. Make sure it is seeded (npm run seed:settings).
                        </p>
                    </CardContent>
                </Card>
            )}

            {settings && (
                <Tabs defaultValue="brand">
                    <TabsList className="flex flex-wrap h-auto">
                        <TabsTrigger value="brand">Brand</TabsTrigger>
                        <TabsTrigger value="theme">Theme</TabsTrigger>
                        <TabsTrigger value="hero">Hero</TabsTrigger>
                        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                        <TabsTrigger value="navbar">Navbar</TabsTrigger>
                        <TabsTrigger value="footer">Footer</TabsTrigger>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="about">About</TabsTrigger>
                        <TabsTrigger value="limitedOffer">Limited Offer</TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <TabsContent value="brand">
                            <BrandEditor brand={settings.brand} onSave={saveBrand} saving={saving("theme")} />
                        </TabsContent>
                        <TabsContent value="theme">
                            <ThemeEditor theme={settings.theme} onSave={saveTheme} saving={saving("theme")} />
                        </TabsContent>
                        <TabsContent value="hero">
                            <HeroEditor slides={settings.hero.slides} onSave={saveHero} saving={saving("hero")} />
                        </TabsContent>
                        <TabsContent value="testimonials">
                            <TestimonialsEditor
                                heading={settings.testimonials.heading}
                                items={settings.testimonials.items}
                                onSave={saveTestimonials}
                                saving={saving("testimonials")}
                            />
                        </TabsContent>
                        <TabsContent value="navbar">
                            <NavbarEditor navbar={settings.navbar} onSave={saveNavbar} saving={saving("navbar")} />
                        </TabsContent>
                        <TabsContent value="footer">
                            <FooterEditor footer={settings.footer} onSave={saveFooter} saving={saving("footer")} />
                        </TabsContent>
                        <TabsContent value="contact">
                            <ContactEditor contact={settings.contact} onSave={saveContact} saving={saving("contact")} />
                        </TabsContent>
                        <TabsContent value="about">
                            <AboutEditor about={settings.about} onSave={saveAbout} saving={saving("about")} />
                        </TabsContent>
                        <TabsContent value="limitedOffer">
                            <LimitedOfferEditor
                                offer={settings.limitedOffer}
                                onSave={saveLimitedOffer}
                                saving={saving("limitedOffer")}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            )}

            {settings && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Changes are saved per section. The storefront reflects them after revalidation.
                </div>
            )}
        </div>
    );
}
