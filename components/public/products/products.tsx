"use client";

import { Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "../../../components/shared/reveal";
import { useQueryParams } from "../../../lib/hooks/use-query-params";
import { ProductCard } from "../../../components/shared/product-card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Slider } from "../../../components/ui/slider";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Pagination } from "@/components/ui/pagination";
import type { Product } from "@/lib/types";
import type { Category, Brand } from "@/lib/types/backend";
import { currencySymbol } from "@/lib/utils/currency";

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] rounded-xl bg-muted mb-3" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                </div>
            ))}
        </div>
    );
}

interface ProductsPageContentProps {
    products: Product[];
    categories: Category[];
    brands: Brand[];
}

function ProductsPageContent({
    products,
    categories,
    brands,
}: ProductsPageContentProps) {
    const [params, setParams] = useQueryParams({
        search: "",
        category: "all",
        brand: "all",
        sort: "newest",
        minPrice: "",
        maxPrice: "",
        inStock: "",
        page: "1",
    });
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Local, uncontrolled search input for lag-free typing. Commits to the URL
    // params only after the user pauses (debounced), so keystrokes never push
    // a router navigation.
    const [searchDraft, setSearchDraft] = useState(params.search);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setSearchDraft(params.search);
    }, [params.search]);

    useEffect(() => {
        setLoading(false);
    }, []);

    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchDraft(value);
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
            searchDebounceRef.current = setTimeout(() => {
                setParams({ search: value });
            }, 350);
        },
        [setParams],
    );

    // Clear the debounce on unmount.
    useEffect(() => {
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, []);

    // Derive slider bounds from all products
    const priceBounds = useMemo(() => {
        const prices = products.map((p) => p.price);
        return {
            min: prices.length ? Math.floor(Math.min(...prices)) : 0,
            max: prices.length ? Math.ceil(Math.max(...prices)) : 1000,
        };
    }, [products]);

    // Label map for sort select
    const sortLabels: Record<string, string> = {
        newest: "Newest",
        "price-asc": "Price: Low to High",
        "price-desc": "Price: High to Low",
        rating: "Top Rated",
    };

    // Currency symbol for the price filter placeholders (first product's currency).
    const currencyLabel = products[0]?.currency
        ? currencySymbol(products[0].currency)
        : "$";

    // Numeric price values for slider (local state for fluid dragging)
    const [sliderValue, setSliderValue] = useState<[number, number]>([
        Number(params.minPrice) || priceBounds.min,
        Number(params.maxPrice) || priceBounds.max,
    ]);

    // Sync slider from URL when params change externally
    useEffect(() => {
        setSliderValue([
            Number(params.minPrice) || priceBounds.min,
            Number(params.maxPrice) || priceBounds.max,
        ]);
    }, [params.minPrice, params.maxPrice, priceBounds.min, priceBounds.max]);

    const commitSlider = useCallback(
        (value: [number, number]) => {
            setParams({
                minPrice: value[0] > priceBounds.min ? String(value[0]) : "",
                maxPrice: value[1] < priceBounds.max ? String(value[1]) : "",
            });
        },
        [priceBounds, setParams],
    );

    const filtered = useMemo(() => {
        let result = products.filter((p) => p.isActive);

        if (params.search) {
            const q = params.search.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q),
            );
        }

        if (params.category !== "all") {
            result = result.filter((p) => p.category === params.category);
        }

        if (params.brand !== "all") {
            result = result.filter((p) => p.brand === params.brand);
        }

        // Price range filter
        const minP = Number(params.minPrice) || 0;
        const maxP = Number(params.maxPrice) || Infinity;
        result = result.filter((p) => p.price >= minP && p.price <= maxP);

        // Stock filter
        if (params.inStock === "true") {
            result = result.filter((p) => (p.stock ?? 0) > 0);
        }

        switch (params.sort) {
            case "price-asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "rating":
                result.sort((a, b) => b.rating - a.rating);
                break;
            case "newest":
            default:
                result.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                );
                break;
        }

        return result;
    }, [
        products,
        params.search,
        params.category,
        params.brand,
        params.sort,
        params.minPrice,
        params.maxPrice,
        params.inStock,
    ]);

    // Pagination
    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(
        Math.max(1, Number(params.page) || 1),
        totalPages,
    );
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    const hasActiveFilters =
        params.search ||
        params.category !== "all" ||
        params.brand !== "all" ||
        params.minPrice ||
        params.maxPrice ||
        params.inStock;

    const clearFilters = () =>
        setParams({
            search: "",
            category: "all",
            brand: "all",
            minPrice: "",
            maxPrice: "",
            inStock: "",
        });

    const filterPanel = (
        <div className="space-y-6">
            <div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search products..."
                        value={searchDraft}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">Category</h3>
                <RadioGroup
                    value={params.category}
                    onValueChange={(value) => setParams({ category: value })}
                    className="space-y-2"
                >
                    <Label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="all" />
                        All
                    </Label>
                    {categories.map((cat) => (
                        <Label
                            key={cat._id}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <RadioGroupItem value={cat.name} />
                            {cat.name}
                        </Label>
                    ))}
                </RadioGroup>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">Brand</h3>
                <RadioGroup
                    value={params.brand}
                    onValueChange={(value) => setParams({ brand: value })}
                    className="space-y-2"
                >
                    <Label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="all" />
                        All
                    </Label>
                    {brands.map((b) => (
                        <Label
                            key={b._id}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <RadioGroupItem value={b.name} />
                            {b.name}
                        </Label>
                    ))}
                </RadioGroup>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">Sort By</h3>
                <Select
                    value={params.sort}
                    onValueChange={(value) => setParams({ sort: value ?? "newest" })}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue>{sortLabels[params.sort] || params.sort}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Top Rated</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">Price Range</h3>
                <div className="space-y-3">
                    <Slider
                        value={sliderValue}
                        min={priceBounds.min}
                        max={priceBounds.max}
                        onValueChange={(value) => {
                            const [min, max] = value as number[];
                            setSliderValue([min, max]);
                        }}
                        onValueCommitted={(value) => {
                            const [min, max] = value as number[];
                            commitSlider([min, max]);
                        }}
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder={`${currencyLabel}${priceBounds.min}`}
                            value={params.minPrice}
                            onChange={(e) => setParams({ minPrice: e.target.value })}
                            className="h-8 text-xs"
                        />
                        <span className="text-zinc-400 text-xs">—</span>
                        <Input
                            type="number"
                            placeholder={`${currencyLabel}${priceBounds.max}`}
                            value={params.maxPrice}
                            onChange={(e) => setParams({ maxPrice: e.target.value })}
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </div>

            <div>
                <Label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                        checked={params.inStock === "true"}
                        onCheckedChange={(checked: boolean) =>
                            setParams({ inStock: checked ? "true" : "" })
                        }
                    />
                    In Stock Only
                </Label>
            </div>

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs cursor-pointer"
                >
                    <X className="h-3 w-3 mr-1" /> Clear filters
                </Button>
            )}
        </div>
    );

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                        Products
                    </h1>
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                        {filtered.length} items
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="sm:hidden"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                </Button>
            </motion.div>

            <div className="flex gap-8">
                {/* Desktop inline sidebar */}
                <motion.aside
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="hidden sm:block w-56 shrink-0"
                >
                    <div className="sticky top-24">{filterPanel}</div>
                </motion.aside>

                {/* Mobile floating filter overlay (bottom sheet) */}
                {showFilters && (
                    <div className="fixed inset-0 z-50 sm:hidden">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowFilters(false)}
                        />
                        <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t bg-background p-5 shadow-2xl">
                            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-semibold">Filters</h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                    aria-label="Close filters"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            {filterPanel}
                            <Button
                                className="mt-6 w-full"
                                onClick={() => setShowFilters(false)}
                            >
                                Show {filtered.length} results
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {loading ? (
                        <SkeletonGrid />
                    ) : paginated.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-lg text-zinc-500 dark:text-zinc-400">
                                No products found
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 cursor-pointer"
                                onClick={() =>
                                    setParams({
                                        search: "",
                                        category: "all",
                                        brand: "all",
                                        minPrice: "",
                                        maxPrice: "",
                                        inStock: "",
                                    })
                                }
                            >
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                animate="show"
                                key={`${params.category}-${params.brand}-${params.page}`}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                            >
                                {paginated.map((product, i) => (
                                    <motion.div key={product.id} variants={fadeUp}>
                                        <ProductCard
                                            product={product}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(p) => {
                                    setParams({ page: String(p) });
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Products({
    products,
    categories,
    brands,
}: {
    products: Product[];
    categories: Category[];
    brands: Brand[];
}) {
    return (
        <Suspense fallback={<SkeletonGrid />}>
            <ProductsPageContent
                products={products}
                categories={categories}
                brands={brands}
            />
        </Suspense>
    );
}
