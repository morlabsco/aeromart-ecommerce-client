"use client";

import * as React from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCurrency, currencySymbol } from "@/lib/utils/currency";
import type { Order } from "@/lib/types/backend";

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "var(--primary)",
    },
    orders: {
        label: "Orders",
        color: "var(--muted-foreground)",
    },
} satisfies ChartConfig;

const RANGES = [
    { label: "7D", days: 7 },
    { label: "14D", days: 14 },
    { label: "30D", days: 30 },
] as const;

type RangeKey = (typeof RANGES)[number]["days"];

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDay(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildSeries(orders: Order[], days: number) {
    const today = startOfDay(new Date());
    const from = new Date(today);
    from.setDate(from.getDate() - (days - 1));

    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
        const day = new Date(from);
        day.setDate(from.getDate() + i);
        buckets.set(day.toDateString(), { revenue: 0, orders: 0 });
    }

    for (const order of orders) {
        const created = startOfDay(new Date(order.createdAt));
        if (created < from || created > today) continue;
        const bucket = buckets.get(created.toDateString());
        if (!bucket) continue;
        bucket.orders += 1;
        if (order.paymentStatus === "Paid" && order.status !== "Cancelled") {
            bucket.revenue += order.finalAmount;
        }
    }

    return Array.from(buckets.entries()).map(([key, value]) => ({
        date: formatDay(new Date(key)),
        revenue: Number(value.revenue.toFixed(2)),
        orders: value.orders,
    }));
}

interface RevenueTrendChartProps {
    orders: Order[];
    /** Fallback currency for revenue display (brand currency). */
    brandCurrency?: string;
}

export function RevenueTrendChart({ orders, brandCurrency = "usd" }: RevenueTrendChartProps) {
    const [range, setRange] = React.useState<RangeKey>(30);

    const data = React.useMemo(() => buildSeries(orders, range), [orders, range]);

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
    const symbol = currencySymbol(brandCurrency);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <CardTitle className="text-base">Revenue & Orders</CardTitle>
                    <CardDescription>
                        {formatCurrency(totalRevenue, brandCurrency)} revenue · {totalOrders} orders in {range} days
                    </CardDescription>
                </div>
                <ToggleGroup
                    multiple={false}
                    size="sm"
                    variant="outline"
                    spacing={0}
                    value={[String(range)]}
                    onValueChange={(value) => {
                        const next = Number(value[0]);
                        if (value[0] && RANGES.some((r) => r.days === next)) {
                            setRange(next as RangeKey);
                        }
                    }}
                    className="self-start sm:self-auto"
                >
                    {RANGES.map((r) => (
                        <ToggleGroupItem key={r.days} value={String(r.days)}>
                            {r.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </CardHeader>
            <CardContent className="px-2 pb-4 sm:px-4">
                <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
                    <AreaChart
                        data={data}
                        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={24}
                        />
                        <YAxis
                            yAxisId="left"
                            tickLine={false}
                            axisLine={false}
                            width={44}
                            tickFormatter={(value: number) =>
                                `${symbol}${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`
                            }
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            width={28}
                            allowDecimals={false}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    indicator="dot"
                                    formatter={(value, name, item) => {
                                        const key = String(item.dataKey);
                                        if (key === "revenue") {
                                            return [formatCurrency(Number(value), brandCurrency), "Revenue"];
                                        }
                                        return [String(value), "Orders"];
                                    }}
                                />
                            }
                        />
                        <Area
                            yAxisId="left"
                            dataKey="revenue"
                            type="monotone"
                            fill="var(--color-revenue)"
                            fillOpacity={0.25}
                            stroke="var(--color-revenue)"
                            strokeWidth={2}
                            name="Revenue"
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="orders"
                            fill="var(--color-orders)"
                            fillOpacity={0.45}
                            radius={[3, 3, 0, 0]}
                            name="Orders"
                            barSize={16}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
