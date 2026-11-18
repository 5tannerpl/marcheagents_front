import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactPage } from './ContactPage';

const TEST_KEY = 'test-access-key';

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/name/i), 'Jane Doe');
  await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/subject/i), 'Workflow automation');
  await user.type(screen.getByLabelText(/message/i), 'Please help us.');
}

describe('ContactPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', TEST_KEY);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('submits via Web3Forms JSON API and shows the success message', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(<ContactPage />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(
      await screen.findByTestId('contact-confirmation'),
    ).toHaveTextContent('Thank you for contacting MarcheAgents!');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.web3forms.com/submit');
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body).toMatchObject({
      access_key: TEST_KEY,
      subject: 'New MarcheAgents Website Enquiry',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Please help us.',
    });

    // Form resets only after confirmed success
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/message/i)).toHaveValue('');
  });

  it('shows the failure message and keeps input when submission fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    render(<ContactPage />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByTestId('contact-error')).toHaveTextContent(
      /Sorry, we couldn’t send your message/,
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Doe');
  });

  it('shows a validation error and does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<ContactPage />);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByTestId('contact-error')).toHaveTextContent(
      'Please fill in all required fields.',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows a configuration error and does not submit when the access key is missing', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', '');
    const user = userEvent.setup();
    render(<ContactPage />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByTestId('contact-error')).toHaveTextContent(
      /not configured yet/,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('disables the button while submitting and prevents duplicate submissions', async () => {
    let resolveFetch: (response: Response) => void = () => {};
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<ContactPage />);
    await fillRequiredFields(user);

    const button = screen.getByRole('button', { name: /send message/i });
    await user.click(button);

    const sending = screen.getByRole('button', { name: /sending/i });
    expect(sending).toBeDisabled();
    expect(fetch).toHaveBeenCalledTimes(1);

    resolveFetch(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('contact-confirmation')).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).toBeEnabled();
  });
});
