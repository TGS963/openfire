import Editor from '@monaco-editor/react';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialogPlugin } from '@tauri-apps/plugin-dialog';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { useCollections, useDocument, useDocuments } from '@/hooks/firestore';
import { useAuthStore } from '@/stores/auth-store';
import { useNavStore } from '@/stores/nav-store';
import type { FirestoreDocument, ServiceAccountSummary } from '@/types/firestore';

export function App() {
  const { toast } = useToast();
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
                />
                <DocumentPreviewSection
                  document={previewDocument}
                  isLoading={documentQuery.isLoading}
                />
              </div>
            </>
          )}
        </main>
      </div>
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
};

function Header({ collectionPath, isLoading, canClear, onClearSelection }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <p className="text-xs uppercase text-muted-foreground">Collection</p>
        <h1 className="text-2xl font-semibold">
          {collectionPath ? collectionPath : 'Select a collection'}
        </h1>
      </div>
      <div className="flex items-center gap-3">
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
              <DocumentRow doc={doc} selectedPath={selectedPath} onSelect={onSelect} />
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
};

function DocumentRow({ doc, selectedPath, onSelect }: DocumentRowProps) {
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type DocumentPreviewSectionProps = {
  document: FirestoreDocument | null;
  isLoading: boolean;
};

function DocumentPreviewSection({ document, isLoading }: DocumentPreviewSectionProps) {
  return (
    <section className="flex flex-1 flex-col">
      <div className="border-b px-4 py-2">
        <p className="text-xs uppercase text-muted-foreground">Document</p>
        <p className="text-sm font-semibold">
          {isLoading ? 'Loading…' : document?.path ?? 'Nothing selected'}
        </p>
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
            defaultLanguage="json"
            value={JSON.stringify(document.data, null, 2)}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 13, readOnly: true }}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a document to preview its JSON payload.
          </div>
        )}
      </div>
    </section>
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



