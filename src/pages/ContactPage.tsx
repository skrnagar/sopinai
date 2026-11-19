import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { StatusText } from '../components/ui/EditorialPrimitives';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [topic, setTopic] = useState('Design Partner Access');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setStatus('success');
    }, 350);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setOrganization('');
    setMessage('');
    setStatus('idle');
    setErrorText('');
  };

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#101014]/[0.08] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['Contact SOPIN', 'SONIL Group', 'sopin.ai']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#101014] dark:text-white text-balance">
              Connect with the SOPIN team.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
              Reach out regarding Developer Preview access, architecture reviews, MCP/A2A integrations, or enterprise collaboration with the SONIL Group.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F7F7FA] dark:bg-[#101126]/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6 min-w-0">
            <div className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-white dark:bg-[#101014] p-7 space-y-4 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              <h2 className="font-display text-lg font-semibold text-[#101014] dark:text-white">
                Direct Channels
              </h2>
              <div className="space-y-3 text-sm text-[#777786] dark:text-[#B5B5C5]">
                <div>
                  <div className="font-medium text-[#101014] dark:text-white">Platform &amp; Preview Inquiries</div>
                  <div>hello@sopin.ai</div>
                </div>
                <div>
                  <div className="font-medium text-[#101014] dark:text-white">Parent Organization</div>
                  <div>SONIL Group · Global AI Infrastructure</div>
                </div>
                <div>
                  <div className="font-medium text-[#101014] dark:text-white">Response Scope</div>
                  <div>This prototype validates form inputs locally without transmitting data to a backend server.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 min-w-0">
            <div className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-white dark:bg-[#101014] p-7 sm:p-8 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              {status === 'success' ? (
                <div className="py-6 text-center space-y-4" role="status">
                  <CheckCircle2 className="w-10 h-10 text-[#6252E8] mx-auto" aria-hidden="true" />
                  <h2 className="font-display text-2xl font-semibold text-[#101014] dark:text-white">
                    Inquiry Ready for Review
                  </h2>
                  <p className="text-sm text-[#777786] dark:text-[#B5B5C5] max-w-md mx-auto leading-relaxed">
                    Thank you, {name}. Your {topic.toLowerCase()} note for {organization || 'your team'} passed validation in this prototype preview.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-lg bg-[#6252E8] text-white text-sm font-semibold hover:bg-[#5243d6] transition-colors"
                  >
                    Submit Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {status === 'error' && errorText && (
                    <div
                      role="alert"
                      className="rounded-lg border border-[#965BFF]/40 bg-[#965BFF]/10 px-4 py-3 flex items-center gap-2.5 text-sm text-[#101014] dark:text-white"
                    >
                      <AlertCircle className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                      <span>{errorText}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-sm text-[#101014] dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-sm text-[#101014] dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-org" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                        Organization (Optional)
                      </label>
                      <input
                        id="contact-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Organization name"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-sm text-[#101014] dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-topic" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                        Inquiry Topic
                      </label>
                      <select
                        id="contact-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-sm text-[#101014] dark:text-white"
                      >
                        <option value="Design Partner Access">Design Partner Access</option>
                        <option value="Developer Preview & SDK">Developer Preview & SDK</option>
                        <option value="SONIL Group Enterprise">SONIL Group Enterprise</option>
                        <option value="Protocol & Partnership">Protocol & Partnership</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                      Technical Context or Inquiry
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the agent workflows, tools, or governance requirements you are exploring..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-sm text-[#101014] dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>{status === 'submitting' ? 'Validating...' : 'Send Inquiry'}</span>
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
