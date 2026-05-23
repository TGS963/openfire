import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useViewStore, type ListMode, type PreviewMode } from '@/stores/view-store';

export function ListModeToggle() {
  const listMode = useViewStore((state) => state.listMode);
  const setListMode = useViewStore((state) => state.setListMode);

  return (
    <Tabs value={listMode} onValueChange={(v) => setListMode(v as ListMode)}>
      <TabsList>
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function PreviewModeToggle() {
  const previewMode = useViewStore((state) => state.previewMode);
  const setPreviewMode = useViewStore((state) => state.setPreviewMode);

  return (
    <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as PreviewMode)}>
      <TabsList>
        <TabsTrigger value="json">JSON</TabsTrigger>
        <TabsTrigger value="fields">Fields</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
