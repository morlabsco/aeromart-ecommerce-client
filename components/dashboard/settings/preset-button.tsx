"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import {
    applySettingsPreset,
    resetSettings,
    resetSettingsToEmpty,
} from "@/lib/services/settings";
import { NICHE_OPTIONS } from "@/lib/settings-niches";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage } from "@/lib/utils/form-feedback";

/** Special option: resets every section to empty (no theme). */
const EMPTY_OPTION = { value: "empty", label: "Empty (no theme)" };

const ALL_OPTIONS = [...NICHE_OPTIONS, EMPTY_OPTION];

/**
 * "Niche Preset" control: pick a niche, then either Apply (theme only) or
 * Reset (full preset, or "empty" → clear all sections with no theme), each
 * with its own confirm modal. Shows the label (e.g. "Perfume Oil") not the
 * raw value.
 */
export function PresetButton() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selected, setSelected] = useState<string>("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [action, setAction] = useState<"apply" | "reset">("apply");

    const isEmpty = selected === "empty";
    const selectedLabel =
        ALL_OPTIONS.find((n) => n.value === selected)?.label ?? "";

    const canApply = !isEmpty;
    const canReset = !!selected;

    const run = () => {
        if (!selected) return;
        setConfirmOpen(false);
        startTransition(async () => {
            const result = isEmpty
                ? await resetSettingsToEmpty()
                : action === "apply"
                ? await applySettingsPreset(selected)
                : await resetSettings(selected);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(
                result.message ??
                    (isEmpty
                        ? "Settings cleared"
                        : action === "apply"
                        ? "Preset applied successfully"
                        : "Preset reset successfully")
            );
            setSelected("");
            router.refresh();
        });
    };

    const openApply = () => {
        setAction("apply");
        setConfirmOpen(true);
    };
    const openReset = () => {
        setAction("reset");
        setConfirmOpen(true);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <Select
                    value={selected}
                    onValueChange={(v) => setSelected(String(v ?? ""))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Pick a niche">
                            {(value) => {
                                const v = String(value ?? "");
                                return (
                                    ALL_OPTIONS.find((n) => n.value === v)?.label ??
                                    (v || null)
                                );
                            }}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {ALL_OPTIONS.map((option) => (
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
                <Button
                    type="button"
                    variant="outline"
                    disabled={!canApply || isPending}
                    onClick={openApply}
                    className="gap-1.5"
                >
                    {isPending && action === "apply" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    Apply
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={!canReset || isPending}
                    onClick={openReset}
                    className="gap-1.5 text-destructive hover:text-destructive"
                >
                    {isPending && action === "reset" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RotateCcw className="h-4 w-4" />
                    )}
                    Reset
                </Button>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEmpty
                                ? "Reset everything to empty?"
                                : action === "apply"
                                ? `Apply ${selectedLabel} theme?`
                                : `Reset to ${selectedLabel} preset?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isEmpty
                                ? `Clears all sections to empty defaults (theme, hero, testimonials, navbar, footer, contact, about and limited offer). No theme is applied. Store currency and delivery options are kept. This cannot be undone.`
                                : action === "apply"
                                ? `This applies only the ${selectedLabel} theme, colors (light and dark), fonts, radius and global CSS. Your brand identity, hero, navbar, footer and other sections stay untouched.`
                                : `This replaces all sections with the ${selectedLabel} preset, theme, brand identity, hero, navbar, footer, contact, about, testimonials and limited offer. Store currency and delivery options are kept. This cannot be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={run}
                            disabled={isPending}
                            className={
                                action === "reset"
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : undefined
                            }
                        >
                            {isPending
                                ? isEmpty
                                    ? "Clearing..."
                                    : action === "apply"
                                    ? "Applying..."
                                    : "Resetting..."
                                : isEmpty
                                ? "Yes, clear everything"
                                : action === "apply"
                                ? "Yes, apply theme"
                                : "Yes, reset preset"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
