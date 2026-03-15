import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useViewStore, type ListMode, type PreviewMode } from '@/stores/view-store';

export function ListModeToggle() {
  const listMode = useViewStore((state) => state.listMode);
  const setListMode = useViewStore((state) => state.setListMode);

  return (
    <Tabs value={listMode} onValueChange={(v) => setListMode(v as ListMode)}>
      <TabsList className="h-7">
        <TabsTrigger value="list" className="h-6 px-2 text-xs">
          List
        </TabsTrigger>
        <TabsTrigger value="table" className="h-6 px-2 text-xs">
          Table
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function PreviewModeToggle() {
  const previewMode = useViewStore((state) => state.previewMode);
  const setPreviewMode = useViewStore((state) => state.setPreviewMode);

  return (
    <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as PreviewMode)}>
      <TabsList className="h-7">
        <TabsTrigger value="json" className="h-6 px-2 text-xs">
          JSON
        </TabsTrigger>
        <TabsTrigger value="fields" className="h-6 px-2 text-xs">
          Fields
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
