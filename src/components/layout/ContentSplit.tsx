import type { ReactNode } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';

export type ContentSplitProps = {
  left: ReactNode;
  right: ReactNode;
};

const SEPARATOR_V =
  'group relative w-2 cursor-col-resize select-none focus:outline-none before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-black/[0.06] dark:before:bg-white/[0.06] before:transition-all hover:before:w-0.5 hover:before:bg-primary/50 focus:before:w-0.5 focus:before:bg-primary active:before:w-0.5 active:before:bg-primary';

export function ContentSplit({ left, right }: ContentSplitProps) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'content-split-v2' });

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <Group
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        resizeTargetMinimumSize={{ coarse: 28, fine: 16 }}
      >
        <Panel id="doc-list" defaultSize={40} minSize={20} className="flex flex-col">
          {left}
        </Panel>
        <Separator className={SEPARATOR_V} />
        <Panel id="doc-preview" minSize={30} className="flex flex-col">
          {right}
        </Panel>
      </Group>
    </div>
  );
}
