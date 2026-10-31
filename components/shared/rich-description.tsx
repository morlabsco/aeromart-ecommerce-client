import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * RichDescription — renders admin-authored rich text (TipTap editor output)
 * or plain text. HTML goes into the token-styled `.rich-description`
 * container (globals.css — Bangla "Li Ador Noirrit" face first, Jost/Hind
 * stack behind it, editor inline styles normalized away); plain text renders
 * as relaxed paragraphs. One renderer for the storefront product page and
 * the dashboard product details.
 * ------------------------------------------------------------------------- */

/** True when the text carries HTML markup (rich-text editor output). */
export function looksLikeHtml(text: string): boolean {
    return /<\/?[a-z][^>]*>/i.test(text);
}

export function RichDescription({
    text,
    className,
}: {
    /** Raw description field — HTML from the editor or plain text. */
    text?: string | null;
    className?: string;
}) {
    const content = (text ?? "").trim();
    if (!content) return null;

    if (!looksLikeHtml(content)) {
        return (
            <div
                className={cn(
                    "space-y-3 text-sm leading-relaxed text-muted-foreground",
                    className,
                )}
            >
                {content
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                    ))}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rich-description text-sm leading-relaxed text-muted-foreground",
                className,
            )}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
