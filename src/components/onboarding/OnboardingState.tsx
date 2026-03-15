import { Button } from '@/components/ui/button';
import { ShineBorder } from '@/components/ui/shine-border';

export type OnboardingProps = {
  onImport: () => Promise<void>;
};

export function OnboardingState({ onImport }: OnboardingProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="dark:bg-white/[0.02] bg-white/40 border dark:border-white/[0.06] border-black/[0.06] rounded-2xl p-8 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="flex flex-col items-center gap-6">
          <img
            src="/openfire-icon.svg"
            alt="OpenFire"
            className="h-20 w-20 rounded-2xl animate-float drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          />
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">Welcome to OpenFire</h2>
            <p className="max-w-md text-muted-foreground">
              Browse, query, and manage your Firestore databases locally.
            </p>
          </div>
          <div className="space-y-3 text-center">
            <ShineBorder>
              <Button onClick={onImport} size="lg" className="w-full">
                Import service account
              </Button>
            </ShineBorder>
            <p className="max-w-sm text-xs text-muted-foreground">
              Import a Google Service Account JSON to get started. Your credentials are stored on this
              device and never leave this machine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
