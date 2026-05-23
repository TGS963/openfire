import { Filter, Loader2, MoreHorizontal, Terminal } from 'lucide-react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListModeToggle } from '@/components/views/ViewModeToggle';

export type ToolbarProps = {
  collectionPath: string | null;
  breadcrumbs: string[];
  onCrumbClick: (index: number) => void;
  isLoading: boolean;
  queryOpen?: boolean;
  onToggleQuery?: () => void;
  shellOpen?: boolean;
  onToggleShell?: () => void;
  onDuplicateCollection: () => void;
  onDeleteCollection?: () => void;
};

export function Toolbar({
  collectionPath,
  breadcrumbs,
  onCrumbClick,
  isLoading,
  queryOpen,
  onToggleQuery,
  shellOpen,
  onToggleShell,
  onDuplicateCollection,
  onDeleteCollection,
}: ToolbarProps) {
  const hasCollection = Boolean(collectionPath);

  return (
    <div className="flex h-10 flex-shrink-0 items-center gap-2 border-b border-border-soft pl-3.5 pr-3">
      {/* breadcrumbs */}
      <div className="flex min-w-0 flex-1 items-center gap-1 font-mono text-[12.5px] text-text-muted">
        {breadcrumbs.length === 0 ? (
          <span className="px-1 text-text-faint">nothing selected</span>
        ) : (
          breadcrumbs.map((seg, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <Fragment key={`${seg}-${i}`}>
                {i > 0 && <span className="text-text-faint">/</span>}
                <button
                  type="button"
                  onClick={() => onCrumbClick(i)}
                  disabled={isLoading}
                  className={`truncate rounded-sm px-1 py-0.5 hover:bg-surface-2 hover:text-text disabled:opacity-60 disabled:hover:bg-transparent ${
                    last ? 'font-medium text-text' : 'text-text-mid'
                  }`}
                >
                  {seg}
                </button>
              </Fragment>
            );
          })
        )}
        {isLoading && <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-text-faint" />}
      </div>

      {/* actions */}
      <div className="flex flex-shrink-0 items-center gap-0.5">
        {hasCollection && <ListModeToggle />}
        <span className="mx-1 h-4 w-px bg-border-soft" />
        {onToggleQuery && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Query"
            aria-pressed={queryOpen}
            className={queryOpen ? 'bg-surface-3 text-text' : ''}
            onClick={onToggleQuery}
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
        {onToggleShell && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Shell"
            aria-pressed={shellOpen}
            className={shellOpen ? 'bg-surface-3 text-text' : ''}
            onClick={onToggleShell}
          >
            <Terminal className="h-4 w-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More" disabled={!hasCollection || isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onDuplicateCollection}>Duplicate</DropdownMenuItem>
            {onDeleteCollection && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-danger" onSelect={onDeleteCollection}>
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
