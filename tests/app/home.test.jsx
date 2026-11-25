import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../support/harness.jsx';

describe('home', () => {
  it('greets the student and shows the three cards', async () => {
    await renderApp('/home');
    expect(screen.getByText('Welcome back, Sam')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Practice',
      'My Results',
      'My Supports',
    ]);
    expect(screen.getByRole('link', { name: 'Start practice' })).toHaveAttribute('href', '/practice');
  });

  it('has the main navigation', async () => {
    await renderApp('/home');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    for (const name of [/Home/, /Practice/, /My Results/, /My Supports/]) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
    }
  });
});
