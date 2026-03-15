import type { ReactNode } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';

export type ContentSplitProps = {
  left: ReactNode;
  right: ReactNode;
};

export function ContentSplit({ left, right }: ContentSplitProps) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'content-split' });

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <Group
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        <Panel id="doc-list" defaultSize={40} minSize={20} className="flex flex-col">
          {left}
        </Panel>
        <Separator className="w-px dark:bg-white/[0.06] bg-black/[0.06] hover:bg-primary/30 transition-all duration-300 hover:shadow-[0_0_8px_rgba(245,158,11,0.15)]" />
        <Panel id="doc-preview" minSize={30} className="flex flex-col">
          {right}
        </Panel>
      </Group>
    </div>
  );
}
