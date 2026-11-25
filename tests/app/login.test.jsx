import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../support/harness.jsx';

describe('login', () => {
  it('goes to the home page after sign-in', async () => {
    const { user } = await renderApp('/login', { as: null });
    await user.type(screen.getByLabelText('Username'), 'student1');
    await user.type(screen.getByLabelText('Password'), 'practice1');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Welcome back, Sam')).toBeInTheDocument();
  });

  it('shows the error from the API for a wrong password', async () => {
    const { user } = await renderApp('/login', { as: null });
    await user.type(screen.getByLabelText('Username'), 'student1');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('The username or password is not correct.')).toBeInTheDocument();
    expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument();
  });

  it('sends a signed-out visitor to the login page', async () => {
    await renderApp('/practice', { as: null });
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('keeps the login form markup the same', async () => {
    const { container } = await renderApp('/login', { as: null });
    expect(container.querySelector('form')).toMatchSnapshot();
  });
});

describe('sign out', () => {
  it('goes back to the login page', async () => {
    const { user } = await renderApp('/home');
    await user.click(screen.getByRole('button', { name: /Sign Out/ }));
    expect(await screen.findByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });
});
