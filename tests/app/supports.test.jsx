import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../support/harness.jsx';

describe('my supports', () => {
  it("shows student2's saved supports", async () => {
    await renderApp('/supports', { as: 'student2' });
    expect(await screen.findByLabelText('Parent email for reports')).toHaveValue('jordan.parent@example.com');
    expect(screen.getByLabelText('Default')).toBeChecked();
  });

  it('saves a change', async () => {
    const { user, agent } = await renderApp('/supports');
    await user.click(await screen.findByLabelText('Large'));
    await user.click(screen.getByLabelText('Cream'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Your supports are saved.')).toBeInTheDocument();
    const saved = (await agent.get('/api/supports')).body;
    expect(saved).toMatchObject({ fontSize: 'large', readingColour: 'cream' });
  });

  it('turns a support on with a click', async () => {
    const { user, agent } = await renderApp('/supports');
    await screen.findByText('Magnifier');
    await user.click(screen.getByText('Magnifier'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Your supports are saved.');
    expect((await agent.get('/api/supports')).body.magnifier).toBe(true);
  });
});
