"use client";

import * as React from "react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    Columns3Icon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    pageSize?: number;
    loading?: boolean;
    loadingRowCount?: number;
}

export function DashboardDataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    pageSize = 10,
    loading = false,
    loadingRowCount = 5,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize,
    });

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-9 w-64 rounded-md bg-muted animate-pulse" />
                    <div className="h-9 w-24 rounded-md bg-muted animate-pulse ml-auto" />
                </div>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: loadingRowCount }).map(
                                (_, i) => (
                                    <TableRow key={i}>
                                        {columns.map((_, j) => (
                                            <TableCell key={j}>
                                                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                {searchKey && (
                    <Input
                        placeholder={searchPlaceholder}
                        value={
                            (table
                                .getColumn(searchKey)
                                ?.getFilterValue() as string) ?? ""
                        }
                        onChange={(event) =>
                            table
                                .getColumn(searchKey)
                                ?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger
                            render={
                                <Button variant="outline" size="sm" className="ml-auto" />
                            }
                        >
                            <Columns3Icon className="h-4 w-4 mr-2" />
                            Columns
                            <ChevronDownIcon className="h-3 w-3 ml-1" />
                        </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        {table
                            .getAllColumns()
                            .filter(
                                (column) =>
                                    typeof column.accessorFn !== "undefined" &&
                                    column.getCanHide()
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                    <TableHeader className="bg-muted/40 [&_tr]:border-b [&_tr]:border-border/60 [&_th]:h-11 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : (
                                                      <div
                                                          className={cn(
                                                              "flex items-center gap-1",
                                                              header.column.getCanSort() &&
                                                                  "cursor-pointer select-none hover:text-foreground"
                                                          )}
                                                          onClick={
                                                              header.column.getCanSort()
                                                                  ? header.column.getToggleSortingHandler()
                                                                  : undefined
                                                          }
                                                      >
                                                          {flexRender(
                                                              header.column
                                                                  .columnDef
                                                                  .header,
                                                              header.getContext()
                                                          )}
                                                          {{
                                                              asc: (
                                                                  <ArrowUp className="h-3 w-3 ml-0.5" />
                                                              ),
                                                              desc: (
                                                                  <ArrowDown className="h-3 w-3 ml-0.5" />
                                                              ),
                                                          }[
                                                              header.column.getIsSorted() as string
                                                          ] ??
                                                              (
                                                                  header.column.getCanSort() && (
                                                                      <ArrowUpDown className="h-3 w-3 ml-0.5 text-muted-foreground/50" />
                                                                  )
                                                              )}
                                                      </div>
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                    className="transition-colors hover:bg-muted/40"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-muted-foreground"
                                >
                                    No results found — try a different search.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} row
                    {table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
                    {table.getFilteredSelectedRowModel().rows.length > 0 &&
                        ` · ${table.getFilteredSelectedRowModel().rows.length} selected`}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {Math.max(table.getPageCount(), 1)}
                    </div>
                    <div className="flex items-center overflow-hidden rounded-lg border border-border/60">
                        <Button
                            variant="ghost"
                            className="h-8 w-8 rounded-none border-0 p-0 first:rounded-l-lg last:rounded-r-lg hover:bg-muted"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 rounded-none border-0 p-0 first:rounded-l-lg last:rounded-r-lg hover:bg-muted"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 rounded-none border-0 p-0 first:rounded-l-lg last:rounded-r-lg hover:bg-muted"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 rounded-none border-0 p-0 first:rounded-l-lg last:rounded-r-lg hover:bg-muted"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
