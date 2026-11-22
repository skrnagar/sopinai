import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { StatusText } from '../components/ui/EditorialPrimitives';

interface ContactPageProps {
  queryString?: string;
}

const VALID_TOPICS = [
  'Design Partner Access',
  'Developer Preview & SDK',
  'SONIL Group Enterprise',
  'Protocol & Partnership',
];

export const ContactPage: React.FC<ContactPageProps> = ({ queryString }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [topic, setTopic] = useState('Design Partner Access');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');
  const [referenceId, setReferenceId] = useState('');

  useEffect(() => {
    const raw = queryString ?? (typeof window !== 'undefined' ? window.location.search : '');
    if (!raw) return;
    const params = new URLSearchParams(raw);
    const paramTopic = params.get('topic');
    if (paramTopic && VALID_TOPICS.includes(paramTopic)) {
      setTopic(paramTopic);
    }
  }, [queryString]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!name.trim()) {
      setStatus('error');
      setErrorText('Please provide your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error');
      setErrorText('Please enter a valid work or personal email address.');
      return;
    }
    if (message.trim().length < 15) {
      setStatus('error');
      setErrorText('Please include a brief summary of your inquiry or technical use case (at least 15 characters).');
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          organization: organization.trim(),
          topic,
          message: message.trim(),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        referenceId?: string;
        error?: string;
      };
      if (!response.ok) {
        setStatus('error');
        setErrorText(payload.error || 'Unable to submit inquiry right now. Please try again or email hello@sopin.ai.');
        return;
      }
      setReferenceId(payload.referenceId || '');
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorText('Network error while submitting your inquiry. Please verify connectivity or write to hello@sopin.ai.');
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setOrganization('');
    setMessage('');
    setReferenceId('');
    setStatus('idle');
    setErrorText('');
  };

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#05070E]/[0.08] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#05070E] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['Contact SOPIN', 'SONIL Group', 'sopin.ai']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] dark:text-white text-balance">
              Connect with the SOPIN team.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              Reach out regarding Developer Preview access, architecture reviews, MCP/A2A integrations, or enterprise collaboration with the SONIL Group.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#FBF7F0] dark:bg-[#0A1226]/40">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          <div className="lg:col-span-5 space-y-6 min-w-0">
            <div className="rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#05070E] p-6 sm:p-7 space-y-4 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              <h2 className="font-display text-lg font-semibold text-[#05070E] dark:text-white">
                Direct Channels
              </h2>
              <div className="space-y-3 text-sm text-[#5E5E6E] dark:text-[#B5B5C5]">
                <div>
                  <div className="font-medium text-[#05070E] dark:text-white">Platform &amp; Preview Inquiries</div>
                  <div>hello@sopin.ai</div>
                </div>
                <div>
                  <div className="font-medium text-[#05070E] dark:text-white">Security &amp; Trust Disclosures</div>
                  <div>security@sopin.ai</div>
                </div>
                <div>
                  <div className="font-medium text-[#05070E] dark:text-white">Parent Organization</div>
                  <div>SONIL Group · Global AI Infrastructure</div>
                </div>
                <div>
                  <div className="font-medium text-[#05070E] dark:text-white">Engineering Routing</div>
                  <div>Inquiries are validated and routed directly to the SOPIN platform and enterprise onboarding queue.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 min-w-0">
            <div className="rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#05070E] p-6 sm:p-8 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              {status === 'success' ? (
                <div className="py-6 text-center space-y-4" role="status">
                  <CheckCircle2 className="w-10 h-10 text-[#2563EB] mx-auto" aria-hidden="true" />
                  <h2 className="font-display text-2xl font-semibold text-[#05070E] dark:text-white">
                    Inquiry Received
                  </h2>
                  <p className="text-sm text-[#5E5E6E] dark:text-[#B5B5C5] max-w-md mx-auto leading-relaxed">
                    Thank you, {name}. Your {topic.toLowerCase()} note for {organization || 'your team'} has been logged cleanly for the SOPIN &amp; SONIL Group team.
                  </p>
                  {referenceId && (
                    <div className="inline-block font-mono text-xs px-3 py-1 rounded-md bg-[#FBF7F0] dark:bg-[#0A1226] text-[#2563EB] dark:text-[#7EC8FF]">
                      Reference ID: {referenceId}
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors"
                    >
                      Submit Another Note
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {status === 'error' && errorText && (
                    <div
                      role="alert"
                      className="rounded-lg border border-[#60A5FA]/40 bg-[#60A5FA]/10 px-4 py-3 flex items-center gap-2.5 text-sm text-[#05070E] dark:text-white"
                    >
                      <AlertCircle className="w-4 h-4 text-[#60A5FA] shrink-0" aria-hidden="true" />
                      <span>{errorText}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-semibold text-[#05070E] dark:text-white mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#FBF7F0] dark:bg-[#0A1226] text-base sm:text-sm text-[#05070E] dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-semibold text-[#05070E] dark:text-white mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#FBF7F0] dark:bg-[#0A1226] text-base sm:text-sm text-[#05070E] dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-org" className="block text-xs font-semibold text-[#05070E] dark:text-white mb-1.5">
                        Organization (Optional)
                      </label>
                      <input
                        id="contact-org"
                        type="text"
                        autoComplete="organization"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Organization name"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#FBF7F0] dark:bg-[#0A1226] text-base sm:text-sm text-[#05070E] dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-topic" className="block text-xs font-semibold text-[#05070E] dark:text-white mb-1.5">
                        Inquiry Topic
                      </label>
                      <select
                        id="contact-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#FBF7F0] dark:bg-[#0A1226] text-base sm:text-sm text-[#05070E] dark:text-white"
                      >
                        {VALID_TOPICS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-[#05070E] dark:text-white mb-1.5">
                      Technical Context or Inquiry
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the agent workflows, tools, or governance requirements you are exploring..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#FBF7F0] dark:bg-[#0A1226] text-base sm:text-sm text-[#05070E] dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>{status === 'submitting' ? 'Sending...' : 'Send Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
