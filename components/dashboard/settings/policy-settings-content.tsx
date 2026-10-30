"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { RichTextEditor } from "@/components/dashboard/shared/rich-text-editor";
import { updateSettingsSection } from "@/lib/services/settings";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
import { ExternalLink, FileText, Loader2, RotateCcw, Save } from "lucide-react";
import type { Settings } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Settings → Return & Refund — the rich-text editor for the storefront
 * policy page. Storage model: settings.policy.returnRefund holds ONE HTML
 * string (TipTap output). An EMPTY value renders the built-in default page
 * (the typed builder in the app — never deleted); saved HTML overrides only
 * the body, keeping the page shell (hero banner + contact panel) intact.
 * ------------------------------------------------------------------------- */

export function PolicySettingsContent({ settings }: { settings: Settings }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const savedHtml = settings.policy?.returnRefund ?? "";
    const [html, setHtml] = useState(savedHtml);
    const [saving, setSaving] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    const dirty = html !== savedHtml;
    const usingCustom = !!savedHtml.trim();

    const save = (nextHtml: string) => {
        setSaving(true);
        startTransition(async () => {
            const result = await updateSettingsSection("policy", {
                returnRefund: nextHtml,
            });
            setSaving(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(
                nextHtml.trim()
                    ? "Custom policy published — the storefront page now shows it."
                    : "Policy reset — the default page is live again.",
            );
            setConfirmReset(false);
            router.refresh();
        });
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
                                ? "Custom policy is live"
                                : "Showing the built-in default policy"}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {usingCustom
                                ? "The storefront page renders your edited content inside the same design (banner + contact panel)."
                                : "Write your own policy below to replace the default content — leaving it empty keeps the shipped page."}
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

            {/* ── Editor ── */}
            <RichTextEditor
                value={html}
                onChange={setHtml}
                placeholder="Write the Return & Refund Policy — headings, lists, tables, images all supported. Bangla text renders with the store's Bangla font."
                label="Return & Refund Policy content"
                minHeight={420}
            />

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
                        onClick={() => save(html)}
                        disabled={saving || isPending || !dirty}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save & Publish
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
                        <AlertDialogTitle>Reset to default policy</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your custom content will be deleted and the storefront
                            goes back to the built-in policy page. This cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving || isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => save("")}
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
