/** Newsletter subscriber (backend §19 — /api/v1/newsletter). */
export interface NewsletterSubscriber {
  _id: string;
  /** Stored lowercase + trimmed by the backend. */
  email: string;
  /** True on the subscribe response when the email was already on the list. */
  alreadySubscribed?: boolean;
  createdAt: string;
  updatedAt: string;
}
