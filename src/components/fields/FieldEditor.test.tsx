import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { FieldEditor } from '@/components/fields/FieldEditor';

describe('FieldEditor', () => {
  const defaultProps = {
    value: 'hello' as unknown,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('string editor', () => {
    it('renders text input for string values', () => {
      render(<FieldEditor {...defaultProps} value="hello" />);
      expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
    });

    it('calls onChange when text is modified', async () => {
      const user = userEvent.setup();
      render(<FieldEditor {...defaultProps} value="" />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      expect(defaultProps.onChange).toHaveBeenCalledWith('a');
    });
  });

  describe('number editor', () => {
    it('renders number input for numeric values', () => {
      render(<FieldEditor {...defaultProps} value={42} />);
      expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    });

    it('calls onChange with parsed number', async () => {
      const user = userEvent.setup();
      render(<FieldEditor {...defaultProps} value={0} />);
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '7');
      expect(defaultProps.onChange).toHaveBeenCalledWith(7);
    });
  });

  describe('boolean editor', () => {
    it('renders checkbox for boolean values', () => {
      render(<FieldEditor {...defaultProps} value={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('calls onChange with toggled value', async () => {
      const user = userEvent.setup();
      render(<FieldEditor {...defaultProps} value={true} />);
      await user.click(screen.getByRole('checkbox'));
      expect(defaultProps.onChange).toHaveBeenCalledWith(false);
    });
  });

  describe('null editor', () => {
    it('renders null display', () => {
      render(<FieldEditor {...defaultProps} value={null} />);
      const nullElements = screen.getAllByText('null');
      expect(nullElements.length).toBeGreaterThanOrEqual(1);
      // One is the type badge, one is the value display
      expect(nullElements.some((el) => el.tagName === 'SPAN')).toBe(true);
    });
  });

  describe('array/map editor', () => {
    it('renders item count for arrays', () => {
      render(<FieldEditor {...defaultProps} value={[1, 2, 3]} />);
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('renders key count for maps', () => {
      render(<FieldEditor {...defaultProps} value={{ a: 1, b: 2 }} />);
      expect(screen.getByText('2 keys')).toBeInTheDocument();
    });
  });

  describe('type selector', () => {
    it('renders type badge', () => {
      render(<FieldEditor {...defaultProps} value="hello" />);
      expect(screen.getByText('string')).toBeInTheDocument();
    });

    it('changes type and calls onChange with default value', async () => {
      const user = userEvent.setup();
      render(<FieldEditor {...defaultProps} value="hello" />);
      // Click the type badge to open dropdown
      await user.click(screen.getByText('string'));
      await user.click(screen.getByText('number'));
      expect(defaultProps.onChange).toHaveBeenCalledWith(0);
    });
  });

  describe('timestamp editor', () => {
    it('renders timestamp inputs', () => {
      render(
        <FieldEditor
          {...defaultProps}
          value={{ __type__: 'timestamp', seconds: 1000, nanos: 0 }}
        />,
      );
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });
  });

  describe('geopoint editor', () => {
    it('renders latitude and longitude inputs', () => {
      render(
        <FieldEditor
          {...defaultProps}
          value={{ __type__: 'geopoint', latitude: 40.7, longitude: -74.0 }}
        />,
      );
      expect(screen.getByDisplayValue('40.7')).toBeInTheDocument();
      expect(screen.getByDisplayValue('-74')).toBeInTheDocument();
    });
  });

  describe('reference editor', () => {
    it('renders path input', () => {
      render(
        <FieldEditor
          {...defaultProps}
          value={{ __type__: 'reference', path: 'users/doc1' }}
        />,
      );
      expect(screen.getByDisplayValue('users/doc1')).toBeInTheDocument();
    });
  });
});
