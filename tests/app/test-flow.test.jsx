import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { findQuestion, renderApp, renderAttempt, TESTS } from '../support/harness.jsx';

describe('taking a test', () => {
  it('goes from the directions through the questions to the review, and submits', async () => {
    const { user } = await renderApp('/practice', { as: 'student3' });
    await screen.findByText('Grade 6 Math Practice');
    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    // Grade 6 Math Practice is the third card (sorted by grade, then title).
    await user.click(startButtons[2]);
    await user.click(await screen.findByRole('button', { name: /Begin/ }));

    await findQuestion(1, 8);
    expect(screen.getByText('How much does Maya pay for the notebooks?')).toBeInTheDocument();
    await user.click(screen.getAllByRole('radio')[2]);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await findQuestion(2, 8);
    await user.click(screen.getAllByRole('radio')[1]);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await findQuestion(3, 8);

    // Jump to the last question with the question strip, then Next goes to the review.
    await user.click(screen.getByRole('button', { name: /^(question )?8(?!\d)/i }));
    await findQuestion(8, 8);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('heading', { name: 'Review your answers' })).toBeInTheDocument();
    expect(await screen.findByText(/2 of 8 answered/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('How hard was this test?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText(/Score: 2 of 8/)).toBeInTheDocument();
  });

  it('shows the passage, the question and its four options', async () => {
    await renderAttempt((id) => `/test/${id}/q/1`, { testId: TESTS.ela4 });
    await findQuestion(1, 6);
    expect(screen.getByText(/One hot day a hungry Fox/)).toBeInTheDocument();
    expect(screen.getByText('Why did the Fox jump at the wall?')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByText('He wanted to eat the grapes.')).toBeInTheDocument();
  });

  it('keeps an answer after Next and the question strip', async () => {
    const { user } = await renderAttempt((id) => `/test/${id}/q/1`);
    await findQuestion(1, 8);
    await user.click(screen.getAllByRole('radio')[3]);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await findQuestion(2, 8);
    await user.click(screen.getByRole('button', { name: /^(question )?1(?!\d)/i }));
    await findQuestion(1, 8);
    expect(screen.getAllByRole('radio')[3]).toBeChecked();
  });

  it('opens the calculator on a test that allows it', async () => {
    const { user } = await renderAttempt((id) => `/test/${id}/q/1`, { testId: TESTS.math8 });
    await findQuestion(1, 8);
    await user.click(screen.getByRole('button', { name: /Calculator/ }));
    const calculator = screen.getByRole('heading', { name: 'Calculator' }).parentElement;
    for (const key of ['7', '×', '6', '=']) await user.click(within(calculator).getByRole('button', { name: key }));
    expect(within(calculator).getByRole('status')).toHaveTextContent('42');
  });

  it('has no calculator on other tests', async () => {
    await renderAttempt((id) => `/test/${id}/q/1`, { testId: TESTS.ela4 });
    await findQuestion(1, 6);
    expect(screen.queryByRole('button', { name: /Calculator/ })).not.toBeInTheDocument();
  });
});
