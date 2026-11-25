import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../support/harness.jsx';

it.skip('shows the error next to the empty username field', async () => {
  const { user } = await renderApp('/login', { as: null });
  await user.click(screen.getByRole('button', { name: 'Sign In' }));

  const username = screen.getByLabelText('Username');
  expect(username).toHaveAttribute('aria-invalid', 'true');
  expect(username).toHaveAccessibleDescription(/required/i);
});
