# Deployment

## Hosting
- **Platform:** Vercel
- **Initial Plan:** Deploy on Vercel's free tier for testing and demoing to the client
- Later, connect a custom domain for the client once approved

## Environment Variables
*(Values not provided - placeholder list based on the tech stack so far, to be filled in/confirmed.)*
- `DATABASE_URL` - MongoDB connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `BETTER_AUTH_URL` - Base URL for auth callbacks
- `SSLCOMMERZ_STORE_ID` - SSLCommerz store credential
- `SSLCOMMERZ_STORE_PASSWORD` - SSLCommerz store credential
- `NEXT_PUBLIC_APP_URL` - Public app URL (frontend reference)

## Database
- **Database:** MongoDB
- Hosted database instance to be connected via `DATABASE_URL`
- Prisma ORM used to manage schema and queries against this instance

## Build Process
- Framework: Next.js (App Router)
- Vercel auto-detects Next.js projects and runs the standard build (`next build`) on deploy
- Monorepo structure to be considered when configuring the Vercel project (root directory setting, if needed)

## Domains
- **Initial:** Default Vercel-provided domain (e.g., `project-name.vercel.app`) for testing/demo purposes
- **Later:** Custom domain to be connected once the client approves the project

## Deployment Steps (Draft)
1. Push project to a Git repository (e.g., GitHub)
2. Connect the repository to Vercel
3. Configure environment variables in Vercel project settings
4. Deploy to Vercel's free tier
5. Test the deployed application (customer + admin workflows)
6. Share the Vercel URL with the client for review
7. Once approved, connect the client's custom domain

---

## Suggestions (Not part of original input - for your consideration)
- **Database hosting provider:** Not specified - since MongoDB is the database, consider using **MongoDB Atlas** (has a free tier), which pairs well with Vercel's serverless functions.
- **Environment separation:** Consider separate environment variable sets for development, preview (Vercel preview deployments), and production, especially for SSLCommerz (sandbox vs. live credentials).
- **SSLCommerz sandbox vs. live:** Worth explicitly noting that SSLCommerz has a sandbox mode for testing before going live with real transactions - deployment should clarify which mode is active at each stage.
- **Vercel free tier limits:** Worth noting the free tier has limits (serverless function execution time, bandwidth) - fine for a demo/client-hunting project, but worth flagging before real customer traffic arrives.
- **Domain provider:** Not mentioned - once the client approves, you'll need to note where the domain will be purchased/managed (e.g., Namecheap, GoDaddy) and how DNS will be pointed to Vercel.
- **CI/CD:** Vercel deploys automatically on push by default - worth deciding on a branching strategy (e.g., `main` for production, `dev` for preview deployments).
- **Backups:** Consider a database backup strategy once real customer/order data starts flowing in, even for a demo project.
- **Monitoring after deployment:** Consider basic uptime/error monitoring (e.g., Vercel Analytics, or a third-party tool) once live.