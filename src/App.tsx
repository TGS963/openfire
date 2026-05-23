import { save as saveDialogPlugin } from '@tauri-apps/plugin-dialog';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';

import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { useDeleteCollection, useDeleteDocument, useDocument, useDocuments, useQueryDocuments } from '@/hooks/firestore';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { duplicateCollection, duplicateDocument, exportCollection, importCollection, saveDocument, transferDocuments } from '@/lib/tauri';
import { openFileDialog } from '@/lib/dialog-utils';
import { normalizeFirestorePath, collectionFromDocPath } from '@/lib/firestore-utils';
import { toastError } from '@/lib/toast-utils';
import { useAuthStore } from '@/stores/auth-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore, type DialogName } from '@/stores/dialog-store';
import { useNavStore } from '@/stores/nav-store';
import type { DocumentPage, FirestoreDocument, ImportMode, QuerySpec } from '@/types/firestore';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ResizableLayout } from '@/components/layout/ResizableLayout';
import { ContentSplit } from '@/components/layout/ContentSplit';
import { BackgroundBlobs } from '@/components/layout/BackgroundBlobs';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { DocumentListSection } from '@/components/documents/DocumentListSection';
import { DocumentPreviewSection } from '@/components/documents/DocumentPreviewSection';
import { AboutDialog } from '@/components/dialogs/AboutDialog';
import { CreateDocumentDialog } from '@/components/dialogs/CreateDocumentDialog';
import { DuplicateDocumentDialog } from '@/components/dialogs/DuplicateDocumentDialog';
import { DuplicateCollectionDialog } from '@/components/dialogs/DuplicateCollectionDialog';
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog';
import { ImportCollectionDialog } from '@/components/dialogs/ImportCollectionDialog';
import { EmulatorConnectDialog } from '@/components/dialogs/EmulatorConnectDialog';
import { SaveQueryDialog } from '@/components/dialogs/SaveQueryDialog';
import { SaveScriptDialog } from '@/components/dialogs/SaveScriptDialog';
import { ShortcutsHelpDialog } from '@/components/dialogs/ShortcutsHelpDialog';
import { ConnectionManagerDialog } from '@/components/dialogs/ConnectionManagerDialog';
import { TransferDialog } from '@/components/dialogs/TransferDialog';
import { ScriptPanel } from '@/components/shell/ScriptPanel';
import { QueryBar } from '@/components/query/QueryBar';
import { OnboardingState } from '@/components/onboarding/OnboardingState';
import { useQueryStore } from '@/stores/query-store';
import { useScriptStore } from '@/stores/script-store';
import { useViewStore } from '@/stores/view-store';

type ShellSplitProps = {
  shellOpen: boolean;
  children: React.ReactNode;
  onSaveRequest: () => void;
  runScriptRef: React.MutableRefObject<(() => void) | null>;
};

const SEPARATOR_H =
  'group relative h-2 cursor-row-resize select-none focus:outline-none before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-black/[0.06] dark:before:bg-white/[0.06] before:transition-all hover:before:h-0.5 hover:before:bg-primary/50 focus:before:h-0.5 focus:before:bg-primary active:before:h-0.5 active:before:bg-primary';

function ShellSplitInner({
  children,
  onSaveRequest,
  runScriptRef,
}: {
  children: React.ReactNode;
  onSaveRequest: () => void;
  runScriptRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'shell-split-v2' });

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <Group
        orientation="vertical"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        resizeTargetMinimumSize={{ coarse: 28, fine: 16 }}
      >
        <Panel id="main-content" defaultSize={65} minSize={30} className="flex flex-col">
          {children}
        </Panel>
        <Separator className={SEPARATOR_H} />
        <Panel id="shell" defaultSize={35} minSize={15} className="flex flex-col">
          <ScriptPanel onSaveRequest={onSaveRequest} runRef={runScriptRef} />
        </Panel>
      </Group>
    </div>
  );
}

