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

/* ---------------------------------------------------------------------------
 * Server error → friendly toast text
 *
 * The backend's generic validation message is just "Validation Error" while
 * the real detail sits in `errorSources` with RAW field paths ("offerPrice",
 * "startAt"…). This builds a human sentence from those paths so toasts never
 * show camelCase jargon.
 * ------------------------------------------------------------------------- */

/** Known field paths → the label users read. */
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  password: "Password",
  oldPassword: "Current password",
  newPassword: "New password",
  phoneNo: "Phone number",
  address: "Address",
  description: "Description",
  price: "Price",
  currency: "Currency",
  stock: "Stock",
  weight: "Weight",
  slug: "Slug",
  sku: "SKU",
  category: "Category",
  brand: "Brand",
  images: "Images",
  image: "Image",
  logo: "Logo",
  icon: "Icon",
  isActive: "Active status",
  variants: "Variants",
  attributes: "Attributes",
  colorOptions: "Color options",
  specification: "Specification",
  keyFeatures: "Key features",
  offerPrice: "Offer price",
  type: "Offer type",
  value: "Offer value",
  startAt: "Offer start date",
  endAt: "Offer end date",
  code: "Coupon code",
  discountType: "Discount type",
  discountValue: "Discount value",
  minOrderAmount: "Minimum order amount",
  maxDiscountAmount: "Maximum discount",
  startDate: "Start date",
  endDate: "End date",
  products: "Products",
  product: "Product",
  quantity: "Quantity",
  variant: "Variant",
  coupon: "Coupon",
  deliveryOptionName: "Delivery method",
  shippingAddress: "Shipping address",
  recipientName: "Recipient name",
  notes: "Notes",
  rating: "Rating",
  title: "Title",
  headline: "Headline",
  label: "Label",
  url: "Link",
  slides: "Slides",
  items: "Items",
  theme: "Theme",
  fonts: "Fonts",
  colors: "Colors",
  role: "Role",
};

/** "offerPrice" / "startDate" / "sku" → "Offer price" / "Start date" / "SKU". */
function humanizeField(path: string): string {
  const key = path.split(".").pop() ?? path;
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => (w.toLowerCase() === "sku" || w.toLowerCase() === "url" ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)));
  return words.join(" ") || "Some details";
}

interface ServerErrorLike {
  message?: string | null;
  errorSources?: { path: string; message: string }[] | null;
}

/**
 * Friendly toast text for a failed service result. When the server's message
 * is the generic "Validation Error", the field paths from `errorSources`
 * become the description — Proper Cased, max 3 named, then "and N more".
 * Otherwise the server's own (already friendly) message is returned as-is.
 */
export function serverErrorMessage(
  result: ServerErrorLike,
  fallback = "Something went wrong. Please try again.",
): string {
  const message = result.message?.trim();
  const sources = (result.errorSources ?? []).filter((s) => s?.path !== "");

  if (!sources.length) {
    return message || fallback;
  }

  const labels = Array.from(
    new Set(sources.map((s) => humanizeField(String(s.path ?? "")))),
  );
  const named = labels.slice(0, 3);
  const extra = labels.length - named.length;
  const list =
    extra > 0 ? `${named.join(", ")} and ${extra} more` : named.join(", ");

  return `Please check: ${list}.`;
}

