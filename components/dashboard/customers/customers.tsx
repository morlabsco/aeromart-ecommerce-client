"use client"

import { Suspense, useMemo, useState } from "react"
import { Search, ChevronDown, ChevronUp, Mail, Phone } from "lucide-react"
import { useCustomerStore, useOrderStore } from "../../../lib/store/app-store"
import { useQueryParams } from "../../../lib/hooks/use-query-params"
import { Input } from "../../ui/input"
import { Pagination } from "../../ui/pagination"
import { OrderStatusBadge } from "../../shared/order-status-badge"

function CustomersPageContent() {
  const { customers } = useCustomerStore()
  const { orders } = useOrderStore()
  const [params, setParams] = useQueryParams({ search: "", sort: "most-orders", page: "1" })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = [...customers]

    if (params.search) {
      const q = params.search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q),
      )
    }

    switch (params.sort) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "highest-spent":
        result.sort((a, b) => b.totalSpent - a.totalSpent)
        break
      default: // most-orders
        result.sort((a, b) => b.totalOrders - a.totalOrders)
    }

    return result
  }, [customers, params.search, params.sort])

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(Math.max(1, Number(params.page) || 1), totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground text-sm mt-1">View customer information and order history</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={params.search}
            onChange={(e) => setParams({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        <select
          value={params.sort}
          onChange={(e) => setParams({ sort: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm bg-card border-border"
        >
          <option value="most-orders">Most Orders</option>
          <option value="name-asc">Name: A-Z</option>
          <option value="name-desc">Name: Z-A</option>
          <option value="highest-spent">Highest Spent</option>
        </select>
      </div>

      <div className="space-y-4">
        {paginated.map((customer) => {
          const customerOrders = orders.filter((o) => o.customerId === customer.id)

          return (
            <div key={customer.id} className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                    {customer.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{customer.totalOrders} orders</p>
                    <p className="text-xs text-muted-foreground">${customer.totalSpent.toFixed(2)}</p>
                  </div>
                  {expandedId === customer.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {expandedId === customer.id && (
                <div className="border-t px-4 sm:px-6 py-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Contact Info</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> {customer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" /> {customer.phone}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Stats</h4>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p>Total Orders: <span className="font-medium">{customer.totalOrders}</span></p>
                        <p>Total Spent: <span className="font-medium">${customer.totalSpent.toFixed(2)}</span></p>
                        <p>Last Order: <span className="font-medium">{new Date(customer.lastOrderDate).toLocaleDateString()}</span></p>
                        <p>Customer Since: <span className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</span></p>
                      </div>
                    </div>
                  </div>

                  {customerOrders.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Order History</h4>
                      <div className="space-y-2">
                        {customerOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
                            <div>
                              <span className="font-medium">{order.id}</span>
                              <span className="text-muted-foreground ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">${order.total.toFixed(2)}</span>
                              <OrderStatusBadge status={order.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No customers found</p>
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setParams({ page: String(p) })} />
    </div>
  )
}

export default function Customers() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Loading customers...</div>}>
      <CustomersPageContent />
    </Suspense>
  )
}
