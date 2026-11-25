import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../support/harness.jsx';

describe('results', () => {
  it("lists student1's three results", async () => {
    await renderApp('/results');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByRole('link', { name: 'Grade 10 ELA Practice' })).toHaveAttribute('href', '/results/2');
    expect(within(table).getByText('7 of 10 (70%)')).toBeInTheDocument();
  });

  it('shows one result with the score and each question', async () => {
    const { user } = await renderApp('/results/2');
    expect(await screen.findByRole('heading', { name: 'Grade 10 ELA Practice' })).toBeInTheDocument();
    expect(screen.getByText(/Score: 7 of 10 \(70%\)/)).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(11);
    await user.click(screen.getByRole('button', { name: 'Incorrect' }));
    expect(within(table).getAllByRole('row')).toHaveLength(4);
  });

  it('has an empty state for a student with no results', async () => {
    await renderApp('/results', { as: 'student3' });
    expect(await screen.findByText(/You have no results yet/)).toBeInTheDocument();
  });
});
