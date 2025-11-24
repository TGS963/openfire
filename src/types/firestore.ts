export type ServiceAccountSummary = {
  id: string;
  projectId: string;
  clientEmail: string;
};

export type CollectionList = {
  collectionIds: string[];
  nextPageToken?: string | null;
};

export type FirestoreDocument = {
  id: string;
  path: string;
  data: Record<string, unknown>;
  createTime?: string | null;
  updateTime?: string | null;
};

export type DocumentPage = {
  documents: FirestoreDocument[];
  nextPageToken?: string | null;
};
