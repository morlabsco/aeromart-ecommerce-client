"use client";

import { useState } from "react";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface KeyValueItem {
    key: string;
    value: string;
}

interface KeyValueListEditorProps {
    label: string;
    items: KeyValueItem[];
    onChange: (items: KeyValueItem[]) => void;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    addLabel?: string;
}

/**
 * Editable list of { key, value } pairs (e.g. product specifications).
 * Supports add, inline edit, remove, and reorder (serial maintenance).
 */
export function KeyValueListEditor({
    label,
    items,
    onChange,
    keyPlaceholder = "Key",
    valuePlaceholder = "Value",
    addLabel = "Add Row",
}: KeyValueListEditorProps) {
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");

    const addItem = () => {
        const key = newKey.trim();
        const value = newValue.trim();
        if (!key || !value) return;
        onChange([...items, { key, value }]);
        setNewKey("");
        setNewValue("");
    };

    const updateItem = (index: number, patch: Partial<KeyValueItem>) => {
        onChange(
            items.map((item, i) => (i === index ? { ...item, ...patch } : item))
        );
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
                                value={item.key}
                                onChange={(e) =>
                                    updateItem(index, { key: e.target.value })
                                }
                                placeholder={keyPlaceholder}
                                className="flex-1"
                            />
                            <Input
                                value={item.value}
                                onChange={(e) =>
                                    updateItem(index, { value: e.target.value })
                                }
                                placeholder={valuePlaceholder}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeItem(index)}
                                aria-label="Remove row"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2">
                <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder={keyPlaceholder}
                    className="flex-1"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addItem();
                        }
                    }}
                />
                <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={valuePlaceholder}
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
