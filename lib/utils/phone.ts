/**
 * Shared phone number validation (E.164-style, international).
 * Accepts an optional `+<country code>` (1–3 digits) followed by 7–15 digits,
 * with optional spaces, dashes, or parentheses as separators.
 *
 * Examples: +8801712345678, +1 (555) 123-4567, 01712345678, +44 20 7946 0958
 */
export const PHONE_REGEX =
  /^\+?[0-9]{1,3}[\s()\-]*(?:[0-9][\s()\-]*){7,15}$/;

export const PHONE_ERROR_MESSAGE =
  "Enter a valid phone number with country code (e.g. +8801712345678).";
