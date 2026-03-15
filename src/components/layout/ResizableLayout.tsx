import type { ReactNode } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';

export type ResizableLayoutProps = {
  sidebarContent: ReactNode;
  mainContent: ReactNode;
};

export function ResizableLayout({ sidebarContent, mainContent }: ResizableLayoutProps) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'main-layout' });

  return (
    <Group
      orientation="horizontal"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      className="h-screen bg-grid-dots"
    >
      <Panel id="sidebar" defaultSize={25} minSize={15} className="flex flex-col">
        {sidebarContent}
      </Panel>
      <Separator className="w-px dark:bg-white/[0.06] bg-black/[0.06] hover:bg-primary/30 transition-all duration-300 hover:shadow-[0_0_8px_rgba(245,158,11,0.15)]" />
      <Panel id="main" minSize={50} className="flex flex-col">
        {mainContent}
      </Panel>
    </Group>
  );
}
