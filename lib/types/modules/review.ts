// Review module types, docs/v7-backend-usage-guide.md §14.

export interface Review {
  _id: string;
  rating: number;
  description: string;
  user: {
    _id: string;
    name: string;
    email: string;
    photoUrl?: string;
  };
  product: {
    _id: string;
    name: string;
    slug: string;
  };
  isFlagged: boolean;
  flaggedReason: string;
  isVerifiedPurchase: boolean;
  /** Optional customer-uploaded photos (Cloudinary URLs, max 3). */
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPayload {
  rating: number;
  description: string;
  product: string;
  photoUrls?: string[];
}
