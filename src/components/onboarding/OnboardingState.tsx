import { Upload, Zap } from 'lucide-react';

export type OnboardingProps = {
  onImport: () => Promise<void> | void;
  onConnectEmulator: () => void;
  onRestoreBackup?: () => void;
};

export function OnboardingState({ onImport, onConnectEmulator, onRestoreBackup }: OnboardingProps) {
  return (
    <div className="flex flex-1 items-center justify-center bg-surface p-8">
      <div className="flex w-[460px] flex-col gap-[22px] rounded-xl border border-border-soft bg-surface-1 p-7">
        {/* logo mark */}
        <div className="grid h-12 w-12 place-items-center rounded-[12px] bg-ember font-mono text-[22px] font-bold tracking-[-0.04em] text-ember-fg">
          of
        </div>

        <div className="space-y-2">
          <h2 className="m-0 text-[20px] font-semibold tracking-[-0.015em] text-text">
            Connect a Firestore project
          </h2>
          <p className="m-0 text-[13px] leading-[1.55] text-text-muted">
            openfire reads from your project locally over a service account. Your credentials are
            stored on this machine and never leave it.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void onImport()}
            className="flex items-center gap-3 rounded-md border border-ember-border bg-ember-bg px-[14px] py-3 text-left transition-colors hover:bg-[var(--accent-bg-hover)]"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-ember text-ember-fg">
              <Upload className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-ember-strong">
                Import service account JSON
              </span>
              <span className="mt-px block text-[11.5px] text-text-muted">
                Recommended · production access
              </span>
            </span>
            <span className="shrink-0 font-mono text-[12px] text-text-faint">⏎</span>
          </button>

          <button
            type="button"
            onClick={onConnectEmulator}
            className="flex items-center gap-3 rounded-md border border-border-soft bg-surface px-[14px] py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-surface-2 text-text-mid">
              <Zap className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-text">
                Connect to local emulator
              </span>
              <span className="mt-px block text-[11.5px] text-text-muted">
                For development · localhost:8080
              </span>
            </span>
          </button>
        </div>

        <p className="text-center text-[11.5px] leading-[1.5] text-text-faint">
          Have a previous setup?{' '}
          <button
            type="button"
            onClick={onRestoreBackup}
            className="font-medium text-ember-strong hover:underline"
          >
            Restore from backup
          </button>
        </p>
      </div>
    </div>
  );
}
