"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, ImagePlus, Loader2, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSettingsSection } from "@/lib/services/settings";
import { isErrorResult } from "@/lib/utils/result";
import type { Settings, SettingsSeo } from "@/lib/types/backend";
import { serverErrorMessage } from "@/lib/utils/form-feedback";

/** OG/social image upload constraints (multer accepts any image type). */
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

/** Soft recommendation windows the preview counters nudge toward. */
const TITLE_IDEAL = 60;
const DESCRIPTION_IDEAL = 160;

/** Empty-section defaults for older settings docs without `seo`. */
const EMPTY_SEO: SettingsSeo = {
    title: "",
    titleTemplate: "",
    description: "",
    keywords: "",
    ogImage: "",
    noindex: false,
};

interface SeoSettingsContentProps {
    settings: Settings;
}

export function SeoSettingsContent({ settings }: SeoSettingsContentProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [saving, setSaving] = useState(false);

    const seo = settings.seo ?? EMPTY_SEO;
    const [title, setTitle] = useState(seo.title);
    const [titleTemplate, setTitleTemplate] = useState(seo.titleTemplate);
    const [description, setDescription] = useState(seo.description);
    const [keywords, setKeywords] = useState(seo.keywords);
    const [noindex, setNoindex] = useState(seo.noindex);

    const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    /** The site origin for the previews — read after mount (no SSR mismatch). */
    const [origin, setOrigin] = useState("yoursite.com");
    useEffect(() => setOrigin(window.location.origin), []);

    /** The auto image chain: uploaded SEO image → first hero slide → logo. */
    const savedImage = seo.ogImage || "";
    const autoImage =
        settings.hero?.slides?.find((slide) => slide.image)?.image ||
        settings.brand?.logo ||
        "";
    const previewImage = imagePreview?.url ?? (savedImage || autoImage);
    const usingAutoImage = !imagePreview && !savedImage;

    const brandName = settings.brand.name || "Attor";
    const previewTitle = title.trim() || brandName;
    const previewDescription =
        description.trim() || settings.brand.description || "Your store's meta description appears here.";

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            toast.error("Image must be a PNG, JPG or WebP file.");
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            toast.error("Image is too large. Maximum size is 2 MB.");
            return;
        }
        setImagePreview({ file, url: URL.createObjectURL(file) });
    };

    const handleSave = () => {
        // The template must keep %s so sub-page titles stay composable.
        const template = titleTemplate.trim();
        if (template && !template.includes("%s")) {
            toast.error("Title template must contain %s — it is replaced by each page's name.", {
                description: 'Example: "%s | ' + brandName + '"',
            });
            return;
        }

        setSaving(true);
        startTransition(async () => {
            const result = await updateSettingsSection(
                "seo",
                {
                    title: title.trim(),
                    titleTemplate: template,
                    description: description.trim(),
                    keywords: keywords.trim(),
                    // Keep the saved URL in the payload so the server's
                    // image diff treats it as retained; a new file (below)
                    // overrides it, and the dedicated remove button sends "".
                    ogImage: savedImage,
                    noindex,
                },
                imagePreview ? [imagePreview.file] : undefined,
            );
            setSaving(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(result.message ?? "SEO settings updated successfully");
            setImagePreview(null);
            router.refresh();
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Search Engine Optimization</CardTitle>
                <CardDescription>
                    How {brandName} appears on Google, Facebook, WhatsApp and other
                    platforms — titles, description and the social share image.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* ── Live Google preview ── */}
                <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Search className="size-3.5" /> Google preview
                    </p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card">
                                {settings.brand.favicon ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={settings.brand.favicon} alt="" className="size-full object-contain" />
                                ) : (
                                    <Globe className="size-3.5 text-muted-foreground" />
                                )}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-xs leading-4 text-foreground">{brandName}</p>
                                <p className="truncate text-[11px] leading-3 text-muted-foreground">{origin}</p>
                            </div>
                        </div>
                        <p className="truncate text-lg leading-7 text-info hover:underline">
                            {previewTitle}
                        </p>
                        <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                            {previewDescription}
                        </p>
                    </div>
                    {noindex && (
                        <p className="text-[11px] font-medium text-warning">
                            "Hide from search engines" is ON — the real page would send
                            noindex and never appear in Google.
                        </p>
                    )}
                </div>

                {/* ── Fields ── */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">Meta Title (home page)</Label>
                        <span
                            className={`text-[11px] tabular-nums ${
                                title.length > TITLE_IDEAL ? "text-warning" : "text-muted-foreground"
                            }`}
                        >
                            {title.length}/{TITLE_IDEAL} recommended
                        </span>
                    </div>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={brandName}
                        maxLength={120}
                    />
                    <p className="text-[11px] text-muted-foreground">
                        Leave empty to use the brand name only — that is the
                        recommended home page title.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">Page Title Template</Label>
                    <Input
                        value={titleTemplate}
                        onChange={(e) => setTitleTemplate(e.target.value)}
                        placeholder={`%s | ${brandName}`}
                        maxLength={120}
                    />
                    <p className="text-[11px] text-muted-foreground">
                        Every other page composes its title through this pattern —{" "}
                        <span className="font-semibold text-foreground">
                            {(titleTemplate.trim().includes("%s")
                                ? titleTemplate.trim()
                                : `%s | ${brandName}`
                            ).replace("%s", "Track Order")}
                        </span>
                        . Keep <code className="rounded bg-muted px-1">%s</code> for the
                        page name.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">Meta Description</Label>
                        <span
                            className={`text-[11px] tabular-nums ${
                                description.length > DESCRIPTION_IDEAL
                                    ? "text-warning"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {description.length}/{DESCRIPTION_IDEAL} recommended
                        </span>
                    </div>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="A short, honest summary of what your store sells — this is the snippet people read before clicking."
                    />
                    <p className="text-[11px] text-muted-foreground">
                        Leave empty to reuse the Brand description.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">Keywords</Label>
                    <Input
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="massage machine, back pain relief, dhaka"
                        maxLength={500}
                    />
                    <p className="text-[11px] text-muted-foreground">
                        Comma-separated. Minor for ranking today, but some
                        directories still read them.
                    </p>
                </div>

                {/* ── Social share image ── */}
                <div className="space-y-2">
                    <Label className="text-xs">Social Share Image (Open Graph)</Label>
                    <div className="overflow-hidden rounded-lg border bg-muted/30">
                        <div className="flex aspect-[1.91/1] items-center justify-center overflow-hidden bg-muted">
                            {previewImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={previewImage}
                                    alt="Social share image preview"
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="text-xs text-muted-foreground">
                                    No image available — upload one or set a hero slide / logo
                                </span>
                            )}
                        </div>
                        <div className="space-y-0.5 border-t bg-card p-3">
                            <p className="text-[11px] leading-4 text-muted-foreground">{origin}</p>
                            <p className="truncate text-sm font-semibold text-foreground">
                                {previewTitle}
                            </p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                                {previewDescription}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => imageInputRef.current?.click()}
                        >
                            <ImagePlus className="mr-2 h-4 w-4" />
                            {imagePreview
                                ? "Replace image"
                                : savedImage
                                  ? "Change image"
                                  : "Upload image"}
                        </Button>
                        {imagePreview && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setImagePreview(null)}
                                aria-label="Discard selected image"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        {savedImage && !imagePreview && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                    setImagePreview(null);
                                    // Targeted save with the CURRENT field
                                    // values + ogImage "" so the server also
                                    // destroys the old file; nothing the admin
                                    // typed is lost.
                                    setSaving(true);
                                    startTransition(async () => {
                                        const result = await updateSettingsSection("seo", {
                                            title: title.trim(),
                                            titleTemplate: titleTemplate.trim(),
                                            description: description.trim(),
                                            keywords: keywords.trim(),
                                            ogImage: "",
                                            noindex,
                                        });
                                        setSaving(false);
                                        if (isErrorResult(result)) {
                                            toast.error(serverErrorMessage(result));
                                            return;
                                        }
                                        toast.success("Share image removed — auto fallback active");
                                        router.refresh();
                                    });
                                }}
                                disabled={saving || isPending}
                            >
                                Remove saved image
                            </Button>
                        )}
                        <Input
                            ref={imageInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            PNG, JPG or WebP up to 2 MB. Recommended 1200×630.
                        </p>
                    </div>
                    {usingAutoImage && autoImage && (
                        <p className="text-[11px] text-muted-foreground">
                            No image uploaded — <span className="font-semibold text-foreground">auto
                            fallback</span> active: the first hero slide (or the logo)
                            is used until you upload one.
                        </p>
                    )}
                </div>

                {/* ── noindex ── */}
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                        <Label className="text-xs font-medium">Hide from search engines</Label>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Sends noindex, nofollow — useful while the store is under
                            construction. Keep OFF for a live store.
                        </p>
                    </div>
                    <Switch
                        checked={noindex}
                        onCheckedChange={setNoindex}
                        aria-label="Hide from search engines"
                    />
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
                            Save SEO
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
