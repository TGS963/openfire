import Editor from '@monaco-editor/react';
import { Copy, CopyPlus, FileText, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Kbd } from '@/components/ui/kbd';
import { useToast } from '@/components/ui/use-toast';
import { PreviewModeToggle } from '@/components/views/ViewModeToggle';
import { FieldsView } from '@/components/views/FieldsView';
import { useViewStore } from '@/stores/view-store';
import { useDocDraftsStore } from '@/stores/doc-drafts-store';
import type { FirestoreDocument } from '@/types/firestore';

export type DocumentPreviewSectionProps = {
  document: FirestoreDocument | null;
  isLoading: boolean;
  onSave: (path: string, data: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  onDuplicate: (doc: FirestoreDocument) => void;
  onDelete?: (path: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => void) | null>;
};

function fmtTime(t?: string | null) {
  return t ? t.replace('T', ' ').replace('Z', '') : '—';
}

export function DocumentPreviewSection({
  document,
  isLoading,
  onSave,
  isSaving,
  onDuplicate,
  onDelete,
  onDirtyChange,
  saveRef,
}: DocumentPreviewSectionProps) {
  const { toast } = useToast();
  const previewMode = useViewStore((state) => state.previewMode);
  const theme = useViewStore((state) => state.theme);
  const [editorValue, setEditorValue] = useState('');
  const [lastSynced, setLastSynced] = useState('');
  const [fieldsData, setFieldsData] = useState<Record<string, unknown>>({});
  const [fieldsLastSynced, setFieldsLastSynced] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (document) {
      const pretty = JSON.stringify(document.data ?? {}, null, 2);
      // Baseline always tracks the saved document; the working buffer prefers a
      // pending draft so switching docs/tabs never discards unsaved edits.
      setLastSynced(pretty);
      setFieldsLastSynced(document.data ?? {});
      const draft = useDocDraftsStore.getState().getDraft(document.path);
      setEditorValue(draft?.editorValue ?? pretty);
      setFieldsData(draft?.fieldsData ?? document.data ?? {});
    } else {
      setEditorValue('');
      setLastSynced('');
      setFieldsData({});
      setFieldsLastSynced({});
    }
  }, [document?.path, document?.updateTime]);

  const handleEditorChange = (value: string) => {
    setEditorValue(value);
    if (document) {
      useDocDraftsStore.getState().setDraft(document.path, { editorValue: value, fieldsData });
    }
  };

  const handleFieldsChange = (next: Record<string, unknown>) => {
    setFieldsData(next);
    if (document) {
      useDocDraftsStore.getState().setDraft(document.path, { editorValue, fieldsData: next });
    }
  };

  const isJsonDirty = previewMode === 'json' && Boolean(document && editorValue !== lastSynced);
  const isFieldsDirty =
    previewMode === 'fields' &&
    Boolean(document && JSON.stringify(fieldsData) !== JSON.stringify(fieldsLastSynced));
  const isDirty = isJsonDirty || isFieldsDirty;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = () => {
        if (isDirty) handleSave();
      };
      return () => {
        saveRef.current = null;
      };
    }
  });

  const handleSave = async () => {
    if (!document) return;
    let parsed: Record<string, unknown>;
    if (previewMode === 'fields') {
      parsed = fieldsData;
    } else {
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
    }
    try {
      await onSave(document.path, parsed);
    } catch {
      return;
    }
    const pretty = JSON.stringify(parsed, null, 2);
    setLastSynced(pretty);
    setEditorValue(pretty);
    setFieldsData(parsed);
    setFieldsLastSynced(parsed);
    useDocDraftsStore.getState().clearDraft(document.path);
  };

  const pathParts = document?.path.split('/') ?? [];
  const fieldCount = document ? Object.keys(document.data ?? {}).length : 0;
  const changeCount = isDirty ? 1 : 0;

  return (
    <section className="flex flex-1 flex-col min-h-0">
      {/* preview head */}
      <div className="flex min-h-10 shrink-0 items-center gap-2 border-b border-border-soft px-3">
        <div className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-text-muted">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading…
            </span>
          ) : document ? (
            pathParts.map((seg, i) => {
              const last = i === pathParts.length - 1;
              return (
                <span key={i} className={last ? 'font-medium text-text' : 'text-text-faint'}>
                  {i > 0 && <span className="text-text-faint"> / </span>}
                  {seg}
                </span>
              );
            })
          ) : (
            'Nothing selected'
          )}
        </div>
        {document && <PreviewModeToggle />}
        {document && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Copy JSON"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(document.data, null, 2));
              toast({ title: 'Copied', description: 'Document JSON copied to clipboard.' });
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        {document && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Duplicate"
            onClick={() => onDuplicate(document)}
          >
            <CopyPlus className="h-4 w-4" />
          </Button>
        )}
        {document && onDelete && (
          <Button
            variant="danger"
            size="icon"
            aria-label="Delete"
            onClick={() => onDelete(document.path)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        {document && isDirty && (
          <Button
            size="default"
            onClick={handleSave}
            disabled={isSaving}
            className={`gap-1.5 ${isSaving ? 'opacity-60' : ''}`}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
            {!isSaving && (
              <Kbd className="border-[var(--kbd-tip-border)] bg-[var(--kbd-tip-bg)] text-ember-fg">
                ⌘S
              </Kbd>
            )}
          </Button>
        )}
      </div>
      {/* meta strip */}
      {document && (
        <div className="flex shrink-0 gap-[18px] border-b border-border-soft px-3 py-1.5 font-mono text-[11px] text-text-muted">
          <span>
            <b className="mr-1 font-medium text-text-mid">created</b>
            {fmtTime(document.createTime)}
          </span>
          <span>
            <b className="mr-1 font-medium text-text-mid">updated</b>
            {fmtTime(document.updateTime)}
          </span>
          <span className="whitespace-nowrap">
            <b className="mr-1 font-medium text-text-mid">{fieldCount} fields</b>
          </span>
          {isDirty && (
            <button
              type="button"
              onClick={() => {
                setFieldsData(fieldsLastSynced);
                setEditorValue(lastSynced);
                if (document) useDocDraftsStore.getState().clearDraft(document.path);
              }}
              className="ml-auto text-text-faint hover:text-text"
            >
              reset
            </button>
          )}
          <span
            className={
              isDirty
                ? 'whitespace-nowrap text-warning'
                : 'ml-auto whitespace-nowrap text-success'
            }
          >
            ● {isDirty ? `unsaved · ${changeCount} change${changeCount === 1 ? '' : 's'}` : 'saved'}
          </span>
        </div>
      )}
      {previewMode === 'fields' ? (
        document ? (
          <FieldsView data={fieldsData} onChange={handleFieldsChange} />
        ) : (
          <EmptyState
            icon={FileText}
            title="No document selected"
            description="Pick a document from the list to edit its fields."
          />
        )
      ) : (
        <div className="flex flex-1 min-h-0">
          {document ? (
            <Editor
              key={document.path}
              defaultLanguage="json"
              value={editorValue}
              onChange={(value) => handleEditorChange(value ?? '')}
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No document selected"
              description="Pick a document from the list to preview and edit its JSON payload."
            />
          )}
        </div>
      )}
    </section>
  );
}
