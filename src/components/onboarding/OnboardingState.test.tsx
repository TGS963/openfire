import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingState } from './OnboardingState';

describe('OnboardingState', () => {
  const setup = (over: Partial<Parameters<typeof OnboardingState>[0]> = {}) => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    const onConnectEmulator = vi.fn();
    render(
      <OnboardingState onImport={onImport} onConnectEmulator={onConnectEmulator} {...over} />,
    );
    return { onImport, onConnectEmulator };
  };

  it('renders the heading and body', () => {
    setup();
    expect(screen.getByText('Connect a Firestore project')).toBeInTheDocument();
    expect(screen.getByText(/never leave it/i)).toBeInTheDocument();
  });

  it('renders both actions with titles and subs', () => {
    setup();
    expect(screen.getByText('Import service account JSON')).toBeInTheDocument();
    expect(screen.getByText(/Recommended/i)).toBeInTheDocument();
    expect(screen.getByText('Connect to local emulator')).toBeInTheDocument();
    expect(screen.getByText(/localhost:8080/i)).toBeInTheDocument();
  });

  it('calls onImport when the primary action is clicked', async () => {
    const user = userEvent.setup();
    const { onImport } = setup();
    await user.click(screen.getByRole('button', { name: /Import service account JSON/i }));
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('calls onConnectEmulator when the secondary action is clicked', async () => {
    const user = userEvent.setup();
    const { onConnectEmulator } = setup();
    await user.click(screen.getByRole('button', { name: /Connect to local emulator/i }));
    expect(onConnectEmulator).toHaveBeenCalledTimes(1);
  });

  it('renders the restore-from-backup footer link', () => {
    setup();
    expect(screen.getByText(/Restore from backup/i)).toBeInTheDocument();
  });

  it('invokes onRestoreBackup when provided and clicked', async () => {
    const user = userEvent.setup();
    const onRestoreBackup = vi.fn();
    setup({ onRestoreBackup });
    await user.click(screen.getByText(/Restore from backup/i));
    expect(onRestoreBackup).toHaveBeenCalledTimes(1);
  });
});
