import Editor from '@monaco-editor/react';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialogPlugin } from '@tauri-apps/plugin-dialog';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { useCollections, useDocument, useDocuments } from '@/hooks/firestore';
import { duplicateCollection, duplicateDocument, saveDocument } from '@/lib/tauri';
import { useAuthStore } from '@/stores/auth-store';
import { useNavStore } from '@/stores/nav-store';
import type { DocumentPage, FirestoreDocument, ServiceAccountSummary } from '@/types/firestore';

const normalizeFirestorePath = (value: string) =>
  value
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');

const collectionFromDocPath = (path: string) => {
  const normalized = normalizeFirestorePath(path);
  if (!normalized) return '';
  const parts = normalized.split('/');
  return parts.slice(0, -1).join('/');
};

export function App() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const accounts = useAuthStore((state) => state.accounts);
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const initialized = useAuthStore((state) => state.initialized);
  const error = useAuthStore((state) => state.error);
  const loadAccounts = useAuthStore((state) => state.loadAccounts);
  const importAccount = useAuthStore((state) => state.importAccount);
  const selectAccount = useAuthStore((state) => state.selectAccount);
  const clearError = useAuthStore((state) => state.clearError);

  const collectionPath = useNavStore((state) => state.collectionPath);
  const documentPath = useNavStore((state) => state.documentPath);
  const setCollectionPath = useNavStore((state) => state.setCollectionPath);
  const setDocumentPath = useNavStore((state) => state.setDocumentPath);
  const resetNav = useNavStore((state) => state.reset);

  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateDoc, setDuplicateDoc] = useState<FirestoreDocument | null>(null);
  const [duplicateCollectionOpen, setDuplicateCollectionOpen] = useState(false);

  const saveDocumentMutation = useMutation({
    mutationFn: ({ path, data }: { path: string; data: Record<string, unknown> }) =>
      saveDocument(path, data),
  });

  const duplicateDocumentMutation = useMutation({
    mutationFn: ({
      sourcePath,
      targetPath,
      overwrite,
    }: {
      sourcePath: string;
      targetPath: string;
      overwrite?: boolean;
    }) => duplicateDocument(sourcePath, targetPath, overwrite ?? false),
  });

  const duplicateCollectionMutation = useMutation({
    mutationFn: ({
      sourcePath,
      targetPath,
      overwrite,
    }: {
      sourcePath: string;
      targetPath: string;
      overwrite?: boolean;
    }) => duplicateCollection(sourcePath, targetPath, overwrite ?? false),
  });

  const updateDocumentCaches = (doc: FirestoreDocument) => {
    if (!activeAccountId) return;
    queryClient.setQueryData<FirestoreDocument>(['document', activeAccountId, doc.path], doc);
    const collectionPath = collectionFromDocPath(doc.path);
    if (!collectionPath) return;
    queryClient.setQueryData<DocumentPage | undefined>(
      ['documents', activeAccountId, collectionPath],
      (existing) => {
        if (!existing) return existing;
        const nextDocuments = existing.documents.some((entry) => entry.path === doc.path)
          ? existing.documents.map((entry) => (entry.path === doc.path ? doc : entry))
          : [doc, ...existing.documents];
        return { ...existing, documents: nextDocuments };
      },
    );
  };

  const persistDocument = async ({
    path,
    data,
    successMessage,
  }: {
    path: string;
    data: Record<string, unknown>;
    successMessage: string;
  }) => {
    const normalizedPath = normalizeFirestorePath(path);
    if (!normalizedPath) {
      toast({
        title: 'Invalid document path',
        description: 'Please provide a valid document path before saving.',
        variant: 'destructive',
      });
      throw new Error('Invalid path');
    }
    try {
      const doc = await saveDocumentMutation.mutateAsync({ path: normalizedPath, data });
      updateDocumentCaches(doc);
      toast({
        title: successMessage,
        description: doc.path,
      });
      return doc;
    } catch (err) {
      toast({
        title: 'Failed to save document',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleDuplicateDocument = async ({
    targetCollectionPath,
    targetDocumentId,
    overwrite,
  }: {
    targetCollectionPath: string;
    targetDocumentId: string;
    overwrite: boolean;
  }) => {
    if (!duplicateDoc) {
      throw new Error('No source document selected');
    }
    const normalizedCollection = normalizeFirestorePath(targetCollectionPath);
    const trimmedId = targetDocumentId.trim();
    if (!normalizedCollection || !trimmedId) {
      toast({
        title: 'Missing target',
        description: 'Collection path and document ID are required.',
        variant: 'destructive',
      });
      throw new Error('Missing target');
    }
    const targetPath = `${normalizedCollection}/${trimmedId}`;
    try {
      const doc = await duplicateDocumentMutation.mutateAsync({
        sourcePath: duplicateDoc.path,
        targetPath,
        overwrite,
      });
      updateDocumentCaches(doc);
      toast({
        title: 'Document duplicated',
        description: `${doc.id} saved under ${collectionFromDocPath(doc.path) || 'collection'}.`,
      });
      setDocumentPath(doc.path);
      setDuplicateDoc(null);
    } catch (err) {
      toast({
        title: 'Unable to duplicate document',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleDuplicateCollection = async ({
    targetCollectionPath,
    overwrite,
  }: {
    targetCollectionPath: string;
    overwrite: boolean;
  }) => {
    if (!collectionPath) {
      toast({
        title: 'Select a collection first',
        description: 'Choose a source collection before duplicating.',
        variant: 'destructive',
      });
      throw new Error('No source collection');
    }
    const sourcePath = normalizeFirestorePath(collectionPath);
    const normalizedTarget = normalizeFirestorePath(targetCollectionPath);
    if (!normalizedTarget) {
      toast({
        title: 'Missing target name',
        description: 'Provide the destination collection path.',
        variant: 'destructive',
      });
      throw new Error('Missing target');
    }
    try {
      const count = await duplicateCollectionMutation.mutateAsync({
        sourcePath,
        targetPath: normalizedTarget,
        overwrite,
      });
      toast({
        title: 'Collection duplicated',
        description: `Copied ${count} documents into ${normalizedTarget}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['collections'], exact: false });
      queryClient.invalidateQueries({
        queryKey: ['documents', activeAccountId, normalizedTarget],
      });
      setCollectionPath(normalizedTarget);
      setDocumentPath(null);
      setDuplicateCollectionOpen(false);
    } catch (err) {
      toast({
        title: 'Unable to duplicate collection',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleCreateDocument = async ({
    documentId,
    data,
  }: {
    documentId: string;
    data: Record<string, unknown>;
  }) => {
    if (!collectionPath) {
      toast({
        title: 'Select a collection first',
        description: 'Choose a destination collection before creating a document.',
        variant: 'destructive',
      });
      throw new Error('Missing collection');
    }
    const normalizedCollection = normalizeFirestorePath(collectionPath);
    const trimmedId = documentId.trim();
    if (!trimmedId) {
      toast({
        title: 'Missing document ID',
        description: 'Provide a document ID before saving.',
        variant: 'destructive',
      });
      throw new Error('Missing document ID');
    }
    const doc = await persistDocument({
      path: `${normalizedCollection}/${trimmedId}`,
      data,
      successMessage: 'Document created',
    });
    setDocumentPath(doc.path);
    setCreateDialogOpen(false);
  };

  const handleSaveDocument = async (path: string, data: Record<string, unknown>) => {
    await persistDocument({ path, data, successMessage: 'Document saved' });
  };

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Account error',
        description: error,
        variant: 'destructive',
      });
      clearError();
    }
  }, [error, toast, clearError]);

  useEffect(() => {
    resetNav();
  }, [activeAccountId, resetNav]);

  const collectionsQuery = useCollections();
  const documentsQuery = useDocuments(collectionPath);
  const documentQuery = useDocument(documentPath);

  const documents: FirestoreDocument[] = documentsQuery.data?.documents ?? [];
  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return documents;
    return documents.filter((doc) => doc.id.toLowerCase().includes(search.toLowerCase()));
  }, [documents, search]);

  const previewDocument: FirestoreDocument | null = documentQuery.data ?? documents.find((doc) => doc.path === documentPath) ?? null;

  useEffect(() => {
    if (!documentPath && documents.length) {
      setDocumentPath(documents[0].path);
    } else if (documentPath && documents.length && !documents.some((doc) => doc.path === documentPath)) {
      setDocumentPath(documents[0].path);
    }
  }, [documentPath, documents, setDocumentPath]);

  const handleImport = async () => {
    try {
      const options = {
        filters: [{ name: 'Service Account', extensions: ['json'] }],
        multiple: false,
      };

      let file: string | string[] | null = null;
      try {
        file = await openDialogPlugin(options);
      } catch (pluginError) {
        console.warn('Dialog plugin failed, falling back to invoke:', pluginError);
        try {
          file = await invoke<string | string[] | null>('plugin:dialog|open', {
            options,
            windowLabel: 'main',
          });
        } catch (invokeError) {
          console.warn('Invoke dialog fallback also failed:', invokeError);
        }
      }

      if (Array.isArray(file)) {
        file = file[0] ?? null;
      }

      if (typeof file === 'string') {
        await importAccount(file);
        return;
      }

      const manualPath = window
        .prompt('Enter the full path to your Service Account JSON file:')
        ?.trim();
      if (manualPath) {
        await importAccount(manualPath);
        toast({ title: 'Imported', description: 'Service account added from manual path.' });
        return;
      }

      toast({
        title: 'No file selected',
        description: 'Please choose a Service Account JSON to continue.',
        variant: 'destructive',
      });
    } catch (err) {
      toast({
        title: 'Unable to open file dialog',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAccount = async (id: string) => {
    if (!id) return;
    try {
      await selectAccount(id);
    } catch {
      // Error surface handled via store/toast side-effects.
    }
  };

  const showOnboarding = initialized && accounts.length === 0;

  return (
    <>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          accounts={accounts}
          activeAccountId={activeAccountId}
          isLoading={isAuthLoading}
          onImport={handleImport}
          onSelectAccount={handleSelectAccount}
          collections={collectionsQuery.data?.collectionIds ?? []}
          isLoadingCollections={collectionsQuery.isLoading}
          collectionPath={collectionPath}
          onSelectCollection={(path) => setCollectionPath(path)}
        />
        <main className="flex flex-1 flex-col">
          {showOnboarding ? (
            <OnboardingState onImport={handleImport} />
          ) : (
            <>
              <Header
                collectionPath={collectionPath}
                isLoading={documentsQuery.isLoading && !documentsQuery.data}
                onClearSelection={() => setCollectionPath(null)}
                canClear={Boolean(collectionPath)}
                onDuplicateCollection={() => setDuplicateCollectionOpen(true)}
              />
              <div className="flex flex-1 divide-x">
                <DocumentListSection
                  documents={filteredDocuments}
                  isLoading={documentsQuery.isLoading}
                  error={documentsQuery.error as Error | undefined}
                  selectedPath={documentPath}
                  onSelect={setDocumentPath}
                  hasCollection={Boolean(collectionPath)}
                  search={search}
                  onSearchChange={setSearch}
                onCreateDocument={() => setCreateDialogOpen(true)}
                onDuplicateDocument={setDuplicateDoc}
                />
                <DocumentPreviewSection
                  document={previewDocument}
                  isLoading={documentQuery.isLoading}
                onSave={handleSaveDocument}
                isSaving={saveDocumentMutation.isPending}
                onDuplicate={(doc) => setDuplicateDoc(doc)}
                />
              </div>
            </>
          )}
        </main>
      </div>
      <CreateDocumentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        collectionPath={collectionPath}
        onSubmit={handleCreateDocument}
        isSubmitting={saveDocumentMutation.isPending}
      />
      <DuplicateDocumentDialog
        open={Boolean(duplicateDoc)}
        onOpenChange={(next) => {
          if (!next) {
            setDuplicateDoc(null);
          }
        }}
        sourceDocument={duplicateDoc}
        onSubmit={handleDuplicateDocument}
        isSubmitting={duplicateDocumentMutation.isPending}
      />
      <DuplicateCollectionDialog
        open={duplicateCollectionOpen}
        onOpenChange={setDuplicateCollectionOpen}
        sourceCollectionPath={collectionPath}
        onSubmit={handleDuplicateCollection}
        isSubmitting={duplicateCollectionMutation.isPending}
      />
      <Toaster />
    </>
  );
}

type SidebarProps = {
  accounts: ServiceAccountSummary[];
  activeAccountId: string | null;
  isLoading: boolean;
  onImport: () => Promise<void>;
  onSelectAccount: (id: string) => Promise<void>;
  collections: string[];
  isLoadingCollections: boolean;
  collectionPath: string | null;
  onSelectCollection: (path: string) => void;
};

function Sidebar({
  accounts,
  activeAccountId,
  isLoading,
  onImport,
  onSelectAccount,
  collections,
  isLoadingCollections,
  collectionPath,
  onSelectCollection,
}: SidebarProps) {
  return (
    <aside className="flex w-72 flex-col border-r">
      <div className="space-y-3 border-b px-4 py-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Active project</p>
          <select
            className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            value={activeAccountId ?? ''}
            onChange={(event) => onSelectAccount(event.target.value)}
            disabled={!accounts.length || isLoading}
          >
            {!accounts.length && <option value="">No accounts yet</option>}
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.projectId}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={onImport} variant="outline" size="sm" className="w-full">
          Import service account
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          <p className="mb-2 text-xs uppercase text-muted-foreground">Collections</p>
          {isLoadingCollections ? (
            <p className="text-sm text-muted-foreground">Loading collections…</p>
          ) : (
            <div className="space-y-1">
              {collections.map((collectionId) => {
                const isActive = collectionPath === collectionId;
                return (
                  <button
                    key={collectionId}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? 'bg-primary/10 text-primary-foreground' : 'hover:bg-accent'
                    }`}
                    onClick={() => onSelectCollection(collectionId)}
                  >
                    {collectionId}
                  </button>
                );
              })}
              {!collections.length && (
                <p className="text-sm text-muted-foreground">No collections found.</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

type HeaderProps = {
  collectionPath: string | null;
  isLoading: boolean;
  canClear: boolean;
  onClearSelection: () => void;
  onDuplicateCollection: () => void;
};

function Header({
  collectionPath,
  isLoading,
  canClear,
  onClearSelection,
  onDuplicateCollection,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <p className="text-xs uppercase text-muted-foreground">Collection</p>
        <h1 className="text-2xl font-semibold">
          {collectionPath ? collectionPath : 'Select a collection'}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {collectionPath && (
          <Button variant="outline" size="sm" onClick={onDuplicateCollection}>
            Duplicate
          </Button>
        )}
        {canClear && (
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Fetching documents…
          </div>
        )}
      </div>
    </header>
  );
}

type DocumentListSectionProps = {
  documents: FirestoreDocument[];
  isLoading: boolean;
  error?: Error;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  hasCollection: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onCreateDocument: () => void;
  onDuplicateDocument: (doc: FirestoreDocument) => void;
};

function DocumentListSection({
  documents,
  isLoading,
  error,
  selectedPath,
  onSelect,
  hasCollection,
  search,
  onSearchChange,
  onCreateDocument,
  onDuplicateDocument,
}: DocumentListSectionProps) {
  if (!hasCollection) {
    return (
      <div className="flex w-1/2 items-center justify-center text-sm text-muted-foreground">
        Choose a collection to load documents.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-1/2 items-center justify-center text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  return (
    <section className="flex w-1/2 flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-md border px-3">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Filter by document ID"
            className="border-none p-0 focus-visible:ring-0"
          />
        </div>
        <Button size="sm" onClick={onCreateDocument} disabled={!hasCollection}>
          New
        </Button>
      </div>
      <div className="flex-1">
        {isLoading && !documents.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading documents…
          </div>
        ) : !documents.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No documents found.
          </div>
        ) : (
          <Virtuoso
            data={documents}
            style={{ height: '100%' }}
            itemContent={(_, doc) => (
              <DocumentRow
                doc={doc}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onDuplicate={onDuplicateDocument}
              />
            )}
          />
        )}
      </div>
    </section>
  );
}

type DocumentRowProps = {
  doc: FirestoreDocument;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onDuplicate: (doc: FirestoreDocument) => void;
};

function DocumentRow({ doc, selectedPath, onSelect, onDuplicate }: DocumentRowProps) {
  const isSelected = selectedPath === doc.path;
  return (
    <div
      className={`flex items-center justify-between border-b px-4 py-3 text-sm transition-colors ${
        isSelected ? 'bg-accent/60' : 'hover:bg-accent/30'
      }`}
    >
      <button className="flex flex-1 flex-col text-left" onClick={() => onSelect(doc.path)}>
        <span className="font-medium">{doc.id}</span>
        <span className="text-xs text-muted-foreground truncate">{doc.path}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(doc.path)}>
            Copy path
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDuplicate(doc)}>Duplicate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type DocumentPreviewSectionProps = {
  document: FirestoreDocument | null;
  isLoading: boolean;
  onSave: (path: string, data: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  onDuplicate: (doc: FirestoreDocument) => void;
};

function DocumentPreviewSection({
  document,
  isLoading,
  onSave,
  isSaving,
  onDuplicate,
}: DocumentPreviewSectionProps) {
  const { toast } = useToast();
  const [editorValue, setEditorValue] = useState('');
  const [lastSynced, setLastSynced] = useState('');

  useEffect(() => {
    if (document) {
      const pretty = JSON.stringify(document.data ?? {}, null, 2);
      setEditorValue(pretty);
      setLastSynced(pretty);
    } else {
      setEditorValue('');
      setLastSynced('');
    }
  }, [document?.path, document?.updateTime]);

  const isDirty = Boolean(document && editorValue !== lastSynced);

  const handleSave = async () => {
    if (!document) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = editorValue.trim() ? JSON.parse(editorValue) : {};
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Fix the JSON before saving.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSave(document.path, parsed);
    } catch {
      return;
    }
    const pretty = JSON.stringify(parsed, null, 2);
    setLastSynced(pretty);
    setEditorValue(pretty);
  };

  return (
    <section className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Document</p>
          <p className="text-sm font-semibold">
            {isLoading ? 'Loading…' : document?.path ?? 'Nothing selected'}
          </p>
          {isDirty && (
            <p className="text-xs text-amber-500">You have unsaved changes.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {document && (
            <Button variant="outline" size="sm" onClick={() => onDuplicate(document)}>
              Duplicate
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditorValue(lastSynced)}
            disabled={!document || !isDirty || isSaving}
          >
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!document || !isDirty || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>
      {document && (
        <div className="border-b px-4 py-2">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="w-32 text-xs uppercase text-muted-foreground">
                  Created
                </TableCell>
                <TableCell className="text-sm">
                  {document.createTime?.replace('T', ' ').replace('Z', '') ?? '—'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs uppercase text-muted-foreground">
                  Updated
                </TableCell>
                <TableCell className="text-sm">
                  {document.updateTime?.replace('T', ' ').replace('Z', '') ?? '—'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex flex-1">
        {document ? (
          <Editor
            key={document.path}
            defaultLanguage="json"
            value={editorValue}
            onChange={(value) => setEditorValue(value ?? '')}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 13 }}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a document to preview and edit its JSON payload.
          </div>
        )}
      </div>
    </section>
  );
}

type CreateDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionPath: string | null;
  onSubmit: (input: { documentId: string; data: Record<string, unknown> }) => Promise<void>;
  isSubmitting: boolean;
};

function CreateDocumentDialog({
  open,
  onOpenChange,
  collectionPath,
  onSubmit,
  isSubmitting,
}: CreateDocumentDialogProps) {
  const { toast } = useToast();
  const [documentId, setDocumentId] = useState('');
  const [jsonPayload, setJsonPayload] = useState('{\n  \n}');

  useEffect(() => {
    if (!open) {
      setDocumentId('');
      setJsonPayload('{\n  \n}');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!collectionPath) {
      toast({
        title: 'Select a collection first',
        description: 'Choose a destination collection before creating a document.',
        variant: 'destructive',
      });
      return;
    }
    const trimmedId = documentId.trim();
    if (!trimmedId) {
      toast({
        title: 'Missing document ID',
        description: 'Provide a document ID before saving.',
        variant: 'destructive',
      });
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = jsonPayload.trim() ? JSON.parse(jsonPayload) : {};
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Fix the JSON before creating the document.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSubmit({ documentId: trimmedId, data: parsed });
    } catch {
      // errors surfaced upstream
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Documents are saved under {collectionPath ?? 'the selected collection'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Document ID</label>
            <Input
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              placeholder="e.g. doc-123"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">JSON payload</label>
            <textarea
              value={jsonPayload}
              onChange={(event) => setJsonPayload(event.target.value)}
              className="min-h-[180px] w-full rounded-md border bg-background p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !collectionPath}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DuplicateDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDocument: FirestoreDocument | null;
  onSubmit: (input: {
    targetCollectionPath: string;
    targetDocumentId: string;
    overwrite: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
};

function DuplicateDocumentDialog({
  open,
  onOpenChange,
  sourceDocument,
  onSubmit,
  isSubmitting,
}: DuplicateDocumentDialogProps) {
  const { toast } = useToast();
  const [collectionInput, setCollectionInput] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  useEffect(() => {
    if (sourceDocument) {
      setCollectionInput(collectionFromDocPath(sourceDocument.path) || '');
      setDocumentId(`${sourceDocument.id}-copy`);
    } else {
      setCollectionInput('');
      setDocumentId('');
      setOverwrite(false);
    }
  }, [sourceDocument, open]);

  const handleSubmit = async () => {
    if (!sourceDocument) return;
    const trimmedCollection = collectionInput.trim();
    const trimmedId = documentId.trim();
    if (!trimmedCollection || !trimmedId) {
      toast({
        title: 'Missing destination',
        description: 'Provide both the collection path and document ID.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSubmit({
        targetCollectionPath: trimmedCollection,
        targetDocumentId: trimmedId,
        overwrite,
      });
    } catch {
      // handled upstream
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate document</DialogTitle>
          <DialogDescription>
            Copy {sourceDocument?.id ?? 'the selected document'} into another collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Target collection path</label>
            <Input
              value={collectionInput}
              onChange={(event) => setCollectionInput(event.target.value)}
              placeholder="e.g. users/123/posts"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Document ID</label>
            <Input value={documentId} onChange={(event) => setDocumentId(event.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(event) => setOverwrite(event.target.checked)}
            />
            Overwrite if the document already exists
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !sourceDocument}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Duplicate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DuplicateCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCollectionPath: string | null;
  onSubmit: (input: { targetCollectionPath: string; overwrite: boolean }) => Promise<void>;
  isSubmitting: boolean;
};

function DuplicateCollectionDialog({
  open,
  onOpenChange,
  sourceCollectionPath,
  onSubmit,
  isSubmitting,
}: DuplicateCollectionDialogProps) {
  const { toast } = useToast();
  const [targetPath, setTargetPath] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  useEffect(() => {
    if (open && sourceCollectionPath) {
      setTargetPath(`${sourceCollectionPath}-copy`);
      setOverwrite(false);
    } else if (!open) {
      setTargetPath('');
      setOverwrite(false);
    }
  }, [open, sourceCollectionPath]);

  const handleSubmit = async () => {
    if (!sourceCollectionPath) {
      toast({
        title: 'Select a collection first',
        description: 'Choose a source collection before duplicating.',
        variant: 'destructive',
      });
      return;
    }
    const trimmed = targetPath.trim();
    if (!trimmed) {
      toast({
        title: 'Missing target name',
        description: 'Provide the destination collection path.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSubmit({ targetCollectionPath: trimmed, overwrite });
    } catch {
      // handled upstream
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate collection</DialogTitle>
          <DialogDescription>
            Copy documents from {sourceCollectionPath ?? 'the selected collection'} into a new or
            existing path.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Destination collection path</label>
            <Input
              value={targetPath}
              onChange={(event) => setTargetPath(event.target.value)}
              placeholder="e.g. users_copy"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(event) => setOverwrite(event.target.checked)}
            />
            Overwrite matching documents
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !sourceCollectionPath}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Duplicate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type OnboardingProps = {
  onImport: () => Promise<void>;
};

function OnboardingState({ onImport }: OnboardingProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">Connect your first Firebase project</h2>
      <p className="max-w-md text-center text-muted-foreground">
        Import a Google Service Account JSON to start browsing Firestore data locally. The key is stored
        on your device and never leaves this machine.
      </p>
      <Button onClick={onImport}>Import service account</Button>
    </div>
  );
}



