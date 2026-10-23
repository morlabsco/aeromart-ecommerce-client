# Data Modeling

## What Information Does Our System Store?

*(Data types below have been inferred where the user did not explicitly specify them, based on field names and context. Enums mentioned as existing in the schema are skipped for now, as noted by the user, to be added later.)*

## User Model
| Field | Type |
|---|---|
| _id | ObjectId (Mongoose ID) |
| firstName | String |
| email | String |
| emailVerified | Boolean |
| isBanned | Boolean |
| roles | Array |
| name | String |
| createdAt | DateTime |
| updatedAt | DateTime |

## Verification Model
| Field | Type |
|---|---|
| id | String / ObjectId |
| identifier | String |
| value | String |
| expiresAt | DateTime |
| createdAt | DateTime |
| updatedAt | DateTime |

## Session Model
| Field | Type |
|---|---|
| _id | ObjectId |
| expiresAt | DateTime |
| token | String |
| createdAt | DateTime |
| updatedAt | DateTime |
| ipAddress | String |
| userAgent | String |
| userId | Reference (User) |

## Account Model
| Field | Type |
|---|---|
| _id | ObjectId |
| accountId | String |
| providerId | String |
| userId | Reference (User) |
| user | Relation (User) |
| accessToken | String |
| refreshToken | String |
| idToken | String |
| accessTokenExpiresAt | DateTime |
| refreshTokenExpiresAt | DateTime |
| scope | String |
| password | String |
| createdAt | DateTime |
| updatedAt | DateTime |

## Product Model
| Field | Type |
|---|---|
| _id | ObjectId |
| name | String |
| slug | String |
| description | String |
| type | String |
| status | String |
| originalPrice | Number |
| discountPrice | Number |
| stock | Number |
| thumbnail | String (URL) |
| demoUrl | String (URL) |
| metaTitle | String |
| metaDescription | String |
| tags | Array |
| images | Array |
| totalSales | Number |
| totalRevenue | Number |
| averageRating | Number |
| isFeatured | Boolean |
| isDeleted | Boolean |
| categoryId | Reference (Category) |
| category | Relation (Category) |
| createdAt | DateTime |
| updatedAt | DateTime |

## Password Reset Token Model
| Field | Type |
|---|---|
| _id | ObjectId |
| email | String |
| token | String |
| expiresAt | DateTime |
| expiredAt | DateTime |

## Order Model
| Field | Type |
|---|---|
| id | ObjectId |
| customerId | Reference (Customer) |
| customer | Relation (Customer) |
| orderNumber | String |
| status | String |
| paymentStatus | String |
| totalAmount | Number |
| subtotal | Number |
| createdAt | DateTime |
| updatedAt | DateTime |
| user | Relation (User) |
| userId | Reference (User) |

## Customer Model
| Field | Type |
|---|---|
| id | ObjectId |
| name | String |
| email | String |
| isBanned | Boolean |
| password | String |
| emailVerified | Boolean |
| phone | String |
| address | String |
| city | String |
| state | String |
| zip | String |
| country | String |
| orders | Array (Relation to Order) |
| createdAt | DateTime |
| updatedAt | DateTime |

## Category Model
| Field | Type |
|---|---|
| id | ObjectId |
| name | String |
| slug | String |
| imageUrl | String |
| description | String |
| icon | String |
| color | String |
| parentId | Reference (Category - self-relation) |
| isActive | Boolean |
| isDeleted | Boolean |
| sortOrder | Number |
| metaTitle | String |
| metaDescription | String |
| createdAt | DateTime |
| updatedAt | DateTime |
| products | Array (Relation to Product) |

## Audit Log Model
| Field | Type |
|---|---|
| id | ObjectId |
| action | String |
| entityType | String |
| entityId | String |
| actorId | String |
| actorType | String |
| actorEmail | String |
| before | JSON/Object |
| after | JSON/Object |
| changeFields | Array |
| reason | String |
| ipAddress | String |
| userAgent | String |
| source | String |
| createdAt | DateTime |

## Enums

### Role
- ADMIN
- MANAGER
- USER

### ProductType
- DIGITAL
- PHYSICAL
- SERVICE

### ProductStatus
- DRAFT
- PUBLISHED
- ARCHIVED

### OrderStatus
- PENDING
- PROCESSING
- COMPLETED
- CANCELED
- REFUNDED

### PaymentStatus
- PENDING
- PAID
- FAILED
- REFUNDED

*(Note: Failed occurs after Paid in sequence.)*

### AuditAction
- CREATE
- UPDATE
- DELETE
- RESTORE
- STATUS_CHANGE
- LOGIN
- PERMISSION_CHANGE

### AuditEntityType
- PRODUCT
- ORDER
- USER
- CATEGORY
- COUPON
- INVENTORY
- PAYMENT
- REFUND
- SETTINGS

---

## Suggestions (Not part of original input - for your consideration)
- **User vs Customer distinction:** There appear to be two separate identity models - `User` (with roles, sessions, accounts - likely for admin/staff/auth) and `Customer` (with address, phone, orders). Worth clarifying explicitly whether `Customer` is a separate collection from `User`, or if customers also use the `User`/`Account`/`Session` auth models. This affects both the ER diagram and API design.
- **Missing relations:** No `CartItem`/`Cart` model was mentioned, though workflows.md references adding to cart, modifying quantity, selecting color/size. Consider adding a Cart/CartItem model.
- **Order items:** The `Order` model has `totalAmount` and `subtotal` but no line-items model (e.g., `OrderItem`) shown yet - likely needed to store which products, quantities, colors, and sizes were purchased.
- **Payment model:** Since SSLCommerz is the payment gateway, a dedicated `Payment`/`Transaction` model (transaction ID, gateway response, payment method, amount, status) may be worth adding.
- **Review/Rating model:** `Product` has `averageRating`, but no separate `Review` model was mentioned to store individual customer reviews.
- **Staff/Manager model:** Workflows.md mentions admin managing staff - unclear if this maps to `User.roles` or needs a separate `Staff` model.
- **AuditEntityType references models not yet defined:** The `AuditEntityType` enum includes `Coupon`, `Inventory`, `Payment`, `Refund`, and `Settings` - but no corresponding models for these exist yet in this document (only `Product`, `Order`, `User`, `Category` do). Worth adding these models in a future iteration if audit logging will cover them.
- **Data types confirmation:** Some fields (e.g., `originalPrice`, `discountPrice`, `stock`) were assumed as `Number` - confirm if `Decimal` is preferred for currency fields to avoid floating-point precision issues.