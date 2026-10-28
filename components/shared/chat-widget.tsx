"use client"

import { useState } from "react"
import { MessageCircle, Phone, X } from "lucide-react"
import type { SettingsContact } from "@/lib/types/backend"
import { cn } from "@/lib/utils"
import { MessengerIcon, WhatsAppIcon } from "./brand-icons"

interface ChatWidgetProps {
  /** Contact section from the settings singleton. */
  contact?: SettingsContact | null
}

/** Strips everything except digits and a leading + from a phone number. */
function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "")
}

/** Derives a m.me page id from a facebook profile/shop URL, if possible. */
function messengerFromFacebook(url: string) {
  const lastSegment = url.replace(/\/+$/, "").split("/").pop() ?? ""
  // Reject things that are clearly not page ids (query strings, file names).
  if (!lastSegment || lastSegment.includes("?") || lastSegment.includes(".")) return ""
  return lastSegment ? `https://m.me/${lastSegment}` : ""
}

/**
 * Nittonova-style floating chat button, bottom-right: orange circle with a
 * white chat glyph, a green presence dot and a soft pulsing ring. Toggles
 * open to reveal WhatsApp / Messenger / Call buttons that spring upward in
 * sequence; the main button flips to a close icon while open. Channels
 * without configured contact data are hidden automatically.
 */
export function ChatWidget({ contact }: ChatWidgetProps) {
  const [open, setOpen] = useState(false)

  const phone = contact?.phone?.trim() ?? ""
  const digits = normalizePhone(phone)
  const facebookUrl = contact?.social?.facebook?.trim() ?? ""

  const actions = [
    digits && {
      label: "WhatsApp",
      href: `https://wa.me/${digits.replace(/^\+/, "")}`,
      icon: WhatsAppIcon,
      // Platform brand colors — fixed identities, not theme tokens.
      className: "bg-[#25D366] hover:bg-[#1fb857]",
    },
    facebookUrl &&
      messengerFromFacebook(facebookUrl) && {
        label: "Messenger",
        href: messengerFromFacebook(facebookUrl),
        icon: MessengerIcon,
        className: "bg-[#0084FF] hover:bg-[#0073d9]",
      },
    phone && {
      label: "Call Us",
      href: `tel:${phone.replace(/\s/g, "")}`,
      icon: Phone,
      className: "bg-brand hover:bg-brand/90",
    },
  ].filter(Boolean) as {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    className: string
  }[]

  // No contact channels configured at all — render nothing.
  if (actions.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3 sm:bottom-6 sm:right-6">
      {/* Channel buttons — spring open upward with a stagger */}
      <div className="flex flex-col items-center gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <a
              key={action.label}
              href={action.href}
              target={action.href.startsWith("http") ? "_blank" : undefined}
              rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={action.label}
              className={cn(
                "group relative flex h-12 w-12 items-center justify-center rounded-full text-brand-foreground shadow-lg transition-all duration-300 hover:scale-110",
                action.className,
                open
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none translate-y-5 scale-50 opacity-0"
              )}
              style={{
                transitionDelay:
                  open && actions.length > 1
                    ? `${(actions.length - 1 - i) * 70}ms`
                    : `${i * 40}ms`,
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-header-nav px-3 py-1.5 text-xs font-semibold text-header-nav-foreground opacity-0 shadow-md transition-all duration-200 group-hover:-translate-x-1 group-hover:opacity-100 sm:block">
                {action.label}
              </span>
            </a>
          )
        })}
      </div>

      {/* Main toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat options" : "Open chat options"}
        aria-expanded={open}
        className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xl transition-transform duration-300 hover:scale-105"
      >
        {/* Flowing pulse ring while collapsed */}
        {!open && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-brand/40"
          />
        )}
        {/* Presence dot while collapsed */}
        {!open && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-success"
          />
        )}
        <span
          className={cn(
            "relative transition-transform duration-300",
            open && "rotate-90"
          )}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </span>
      </button>
    </div>
  )
}
