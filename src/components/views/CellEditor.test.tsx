import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/firestore', () => ({
  useCollections: () => ({ data: { collectionIds: ['users', 'posts'], nextPageToken: null }, isLoading: false }),
}));

import { CellEditor } from '@/components/views/CellEditor';

describe('CellEditor', () => {
  describe('string', () => {
    it('commits the typed value on Enter', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<CellEditor value="Ada" type="string" onCommit={onCommit} onCancel={vi.fn()} />);
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Ada Lovelace{Enter}');
      expect(onCommit).toHaveBeenCalledWith('Ada Lovelace');
    });

    it('cancels on Escape', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<CellEditor value="Ada" type="string" onCommit={vi.fn()} onCancel={onCancel} />);
      await user.keyboard('{Escape}');
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('number', () => {
    it('commits a parsed number on Enter', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<CellEditor value={1} type="number" onCommit={onCommit} onCancel={vi.fn()} />);
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, '42{Enter}');
      expect(onCommit).toHaveBeenCalledWith(42);
    });

    it('rejects non-numeric input and stays open', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<CellEditor value={1} type="number" onCommit={onCommit} onCancel={vi.fn()} />);
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'abc{Enter}');
      expect(onCommit).not.toHaveBeenCalled();
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('boolean', () => {
    it('renders true/false segments and commits the selected value', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<CellEditor value={false} type="boolean" onCommit={onCommit} onCancel={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: 'true' }));
      await user.keyboard('{Enter}');
      expect(onCommit).toHaveBeenCalledWith(true);
    });
  });

  it('renders the floating tip with type label and kbd hints', () => {
    render(<CellEditor value="" type="string" onCommit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByText('save')).toBeInTheDocument();
    expect(screen.getByText('cancel')).toBeInTheDocument();
  });

  describe('timestamp', () => {
    it('round-trips a timestamp value on Enter', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const initial = { __type__: 'timestamp', seconds: 1_700_000_000, nanos: 0 };
      render(<CellEditor value={initial} type="timestamp" onCommit={onCommit} onCancel={vi.fn()} />);
      const timeInput = screen.getByLabelText('time') as HTMLInputElement;
      // change to 12:34
      await user.clear(timeInput);
      await user.type(timeInput, '12:34');
      await user.keyboard('{Enter}');
      expect(onCommit).toHaveBeenCalledTimes(1);
      const payload = onCommit.mock.calls[0][0];
      expect(payload.__type__).toBe('timestamp');
      expect(typeof payload.seconds).toBe('number');
      expect(payload.nanos).toBe(0);
    });

    it('cancels on Escape without committing', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const onCancel = vi.fn();
      const initial = { __type__: 'timestamp', seconds: 1_700_000_000, nanos: 0 };
      render(<CellEditor value={initial} type="timestamp" onCommit={onCommit} onCancel={onCancel} />);
      await user.keyboard('{Escape}');
      expect(onCancel).toHaveBeenCalled();
      expect(onCommit).not.toHaveBeenCalled();
    });
  });

  describe('reference', () => {
    it('commits a reference shape on Enter', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<CellEditor value={{ __type__: 'reference', path: '' }} type="reference" onCommit={onCommit} onCancel={vi.fn()} />);
      const input = screen.getByPlaceholderText('collection/document');
      await user.type(input, 'users/abc');
      await user.keyboard('{Enter}');
      expect(onCommit).toHaveBeenCalledWith({ __type__: 'reference', path: 'users/abc' });
    });

    it('cancels on Escape without committing', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const onCancel = vi.fn();
      render(<CellEditor value={{ __type__: 'reference', path: 'users/abc' }} type="reference" onCommit={onCommit} onCancel={onCancel} />);
      await user.keyboard('{Escape}');
      expect(onCancel).toHaveBeenCalled();
      expect(onCommit).not.toHaveBeenCalled();
    });
  });

  describe('geopoint', () => {
    it('commits latitude/longitude on Enter', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<CellEditor value={{ __type__: 'geopoint', latitude: 0, longitude: 0 }} type="geopoint" onCommit={onCommit} onCancel={vi.fn()} />);
      const lat = screen.getByLabelText('latitude');
      const lng = screen.getByLabelText('longitude');
      await user.clear(lat);
      await user.type(lat, '37.5');
      await user.clear(lng);
      await user.type(lng, '-122.1');
      await user.keyboard('{Enter}');
      expect(onCommit).toHaveBeenCalledWith({ __type__: 'geopoint', latitude: 37.5, longitude: -122.1 });
    });

    it('cancels on Escape without committing', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const onCancel = vi.fn();
      render(<CellEditor value={{ __type__: 'geopoint', latitude: 1, longitude: 2 }} type="geopoint" onCommit={onCommit} onCancel={onCancel} />);
      await user.keyboard('{Escape}');
      expect(onCancel).toHaveBeenCalled();
      expect(onCommit).not.toHaveBeenCalled();
    });
  });
});
