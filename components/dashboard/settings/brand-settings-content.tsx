"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBrandSettings } from "@/lib/services/settings";
import { NICHE_LABELS, NICHE_OPTIONS } from "@/lib/settings-niches";
import { isErrorResult } from "@/lib/utils/result";
import type { SettingsBrand, SettingsDeliveryOption } from "@/lib/types/backend";
import { serverErrorMessage } from "@/lib/utils/form-feedback";

/** Currency codes the storefront can display (see lib/utils/currency.ts). */
const CURRENCY_OPTIONS = [
  { value: "usd", label: "USD , US Dollar" },
  { value: "bdt", label: "BDT, Bangladeshi Taka" },
  { value: "eur", label: "EUR , Euro" },
  { value: "gbp", label: "GBP , British Pound" },
  { value: "inr", label: "INR , Indian Rupee" },
  { value: "aed", label: "AED , UAE Dirham" },
  { value: "aud", label: "AUD , Australian Dollar" },
  { value: "cad", label: "CAD , Canadian Dollar" },
];

const ALLOWED_IMAGE_TYPES = ["image/png", "image/svg+xml"];

/** Maximum brand logo/favicon upload size (backend rejects anything larger). */
const MAX_BRAND_IMAGE_SIZE = 1024 * 1024; // 1 MB

