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

/* Whitespace the admin typed must SURVIVE rendering. Browsers collapse runs
 * of spaces and give empty paragraphs no line box, while the TipTap editor
 * (a pre-wrap surface) shows both — so spacing that looked right while
 * editing used to quietly disappear on the product pages. Before injecting
 * the editor's HTML:
 *   , blank paragraphs (Enter on an empty line → <p></p>) become <p><br></p>
 *     so the empty line is actually visible
 *   , runs of 2+ spaces in TEXT nodes become &nbsp; so they keep their width
 *     (single spaces between words already render correctly)
 * Text segments that contain a newline are left alone — those are inter-tag
 * source formatting of pretty-printed HTML, where a forced space would add
 * a stray line (all TipTap output is compact, so typed content never has
 * source newlines). */
function preserveEditorWhitespace(html: string): string {
    return html
        .replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/g, "<p><br></p>")
        .split(/(<[^>]+>)/)
        .map((segment) =>
            segment.startsWith("<") || segment.includes("\n")
                ? segment
                : segment.replace(
                      / {2,}/g,
                      (run) => "&nbsp;".repeat(run.length),
                  ),
        )
        .join("");
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
        // Plain text renders pre-wrap so every space, indent and blank line
        // the admin typed is shown exactly (splitting into paragraphs used
        // to collapse runs of newlines into a single break).
        return (
            <div
                className={cn(
                    "whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
                    className,
                )}
            >
                {content.replace(/\r\n?/g, "\n")}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rich-description text-sm leading-relaxed text-muted-foreground",
                className,
            )}
            dangerouslySetInnerHTML={{ __html: preserveEditorWhitespace(content) }}
        />
    );
}
