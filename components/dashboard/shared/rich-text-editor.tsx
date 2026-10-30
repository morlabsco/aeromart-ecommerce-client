"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extensions";
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Heading2,
    Heading3,
    Highlighter,
    ImagePlus,
    Italic,
    Link2,
    Link2Off,
    List,
    ListOrdered,
    Minus,
    Palette,
    Quote,
    Redo2,
    Strikethrough,
    Table as TableIcon,
    Trash2,
    Type,
    Underline,
    Undo2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * RichTextEditor — the shared TipTap editor for dashboard content (product
 * descriptions, policy pages…). Produces ONE clean HTML string; the
 * storefront renders it through the token-styled .rich-description scope,
 * and the editing surface here mirrors those styles (see globals.css).
 *
 * Toolbar groups: history · inline marks · blocks · lists · alignment ·
 * link/image · table · color/highlight · utilities. Wraps on small screens,
 * 36px touch targets, mousedown-default-prevented so the selection never
 * collapses when tapping a control.
 * ------------------------------------------------------------------------- */

/** Preset palette — brand-aware defaults + a compact standard set. */
const TEXT_COLORS = [
    "var(--foreground)",
    "var(--brand)",
    "var(--success)",
    "var(--warning)",
    "var(--info)",
    "var(--destructive)",
    "#7c3aed",
    "#0f766e",
];
const HIGHLIGHT_COLORS = [
    "color-mix(in oklab, var(--brand) 25%, transparent)",
    "color-mix(in oklab, var(--success) 30%, transparent)",
    "color-mix(in oklab, var(--warning) 35%, transparent)",
    "color-mix(in oklab, var(--info) 30%, transparent)",
    "#fef08a",
    "#bbf7d0",
    "#bfdbfe",
    "#fecdd3",
];

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    /** Content area min height (px). */
    minHeight?: number;
    disabled?: boolean;
    className?: string;
    /** Accessible name for the editing area. */
    label?: string;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Write something…",
    minHeight = 220,
    disabled = false,
    className,
    label = "Rich text content",
}: RichTextEditorProps) {
    const editor = useEditor(
        {
            extensions: [
                StarterKit.configure({
                    // Link ships inside StarterKit v3 — open in new tab by default.
                    link: {
                        openOnClick: false,
                        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
                    },
                }),
                TableKit.configure({ table: { resizable: true } }),
                Image.configure({ HTMLAttributes: { loading: "lazy" } }),
                TextAlign.configure({ types: ["heading", "paragraph"] }),
                TextStyle,
                Color,
                Highlight.configure({ multicolor: true }),
                Placeholder.configure({ placeholder }),
            ],
            content: value || "<p></p>",
            editable: !disabled,
            immediatelyRender: false,
            editorProps: {
                attributes: {
                    class: "tiptap",
                    "aria-label": label,
                    role: "textbox",
                    "aria-multiline": "true",
                },
            },
            onUpdate: ({ editor: current }) => {
                onChange(current.isEmpty ? "" : current.getHTML());
            },
        },
        [disabled],
    );

    /* Keep the doc in sync when the parent's value changes externally
     * (form reset, programmatic fill) — but never while the user is typing,
     * or the caret would jump. */
    useEffect(() => {
        if (!editor) return;
        const current = editor.isEmpty ? "" : editor.getHTML();
        if (value !== current && !editor.isFocused) {
            editor.commands.setContent(value || "<p></p>", {
                emitUpdate: false,
            });
        }
    }, [value, editor]);

    /* ── Link / image inline prompt rows ── */
    const [linkRow, setLinkRow] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageRow, setImageRow] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const linkInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (linkRow) linkInputRef.current?.focus();
    }, [linkRow]);
    useEffect(() => {
        if (imageRow) imageInputRef.current?.focus();
    }, [imageRow]);

    if (!editor) {
        return (
            <div
                className={cn(
                    "rich-editor h- animate-pulse rounded-lg border border-input bg-muted/40",
                    className,
                )}
                style={{ minHeight: minHeight + 49 }}
                aria-busy="true"
            />
        );
    }

    /** Prefix a scheme so "example.com" links don't become relative hrefs. */
    const normalizeUrl = (raw: string) => {
        const url = raw.trim();
        if (!url) return "";
        return /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(url)
            ? url
            : `https://${url}`;
    };

    const applyLink = () => {
        const href = normalizeUrl(linkUrl);
        if (!href) {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href })
                .run();
        }
        setLinkRow(false);
        setLinkUrl("");
    };

    const applyImage = () => {
        const src = imageUrl.trim();
        if (src) {
            editor.chain().focus().setImage({ src: normalizeUrl(src) }).run();
        }
        setImageRow(false);
        setImageUrl("");
    };

    const inTable = editor.isActive("table");

    return (
        <div
            className={cn(
                "rich-editor overflow-hidden rounded-lg border border-input bg-card focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-ring/25",
                disabled && "opacity-60",
                className,
            )}
        >
            {/* ── Toolbar ── */}
            <div
                role="toolbar"
                aria-label="Formatting"
                className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/40 p-1.5"
            >
                <ToolButton
                    title="Undo (Ctrl+Z)"
                    disabled={!editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <Undo2 />
                </ToolButton>
                <ToolButton
                    title="Redo (Ctrl+Shift+Z)"
                    disabled={!editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <Redo2 />
                </ToolButton>

                <Divider />

                <ToolButton
                    title="Bold (Ctrl+B)"
                    active={editor.isActive("bold")}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold />
                </ToolButton>
                <ToolButton
                    title="Italic (Ctrl+I)"
                    active={editor.isActive("italic")}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic />
                </ToolButton>
                <ToolButton
                    title="Underline (Ctrl+U)"
                    active={editor.isActive("underline")}
                    disabled={!editor.can().chain().focus().toggleUnderline().run()}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <Underline />
                </ToolButton>
                <ToolButton
                    title="Strikethrough"
                    active={editor.isActive("strike")}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough />
                </ToolButton>

                <Divider />

                <ToolButton
                    title="Paragraph"
                    active={editor.isActive("paragraph")}
                    onClick={() => editor.chain().focus().setParagraph().run()}
                >
                    <Type />
                </ToolButton>
                <ToolButton
                    title="Heading 2"
                    active={editor.isActive("heading", { level: 2 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                >
                    <Heading2 />
                </ToolButton>
                <ToolButton
                    title="Heading 3"
                    active={editor.isActive("heading", { level: 3 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                >
                    <Heading3 />
                </ToolButton>

                <Divider />

                <ToolButton
                    title="Bullet list"
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List />
                </ToolButton>
                <ToolButton
                    title="Numbered list"
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered />
                </ToolButton>
                <ToolButton
                    title="Quote"
                    active={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote />
                </ToolButton>
                <ToolButton
                    title="Code block"
                    active={editor.isActive("codeBlock")}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                >
                    <Code />
                </ToolButton>

                <Divider />

                <ToolButton
                    title="Align left"
                    active={editor.isActive({ textAlign: "left" })}
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                >
                    <AlignLeft />
                </ToolButton>
                <ToolButton
                    title="Align center"
                    active={editor.isActive({ textAlign: "center" })}
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                >
                    <AlignCenter />
                </ToolButton>
                <ToolButton
                    title="Align right"
                    active={editor.isActive({ textAlign: "right" })}
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                >
                    <AlignRight />
                </ToolButton>

                <Divider />

                <ToolButton
                    title={editor.isActive("link") ? "Edit link" : "Add link"}
                    active={editor.isActive("link")}
                    onClick={() => {
                        setLinkUrl(
                            (editor.getAttributes("link").href as string) ?? "",
                        );
                        setImageRow(false);
                        setLinkRow((open) => !open);
                    }}
                >
                    <Link2 />
                </ToolButton>
                {editor.isActive("link") && (
                    <ToolButton
                        title="Remove link"
                        onClick={() =>
                            editor.chain().focus().extendMarkRange("link").unsetLink().run()
                        }
                    >
                        <Link2Off />
                    </ToolButton>
                )}
                <ToolButton
                    title="Insert image by URL"
                    active={imageRow}
                    onClick={() => {
                        setImageUrl("");
                        setLinkRow(false);
                        setImageRow((open) => !open);
                    }}
                >
                    <ImagePlus />
                </ToolButton>

                <Divider />

                <ToolButton
                    title="Insert table (3×3)"
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                            .run()
                    }
                >
                    <TableIcon />
                </ToolButton>
                {inTable && (
                    <ToolButton
                        title="Delete table"
                        danger
                        onClick={() => editor.chain().focus().deleteTable().run()}
                    >
                        <Trash2 />
                    </ToolButton>
                )}

                <Divider />

                {/* Text color palette */}
                <Popover>
                    <PopoverTrigger
                        render={
                            <button
                                type="button"
                                title="Text color"
                                className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            />
                        }
                    >
                        <Palette />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-1.5">
                            {TEXT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    title="Text color"
                                    onClick={() =>
                                        editor.chain().focus().setColor(color).run()
                                    }
                                    className="size-7 cursor-pointer rounded-md border border-border/60 transition-transform hover:scale-110"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full text-xs"
                            onClick={() => editor.chain().focus().unsetColor().run()}
                        >
                            Reset to default
                        </Button>
                    </PopoverContent>
                </Popover>

                {/* Highlight palette */}
                <Popover>
                    <PopoverTrigger
                        render={
                            <button
                                type="button"
                                title="Highlight"
                                className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            />
                        }
                    >
                        <Highlighter />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-1.5">
                            {HIGHLIGHT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    title="Highlight"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHighlight({ color })
                                            .run()
                                    }
                                    className="size-7 cursor-pointer rounded-md border border-border/60 transition-transform hover:scale-110"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full text-xs"
                            onClick={() =>
                                editor.chain().focus().unsetHighlight().run()
                            }
                        >
                            Remove highlight
                        </Button>
                    </PopoverContent>
                </Popover>

                <Divider />

                <ToolButton
                    title="Divider line"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                    <Minus />
                </ToolButton>
                <ToolButton
                    title="Clear formatting"
                    onClick={() =>
                        editor.chain().focus().unsetAllMarks().clearNodes().run()
                    }
                >
                    <X />
                </ToolButton>
            </div>

            {/* ── Link URL prompt ── */}
            {linkRow && (
                <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-brand/5 px-2.5 py-2">
                    <Link2 className="size-4 shrink-0 text-brand" />
                    <Input
                        ref={linkInputRef}
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                applyLink();
                            }
                            if (e.key === "Escape") setLinkRow(false);
                        }}
                        placeholder="Paste a URL — leave empty to remove the link"
                        className="h-9 min-w-0 flex-1"
                        aria-label="Link URL"
                    />
                    <Button size="sm" variant="brand" onClick={applyLink}>
                        Apply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setLinkRow(false)}>
                        Cancel
                    </Button>
                </div>
            )}

            {/* ── Image URL prompt ── */}
            {imageRow && (
                <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-brand/5 px-2.5 py-2">
                    <ImagePlus className="size-4 shrink-0 text-brand" />
                    <Input
                        ref={imageInputRef}
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                applyImage();
                            }
                            if (e.key === "Escape") setImageRow(false);
                        }}
                        placeholder="Paste an image URL (https://…)"
                        className="h-9 min-w-0 flex-1"
                        aria-label="Image URL"
                        inputMode="url"
                    />
                    <Button size="sm" variant="brand" onClick={applyImage}>
                        Insert
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setImageRow(false)}>
                        Cancel
                    </Button>
                </div>
            )}

            {/* ── Editing surface ── */}
            <EditorContent
                editor={editor}
                style={{ minHeight }}
                className="rich-editor-surface px-4 py-3 text-sm leading-relaxed"
            />
        </div>
    );
}

/* ── Toolbar primitives ── */

function ToolButton({
    title,
    onClick,
    active,
    disabled,
    danger,
    children,
}: {
    title: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    danger?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            disabled={disabled}
            // Keep the editor selection when tapping a control.
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                active
                    ? "bg-brand text-brand-foreground"
                    : danger
                      ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
        >
            {children}
        </button>
    );
}

function Divider() {
    return (
        <span
            aria-hidden="true"
            className="mx-1 h-5 w-px shrink-0 bg-border"
        />
    );
}
