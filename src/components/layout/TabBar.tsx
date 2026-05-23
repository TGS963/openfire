import { FileText, Folder, Plus, X } from 'lucide-react';

import { useTabsStore, type Tab } from '@/stores/tabs-store';

export type TabBarProps = {
  onNewTab?: () => void;
};

function tabLabel(tab: Tab): string {
  if (tab.kind === 'document') {
    const parts = tab.path.split('/');
    return parts[parts.length - 1];
  }
  return tab.path;
}

export function TabBar({ onNewTab }: TabBarProps) {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const setActive = useTabsStore((s) => s.setActive);
  const closeTab = useTabsStore((s) => s.closeTab);

  return (
    <div className="flex h-[34px] flex-shrink-0 items-stretch overflow-x-auto border-b border-border-soft bg-surface-1 pl-1.5">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const label = tabLabel(tab);
        return (
          <div
            key={tab.id}
            data-testid="tab"
            data-active={isActive}
            onClick={() => setActive(tab.id)}
            className={`group relative flex max-w-[220px] flex-shrink-0 cursor-pointer items-center gap-[7px] border-r border-border-soft pl-3 pr-2.5 text-[12px] ${
              isActive ? 'bg-surface text-text' : 'text-text-muted hover:bg-surface-2 hover:text-text'
            }`}
          >
            {isActive && <span className="absolute inset-x-0 top-0 h-0.5 bg-ember" />}
            <span className={`flex-shrink-0 ${isActive ? 'text-ember' : 'text-text-faint'}`}>
              {tab.kind === 'document' ? (
                <FileText className="h-3.5 w-3.5" />
              ) : (
                <Folder className="h-3.5 w-3.5" />
              )}
            </span>
            <span
              className={`min-w-0 flex-1 truncate ${
                tab.kind === 'document' ? 'font-mono text-[11.5px]' : ''
              }`}
            >
              {label}
            </span>
            {tab.dirty ? (
              <>
                <span
                  data-testid="tab-dirty"
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-warning group-hover:hidden"
                />
                <button
                  type="button"
                  aria-label={`Close tab ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="hidden h-4 w-4 flex-shrink-0 place-items-center rounded-[3px] text-text-faint hover:bg-surface-3 hover:text-text group-hover:grid"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-label={`Close tab ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-[3px] text-text-faint opacity-0 transition-opacity hover:bg-surface-3 hover:text-text group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        aria-label="New tab"
        onClick={onNewTab}
        className="grid w-[30px] flex-shrink-0 place-items-center border-r border-border-soft text-text-faint hover:bg-surface-2 hover:text-text"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <div className="flex-1 border-b border-border-soft" />
    </div>
  );
}