function ShellSplit({ shellOpen, children, onSaveRequest, runScriptRef }: ShellSplitProps) {
  if (!shellOpen) return <>{children}</>;

  return (
    <ShellSplitInner onSaveRequest={onSaveRequest} runScriptRef={runScriptRef}>
      {children}
    </ShellSplitInner>
  );
}

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
  const connectionMode = useAuthStore((state) => state.connectionMode);
  const emulatorProjectId = useAuthStore((state) => state.emulatorProjectId);
  const connectToEmulator = useAuthStore((state) => state.connectToEmulator);
  const disconnectFromEmulator = useAuthStore((state) => state.disconnectFromEmulator);

  const collectionPath = useNavStore((state) => state.collectionPath);
  const documentPath = useNavStore((state) => state.documentPath);
  const setCollectionPath = useNavStore((state) => state.setCollectionPath);
  const setDocumentPath = useNavStore((state) => state.setDocumentPath);
  const resetNav = useNavStore((state) => state.reset);

  const [search, setSearch] = useState('');
  const [duplicateDoc, setDuplicateDoc] = useState<FirestoreDocument | null>(null);
  const [deleteDocPath, setDeleteDocPath] = useState<string | null>(null);
  const [deleteCollectionPath, setDeleteCollectionPath] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState<QuerySpec | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [shellOpen, setShellOpen] = useState(false);
  const saveQueryToStore = useQueryStore((state) => state.saveQuery);
  const saveScriptToStore = useScriptStore((s) => s.saveScript);
  const scriptStoreScript = useScriptStore((s) => s.script);

  const connections = useConnectionStore((state) => state.connections);
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const loadConnections = useConnectionStore((state) => state.loadConnections);
  const switchConnection = useConnectionStore((state) => state.switchConnection);
  const removeConnectionFromStore = useConnectionStore((state) => state.removeConnection);

  const openDialog = useDialogStore((s) => s.open);
  const closeDialog = useDialogStore((s) => s.close);
  const dialogStack = useDialogStore((s) => s.stack);
  const isDialogOpen = (name: DialogName) => dialogStack.includes(name);
  const closeTopDialog = useDialogStore((s) => s.closeTop);
  const theme = useViewStore((s) => s.theme);

  const saveRequestedRef = useRef<(() => void) | null>(null);
  const runScriptRef = useRef<(() => void) | null>(null);

  const deleteDocumentMutation = useDeleteDocument();
  const deleteCollectionMutation = useDeleteCollection();

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

  const importCollectionMutation = useMutation({
    mutationFn: ({
      collectionPath: cp,
      filePath,
      mode,
    }: {
      collectionPath: string;
      filePath: string;
      mode: ImportMode;
    }) => importCollection(cp, filePath, mode),
  });

  const updateDocumentCaches = (doc: FirestoreDocument) => {
    if (!activeAccountId) return;
    queryClient.setQueryData<FirestoreDocument>(['document', activeAccountId, doc.path], doc);
    const collection = collectionFromDocPath(doc.path);
    if (!collection) return;
    queryClient.setQueryData<DocumentPage | undefined>(
      ['documents', activeAccountId, collection],
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
      toastError(toast, 'Failed to save document', err);
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
      toastError(toast, 'Unable to duplicate document', err);
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
      closeDialog('duplicateCollection');
    } catch (err) {
      toastError(toast, 'Unable to duplicate collection', err);
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
    closeDialog('createDocument');
  };

  const handleSaveDocument = async (path: string, data: Record<string, unknown>) => {
    await persistDocument({ path, data, successMessage: 'Document saved' });
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocPath) return;
    try {
      await deleteDocumentMutation.mutateAsync(deleteDocPath);
      toast({ title: 'Document deleted', description: deleteDocPath });
      if (documentPath === deleteDocPath) {
        setDocumentPath(null);
      }
      setDeleteDocPath(null);
    } catch (err) {
      toastError(toast, 'Failed to delete document', err);
    }
  };

  const handleDeleteCollection = async () => {
    if (!deleteCollectionPath) return;
    try {
      const count = await deleteCollectionMutation.mutateAsync(deleteCollectionPath);
      toast({
        title: 'Collection deleted',
        description: `Deleted ${count} documents from ${deleteCollectionPath}.`,
      });
      if (collectionPath === deleteCollectionPath) {
        setCollectionPath(null);
      }
      setDeleteCollectionPath(null);
    } catch (err) {
      toastError(toast, 'Failed to delete collection', err);
    }
  };

  const handleExportCollection = async () => {
    if (!collectionPath) return;
    try {
      const collectionName = collectionPath.split('/').pop() ?? collectionPath;
      const filePath = await saveDialogPlugin({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: `${collectionName}.json`,
      });
      if (!filePath) return;
      const count = await exportCollection(collectionPath, filePath);
      toast({
        title: 'Collection exported',
        description: `Exported ${count} documents to ${filePath.split('/').pop()}.`,
      });
    } catch (err) {
      toastError(toast, 'Export failed', err);
    }
  };

  const handleImportCollection = async ({
    filePath,
    mode,
  }: {
    filePath: string;
    mode: ImportMode;
  }) => {
    if (!collectionPath) return;
    try {
      const result = await importCollectionMutation.mutateAsync({
        collectionPath,
        filePath,
        mode,
      });
      toast({
        title: 'Import complete',
        description: `Imported ${result.imported} documents${result.skipped > 0 ? `, skipped ${result.skipped}` : ''}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['documents', activeAccountId, collectionPath] });
      queryClient.invalidateQueries({ queryKey: ['collections'], exact: false });
      closeDialog('importCollection');
    } catch (err) {
      toastError(toast, 'Import failed', err);
      throw err;
    }
  };

  const handleConnectEmulator = async ({
    projectId,
    emulatorUrl,
  }: {
    projectId: string;
    emulatorUrl: string;
  }) => {
    try {
      await connectToEmulator(projectId, emulatorUrl);
      queryClient.clear();
      resetNav();
      closeDialog('emulatorConnect');
      toast({ title: 'Connected to emulator', description: `Project: ${projectId}` });
    } catch (err) {
      toastError(toast, 'Failed to connect to emulator', err);
      throw err;
    }
  };

  const handleDisconnectEmulator = async () => {
    try {
      await disconnectFromEmulator();
      queryClient.clear();
      resetNav();
      toast({ title: 'Disconnected from emulator' });
    } catch (err) {
      toastError(toast, 'Failed to disconnect', err);
    }
  };

  const handleTransfer = async (params: {
    sourceConnectionId: string;
    destConnectionId: string;
    sourceCollectionPath: string;
    destCollectionPath: string;
    overwrite: boolean;
  }) => {
    setIsTransferring(true);
    try {
      const result = await transferDocuments(
        params.sourceConnectionId,
        params.destConnectionId,
        params.sourceCollectionPath,
        params.destCollectionPath,
        params.overwrite,
      );
      toast({
        title: 'Transfer complete',
        description: `Transferred ${result.transferred} documents${result.skipped > 0 ? `, skipped ${result.skipped}` : ''}.`,
      });
      closeDialog('transfer');
      queryClient.invalidateQueries({ queryKey: ['collections'], exact: false });
    } catch (err) {
      toastError(toast, 'Transfer failed', err);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSwitchConnection = async (id: string) => {
    await switchConnection(id);
    queryClient.clear();
    resetNav();
    closeDialog('connectionManager');
  };

  const handleRemoveConnection = async (id: string) => {
    await removeConnectionFromStore(id);
    if (id === activeConnectionId) {
      queryClient.clear();
      resetNav();
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    loadAccounts();
    loadConnections();
  }, [loadAccounts, loadConnections]);

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
    setActiveQuery(null);
  }, [activeAccountId, resetNav]);

  const documentsQuery = useDocuments(collectionPath);
  const queryDocumentsResult = useQueryDocuments(activeQuery);
  const documentQuery = useDocument(documentPath);

  const isQueryActive = activeQuery !== null;
  const documents: FirestoreDocument[] = isQueryActive
    ? (queryDocumentsResult.data?.documents ?? [])
    : (documentsQuery.data?.documents ?? []);
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

  useKeyboardShortcuts({
    'save-document': () => saveRequestedRef.current?.(),
    'run-query': () => {
      if (activeQuery && collectionPath) {
        setActiveQuery({ ...activeQuery });
      }
    },
    // toggle-query not wired — QueryBar manages its own expanded state
    escape: () => {
      if (useDialogStore.getState().stack.length > 0) {
        closeTopDialog();
      } else if (shellOpen) {
        setShellOpen(false);
      }
    },
    'show-shortcuts': () => openDialog('shortcutsHelp'),
    'toggle-shell': () => setShellOpen((prev) => !prev),
    'run-script': () => runScriptRef.current?.(),
  });

  const handleImport = async () => {
    let file: string | null = null;
    try {
      file = await openFileDialog({
        filters: [{ name: 'Service Account', extensions: ['json'] }],
        multiple: false,
      });
    } catch (err) {
      toastError(toast, 'Unable to open file dialog', err);
      return;
    }
    if (!file) return;
    try {
      await importAccount(file);
      toast({
        title: 'Service account imported',
        description: 'Connected to the project.',
      });
    } catch (err) {
      toastError(toast, 'Unable to import service account', err);
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

  const showOnboarding = initialized && accounts.length === 0 && connectionMode !== 'emulator';

  return (
    <ErrorBoundary>
      <BackgroundBlobs />
      <ResizableLayout
        sidebarContent={
          <Sidebar
            accounts={accounts}
            activeAccountId={activeAccountId}
            isLoading={isAuthLoading}
            onImport={handleImport}
            onSelectAccount={handleSelectAccount}
            collectionPath={collectionPath}
            documentPath={documentPath}
            onSelectCollection={(path) => setCollectionPath(path)}
            onSelectDocument={(path) => {
              const collection = collectionFromDocPath(path);
              if (collection) setCollectionPath(collection);
              setDocumentPath(path);
            }}
            connectionMode={connectionMode}
            emulatorProjectId={emulatorProjectId}
            onConnectEmulator={() => openDialog('emulatorConnect')}
            onDisconnectEmulator={handleDisconnectEmulator}
            connectionCount={connections.length}
            onManageConnections={() => openDialog('connectionManager')}
            onDeleteCollection={(path) => setDeleteCollectionPath(path)}
            onAbout={() => openDialog('about')}
          />
        }
        mainContent={
          <main className="flex flex-1 flex-col min-h-0 bg-background text-foreground">
            {showOnboarding ? (
              <OnboardingState onImport={handleImport} />
            ) : (
              <>
                <Header
                  collectionPath={collectionPath}
                  isLoading={
                    isQueryActive
                      ? queryDocumentsResult.isLoading
                      : documentsQuery.isLoading && !documentsQuery.data
                  }
                  onClearSelection={() => {
                    setCollectionPath(null);
                    setActiveQuery(null);
                  }}
                  canClear={Boolean(collectionPath)}
                  onDuplicateCollection={() => openDialog('duplicateCollection')}
                  onDeleteCollection={collectionPath ? () => setDeleteCollectionPath(collectionPath) : undefined}
                  onExportCollection={collectionPath ? handleExportCollection : undefined}
                  onImportCollection={collectionPath ? () => openDialog('importCollection') : undefined}
                  onTransferCollection={collectionPath ? () => openDialog('transfer') : undefined}
                  connectionCount={connections.length}
                  shellOpen={shellOpen}
                  onToggleShell={() => setShellOpen((prev) => !prev)}
                />
                {collectionPath && (
                  <QueryBar
                    collectionPath={collectionPath}
                    activeQuery={activeQuery}
                    onRunQuery={setActiveQuery}
                    onClearQuery={() => setActiveQuery(null)}
                    isQuerying={queryDocumentsResult.isLoading}
                    onSaveQuery={() => openDialog('saveQuery')}
                    onLoadQuery={(spec) => setActiveQuery(spec)}
                  />
                )}
                <ShellSplit
                  shellOpen={shellOpen}
                  onSaveRequest={() => openDialog('saveScript')}
                  runScriptRef={runScriptRef}
                >
                  <ContentSplit
                    left={
                      <DocumentListSection
                        documents={filteredDocuments}
                        isLoading={documentsQuery.isLoading}
                        error={documentsQuery.error as Error | undefined}
                        selectedPath={documentPath}
                        onSelect={setDocumentPath}
                        hasCollection={Boolean(collectionPath)}
                        search={search}
                        onSearchChange={setSearch}
                        onCreateDocument={() => openDialog('createDocument')}
                        onDuplicateDocument={setDuplicateDoc}
                        onDeleteDocument={setDeleteDocPath}
                      />
                    }
                    right={
                      <DocumentPreviewSection
                        document={previewDocument}
                        isLoading={documentQuery.isLoading}
                        onSave={handleSaveDocument}
                        isSaving={saveDocumentMutation.isPending}
                        onDuplicate={(doc) => setDuplicateDoc(doc)}
                        saveRef={saveRequestedRef}
                      />
                    }
                  />
                </ShellSplit>
              </>
            )}
          </main>
        }
      />
      <CreateDocumentDialog
        open={isDialogOpen('createDocument')}
        onOpenChange={(next) => { if (!next) closeDialog('createDocument'); }}
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
        open={isDialogOpen('duplicateCollection')}
        onOpenChange={(next) => { if (!next) closeDialog('duplicateCollection'); }}
        sourceCollectionPath={collectionPath}
        onSubmit={handleDuplicateCollection}
        isSubmitting={duplicateCollectionMutation.isPending}
      />
      <ImportCollectionDialog
        open={isDialogOpen('importCollection')}
        onOpenChange={(next) => { if (!next) closeDialog('importCollection'); }}
        collectionPath={collectionPath}
        onSubmit={handleImportCollection}
        isSubmitting={importCollectionMutation.isPending}
      />
      <SaveQueryDialog
        open={isDialogOpen('saveQuery')}
        onOpenChange={(next) => { if (!next) closeDialog('saveQuery'); }}
        onSave={(name) => {
          if (activeQuery) {
            saveQueryToStore(name, activeQuery);
            toast({ title: 'Query saved', description: name });
          } else if (collectionPath) {
            saveQueryToStore(name, { collectionPath, filters: [], orderBy: [] });
            toast({ title: 'Query saved', description: name });
          }
        }}
      />
      <EmulatorConnectDialog
        open={isDialogOpen('emulatorConnect')}
        onOpenChange={(next) => { if (!next) closeDialog('emulatorConnect'); }}
        onSubmit={handleConnectEmulator}
        isSubmitting={isAuthLoading}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteDocPath)}
        onOpenChange={(next) => {
          if (!next) setDeleteDocPath(null);
        }}
        onConfirm={handleDeleteDocument}
        isDeleting={deleteDocumentMutation.isPending}
        mode="document"
        targetPath={deleteDocPath ?? ''}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteCollectionPath)}
        onOpenChange={(next) => {
          if (!next) setDeleteCollectionPath(null);
        }}
        onConfirm={handleDeleteCollection}
        isDeleting={deleteCollectionMutation.isPending}
        mode="collection"
        targetPath={deleteCollectionPath ?? ''}
      />
      <ShortcutsHelpDialog
        open={isDialogOpen('shortcutsHelp')}
        onOpenChange={(next) => { if (!next) closeDialog('shortcutsHelp'); }}
      />
      <ConnectionManagerDialog
        open={isDialogOpen('connectionManager')}
        onOpenChange={(next) => { if (!next) closeDialog('connectionManager'); }}
        connections={connections}
        onSwitch={handleSwitchConnection}
        onRemove={handleRemoveConnection}
      />
      <TransferDialog
        open={isDialogOpen('transfer')}
        onOpenChange={(next) => { if (!next) closeDialog('transfer'); }}
        connections={connections}
        sourceConnectionId={activeConnectionId ?? ''}
        sourceCollectionPath={collectionPath ?? ''}
        onTransfer={handleTransfer}
        isTransferring={isTransferring}
      />
      <SaveScriptDialog
        open={isDialogOpen('saveScript')}
        onOpenChange={(next) => { if (!next) closeDialog('saveScript'); }}
        onSave={(name) => {
          saveScriptToStore(name, scriptStoreScript);
          toast({ title: 'Script saved', description: name });
        }}
      />
      <AboutDialog
        open={isDialogOpen('about')}
        onOpenChange={(next) => { if (!next) closeDialog('about'); }}
      />
      <Toaster />
    </ErrorBoundary>
  );
}
