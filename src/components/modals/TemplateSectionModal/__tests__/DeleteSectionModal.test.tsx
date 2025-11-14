import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteSectionModal from '../DeleteSectionModal';

jest.mock('@/ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, variant, className }: any) => (
    <button disabled={disabled} data-variant={variant} onClick={onClick} className={className}>
      {loading ? 'Loading…' : children}
    </button>
  )
}));

// Minimal BaseModal mock to avoid portal complexity
jest.mock('../../_shared/BaseModal', () => ({
  BaseModal: ({ children, title, isOpen }: any) => (isOpen ? <div role="dialog"><div>{title}</div>{children}</div> : null)
}));

// zIndex mock
jest.mock('@/ui/zIndex', () => ({ Z_INDEX: { modalConfirm: 9999 } }));

describe('DeleteSectionModal', () => {
  test('confirm button disabled until exact title typed', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<DeleteSectionModal isOpen sectionTitle="My Section" onConfirm={onConfirm} onCancel={onCancel} />);

    const confirmButton = screen.getByRole('button', { name: /delete section/i });
    expect(confirmButton).toBeDisabled();

    const input = screen.getByLabelText(/Type the section title/i);
    await user.type(input, 'Wrong');
    expect(confirmButton).toBeDisabled();

    await user.clear(input);
    await user.type(input, 'My Section');
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('empty title path requires DELETE keyword', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(<DeleteSectionModal isOpen sectionTitle="" onConfirm={onConfirm} onCancel={() => {}} />);

    const confirmButton = screen.getByRole('button', { name: /delete section/i });
    expect(confirmButton).toBeDisabled();

    const input = screen.getByLabelText(/Type the section title/i);
    await user.type(input, 'DELETE');
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
