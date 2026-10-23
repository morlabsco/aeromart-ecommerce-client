// Category module types, docs/v7-backend-usage-guide.md §13.

import type { BrandCreatedByRef } from "./brand";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  parent: { _id: string; name: string; slug: string } | null;
  isActive: boolean;
  createdBy: BrandCreatedByRef | string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  parent?: string | null;
  isActive?: boolean;
}
