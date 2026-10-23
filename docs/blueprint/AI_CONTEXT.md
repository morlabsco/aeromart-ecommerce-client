# AI_CONTEXT.md

**Question this file answers:** How does AI reliably pick up full project context every session, instead of starting from zero each time?

This file is the entry point. It doesn't contain the actual decisions - those live in `docs/blueprint/` and `docs/design.md`. This file just points AI at them, in order, and sets the ground rules for how AI is allowed to use them.

---

## How This Works

LLMs have no persistent memory of this repository between sessions. Every new chat starts blank unless context is explicitly given. This file solves that by being the **one thing you paste or reference at the start of every session** - it tells AI exactly which files to read, in what order, and what it's and isn't allowed to do with that information.

**At the start of every session, say:**

> "Read AI_CONTEXT.md before doing anything."

If your tool supports file references (e.g. `@filename` syntax in Cursor, Claude Code, Copilot Chat, etc.), use the reference list below directly. If it doesn't, paste the contents of the referenced files into the chat manually before giving your first task.

---

## Folder Structure

```
docs/
├── AI_CONTEXT.md          ← this file
├── design.md                ← design system / visual language
└── blueprint/
    ├── 01-project-overview.md
    ├── 02-requirement-analysis.md
    ├── 03-workflows.md
    ├── 04-data-modeling.md
    ├── 05-er-diagram.md
    ├── 06-api-endpoints.md
    ├── 07-frontend-architecture.md
    ├── 08-backend-architecture.md
    ├── 09-development-roadmap.md
    ├── 10-deployment.md
    └── 11-coding-standards-and-ai-rules.md
```

## Project Documentation (read in this order)

```
Project documentation:

@docs/blueprint/01-project-overview.md
@docs/blueprint/02-requirement-analysis.md
@docs/blueprint/03-workflows.md
@docs/blueprint/04-data-modeling.md
@docs/blueprint/05-er-diagram.md
@docs/blueprint/06-api-endpoints.md
@docs/blueprint/07-frontend-architecture.md
@docs/blueprint/08-backend-architecture.md
@docs/blueprint/09-development-roadmap.md
@docs/blueprint/10-deployment.md
@docs/blueprint/11-coding-standards-and-ai-rules.md
@docs/design.md
```

> **Note:** Double-check these filenames against what actually sits in your `docs/` and `docs/blueprint/` folders and rename/reorder here to match exactly - AI can only follow references that resolve to real files.

Each file answers one specific question. AI should treat that question as the reason the file exists, and check it first when a task touches that area:

| File | Answers |
|---|---|
| `01-project-overview.md` | What is this project, who is it for, what does it do? |
| `02-requirement-analysis.md` | What are the functional and non-functional requirements? |
| `03-workflows.md` | How do users and data move through the system, step by step? |
| `04-data-modeling.md` | What are the core entities, fields, and relationships? |
| `05-er-diagram.md` | What does the database schema look like, visually? |
| `06-api-endpoints.md` | What API routes exist, and what do they expect/return? |
| `07-frontend-architecture.md` | How is the frontend organized? |
| `08-backend-architecture.md` | How is backend logic organized and managed? |
| `09-development-roadmap.md` | What are the build phases and their order? |
| `10-deployment.md` | How and where does this get deployed? |
| `11-coding-standards-and-ai-rules.md` | How should humans and AI write code, and what are AI's hard limits? |
| `design.md` | What does the product look like - colors, type, components, layout? |

### Read-order logic
The list runs roughly **why → what → how it's structured → how it's built → how it looks**:
1–2 ground AI in the project's purpose and scope, 3–6 define the data and system behavior, 7–8 define the codebase structure, 9–10 define the build/ship process, 11 sets the coding guardrails, and `design.md` closes the loop with the visual layer. For most tasks AI won't need to re-read all eleven blueprint files in full - but it should know this order so it can jump to the right one instead of guessing.

---

## Rules

These apply on top of, not instead of, whatever's written in `11-coding-standards-and-ai-rules.md`. That file governs *how code is written*. This section governs *how AI behaves across a session*.

1. **Follow the documentation.** Every decision already made in `docs/blueprint/` and `docs/design.md` is settled. AI implements against it - it doesn't re-litigate it mid-task.
2. **Do not make architectural decisions.** Stack, folder structure, data model, state management, database choice, and deployment target are fixed. If a task seems to require an architectural change, stop and flag it instead of proceeding.
3. **Do not guess when a doc is silent.** If a task touches an area the blueprint doesn't cover, say so explicitly and ask, rather than inventing a pattern that isn't documented anywhere.
4. **Read before writing.** For any non-trivial task, check the relevant blueprint file(s) first - don't rely on memory of an earlier session or assume nothing changed.
5. **Stay in scope.** Do the task asked. Don't refactor, rename, or "improve" adjacent code that wasn't part of the request.
6. **Surface conflicts.** If a task request seems to contradict something in the blueprint (e.g. asks for a package that violates `11-coding-standards-and-ai-rules.md`, or a UI pattern that isn't in `design.md`), point out the conflict before proceeding rather than silently picking one side.
7. **No silent scope creep.** New files, new dependencies, or new architectural patterns require asking first - this mirrors the AI rules in `11-coding-standards-and-ai-rules.md` and is repeated here because it's the rule most likely to get skipped when AI is mid-task and "in flow."
8. **Schema changes are not casual.** Anything touching `04-data-modeling.md` or `05-er-diagram.md` (new fields, new relations, new collections) needs explicit sign-off before implementation - schema drift is the hardest kind to unwind later.

---

## Session Start Checklist

For a human running a session, the intended flow is:

1. Open the session with: **"Read AI_CONTEXT.md."**
2. AI reads this file, then pulls in each referenced doc from `docs/blueprint/` and `docs/design.md`.
3. Give the actual task.
4. If the task spans multiple docs (e.g. a feature that touches the data model, an API endpoint, the frontend, and the design system), AI should confirm it has checked all relevant files before starting - not just the most obviously related one.

---

## Suggestions

- **Keep this file short on purpose.** The moment it starts containing actual decisions instead of pointers to decisions, it becomes a second source of truth that can drift out of sync with the real blueprint docs. Resist the urge to "just add one more rule" here - new rules belong in `11-coding-standards-and-ai-rules.md`; this file only orchestrates.
- **Version-stamp the blueprint set.** A one-line "Last updated: [date], covers phases 1–7 of development-roadmap.md" at the top of this file makes it obvious when the docs have gone stale relative to the actual codebase - useful once the project outlives its first fast week of development.
- **Consider a lightweight "drift check" habit**: every few sessions, ask AI to compare a piece of existing code (or the actual DB schema) against `04-data-modeling.md` / `05-er-diagram.md` and flag anything that's diverged - schema and API drift are the two most common places blueprint docs go stale.
- If your tooling doesn't support `@file` references at all, it's worth keeping a single concatenated `docs/_context-bundle.md` (generated, not hand-maintained) that pastes all twelve files together, so "paste this at session start" is one copy instead of twelve.
- Since `06-api-endpoints.md` and `05-er-diagram.md` are the two files most likely to change as features get built, it may be worth a short "last verified against code" note at the top of each - cheap insurance against AI trusting a stale contract.