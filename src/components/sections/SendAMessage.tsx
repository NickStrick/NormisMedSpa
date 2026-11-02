'use client';

import { useRef, useState } from 'react';
import { useSite } from '@/context/SiteContext';
import AnimatedSection from '@/components/AnimatedSection';
import type { SendAMessageSection, SendAMessageField } from '@/types/site';
import { resolveAssetUrl } from '@/lib/assetUrl';

type FieldValues = Record<string, string>;

function validate(fields: SendAMessageField[], values: FieldValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const val = (values[f.id] ?? '').trim();
    if (f.required && !val) {
      errors[f.id] = `${f.label} is required.`;
    } else if (f.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      errors[f.id] = 'Enter a valid email address.';
    }
  }
  return errors;
}

const inputBase =
  'w-full rounded-xl border border-[var(--bg-2)] bg-[var(--bg)] px-4 py-3 text-[var(--text-1)] placeholder:text-[var(--text-1)]/40 outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30';

const inputError =
  'border-red-500 focus:border-red-500 focus:ring-red-500/20';

export default function SendAMessage(props: SendAMessageSection) {
  const {
    id,
    title,
    subtitle,
    description,
    fields,
    steps,
    submitLabel = 'Send Message',
    successTitle = "We'll be in touch!",
    successMessage = "Your message has been received. We'll get back to you shortly.",
    recipientEmail,
    submission,
    backgroundClass,
    backgroundUrl,
    overlayOpacity = 50,
  } = props;

  const resolvedBackgroundUrl = resolveAssetUrl(backgroundUrl);
  const hasBg = !!resolvedBackgroundUrl;

  const { config } = useSite();
  const sectionRef = useRef<HTMLElement>(null);
  const [values, setValues] = useState<FieldValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  // Multi-step: with 2+ steps only the current step's fields show, with Back / Next.
  const stepCount = Math.max(1, steps?.length ?? 0);
  const isMultiStep = stepCount > 1;
  const stepOf = (f: SendAMessageField) => Math.min(Math.max(f.step ?? 0, 0), stepCount - 1);
  const [stepIndex, setStepIndex] = useState(0);
  const isLastStep = stepIndex >= stepCount - 1;
  const visibleFields = isMultiStep ? fields.filter((f) => stepOf(f) === stepIndex) : fields;
  const stepTitle = steps?.[stepIndex]?.title;

  function scrollToSection() {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setValue(fieldId: string, val: string) {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) setErrors((prev) => ({ ...prev, [fieldId]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Not on the last step yet: check this step's fields, then advance.
    if (!isLastStep) {
      const stepErrs = validate(visibleFields, values);
      if (Object.keys(stepErrs).length) { setErrors(stepErrs); return; }
      setStepIndex((i) => i + 1);
      return;
    }

    const errs = validate(fields, values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Jump back to the first step that still has a problem
      const firstBad = fields.find((f) => errs[f.id]);
      if (isMultiStep && firstBad) setStepIndex(stepOf(firstBad));
      return;
    }

    setStatus('loading');
    setServerError(null);

    try {
      const mode = submission?.type ?? 'resend';

      if (mode === 'googleForm' && submission?.type === 'googleForm') {
        // Convert viewform URL → formResponse URL
        const formResponseUrl = submission.formUrl
          .replace('/viewform', '/formResponse')
          .split('?')[0]; // strip any query params

        const body = new URLSearchParams();
        for (const field of fields) {
          const entryId = submission.fieldMap[field.id];
          if (entryId) body.append(entryId, values[field.id] ?? '');
        }

        // no-cors: response is opaque — we can't read it, so we assume success
        await fetch(formResponseUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
        setStatus('success');
        scrollToSection();

      } else {
        // Resend path
        const toEmail =
          (submission?.type === 'resend' ? submission.recipientEmail : undefined) ||
          recipientEmail ||
          config?.settings?.payments?.supportEmail ||
          config?.settings?.general?.businessNotificationEmail ||
          '';

        const payload = {
          recipientEmail: toEmail,
          subject: title ?? 'New website inquiry',
          senderName: values['name'] ?? values['customer-name'] ?? undefined,
          fields: fields.map((f) => ({ label: f.label, value: values[f.id] ?? '' })),
        };

        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        setStatus('success');
        scrollToSection();
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      className={[
        'section relative',
        hasBg ? 'bg-cover bg-center bg-fixed' : '',
        backgroundClass ?? '',
      ].join(' ')}
      style={hasBg ? { backgroundImage: `url(${resolvedBackgroundUrl})` } : undefined}
    >
      {hasBg && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}
          aria-hidden
        />
      )}

      <div className={['relative z-10 mx-auto max-w-3xl', hasBg ? 'text-white' : ''].join(' ')}>

        {/* Heading */}
        {(title || subtitle) && (
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-10">
            {title && <h2 className="text-4xl md:text-5xl font-extrabold">{title}</h2>}
            {subtitle && <p className={['mt-3 h-hero-p', hasBg ? 'text-white/95' : 'text-muted'].join(' ')}>{subtitle}</p>}
          </AnimatedSection>
        )}

        {description && (
          <AnimatedSection>
            <p className={["text-center mb-8 -mt-4 h-hero-p", hasBg ? 'text-white/95' : 'text-muted'].join(' ')}>
              {description}
            </p>
          </AnimatedSection>
        )}

        {/* Success state */}
        {status === 'success' ? (
          <AnimatedSection>
            {/* .card defaults to --text-2 (inverted), which is unreadable on light card backgrounds */}
            <div className="card  card-outline rounded-2xl p-10 text-center space-y-4 !text-[var(--text-1)]">
              <div className="text-5xl">✓</div>
              <h3 className="text-2xl font-bold">{successTitle}</h3>
              <p className="text-muted">{successMessage}</p>
              <button
                className="btn btn-inverted mt-2 justify-center"
                onClick={() => { setStatus('idle'); setValues({}); setStepIndex(0); }}
              >
                Send another message
              </button>
            </div>
          </AnimatedSection>
        ) : (
          <AnimatedSection>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="card card-lg !max-w-[90vw] card-outline rounded-2xl p-6 md:p-8 space-y-5"
            >
              {isMultiStep && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-[var(--text-1)]">
                    <span>{stepTitle || `Step ${stepIndex + 1}`}</span>
                    <span className="text-muted font-normal">Step {stepIndex + 1} of {stepCount}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${((stepIndex + 1) / stepCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {visibleFields.map((field) => (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-semibold mb-1.5 text-[var(--text-1)]"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.id}
                      rows={4}
                      className={[inputBase, 'resize-y', errors[field.id] ? inputError : ''].join(' ')}
                      placeholder={field.placeholder}
                      value={values[field.id] ?? ''}
                      onChange={(e) => setValue(field.id, e.target.value)}
                    />
                  ) : field.type === 'select' && field.options?.length ? (
                    <select
                      id={field.id}
                      className={[inputBase, errors[field.id] ? inputError : ''].join(' ')}
                      value={values[field.id] ?? ''}
                      onChange={(e) => setValue(field.id, e.target.value)}
                    >
                      <option value="">Select…</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.id}
                      type={field.type === 'phone' ? 'tel' : field.type}
                      className={[inputBase, errors[field.id] ? inputError : ''].join(' ')}
                      placeholder={field.placeholder}
                      value={values[field.id] ?? ''}
                      onChange={(e) => setValue(field.id, e.target.value)}
                    />
                  )}

                  {errors[field.id] && (
                    <p className="text-red-500 text-xs mt-1.5">{errors[field.id]}</p>
                  )}
                </div>
              ))}

              {serverError && (
                <p className="text-red-500 text-sm">{serverError}</p>
              )}

              <div className="flex gap-3 mt-2">
                {isMultiStep && stepIndex > 0 && (
                  <button
                    type="button"
                    className="btn btn-inverted flex-1 py-3 text-base font-semibold justify-center"
                    onClick={() => { setErrors({}); setStepIndex((i) => i - 1); }}
                    disabled={status === 'loading'}
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary flex-1 w-full py-3 text-base font-semibold justify-center btn-gradient"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Sending…' : isLastStep ? submitLabel : 'Next'}
                </button>
              </div>
            </form>
          </AnimatedSection>
        )}

      </div>
    </section>
  );
}
