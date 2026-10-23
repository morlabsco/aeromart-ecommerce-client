# ER Diagram

## How Our Data Entities Are Connected

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : has
    USER ||--o{ ORDER : places
    CUSTOMER ||--o{ ORDER : places
    CATEGORY ||--o{ PRODUCT : contains
    CATEGORY ||--o{ CATEGORY : "parent of"

    USER {
        ObjectId _id
        String firstName
        String email
        Boolean emailVerified
        Boolean isBanned
        Array roles
        String name
        DateTime createdAt
        DateTime updatedAt
    }

    VERIFICATION {
        String id
        String identifier
        String value
        DateTime expiresAt
        DateTime createdAt
        DateTime updatedAt
    }

    SESSION {
        ObjectId _id
        DateTime expiresAt
        String token
        DateTime createdAt
        DateTime updatedAt
        String ipAddress
        String userAgent
        ObjectId userId FK
    }

    ACCOUNT {
        ObjectId _id
        String accountId
        String providerId
        ObjectId userId FK
        String accessToken
        String refreshToken
        String idToken
        DateTime accessTokenExpiresAt
        DateTime refreshTokenExpiresAt
        String scope
        String password
        DateTime createdAt
        DateTime updatedAt
    }

    PRODUCT {
        ObjectId _id
        String name
        String slug
        String description
        String type
        String status
        Number originalPrice
        Number discountPrice
        Number stock
        String thumbnail
        String demoUrl
        String metaTitle
        String metaDescription
        Array tags
        Array images
        Number totalSales
        Number totalRevenue
        Number averageRating
        Boolean isFeatured
        Boolean isDeleted
        ObjectId categoryId FK
        DateTime createdAt
        DateTime updatedAt
    }

    PASSWORD_RESET_TOKEN {
        ObjectId _id
        String email
        String token
        DateTime expiresAt
        DateTime expiredAt
    }

    ORDER {
        ObjectId id
        ObjectId customerId FK
        String orderNumber
        String status
        String paymentStatus
        Number totalAmount
        Number subtotal
        DateTime createdAt
        DateTime updatedAt
        ObjectId userId FK
    }

    CUSTOMER {
        ObjectId id
        String name
        String email
        Boolean isBanned
        String password
        Boolean emailVerified
        String phone
        String address
        String city
        String state
        String zip
        String country
        DateTime createdAt
        DateTime updatedAt
    }

    CATEGORY {
        ObjectId id
        String name
        String slug
        String imageUrl
        String description
        String icon
        String color
        ObjectId parentId FK
        Boolean isActive
        Boolean isDeleted
        Number sortOrder
        String metaTitle
        String metaDescription
        DateTime createdAt
        DateTime updatedAt
    }

    AUDIT_LOG {
        ObjectId id
        String action
        String entityType
        String entityId
        String actorId
        String actorType
        String actorEmail
        Object before
        Object after
        Array changeFields
        String reason
        String ipAddress
        String userAgent
        String source
        DateTime createdAt
    }
```

*(Note: `VERIFICATION`, `PASSWORD_RESET_TOKEN`, and `AUDIT_LOG` are shown as standalone entities above since no explicit foreign key relation was described for them in the data modeling file - they are referenced by fields like `email` or `actorId`/`entityId`, not direct Prisma relations.)*

---

## Suggestions (Not part of original input - for your consideration)
- **Verification/PasswordResetToken linkage:** These currently connect to `User`/`Customer` only via `email`, not a direct foreign key relation. If they should be tied to a specific user record, consider adding a `userId` reference.
- **AuditLog linkage:** `actorId` and `entityId` are stored as plain strings rather than relations, which is common for audit logs (so records survive even if the original entity is deleted) - worth confirming this is intentional.
- **User vs Customer relation to Order:** As flagged in the data modeling file, `Order` connects to both `User` and `Customer` - worth clarifying if these represent the same person through different auth systems, or genuinely separate relationships (e.g., staff-assisted order creation vs. customer self-checkout).
- **Missing entities for a complete e-commerce ER diagram:** As noted in the previous file, `Cart`/`CartItem`, `OrderItem` (line items within an order), `Payment`/`Transaction` (for SSLCommerz), and `Review` are not yet modeled - once added, they'll each need relations drawn here (e.g., `ORDER ||--o{ ORDER_ITEM`, `PRODUCT ||--o{ REVIEW`, `ORDER ||--|| PAYMENT`).
- **Category self-relation:** Drawn as `CATEGORY ||--o{ CATEGORY` for parent-child (subcategories) - confirm this matches the intended use of `parentId`.