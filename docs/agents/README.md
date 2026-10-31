# AeroMart Review Agents

Minimal, project-aware review agents for this monorepo. Each `.md` file is a
complete agent brief: goal, scope, project context, checklist and the exact
verification commands. They are written to be run as **Claude Code subagents**
(Agent tool, `general-purpose` type, with the file as the prompt) or pasted
into any reviewer session.

## Agents

| Agent | File | Reviews |
|---|---|---|
| Backend API reviewer | [backend-api-reviewer.md](./backend-api-reviewer.md) | The Express/Mongoose server (`../aeromart-ecommerce-server`): modules, routes, auth/RBAC, validation, business logic, data integrity. |
| Storefront reviewer | [storefront-reviewer.md](./storefront-reviewer.md) | The Next.js client (this repo): design-system compliance, storefront flows, dashboard UX, edge cases. |

## How to run

```
Agent(subagent_type: "general-purpose",
      prompt: <contents of backend-api-reviewer.md>,
      description: "Backend API review")
```

Reviewers are READ-ONLY by design — they report findings, they never fix.
Both briefs force verification (typecheck/build or a live curl probe) before
a finding is reported, so hallucinated bugs get filtered out.

## Findings format

Each finding: **severity** (critical / high / medium / low), `file:line`,
one-line claim, the concrete failure scenario, and the suggested fix. The
caller decides what to act on; fixes go through the normal workflow
(`tsc` + build verification per `docs/project-tracking/works.md` rules).
