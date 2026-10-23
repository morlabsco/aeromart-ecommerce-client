"use client"

import { useCallback, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

type ParamDefaults = Record<string, string>

/**
 * Syncs filter/search/sort/page state to URL search params.
 * Omits keys from the URL when their value matches the default (clean URLs).
 * Auto-resets page to "1" when a non-page param changes.
 */
export function useQueryParams<T extends ParamDefaults>(defaults: T) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const params = useMemo(() => {
    const result = { ...defaults } as Record<string, string>
    for (const key of Object.keys(defaults)) {
      const val = searchParams.get(key)
      if (val !== null) {
        result[key] = val
      }
    }
    return result as T
  }, [searchParams, defaults])

  const setParams = useCallback(
    (updates: Partial<T>) => {
      const next = new URLSearchParams(searchParams.toString())

      // Reset to page 1 when a non-page filter changes value
      const hasFilterChange = Object.keys(updates).some(
        (k) => k !== "page" && updates[k as keyof T] !== params[k as keyof T],
      )
      if (hasFilterChange) {
        next.set("page", "1")
      }

      for (const [key, value] of Object.entries(updates)) {
        if (value === defaults[key] || value === undefined || value === "") {
          next.delete(key)
        } else {
          next.set(key, value as string)
        }
      }

      const qs = next.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname, params, defaults],
  )

  return [params, setParams] as const
}
