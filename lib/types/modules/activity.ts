// Activity module types, docs/v7-backend-usage-guide.md §16 (audit log).

export type ActivityModule =
  | "Order"
  | "Brand"
  | "Category"
  | "Product"
  | "Review"
  | "User"
  | "Settings"
  | "Coupon"
  | "Payment";

export type ActivityType = "create" | "update" | "delete" | "status" | "preset";

/** Who performed an activity — populated server-side (null = automated/system). */
export interface ActivityPerformer {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  photoUrl?: string | null;
}

export interface Activity {
  _id: string;
  module: ActivityModule;
  type: ActivityType;
  message: string;
  referenceId: string;
  reference: string;
  performedBy: ActivityPerformer | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ClearActivitiesPayload {
  clearAll?: boolean;
  from?: string;
  to?: string;
}

export interface ClearActivitiesResponse {
  deletedCount: number;
}
