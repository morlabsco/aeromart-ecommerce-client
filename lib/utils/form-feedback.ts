"use client";

import { toast } from "sonner";

/**
 * Shared toast feedback for failed form validation. Fields already render
 * their inline errors + `aria-invalid` styling — this tells the user WHY
 * nothing happened the moment they hit submit, naming the first few fields
 * in friendly labels instead of error codes.
 *
 *   notifyInvalidFields(["name", "phone"], { name: "Name", phone: "Mobile" }, "place your order")
 *   → error toast "A few details are missing"
 *     "Name, Mobile — fill the highlighted fields to place your order."
 */
export function notifyInvalidFields(
  fieldKeys: string[],
  labels: Record<string, string>,
  action = "submit",
) {
  const names = fieldKeys
    .map((key) => labels[key] ?? key)
    .slice(0, 3);
  const extra = fieldKeys.length - names.length;
  const list =
    names.length === 0
      ? ""
      : extra > 0
        ? `${names.join(", ")} and ${extra} more`
        : names.join(", ");

  toast.error("A few details are missing", {
    description: list
      ? `${list} — fill the highlighted fields to ${action}.`
      : `Please fill the highlighted fields to ${action}.`,
  });
}

/**
 * Scrolls the first `aria-invalid` field into view and focuses it, so the
 * toast doesn't leave the user hunting for what went wrong. Runs in a frame
 * after React commits the error state.
 */
export function focusFirstInvalidField(root?: ParentNode) {
  requestAnimationFrame(() => {
    const el = (root ?? document).querySelector<HTMLElement>(
      "[aria-invalid='true']",
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  });
}
