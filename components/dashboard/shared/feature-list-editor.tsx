"use client";

import { useState } from "react";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FeatureListEditorProps {
    label: string;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    addLabel?: string;
}

/**
 * Editable list of plain text items (e.g. product key features).
 * Supports add, inline edit, remove, and reorder (serial maintenance).
 */
export function FeatureListEditor({
    label,
    items,
    onChange,
    placeholder = "Add an item",
    addLabel = "Add",
}: FeatureListEditorProps) {
    const [input, setInput] = useState("");

    const addItem = () => {
        const value = input.trim();
        if (!value) return;
        onChange([...items, value]);
        setInput("");
    };

    const updateItem = (index: number, value: string) => {
        onChange(items.map((item, i) => (i === index ? value : item)));
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const moveItem = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>

            {items.length > 0 && (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <button
                                    type="button"
                                    onClick={() => moveItem(index, -1)}
                                    disabled={index === 0}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                    aria-label="Move up"
                                >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveItem(index, 1)}
                                    disabled={index === items.length - 1}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                    aria-label="Move down"
                                >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <Input
                                value={item}
                                onChange={(e) => updateItem(index, e.target.value)}
                                placeholder={placeholder}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeItem(index)}
                                aria-label="Remove item"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addItem();
                        }
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="shrink-0"
                >
                    <Plus className="mr-1 h-4 w-4" />
                    {addLabel}
                </Button>
            </div>
        </div>
    );
}
