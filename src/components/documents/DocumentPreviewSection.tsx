import Editor from '@monaco-editor/react';
import { Copy, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { PreviewModeToggle } from '@/components/views/ViewModeToggle';
import { FieldsView } from '@/components/views/FieldsView';
import { useViewStore } from '@/stores/view-store';
import type { FirestoreDocument } from '@/types/firestore';

export type DocumentPreviewSectionProps = {
  document: FirestoreDocument | null;
  isLoading: boolean;
  onSave: (path: string, data: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  onDuplicate: (doc: FirestoreDocument) => void;
  saveRef?: React.MutableRefObject<(() => void) | null>;
};

export function DocumentPreviewSection({
  document,
  isLoading,
  onSave,
  isSaving,
  onDuplicate,
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
      setEditorValue(pretty);
      setLastSynced(pretty);
      setFieldsData(document.data ?? {});
      setFieldsLastSynced(document.data ?? {});
    } else {
      setEditorValue('');
      setLastSynced('');
      setFieldsData({});
      setFieldsLastSynced({});
    }
  }, [document?.path, document?.updateTime]);

  const isJsonDirty = previewMode === 'json' && Boolean(document && editorValue !== lastSynced);
  const isFieldsDirty =
    previewMode === 'fields' &&
    Boolean(document && JSON.stringify(fieldsData) !== JSON.stringify(fieldsLastSynced));
  const isDirty = isJsonDirty || isFieldsDirty;

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
  };

  return (
    <section className="flex flex-1 flex-col min-h-0">
      <div className="flex items-center justify-between border-b border-white/[0.06] dark:bg-white/[0.005] bg-white/30 backdrop-blur-sm px-4 py-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-xs uppercase text-muted-foreground">Document</p>
            <p className="text-sm font-semibold truncate">
              {isLoading ? 'Loading…' : document?.path ?? 'Nothing selected'}
            </p>
            {isDirty && (
              <p className="text-xs text-amber-500">You have unsaved changes.</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PreviewModeToggle />
          {document && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(document.data, null, 2));
                toast({ title: 'Copied', description: 'Document JSON copied to clipboard.' });
              }}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy JSON
            </Button>
          )}
          {previewMode === 'json' && document && (
            <Button variant="outline" size="sm" onClick={() => onDuplicate(document)}>
              Duplicate
            </Button>
          )}
          {(previewMode === 'json' || previewMode === 'fields') && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (previewMode === 'fields') {
                    setFieldsData(fieldsLastSynced);
                  } else {
                    setEditorValue(lastSynced);
                  }
                }}
                disabled={!document || !isDirty || isSaving}
              >
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!document || !isDirty || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>
      {previewMode === 'json' && document && (
        <div className="border-b px-4 py-2 shrink-0">
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
      {previewMode === 'fields' ? (
        document ? (
          <FieldsView data={fieldsData} onChange={setFieldsData} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a document to edit its fields.
          </div>
        )
      ) : (
        <div className="flex flex-1 min-h-0">
          {document ? (
            <Editor
              key={document.path}
              defaultLanguage="json"
              value={editorValue}
              onChange={(value) => setEditorValue(value ?? '')}
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a document to preview and edit its JSON payload.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
