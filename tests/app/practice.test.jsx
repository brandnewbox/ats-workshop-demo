import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../support/harness.jsx';

const cardTitles = () =>
  screen
    .getAllByRole('button', { name: 'Start' })
    .map((button) => button.closest('li').querySelector('h1, h2, h3, h4, h5, h6').textContent);

describe('practice', () => {
  it('lists all 8 practice tests', async () => {
    await renderApp('/practice');
    expect(await screen.findByText('Grade 10 ELA Practice')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Start' })).toHaveLength(8);
  });

  it('filters by subject and by grade', async () => {
    const { user } = await renderApp('/practice');
    await screen.findByText('Grade 10 ELA Practice');
    await user.click(screen.getByRole('button', { name: 'Math' }));
    expect(cardTitles()).toEqual(['Grade 6 Math Practice', 'Grade 8 Math Practice']);
    await user.click(screen.getByRole('button', { name: 'Grade 8' }));
    expect(cardTitles()).toEqual(['Grade 8 Math Practice']);
    await user.click(screen.getByRole('button', { name: 'All subjects' }));
    expect(cardTitles()).toEqual(['Grade 8 Math Practice', 'Grade 8 Science Practice']);
  });

  it('starts a test and shows the directions', async () => {
    const { user } = await renderApp('/practice');
    await screen.findByText('Grade 10 ELA Practice');
    await user.click(screen.getAllByRole('button', { name: 'Start' })[0]);
    expect(await screen.findByRole('heading', { name: 'Directions' })).toBeInTheDocument();
    expect(await screen.findByText(/Grade 4 ELA Practice: 6 questions/)).toBeInTheDocument();
  });
});
