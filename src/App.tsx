import { save as saveDialogPlugin } from '@tauri-apps/plugin-dialog';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';

import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { useConnectionKey, useDeleteCollection, useDeleteDocument, useDocument, useDocumentsInfinite, useQueryDocuments } from '@/hooks/firestore';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { duplicateCollection, duplicateDocument, exportCollection, importCollection, saveDocument, transferDocuments } from '@/lib/tauri';
import { openFileDialog } from '@/lib/dialog-utils';
import { normalizeFirestorePath, collectionFromDocPath } from '@/lib/firestore-utils';
import { getErrorMessage } from '@/lib/error-utils';
import { toastError } from '@/lib/toast-utils';
import { useAuthStore } from '@/stores/auth-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore, type DialogName } from '@/stores/dialog-store';
import { useNavStore } from '@/stores/nav-store';
import { useTabsStore } from '@/stores/tabs-store';
import { usePaletteStore } from '@/stores/palette-store';
import { useCellEditsStore } from '@/stores/cell-edits-store';
import { flushTablePending } from '@/lib/cell-flush';
import type { DocumentPage, FirestoreDocument, ImportMode, QuerySpec } from '@/types/firestore';

import { Sidebar } from '@/components/layout/Sidebar';
import { Toolbar } from '@/components/layout/Toolbar';
import { TabBar } from '@/components/layout/TabBar';
import { CommandPalette, type PaletteAction } from '@/components/layout/CommandPalette';
import { StatusBar } from '@/components/layout/StatusBar';
import { Kbd } from '@/components/ui/kbd';
import { ResizableLayout } from '@/components/layout/ResizableLayout';
import { ContentSplit } from '@/components/layout/ContentSplit';
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
  'group relative h-2 cursor-row-resize select-none focus:outline-none before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-border-soft before:transition-all hover:before:h-0.5 hover:before:bg-primary/50 focus:before:h-0.5 focus:before:bg-primary active:before:h-0.5 active:before:bg-primary';

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
  const { key: connectionKey } = useConnectionKey();
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
  const validateActiveAccount = useAuthStore((state) => state.validateActiveAccount);

  const collectionPath = useNavStore((state) => state.collectionPath);
  const documentPath = useNavStore((state) => state.documentPath);
  const setCollectionPath = useNavStore((state) => state.setCollectionPath);
  const setDocumentPath = useNavStore((state) => state.setDocumentPath);
  const breadcrumbs = useNavStore((state) => state.breadcrumbs);
  const popToBreadcrumb = useNavStore((state) => state.popToBreadcrumb);
  const resetNav = useNavStore((state) => state.reset);

  const openCollectionTab = useTabsStore((s) => s.openCollection);
  const openDocumentTab = useTabsStore((s) => s.openDocument);
  const resetTabs = useTabsStore((s) => s.reset);
  const setTabDirty = useTabsStore((s) => s.setDirty);
  const hydrateNavFromActive = useTabsStore((s) => s.hydrateNavFromActive);
  const ensureAccount = useTabsStore((s) => s.ensureAccount);
  const syncActiveTab = useTabsStore((s) => s.syncActiveFromNav);
  const activeTabId = useTabsStore((s) => s.activeId);
  const tabsList = useTabsStore((s) => s.tabs);
  const cellPendingCount = useCellEditsStore((s) =>
    Object.values(s.pending).reduce((n, d) => n + Object.keys(d).length, 0),
  );
  const closeTabAction = useTabsStore((s) => s.closeTab);
  const closeTabByPath = useTabsStore((s) => s.closeTabByPath);
  const setActiveTab = useTabsStore((s) => s.setActive);
  const openPalette = usePaletteStore((s) => s.open);
  const closePalette = usePaletteStore((s) => s.close);

  const [search, setSearch] = useState('');
  const [duplicateDoc, setDuplicateDoc] = useState<FirestoreDocument | null>(null);
  const [deleteDocPath, setDeleteDocPath] = useState<string | null>(null);
  const [deleteCollectionPath, setDeleteCollectionPath] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState<QuerySpec | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [shellOpen, setShellOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
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
  const listMode = useViewStore((s) => s.listMode);
  const setPreviewMode = useViewStore((s) => s.setPreviewMode);

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

  const updateDocumentCaches = (doc: FirestoreDocument, key: string | null) => {
    if (!key) return;
    queryClient.setQueryData<FirestoreDocument>(['document', key, doc.path], doc);
    const collection = collectionFromDocPath(doc.path);
    if (!collection) return;
    // Infinite (shared list/tree) cache — match all pageSize variants for this collection.
    queryClient.setQueriesData<{ pages: DocumentPage[]; pageParams: unknown[] } | undefined>(
      { queryKey: ['documentsInf', key, collection], exact: false },
      (existing) => {
        if (!existing) return existing;
        let inserted = false;
        const pages = existing.pages.map((page) => {
          if (page.documents.some((entry) => entry.path === doc.path)) {
            inserted = true;
            return {
              ...page,
              documents: page.documents.map((entry) =>
                entry.path === doc.path ? doc : entry,
              ),
            };
          }
          return page;
        });
        // New document → prepend to first page.
        if (!inserted && pages.length > 0) {
          pages[0] = { ...pages[0], documents: [doc, ...pages[0].documents] };
        }
        return { ...existing, pages };
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
    // Snapshot key at mutation start so a mid-flight account/connection switch
    // can't poison the new connection's cache with this doc's data.
    const keyAtStart = connectionKey;
    const pending = toast({
      title: 'Saving…',
      description: normalizedPath,
      duration: Number.POSITIVE_INFINITY,
    });
    try {
      const doc = await saveDocumentMutation.mutateAsync({ path: normalizedPath, data });
      updateDocumentCaches(doc, keyAtStart);
      // Query-mode list reads from a separate cache key — invalidate so it refetches.
      queryClient.invalidateQueries({ queryKey: ['queryDocuments', keyAtStart], exact: false });
      pending.update({
        id: pending.id,
        title: successMessage,
        description: doc.path,
        variant: 'success',
        duration: 3000,
      });
      return doc;
    } catch (err) {
      pending.update({
        id: pending.id,
        title: 'Failed to save document',
        description: getErrorMessage(err),
        variant: 'destructive',
        duration: 6000,
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
    const keyAtStart = connectionKey;
    try {
      const doc = await duplicateDocumentMutation.mutateAsync({
        sourcePath: duplicateDoc.path,
        targetPath,
        overwrite,
      });
      updateDocumentCaches(doc, keyAtStart);
      toast({
        title: 'Document duplicated',
        description: `${doc.id} saved under ${collectionFromDocPath(doc.path) || 'collection'}.`,
      });
      openDocumentTab(doc.path);
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
        queryKey: ['documentsInf', connectionKey, normalizedTarget],
        exact: false,
      });
      openCollectionTab(normalizedTarget);
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
    openDocumentTab(doc.path);
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
      closeTabByPath(deleteDocPath);
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
      queryClient.invalidateQueries({ queryKey: ['documentsInf', connectionKey, collectionPath], exact: false });
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
      await queryClient.cancelQueries();
      queryClient.clear();
      resetNav();
      resetTabs();
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
      await queryClient.cancelQueries();
      queryClient.clear();
      resetNav();
      resetTabs();
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
    await queryClient.cancelQueries();
    queryClient.clear();
    resetNav();
    resetTabs();
    closeDialog('connectionManager');
  };

  const handleRemoveConnection = async (id: string) => {
    await removeConnectionFromStore(id);
    if (id === activeConnectionId) {
      await queryClient.cancelQueries();
      queryClient.clear();
      resetNav();
      resetTabs();
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    // Dark is the default (tokens live in :root). Light swaps in .theme-light.
    root.classList.toggle('theme-light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
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

  // Restore nav from the persisted active tab once on mount.
  useEffect(() => {
    hydrateNavFromActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Probe active account on window focus to detect mid-session credential
  // revocation. Throttled so rapid focus toggling doesn't hammer the backend.
  useEffect(() => {
    let last = 0;
    const onFocus = () => {
      const now = Date.now();
      if (now - last < 60_000) return;
      last = now;
      void validateActiveAccount();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [validateActiveAccount]);

  // Tabs are tagged with the account they belong to. When the active account
  // changes (login / switch), ensureAccount clears stale tabs; matching account
  // (cold start with persisted tabs) is a no-op.
  const prevAccountIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeAccountId) {
      prevAccountIdRef.current = null;
      return;
    }
    const prev = prevAccountIdRef.current;
    if (ensureAccount(activeAccountId)) {
      setActiveQuery(null);
      // Only toast on an actual switch — first login (prev === null) has no
      // stale tabs to warn about.
      if (prev && prev !== activeAccountId) {
        toast({
          title: 'Switched account',
          description: 'Open a collection from the sidebar to view its documents.',
        });
      }
    }
    prevAccountIdRef.current = activeAccountId;
  }, [activeAccountId, ensureAccount, toast]);

  const handleDirtyChange = useCallback(
    (dirty: boolean) => {
      if (activeTabId) setTabDirty(activeTabId, dirty);
    },
    [activeTabId, setTabDirty],
  );

  const documentsQuery = useDocumentsInfinite(collectionPath);
  const documentsFromPages = useMemo(
    () => documentsQuery.data?.pages.flatMap((p) => p.documents) ?? [],
    [documentsQuery.data],
  );
  const handleLoadMoreDocuments = () => {
    if (documentsQuery.hasNextPage && !documentsQuery.isFetchingNextPage) {
      void documentsQuery.fetchNextPage();
    }
  };
  const queryDocumentsResult = useQueryDocuments(activeQuery);
  const documentQuery = useDocument(documentPath);

  const isQueryActive = activeQuery !== null;
  const documents: FirestoreDocument[] = isQueryActive
    ? (queryDocumentsResult.data?.documents ?? [])
    : documentsFromPages;
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

  const cycleTab = (delta: number) => {
    if (tabsList.length === 0) return;
    const idx = tabsList.findIndex((t) => t.id === activeTabId);
    const next = (idx + delta + tabsList.length) % tabsList.length;
    setActiveTab(tabsList[next].id);
  };

  useKeyboardShortcuts({
    'save-document': () => {
      if (
        listMode === 'table' &&
        useCellEditsStore.getState().pendingCount() > 0
      ) {
        void (async () => {
          // Per-doc failures already surface as destructive toasts via
          // persistDocument; this summary fires only when at least one
          // doc failed in the batch.
          const r = await flushTablePending(documents, handleSaveDocument);
          if (r.failures.length > 0) {
            toast({
              title: `Saved ${r.saved}, failed ${r.failures.length}`,
              description: r.failures
                .map((f) => `${f.path}: ${f.fields.join(', ')}`)
                .join('\n'),
              variant: 'destructive',
              duration: 6000,
            });
          }
        })();
        return;
      }
      saveRequestedRef.current?.();
    },
    'run-query': () => {
      if (activeQuery && collectionPath) {
        setActiveQuery({ ...activeQuery });
      }
    },
    'toggle-query': () => {
      if (collectionPath) setQueryOpen((prev) => !prev);
    },
    escape: () => {
      if (usePaletteStore.getState().isOpen) {
        closePalette();
      } else if (useDialogStore.getState().stack.length > 0) {
        closeTopDialog();
      } else if (queryOpen) {
        setQueryOpen(false);
      } else if (shellOpen) {
        setShellOpen(false);
      }
    },
    'show-shortcuts': () => openDialog('shortcutsHelp'),
    'toggle-shell': () => setShellOpen((prev) => !prev),
    'run-script': () => runScriptRef.current?.(),
    'open-palette': () => {
      if (!showOnboarding) openPalette();
    },
    'goto-path': () => {
      if (!showOnboarding) openPalette('goto');
    },
    'new-tab': () => {
      if (!showOnboarding) openPalette('open-tab');
    },
    'close-tab': () => {
      if (activeTabId) closeTabAction(activeTabId);
    },
    'prev-tab': () => cycleTab(-1),
    'next-tab': () => cycleTab(1),
    ...Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [
        `switch-tab-${i + 1}`,
        () => {
          const tab = tabsList[i];
          if (tab) setActiveTab(tab.id);
        },
      ]),
    ),
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

  const projectName =
    connectionMode === 'emulator'
      ? emulatorProjectId
      : (accounts.find((a) => a.id === activeAccountId)?.projectId ?? null);

  const paletteActions: PaletteAction[] = [
    ...(collectionPath
      ? [
          { id: 'export', label: 'Export collection…', run: () => void handleExportCollection() },
          { id: 'import-collection', label: 'Import collection from JSON…', run: () => openDialog('importCollection') },
          ...(connections.length >= 2
            ? [{ id: 'transfer', label: 'Transfer collection…', run: () => openDialog('transfer') }]
            : []),
          { id: 'duplicate', label: 'Duplicate collection…', run: () => openDialog('duplicateCollection') },
        ]
      : []),
    { id: 'connect-emulator', label: 'Connect to local emulator', run: () => openDialog('emulatorConnect') },
    { id: 'import-sa', label: 'Import service account', run: () => void handleImport() },
    {
      id: 'toggle-theme',
      label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
      run: () => useViewStore.getState().toggleTheme(),
    },
    ...(activeQuery
      ? [{ id: 'save-query', label: 'Save current query…', run: () => openDialog('saveQuery') }]
      : []),
  ];

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col">
      {!showOnboarding && <TabBar onNewTab={() => openPalette('open-tab')} />}
      <div className="min-h-0 flex-1">
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
            onSelectCollection={(path, opts) => openCollectionTab(path, opts)}
            onSelectDocument={(path, opts) => openDocumentTab(path, opts)}
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
              <OnboardingState
                onImport={handleImport}
                onConnectEmulator={() => openDialog('emulatorConnect')}
              />
            ) : (
              <>
                <Toolbar
                  collectionPath={collectionPath}
                  breadcrumbs={breadcrumbs}
                  onCrumbClick={(index) => {
                    popToBreadcrumb(index);
                    syncActiveTab();
                  }}
                  isLoading={
                    isQueryActive
                      ? queryDocumentsResult.isLoading
                      : documentsQuery.isLoading && !documentsQuery.data
                  }
                  queryOpen={queryOpen}
                  onToggleQuery={collectionPath ? () => setQueryOpen((prev) => !prev) : undefined}
                  onDuplicateCollection={() => openDialog('duplicateCollection')}
                  onDeleteCollection={collectionPath ? () => setDeleteCollectionPath(collectionPath) : undefined}
                  shellOpen={shellOpen}
                  onToggleShell={() => setShellOpen((prev) => !prev)}
                />
                {collectionPath && queryOpen && (
                  <QueryBar
                    collectionPath={collectionPath}
                    activeQuery={activeQuery}
                    onRunQuery={setActiveQuery}
                    onClearQuery={() => setActiveQuery(null)}
                    isQuerying={queryDocumentsResult.isLoading}
                    onSaveQuery={() => openDialog('saveQuery')}
                    onLoadQuery={(spec) => setActiveQuery(spec)}
                    matchCount={isQueryActive ? filteredDocuments.length : undefined}
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
                        error={
                          (isQueryActive
                            ? (queryDocumentsResult.error as Error | undefined)
                            : (documentsQuery.error as Error | undefined))
                        }
                        onRetry={() => {
                          if (isQueryActive) void queryDocumentsResult.refetch();
                          else void documentsQuery.refetch();
                        }}
                        selectedPath={documentPath}
                        onSelect={setDocumentPath}
                        onEditComplex={(path) => {
                          setDocumentPath(path);
                          setPreviewMode('fields');
                        }}
                        onEndReached={isQueryActive ? undefined : handleLoadMoreDocuments}
                        hasMore={!isQueryActive && Boolean(documentsQuery.hasNextPage)}
                        isFetchingMore={!isQueryActive && documentsQuery.isFetchingNextPage}
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
                        onDelete={(path) => setDeleteDocPath(path)}
                        onDirtyChange={handleDirtyChange}
                        saveRef={saveRequestedRef}
                      />
                    }
                  />
                </ShellSplit>
              </>
            )}
            {!showOnboarding && (
              <StatusBar
                items={[
                  ...(projectName ? [{ id: 'project', label: projectName }] : []),
                  ...(collectionPath
                    ? [{
                        id: 'count',
                        label: `${filteredDocuments.length}${
                          !isQueryActive && documentsQuery.hasNextPage ? '+' : ''
                        } docs`,
                      }]
                    : []),
                  ...(documentPath ? [{ id: 'sel', label: '1 selected' }] : []),
                  ...(listMode === 'table' && cellPendingCount > 0
                    ? [{ id: 'pending', label: `${cellPendingCount} change${cellPendingCount === 1 ? '' : 's'} pending` }]
                    : []),
                ]}
                right={
                  <span className="flex items-center gap-1.5">
                    {listMode === 'table' && collectionPath ? (
                      <>
                        double-click to edit · <Kbd>⌘S</Kbd> save
                      </>
                    ) : (
                      <>
                        <Kbd>⌘K</Kbd> commands
                      </>
                    )}
                  </span>
                }
              />
            )}
          </main>
        }
      />
      </div>
      </div>
      {!showOnboarding && (
        <CommandPalette actions={paletteActions} onLoadQuery={(q) => setActiveQuery(q)} />
      )}
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
        onImport={handleImport}
        onConnectEmulator={() => openDialog('emulatorConnect')}
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
