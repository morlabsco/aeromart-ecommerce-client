# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/



# styling
See [styling/taste.md](styling/taste.md)
# storefront
See [storefront/taste.md](storefront/taste.md)
# paths
- Use hyphenated directory names (e.g., perfume-oil) instead of underscores (e.g., perfume_oil) for image asset paths. Confidence: 0.65

# shadcn
See [shadcn/taste.md](shadcn/taste.md)
# code organization
See [code-organization/taste.md](code-organization/taste.md)
# data fetching / SSR
See [data-fetching-/-ssr/taste.md](data-fetching-/-ssr/taste.md)
- Public info pages (contact, about) must be settings-driven, not hardcoded: the page server-component fetches the settings singleton and passes the contact/about + brand sections down to a client component (using `generateMetadata` with the brand for titles), falling back to theme-brand defaults only when settings are unreachable , explicitly requested ("use dynamic data and theme"). Confidence: 0.7
- Prefers customer-facing pages to be shareable via URL search params so links can be handed out externally: e.g., /track-order?orderId=... so an admin can send a tracking link to a customer or it can be used in future email sending, with the page auto-loading the entity from the param and a copy-link button in the UI section for easy sharing ("implement search param so it will be easy to send links from admin panel to customers or maybe future message email sending, add a copy link button into the section also"). Confidence: 0.55
- The copy-link control in such surfaces must be kept minimal, just a copy button, with no URL/link-details text shown on the page (an added link-preview line under the button was explicitly removed: "Just a copy link button don't show link details."). Confidence: 0.7
- The copy-link control in such surfaces must be kept minimal, just a copy button, with no URL/link details text shown on the page (an added link-preview line under the button was explicitly removed: "Just a copy link button don't show link details."). Confidence: 0.7
- Site-level identity/branding must be settings-driven with a static fallback: the root layout's favicon (and title/description, once settings are being fetched anyway) should load dynamically from the settings singleton via `generateMetadata`, the theme favicon when available, falling back to the project's static `/favicon.ico` (and default brand name) when settings are unreachable or the favicon is empty ("favicon is loaded but it not referencing dynamically our theme favicon, so it should load that as we are loading the theme and also if no favicon fall back to project static favicon"). Confidence: 0.8
- Brand/logo display surfaces (e.g., the about page's brand card) must show the brand's actual logo image from settings when the brand has one, falling back to the theme's default static logo (`theme.logo` from `theme.config.ts`), and only render a generic icon + name when neither exists ("if the brand has image show that from theme or show theme.config.ts default static image") , a decorative placeholder icon is not acceptable when a real brand logo is available. Confidence: 0.7
# workflow
See [workflow/taste.md](workflow/taste.md)
# error handling
See [error-handling/taste.md](error-handling/taste.md)
# auth,
See [auth,/taste.md](auth,/taste.md)
# workflow
See [workflow/taste.md](workflow/taste.md)
# error handling
See [error-handling/taste.md](error-handling/taste.md)
# auth, 
- Access tokens are stored in a cookie by the auth module, but API CRUD requests must read the token back and send it as an `Authorization` header , authorization should not rely on the cookie being sent with each request. Confidence: 0.9
- Prefers role-separated dashboards (admin vs customer) with role-based route guarding and role-aware redirects. Confidence: 0.6

r) with role-based route guarding and role-aware redirects. Confidence: 0.6

Confidence: 0.6

ts must read the token back and send it as an `Authorization` header , authorization should not rely on the cookie being sent with each request. Confidence: 0.9
- Prefers role-separated dashboards (admin vs customer) with role-based route guarding and role-aware redirects. Confidence: 0.6

r) with role-based route guarding and role-aware redirects. Confidence: 0.6

Confidence: 0.6

ce: 0.6

ts must read the token back and send it as an `Authorization` header , authorization should not rely on the cookie being sent with each request. Confidence: 0.9
- Prefers role-separated dashboards (admin vs customer) with role-based route guarding and role-aware redirects. Confidence: 0.6

r) with role-based route guarding and role-aware redirects. Confidence: 0.6

Confidence: 0.6

