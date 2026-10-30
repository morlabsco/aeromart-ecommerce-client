"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Braces,
    Copy,
    FileDown,
    Loader2,
    Mail,
    Search,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { deleteSubscriber } from "@/lib/services/newsletter";
import { isErrorResult } from "@/lib/utils/result";
import type { NewsletterSubscriber } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Dashboard v4 — Newsletter manager. Every storefront subscription in one
 * list: search, copy, delete, and one-click export (all or single) as CSV
 * or JSON. Exports are generated client-side — no server round-trip needed.
 * ------------------------------------------------------------------------- */

/** RFC-4180-safe CSV cell (quotes wrap cells that contain , " or newlines). */
function csvCell(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(rows: NewsletterSubscriber[]): string {
    const head = ["email", "subscribedAt", "id"];
    const body = rows.map((r) =>
        [
            csvCell(r.email),
            csvCell(new Date(r.createdAt).toISOString()),
            csvCell(r._id),
        ].join(","),
    );
    return [head.join(","), ...body].join("\n");
}

function download(filename: string, mime: string, content: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function NewsletterManager({
    subscribers,
}: {
    subscribers: NewsletterSubscriber[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [query, setQuery] = useState("");
    const [removing, setRemoving] = useState<NewsletterSubscriber | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return subscribers;
        return subscribers.filter((s) => s.email.toLowerCase().includes(q));
    }, [subscribers, query]);

    const exportAll = (format: "csv" | "json") => {
        if (subscribers.length === 0) {
            toast.info("No subscribers to export yet.");
            return;
        }
        if (format === "csv") {
            download(
                `newsletter-subscribers-${stamp()}.csv`,
                "text/csv;charset=utf-8",
                toCsv(subscribers),
            );
        } else {
            download(
                `newsletter-subscribers-${stamp()}.json`,
                "application/json",
                JSON.stringify(
                    subscribers.map((s) => ({
                        email: s.email,
                        subscribedAt: s.createdAt,
                        id: s._id,
                    })),
                    null,
                    2,
                ),
            );
        }
        toast.success(`Exported ${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"} as ${format.toUpperCase()}`);
    };

    const exportOne = (subscriber: NewsletterSubscriber, format: "csv" | "json") => {
        if (format === "csv") {
            download(
                `subscriber-${subscriber.email}-${stamp()}.csv`,
                "text/csv;charset=utf-8",
                toCsv([subscriber]),
            );
        } else {
            download(
                `subscriber-${subscriber.email}-${stamp()}.json`,
                "application/json",
                JSON.stringify(
                    {
                        email: subscriber.email,
                        subscribedAt: subscriber.createdAt,
                        id: subscriber._id,
                    },
                    null,
                    2,
                ),
            );
        }
        toast.success(`Exported ${subscriber.email} as ${format.toUpperCase()}`);
    };

    const confirmRemove = () => {
        if (!removing) return;
        startTransition(async () => {
            const result = await deleteSubscriber(removing._id);
            if (isErrorResult(result)) {
                toast.error(result.message);
                setRemoving(null);
                return;
            }
            toast.success(`Removed ${removing.email}`);
            setRemoving(null);
            router.refresh();
        });
    };

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Newsletter
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}{" "}
                        from the storefront subscribe form.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => exportAll("csv")}
                        disabled={isPending}
                    >
                        <FileDown className="size-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => exportAll("json")}>
                        <Braces className="size-4" /> Export JSON
                    </Button>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by email…"
                    className="pl-9"
                    aria-label="Search subscribers"
                />
            </div>

            {/* ── List ── */}
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                            <Mail className="size-6" strokeWidth={1.75} />
                        </span>
                        <h3 className="mt-4 text-base font-bold text-foreground">
                            {subscribers.length === 0
                                ? "No subscribers yet"
                                : `Nothing matches “${query}”`}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {subscribers.length === 0
                                ? "Emails submitted through the storefront's newsletter form land here, ready to export."
                                : "Try a different email or clear the search."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                                <th className="px-5 py-3 font-semibold">Email</th>
                                <th className="px-5 py-3 font-semibold">Subscribed</th>
                                <th className="px-5 py-3 text-right font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((subscriber) => (
                                <tr
                                    key={subscriber._id}
                                    className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
                                >
                                    <td className="px-5 py-3.5">
                                        <span className="font-mono font-medium text-foreground">
                                            {subscriber.email}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                                        {new Date(subscriber.createdAt).toLocaleString(
                                            "en-GB",
                                            {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            },
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-foreground"
                                                aria-label={`Copy ${subscriber.email}`}
                                                onClick={() => {
                                                    navigator.clipboard
                                                        .writeText(subscriber.email)
                                                        .then(() =>
                                                            toast.success("Email copied"),
                                                        )
                                                        .catch(() =>
                                                            toast.error(
                                                                "Couldn't copy — please copy it manually.",
                                                            ),
                                                        );
                                                }}
                                            >
                                                <Copy className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-foreground"
                                                aria-label={`Export ${subscriber.email} as CSV`}
                                                title="Export as CSV"
                                                onClick={() => exportOne(subscriber, "csv")}
                                            >
                                                <FileDown className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-foreground"
                                                aria-label={`Export ${subscriber.email} as JSON`}
                                                title="Export as JSON"
                                                onClick={() => exportOne(subscriber, "json")}
                                            >
                                                <Braces className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                aria-label={`Remove ${subscriber.email}`}
                                                onClick={() => setRemoving(subscriber)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Remove confirmation ── */}
            <AlertDialog
                open={!!removing}
                onOpenChange={(open) => !open && setRemoving(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Subscriber</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove{" "}
                            <span className="font-medium">{removing?.email}</span> from
                            the newsletter list? They can subscribe again any time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRemoving(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRemove}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Removing…
                                </>
                            ) : (
                                "Remove"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
