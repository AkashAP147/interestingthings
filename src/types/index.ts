export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
};

export type Discovery = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string; // Detailed description / why it's interesting
  categoryId: string;
  imageUrl: string;
  sourceUrl: string;
  tags: string[];
  score: number; // Interestingness Score
  views: number;
  saves: number;
  shares: number;
  createdAt: string;
  publishedAt: string;
  status: "published" | "draft" | "archived" | "pending_approval";
  featured: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
};

export type Collection = {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
};

export type CollectionItem = {
  collectionId: string;
  discoveryId: string;
  createdAt: string;
};
