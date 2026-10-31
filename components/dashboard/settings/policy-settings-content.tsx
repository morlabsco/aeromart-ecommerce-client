"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSettingsSection } from "@/lib/services/settings";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage, notifyInvalidFields } from "@/lib/utils/form-feedback";
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    FileText,
    Loader2,
    Plus,
    RotateCcw,
    Save,
    Trash2,
} from "lucide-react";
import type { Settings } from "@/lib/types/backend";
import {
    bengaliNumeral,
    defaultReturnRefundSections,
    type PolicySectionData,
} from "@/lib/policy-sections";

/* ---------------------------------------------------------------------------
 * Settings → Return & Refund — a STRUCTURED section editor (not one rich
 * text blob). Each section maps 1:1 onto a numbered card on the storefront
 * page: title, intro, paragraphs, bullet items (bold lead + text), a
 * checklist, a callout and a note. Sections can be added, removed and
 * reordered; an EMPTY saved list renders the shipped 8-section default
 * policy, so the design and content are never lost.
 * ------------------------------------------------------------------------- */

const emptySection = (): PolicySectionData => ({
    title: "",
    intro: "",
    paragraphs: [],
    items: [],
    checklist: [],
    callout: "",
    note: "",
});

export function PolicySettingsContent({ settings }: { settings: Settings }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const saved: PolicySectionData[] = settings.policy?.sections ?? [];
    const [sections, setSections] = useState<PolicySectionData[]>(
        saved.map((section) => ({ ...emptySection(), ...section })),
    );
    const [saving, setSaving] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    const usingCustom = saved.length > 0;
    const dirty = JSON.stringify(sections) !== JSON.stringify(saved);

    /* ── list-level helpers ── */
    const update = (index: number, patch: Partial<PolicySectionData>) =>
        setSections((prev) =>
            prev.map((section, i) =>
                i === index ? { ...section, ...patch } : section,
            ),
        );

    const move = (index: number, direction: -1 | 1) =>
        setSections((prev) => {
            const next = [...prev];
            const target = index + direction;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });

    const remove = (index: number) =>
        setSections((prev) => prev.filter((_, i) => i !== index));

    /* ── row helpers (paragraphs / checklist / items) ── */
    const setRows = (
        index: number,
        key: "paragraphs" | "checklist",
        rows: string[],
    ) => update(index, { [key]: rows } as Partial<PolicySectionData>);

    const setItems = (
        index: number,
        items: { lead?: string; text: string }[],
    ) => update(index, { items });

    /* ── persistence ── */
    const save = (nextSections: PolicySectionData[]) => {
        // Titles are the one hard requirement — they head the numbered cards.
        const untitled: string[] = [];
        nextSections.forEach((section, i) => {
            if (!section.title.trim()) untitled.push(`Section ${i + 1}`);
        });
        if (untitled.length) {
            notifyInvalidFields(
                ["title"],
                { title: untitled.join(", ") },
                "publish",
            );
            return;
        }

        setSaving(true);
        startTransition(async () => {
            // Trim the payload: drop empty optional fields so saved docs stay
            // clean (empty list = default policy on the storefront).
            const clean = nextSections.map((section) => ({
                title: section.title.trim(),
                ...(section.intro?.trim()
                    ? { intro: section.intro.trim() }
                    : {}),
                ...(section.paragraphs?.some((p) => p.trim())
                    ? {
                          paragraphs: section.paragraphs.filter((p) =>
                              p.trim(),
                          ),
                      }
                    : {}),
                ...(section.items?.some((item) => item.text.trim())
                    ? {
                          items: section.items
                              .filter((item) => item.text.trim())
                              .map((item) => ({
                                  ...(item.lead?.trim()
                                      ? { lead: item.lead.trim() }
                                      : {}),
                                  text: item.text.trim(),
                              })),
                      }
                    : {}),
                ...(section.checklist?.some((c) => c.trim())
                    ? {
                          checklist: section.checklist.filter((c) =>
                              c.trim(),
                          ),
                      }
                    : {}),
                ...(section.callout?.trim()
                    ? { callout: section.callout.trim() }
                    : {}),
                ...(section.note?.trim() ? { note: section.note.trim() } : {}),
            }));

            const result = await updateSettingsSection("policy", {
                sections: clean,
            });
            setSaving(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(
                clean.length
                    ? `Policy published , ${clean.length} section${clean.length === 1 ? "" : "s"} live on the storefront.`
                    : "Policy reset , the default 8-section page is live again.",
            );
            setConfirmReset(false);
            router.refresh();
        });
    };

    const loadDefaults = () => {
        setSections(
            defaultReturnRefundSections(settings.brand?.name || "AeroMart"),
        );
        toast.info(
            "Default sections loaded , edit what you need, then Save & Publish.",
        );
    };

    return (
        <div className="space-y-5">
            {/* ── Status + explainer ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <FileText className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">
                            {usingCustom
                                ? `Custom policy live , ${saved.length} section${saved.length === 1 ? "" : "s"}`
                                : "Showing the built-in default policy (8 sections)"}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            Each section below is one numbered card on the
                            storefront page — title, paragraphs, bullet items,
                            a checklist, a callout and a note. Add, reorder or
                            remove sections freely; clearing everything brings
                            the default policy back.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    render={
                        <a
                            href="/return-refund-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                        />
                    }
                >
                    <ExternalLink className="h-4 w-4" /> View live page
                </Button>
            </div>

            {/* ── Section editors ── */}
            {sections.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
                    <p className="text-sm font-bold text-foreground">
                        No custom sections yet
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                        The storefront currently shows the shipped 8-section
                        policy. Load it here to tweak a few lines, or start
                        from a blank page with Add Section.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={loadDefaults}>
                            <FileText className="size-4" /> Load Default Sections
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSections([emptySection()])}
                        >
                            <Plus className="size-4" /> Start Blank
                        </Button>
                    </div>
                </div>
            )}

            {sections.map((section, index) => (
                <div
                    key={index}
                    className="space-y-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5"
                >
                    {/* header: numeral + title + order controls */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-header-nav text-xs font-extrabold tabular-nums text-header-nav-foreground">
                            {bengaliNumeral(index + 1)}
                        </span>
                        <Input
                            value={section.title}
                            onChange={(e) =>
                                update(index, { title: e.target.value })
                            }
                            placeholder="Section title (required)"
                            className="min-w-0 flex-1 font-semibold"
                            aria-label={`Section ${index + 1} title`}
                            aria-invalid={!section.title.trim()}
                        />
                        <div className="flex shrink-0 items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                                aria-label="Move section up"
                            >
                                <ChevronUp className="size-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                onClick={() => move(index, 1)}
                                disabled={index === sections.length - 1}
                                aria-label="Move section down"
                            >
                                <ChevronDown className="size-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => remove(index)}
                                aria-label="Remove section"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">
                            Intro line{" "}
                            <span className="text-muted-foreground">
                                (optional, leads the card)
                            </span>
                        </Label>
                        <Textarea
                            value={section.intro ?? ""}
                            onChange={(e) =>
                                update(index, { intro: e.target.value })
                            }
                            rows={1}
                            className="text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Paragraphs</Label>
                        {(section.paragraphs ?? []).map((paragraph, pi) => (
                            <div key={pi} className="flex items-start gap-2">
                                <Textarea
                                    value={paragraph}
                                    onChange={(e) =>
                                        setRows(
                                            index,
                                            "paragraphs",
                                            (section.paragraphs ?? []).map(
                                                (p, i) =>
                                                    i === pi
                                                        ? e.target.value
                                                        : p,
                                            ),
                                        )
                                    }
                                    rows={2}
                                    className="text-sm"
                                    aria-label={`Paragraph ${pi + 1}`}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                        setRows(
                                            index,
                                            "paragraphs",
                                            (section.paragraphs ?? []).filter(
                                                (_, i) => i !== pi,
                                            ),
                                        )
                                    }
                                    aria-label="Remove paragraph"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setRows(index, "paragraphs", [
                                    ...(section.paragraphs ?? []),
                                    "",
                                ])
                            }
                        >
                            <Plus className="size-3.5" /> Add paragraph
                        </Button>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">
                            Bullet items{" "}
                            <span className="text-muted-foreground">
                                (bold lead + text)
                            </span>
                        </Label>
                        {(section.items ?? []).map((item, ii) => (
                            <div
                                key={ii}
                                className="space-y-1.5 rounded-lg border border-border/60 p-2.5"
                            >
                                <div className="flex items-start gap-2">
                                    <Input
                                        value={item.lead ?? ""}
                                        onChange={(e) =>
                                            setItems(
                                                index,
                                                (section.items ?? []).map(
                                                    (it, i) =>
                                                        i === ii
                                                            ? {
                                                                  ...it,
                                                                  lead: e.target
                                                                      .value,
                                                              }
                                                            : it,
                                                ),
                                            )
                                        }
                                        placeholder="Bold lead (optional), e.g. Manufacturing Defect:"
                                        className="h-9 text-sm"
                                        aria-label={`Item ${ii + 1} lead`}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                            setItems(
                                                index,
                                                (section.items ?? []).filter(
                                                    (_, i) => i !== ii,
                                                ),
                                            )
                                        }
                                        aria-label="Remove item"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                                <Textarea
                                    value={item.text}
                                    onChange={(e) =>
                                        setItems(
                                            index,
                                            (section.items ?? []).map(
                                                (it, i) =>
                                                    i === ii
                                                        ? {
                                                              ...it,
                                                              text: e.target
                                                                  .value,
                                                          }
                                                        : it,
                                            ),
                                        )
                                    }
                                    rows={2}
                                    placeholder="Item text"
                                    className="text-sm"
                                    aria-label={`Item ${ii + 1} text`}
                                    aria-invalid={!item.text.trim()}
                                />
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setItems(index, [
                                    ...(section.items ?? []),
                                    { lead: "", text: "" },
                                ])
                            }
                        >
                            <Plus className="size-3.5" /> Add item
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Callout{" "}
                                <span className="text-muted-foreground">
                                    (highlighted note)
                                </span>
                            </Label>
                            <Textarea
                                value={section.callout ?? ""}
                                onChange={(e) =>
                                    update(index, {
                                        callout: e.target.value,
                                    })
                                }
                                rows={2}
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Trailing note{" "}
                                <span className="text-muted-foreground">
                                    (muted, italic)
                                </span>
                            </Label>
                            <Textarea
                                value={section.note ?? ""}
                                onChange={(e) =>
                                    update(index, { note: e.target.value })
                                }
                                rows={2}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Checklist</Label>
                        {(section.checklist ?? []).map((entry, ci) => (
                            <div key={ci} className="flex items-center gap-2">
                                <Input
                                    value={entry}
                                    onChange={(e) =>
                                        setRows(
                                            index,
                                            "checklist",
                                            (section.checklist ?? []).map(
                                                (c, i) =>
                                                    i === ci
                                                        ? e.target.value
                                                        : c,
                                            ),
                                        )
                                    }
                                    className="h-9 text-sm"
                                    aria-label={`Checklist ${ci + 1}`}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                        setRows(
                                            index,
                                            "checklist",
                                            (section.checklist ?? []).filter(
                                                (_, i) => i !== ci,
                                            ),
                                        )
                                    }
                                    aria-label="Remove checklist entry"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setRows(index, "checklist", [
                                    ...(section.checklist ?? []),
                                    "",
                                ])
                            }
                        >
                            <Plus className="size-3.5" /> Add checklist entry
                        </Button>
                    </div>
                </div>
            ))}

            {sections.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setSections((prev) => [...prev, emptySection()])
                        }
                    >
                        <Plus className="h-4 w-4" /> Add Section
                    </Button>
                    <Button variant="outline" onClick={loadDefaults}>
                        <FileText className="h-4 w-4" /> Load Default Sections
                    </Button>
                </div>
            )}

            {/* ── Actions ── */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                    {dirty
                        ? "You have unsaved changes."
                        : "Everything saved. The page updates the moment you save."}
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setConfirmReset(true)}
                        disabled={saving || isPending || !usingCustom}
                    >
                        <RotateCcw className="h-4 w-4" /> Reset to Default
                    </Button>
                    <Button
                        variant="brand"
                        onClick={() => save(sections)}
                        disabled={saving || isPending || !dirty}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save &amp;
                                Publish
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* ── Reset confirmation ── */}
            <AlertDialog
                open={confirmReset}
                onOpenChange={(open) => !open && setConfirmReset(false)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Reset to the default policy
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Your custom sections will be deleted and the
                            storefront shows the shipped 8-section policy
                            again. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving || isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                setSections([]);
                                save([]);
                            }}
                            disabled={saving || isPending}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                            {saving || isPending ? "Resetting..." : "Yes, Reset"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
