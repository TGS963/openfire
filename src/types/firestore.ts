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

export type FilterOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'in'
  | 'array-contains-any'
  | 'not-in';

export type QueryFilter = {
  field: string;
  operator: FilterOperator;
  value: unknown;
};

export type QueryOrderBy = {
  field: string;
  direction: 'asc' | 'desc';
};

export type QuerySpec = {
  collectionPath: string;
  filters: QueryFilter[];
  orderBy: QueryOrderBy[];
  limit?: number | null;
};

export type ImportMode = 'create_only' | 'overwrite';

export type ImportResult = {
  imported: number;
  skipped: number;
};

export type ConnectionInfo = {
  mode: 'production' | 'emulator';
  projectId: string;
  emulatorUrl?: string | null;
};

export type ConnectionEntry = {
  id: string;
  mode: { type: 'production' } | { type: 'emulator'; url: string; project_id: string };
  isActive: boolean;
};

export type TransferResult = {
  transferred: number;
  skipped: number;
};

export type SavedQuery = {
  id: string;
  name: string;
  collectionPath: string;
  filters: QueryFilter[];
  orderBy: QueryOrderBy[];
  limit?: number | null;
  createdAt: number;
};
