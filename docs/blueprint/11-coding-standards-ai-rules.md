# Coding Standards & AI Rules

**Question this file answers:** How should humans and AI write code on this project - and what are the guardrails AI must follow?

This is the most important file for AI to read before doing any work. It exists so that AI-assisted development stays consistent, predictable, and doesn't drift from the architecture defined in the other blueprint files. If there's ever a conflict between "what feels right in the moment" and what's written here, this file wins.

---

## 1. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Variables & functions | camelCase | `getUserSession`, `cartTotal` |
| React components | PascalCase | `ProductCard`, `DashboardSidebar` |
| Types & interfaces | PascalCase | `UserProfile`, `OrderStatus` |
| Constants (fixed values) | UPPER_SNAKE_CASE | `MAX_CART_ITEMS`, `DEFAULT_CURRENCY` |
| Zustand store hooks | camelCase, prefixed with `use` | `useCartStore`, `useAuthStore` |
| Database fields (Prisma) | camelCase | `createdAt`, `userId` |
| Route folders (App Router) | lowercase, kebab-case if multi-word | `forget-password`, `checkout` |

Consistency matters more than the "perfect" convention - once a pattern is used in a file, follow it in that file, even if a different convention is used elsewhere for a different kind of item.

## 2. File Naming

- **Components:** PascalCase file names matching the component name → `ProductCard.tsx`
- **Hooks:** camelCase, prefixed with `use` → `useDebounce.ts`
- **Utilities / lib files:** camelCase → `formatPrice.ts`, `getSession.ts`
- **Types:** camelCase or grouped in `types.ts` unless a domain grows large enough to warrant `types/order.ts`, `types/user.ts`
- **Route files:** follow Next.js App Router conventions exactly (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`) - never rename these
- No spaces, no uppercase folder names, no ambiguous names like `utils2.ts` or `temp.ts`

## 3. Error Handling

- All API routes must return consistent, predictable error shapes - never leak raw database or stack trace details to the client.
- Use `try/catch` around all database calls (Prisma) and external calls.
- Prefer early returns for error states over deeply nested conditionals.
- User-facing errors should be human-readable; internal errors should be logged (see backend-architecture.md for logging approach) but not shown as-is to the user.
- Every form submission and API route must handle the failure path, not just the happy path - no silent failures.

## 4. TypeScript Rules

- `strict` mode stays on. No disabling it to "make something work faster."
- No `any` unless absolutely unavoidable - and if used, it must be commented with why.
- Every function that takes props or arguments should have typed parameters; every API route should have typed request/response shapes.
- Shared types (used in more than one place) belong in `lib/types.ts` or a `types/` folder if that grows - not redefined per-component.
- Prisma-generated types should be reused directly where possible instead of manually re-declaring the same shape.

## 5. General Code Style

- UI should stay responsive across all devices, intuitive to use, and maintain strong color contrast - this applies to every screen, not just primary ones.
- Keep components focused - one responsibility per component. If a component is doing too much, split it.
- Co-locate component-specific logic with the component; keep only shared/reusable logic in `lib/` and `hooks/`.
- Favor readability over cleverness. This is a small project moving fast - code should be easy for a human to scan and understand later, not just functional.

---

## 6. Rules for AI

These are hard constraints. AI must follow them on every task, without exception, unless the project owner explicitly grants permission in that specific instance.

1. **No installing packages.** AI must not add, remove, or update dependencies without asking first and explaining why it's needed.
2. **No modifying the architecture.** The folder structure, routing pattern, state management approach, and tech stack defined in the blueprint files are fixed. AI does not restructure them on its own judgment.
3. **No unnecessary file creation.** AI should not create new files, folders, or documents unless the task requires it - and if it believes a new file is genuinely needed, it must state why and ask for permission before creating it.
4. **Ask before major changes.** Anything that touches multiple files, changes a data model, or affects more than one feature area requires a check-in before proceeding.
5. **Documentation first.** Before making any non-trivial change, AI must read the relevant files in the `docs/blueprint` folder to understand existing decisions and context - not guess or assume.
6. **Stay in scope.** AI should do the task asked, not "improve" unrelated code, rename things, or refactor areas that weren't part of the request.
7. **Explain before acting on ambiguity.** If a request is unclear or could be done multiple ways, AI should state its planned approach briefly before writing code, rather than picking silently and moving on.

The intent behind these rules: AI is a fast pair of hands, not the decision-maker on architecture or scope. It should move quickly *inside* the lines that have already been drawn in this blueprint, not redraw them.

---

## Suggestions

A few additions worth considering, kept minimal since this file is meant to stay lean and practical:

- **Commit message convention:** Even a lightweight one (e.g. `feat:`, `fix:`, `chore:`) makes it much easier to track what AI changed across a fast-moving week of development, and gives you a quick audit trail if something breaks.
- **A short "definition of done" checklist per feature** (builds without errors, responsive check, no console errors, matches naming conventions) - takes 30 seconds and catches a lot of small drift before it compounds.
- **Environment variable safety:** worth a one-line reminder here (even though it's covered in deployment.md) that AI must never hardcode secrets or commit `.env` values directly into code.
- Since this project is moving fast over ~1 week, it may help to explicitly note that **AI should flag technical debt it notices instead of silently fixing or silently ignoring it** - a quick comment or note is enough, full fixes can wait unless asked.

This closes out the full 11-file blueprint set: product/vision, frontend architecture, backend architecture, development roadmap, deployment, and now coding standards & AI rules.