function isValidBrandImage(file: File): boolean {
    return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/** Human-readable size for error messages, e.g. "1 MB". */
function formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(bytes / 1024)} KB`;
}

interface FilePreview {
    file: File;
    url: string;
}

interface BrandSettingsContentProps {
    brand: SettingsBrand;
}

export function BrandSettingsContent({ brand }: BrandSettingsContentProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState(brand.name);
    const [tagline, setTagline] = useState(brand.tagline);
    const [description, setDescription] = useState(brand.description);
    const [niche, setNiche] = useState(brand.niche);
    const [nicheLabel, setNicheLabel] = useState(brand.nicheLabel);
    const [currency, setCurrency] = useState<string>(
        brand.currency || "usd"
    );
    const [deliveryOptions, setDeliveryOptions] = useState<
        SettingsDeliveryOption[]
    >(brand.deliveryOptions ?? []);

    const [logoPreview, setLogoPreview] = useState<FilePreview | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<FilePreview | null>(null);
    const [logoOnly, setLogoOnly] = useState(brand.logoOnly ?? false);

    /** A logo exists — saved, or picked and waiting in this save. */
    const hasAnyLogo = Boolean(brand.logo) || Boolean(logoPreview);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!isValidBrandImage(file)) {
            toast.error("Logo must be a PNG or SVG file (transparent background).");
            return;
        }
        if (file.size > MAX_BRAND_IMAGE_SIZE) {
            toast.error(
                `Logo is too large (${formatSize(file.size)}). Maximum size is 1 MB.`
            );
            return;
        }
        setLogoPreview({ file, url: URL.createObjectURL(file) });
    };

    const handleFaviconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!isValidBrandImage(file)) {
            toast.error("Favicon must be a PNG or SVG file (transparent background).");
            return;
        }
        if (file.size > MAX_BRAND_IMAGE_SIZE) {
            toast.error(
                `Favicon is too large (${formatSize(file.size)}). Maximum size is 1 MB.`
            );
            return;
        }
        setFaviconPreview({ file, url: URL.createObjectURL(file) });
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Brand name is required.");
            return;
        }
        if (!currency.trim()) {
            toast.error("Select a store currency.");
            return;
        }
        const cleanDelivery = deliveryOptions
            .filter((d) => d.name.trim())
            .map((d) => ({
                name: d.name.trim(),
                charge: Number(d.charge) || 0,
                country: d.country?.trim() || "",
                isActive: d.isActive,
            }));
        setSaving(true);
        startTransition(async () => {
            const result = await updateBrandSettings(
                {
                    name: name.trim(),
                    tagline,
                    description,
                    niche,
                    nicheLabel,
                    logoOnly,
                    currency: currency.trim(),
                    deliveryOptions: cleanDelivery,
                },
                {
                    logo: logoPreview?.file ?? null,
                    favicon: faviconPreview?.file ?? null,
                }
            );
            setSaving(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(result.message ?? "Brand updated successfully");
            setLogoPreview(null);
            setFaviconPreview(null);
            router.refresh();
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Brand Identity</CardTitle>
                <CardDescription>
                    Store name, tagline, logo, favicon and niche.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Brand Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Attor"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Tagline</Label>
                        <Input
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            placeholder="Essence of Distinction"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Niche</Label>
                        <Select value={niche} onValueChange={(v) => setNiche(String(v ?? ""))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select niche">
                                    {(value) => {
                                        const v = String(value ?? "");
                                        return (
                                            NICHE_OPTIONS.find((n) => n.value === v)?.label ??
                                            (v || null)
                                        );
                                    }}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {NICHE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} label={option.label}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Niche Label</Label>
                        <Input
                            value={nicheLabel}
                            onChange={(e) => setNicheLabel(e.target.value)}
                            placeholder={NICHE_LABELS[niche] ?? "Perfume Oil"}
                        />
                    </div>
                </div>

                {/* Store currency , single code, drives storefront pricing */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Store Currency</Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(String(v ?? "usd"))}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select store currency">
                                {(value) => {
                                    const v = String(value ?? "");
                                    return (
                                        CURRENCY_OPTIONS.find((c) => c.value === v)?.label ??
                                        (v || null)
                                    );
                                }}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {CURRENCY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} label={option.label}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                        Single code used across the storefront for pricing and formatting.
                    </p>
                </div>

                {/* Delivery options */}
                <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-xs font-medium">Delivery Options</Label>
                            <p className="text-[11px] text-muted-foreground">
                                Customers pick one at checkout; the backend resolves the charge.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setDeliveryOptions([
                                    ...deliveryOptions,
                                    { name: "", charge: 0, country: "", isActive: true },
                                ])
                            }
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                    </div>
                    {deliveryOptions.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            No delivery options configured.
                        </p>
                    )}
                    {deliveryOptions.map((d, i) => (
                        <div key={i} className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={d.name}
                                    onChange={(e) =>
                                        setDeliveryOptions(
                                            deliveryOptions.map((dd, idx) =>
                                                idx === i
                                                    ? { ...dd, name: e.target.value }
                                                    : dd
                                            )
                                        )
                                    }
                                    placeholder="Inside Dhaka"
                                    className="h-8 flex-1 text-xs"
                                    aria-label={`Option ${i + 1} name`}
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={d.charge}
                                    onChange={(e) =>
                                        setDeliveryOptions(
                                            deliveryOptions.map((dd, idx) =>
                                                idx === i
                                                    ? {
                                                          ...dd,
                                                          charge: Number(e.target.value),
                                                      }
                                                    : dd
                                            )
                                        )
                                    }
                                    placeholder="Charge"
                                    className="h-8 w-24 text-xs"
                                    aria-label={`Option ${i + 1} charge`}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                        setDeliveryOptions(
                                            deliveryOptions.filter((_, idx) => idx !== i)
                                        )
                                    }
                                    aria-label="Remove option"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={d.country ?? ""}
                                    onChange={(e) =>
                                        setDeliveryOptions(
                                            deliveryOptions.map((dd, idx) =>
                                                idx === i
                                                    ? { ...dd, country: e.target.value }
                                                    : dd
                                            )
                                        )
                                    }
                                    placeholder="Country code (e.g. BD) , optional"
                                    className="h-8 flex-1 text-xs"
                                    aria-label={`Option ${i + 1} country`}
                                />
                                <div className="flex items-center gap-1.5">
                                    <Switch
                                        checked={d.isActive}
                                        onCheckedChange={(v) =>
                                            setDeliveryOptions(
                                                deliveryOptions.map((dd, idx) =>
                                                    idx === i ? { ...dd, isActive: v } : dd
                                                )
                                            )
                                        }
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Logo upload with preview */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Logo</Label>
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                            {logoPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={logoPreview.url}
                                    alt="Logo preview"
                                    className="h-full w-full object-contain"
                                />
                            ) : brand.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={brand.logo}
                                    alt="Current logo"
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <span className="text-xs text-muted-foreground">No logo</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => logoInputRef.current?.click()}
                            >
                                <ImagePlus className="mr-2 h-4 w-4" />
                                {logoPreview ? "Replace logo" : brand.logo ? "Change logo" : "Upload logo"}
                            </Button>
                            <p className="text-[11px] text-muted-foreground">
                                PNG or SVG only, up to 1 MB (transparent background kept).
                            </p>
                        </div>
                        {logoPreview && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setLogoPreview(null)}
                                aria-label="Remove logo"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <Input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/svg+xml"
                            className="hidden"
                            onChange={handleLogoSelect}
                        />
                    </div>
                </div>

                {/* Logo-only display — header/footer show just the logo, no name */}
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                        <Label className="text-xs font-medium">Show logo only</Label>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Replaces the logo + brand name in the storefront header and
                            footer with just the logo at its natural size — ideal for
                            wide wordmark images.
                        </p>
                        {!hasAnyLogo && (
                            <p className="mt-1 text-[11px] font-medium text-warning">
                                Upload a logo first — until then the storefront shows the
                                brand name.
                            </p>
                        )}
                    </div>
                    <Switch
                        checked={logoOnly}
                        onCheckedChange={setLogoOnly}
                        disabled={!hasAnyLogo && !logoOnly}
                        aria-label="Show logo only"
                    />
                </div>

                {/* Favicon upload with preview */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Favicon</Label>
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                            {faviconPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={faviconPreview.url}
                                    alt="Favicon preview"
                                    className="h-full w-full object-contain"
                                />
                            ) : brand.favicon ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={brand.favicon}
                                    alt="Current favicon"
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <span className="text-[10px] text-muted-foreground">None</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => faviconInputRef.current?.click()}
                            >
                                <ImagePlus className="mr-2 h-4 w-4" />
                                {faviconPreview
                                    ? "Replace favicon"
                                    : brand.favicon
                                    ? "Change favicon"
                                    : "Upload favicon"}
                            </Button>
                            <p className="text-[11px] text-muted-foreground">
                                PNG or SVG only, small square, up to 1 MB (transparent kept).
                            </p>
                        </div>
                        {faviconPreview && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setFaviconPreview(null)}
                                aria-label="Remove favicon"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <Input
                            ref={faviconInputRef}
                            type="file"
                            accept="image/png,image/svg+xml"
                            className="hidden"
                            onChange={handleFaviconSelect}
                        />
                    </div>
                </div>

                <Button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Brand
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
