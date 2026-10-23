"use client";

import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types/backend";

const STATUS_ORDER: OrderStatus[] = [
    "Pending",
    "Processing",
    "Shipped",
    "Completed",
    "Cancelled",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
    Pending: "var(--chart-4)",
    Processing: "var(--chart-3)",
    Shipped: "var(--chart-2)",
    Completed: "var(--chart-1)",
    Cancelled: "var(--destructive)",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
    Pending: "Pending",
    Processing: "Processing",
    Shipped: "Shipped",
    Completed: "Completed",
    Cancelled: "Cancelled",
};

const chartConfig = {
    orders: { label: "Orders" },
    ...Object.fromEntries(
        STATUS_ORDER.map((s) => [s, { label: STATUS_LABELS[s] }])
    ),
} satisfies ChartConfig;

interface OrderStatusChartProps {
    orders: Order[];
}

export function OrderStatusChart({ orders }: OrderStatusChartProps) {
    const [selected, setSelected] = React.useState<OrderStatus | null>(null);

    const data = React.useMemo(
        () =>
            STATUS_ORDER.map((status) => ({
                status,
                value: orders.filter((o) => o.status === status).length,
            })),
        [orders]
    );

    const total = data.reduce((sum, d) => sum + d.value, 0);

    const visibleData = selected
        ? data.filter((d) => d.status === selected)
        : data;

    const activeCount = selected
        ? data.find((d) => d.status === selected)?.value ?? 0
        : total;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-base">Order Status</CardTitle>
                <CardDescription>
                    {total} total orders · click a segment to filter
                </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-4 sm:px-4">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-64 w-full">
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    formatter={(value, name) => [
                                        `${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
                                        name,
                                    ]}
                                />
                            }
                        />
                        <Pie
                            data={visibleData}
                            dataKey="value"
                            nameKey="status"
                            innerRadius={62}
                            outerRadius={92}
                            strokeWidth={4}
                            stroke="var(--background)"
                            paddingAngle={selected ? 0 : 2}
                            onClick={(_, index) => {
                                const entry = visibleData[index];
                                if (!entry) return;
                                setSelected((prev) =>
                                    prev === entry.status ? null : entry.status
                                );
                            }}
                            className="cursor-pointer outline-hidden"
                        >
                            {visibleData.map((entry) => (
                                <Cell
                                    key={entry.status}
                                    fill={STATUS_COLORS[entry.status]}
                                    fillOpacity={
                                        selected && selected !== entry.status
                                            ? 0.25
                                            : 1
                                    }
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 px-2">
                    {data.map((entry) => {
                        const isSelected = selected === entry.status;
                        return (
                            <button
                                key={entry.status}
                                type="button"
                                onClick={() =>
                                    setSelected(isSelected ? null : entry.status)
                                }
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                                    isSelected
                                        ? "border-primary bg-primary/10 text-foreground"
                                        : "border-border text-muted-foreground hover:bg-muted"
                                )}
                                aria-pressed={isSelected}
                            >
                                <span
                                    className="size-2 rounded-full"
                                    style={{ background: STATUS_COLORS[entry.status] }}
                                />
                                {entry.status}
                                <span className="tabular-nums">{entry.value}</span>
                            </button>
                        );
                    })}
                    {selected && (
                        <Badge variant="outline" className="ml-1 cursor-default">
                            {activeCount} active
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
