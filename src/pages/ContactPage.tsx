import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, Send, XCircle } from 'lucide-react';

const CONTACT_EMAIL = 'info@marcheagents.com';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';
type ErrorKind = 'validation' | 'config' | 'submit';

function EmailLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-semibold underline hover:text-rose-200"
    >
      {CONTACT_EMAIL}
    </a>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setStatus('error');
      setErrorKind('validation');
      return;
    }

    // Public form identifier (not a secret backend credential).
    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      setStatus('error');
      setErrorKind('config');
      return;
    }

    const form = event.currentTarget;
    // Honeypot: real visitors never see or tick this field.
    const botcheck = form.elements.namedItem(
      'botcheck',
    ) as HTMLInputElement | null;
    if (botcheck?.checked) return;

    setStatus('submitting');
    setErrorKind(null);

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: 'New MarcheAgents Website Enquiry',
          from_name: 'MarcheAgents Contact Form',
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          enquiry_subject: subject.trim(),
          message: message.trim(),
          botcheck: '',
        }),
      });
      const result = (await response.json()) as { success?: boolean };
      if (response.ok && result.success) {
        setStatus('success');
        setName('');
        setEmail('');
        setCompany('');
        setSubject('');
        setMessage('');
      } else {
        setStatus('error');
        setErrorKind('submit');
      }
    } catch {
      setStatus('error');
      setErrorKind('submit');
    }
  };

  const submitting = status === 'submitting';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-white">
        Let&rsquo;s Make Your Workload Lighter.
      </h1>
      <p className="mt-3 text-slate-400">
        Questions about MarcheAgents or our Email Support Agent demo? Or facing
        repetitive tasks and time-consuming workflows in your business?
      </p>
      <p className="mt-3 font-semibold text-slate-200">
        Tell us about your challenges and explore how AI automation could help
        — we offer a free initial consultation for businesses dealing with
        repetitive, time-consuming or complex workflows.
      </p>
      <p className="mt-4 text-sm text-slate-400">
        Serving businesses across Australia, the USA, the UK and Europe ·
        Remote consultations available
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 space-y-5 rounded-xl border border-slate-800 bg-slate-900/50 p-6"
        data-testid="contact-form"
      >
        {/* Honeypot field for spam protection — hidden from real visitors. */}
        <input
          type="checkbox"
          name="botcheck"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          style={{ display: 'none' }}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contact-name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Name <span aria-hidden className="text-rose-400">*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="contact-email"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Email <span aria-hidden className="text-rose-400">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contact-company"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Company
          </label>
          <input
            id="contact-company"
            name="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Your company (optional)"
            autoComplete="organization"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="contact-subject"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Subject <span aria-hidden className="text-rose-400">*</span>
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What is this about?"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Message <span aria-hidden className="text-rose-400">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how we can help…"
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </div>

        {/* Submission status */}
        <div aria-live="polite">
          {status === 'success' && (
            <div
              className="flex items-start gap-2 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 text-sm text-emerald-300"
              data-testid="contact-confirmation"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                Thank you for contacting MarcheAgents! Your message has been
                sent successfully. We&rsquo;ll get back to you as soon as
                possible.
              </p>
            </div>
          )}
          {status === 'error' && errorKind && (
            <div
              className="flex items-start gap-2 rounded-lg border border-rose-800/40 bg-rose-950/20 p-3 text-sm text-rose-300"
              role="alert"
              data-testid="contact-error"
            >
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                {errorKind === 'validation' && (
                  <>Please fill in all required fields.</>
                )}
                {errorKind === 'config' && (
                  <>
                    The contact form is not configured yet. Please email{' '}
                    <EmailLink /> directly.
                  </>
                )}
                {errorKind === 'submit' && (
                  <>
                    Sorry, we couldn&rsquo;t send your message. Please try
                    again or email <EmailLink /> directly.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <p className="flex items-start gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Your enquiry is securely submitted through Web3Forms and delivered to
          MarcheAgents. Your information is used only to respond to your
          enquiry.
        </p>
      </form>
    </div>
  );
}
