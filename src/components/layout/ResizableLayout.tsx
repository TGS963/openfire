import type { ReactNode } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';

export type ResizableLayoutProps = {
  sidebarContent: ReactNode;
  mainContent: ReactNode;
};

const SEPARATOR_V =
  'group relative w-2 cursor-col-resize select-none focus:outline-none before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border-soft before:transition-all hover:before:w-0.5 hover:before:bg-primary/50 focus:before:w-0.5 focus:before:bg-primary active:before:w-0.5 active:before:bg-primary';

export function ResizableLayout({ sidebarContent, mainContent }: ResizableLayoutProps) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'main-layout-v2' });

  return (
    <Group
      orientation="horizontal"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      resizeTargetMinimumSize={{ coarse: 28, fine: 16 }}
      className="h-full bg-background"
    >
      <Panel id="sidebar" defaultSize={17} minSize={12} className="flex flex-col">
        {sidebarContent}
      </Panel>
      <Separator className={SEPARATOR_V} />
      <Panel id="main" minSize={50} className="flex flex-col">
        {mainContent}
      </Panel>
    </Group>
  );
}
