// Brand module types, docs/v7-backend-usage-guide.md §11.

export interface BrandCreatedByRef {
  _id: string;
  name: string;
  email: string;
}

export interface Brand {
  _id: string;
  name: string;
  logo: string | null;
  isActive: boolean;
  createdBy: BrandCreatedByRef | string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandPayload {
  name: string;
  isActive?: boolean;
}
