'use client';

import { Fragment, useCallback, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faChevronUp, faChevronDown, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import type { SendAMessageSection, SendAMessageField, SendAMessageFieldType, SendAMessageStep } from '@/types/site';
import type { EditorProps } from './types';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function newField(): SendAMessageField {
  return { id: `field-${Math.random().toString(36).slice(2, 7)}`, label: '', type: 'text' };
}

const FIELD_TYPES: { value: SendAMessageFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select (dropdown)' },
];

export default function EditSendAMessage({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<SendAMessageSection>) {
  const set = useCallback(
    <K extends keyof SendAMessageSection>(key: K, value: SendAMessageSection[K]) =>
      onChange({ ...section, [key]: value }),
    [onChange, section]
  );

  const fields = section.fields ?? [];
  const submission = section.submission;
  const submissionType = submission?.type ?? 'resend';

  // ── Submission helpers ──────────────────────────────────────────────────────

  function setSubmissionType(type: 'resend' | 'googleForm') {
    if (type === 'resend') {
      onChange({ ...section, submission: { type: 'resend' } });
    } else {
      onChange({
        ...section,
        submission: {
          type: 'googleForm',
          formUrl: submission?.type === 'googleForm' ? submission.formUrl : '',
          fieldMap: submission?.type === 'googleForm' ? submission.fieldMap : {},
        },
      });
    }
  }

  function setResendEmail(email: string) {
    onChange({ ...section, submission: { type: 'resend', recipientEmail: email } });
  }

  function setGoogleFormUrl(url: string) {
    if (submission?.type !== 'googleForm') return;
    onChange({ ...section, submission: { ...submission, formUrl: url } });
  }

  function setFieldMapEntry(fieldId: string, entryId: string) {
    if (submission?.type !== 'googleForm') return;
    onChange({
      ...section,
      submission: {
        ...submission,
        fieldMap: { ...submission.fieldMap, [fieldId]: entryId },
      },
    });
  }

  // ── Steps helpers ───────────────────────────────────────────────────────────
  // A form always has at least one step; with only one it renders as a single page.

  const steps: SendAMessageStep[] = section.steps?.length ? section.steps : [{}];
  const stepCount = steps.length;
  const stepOf = (f: SendAMessageField) => Math.min(Math.max(f.step ?? 0, 0), stepCount - 1);

  function addStep() {
    onChange({ ...section, steps: [...steps, { title: '' }] });
  }

  function updateStep(s: number, patch: Partial<SendAMessageStep>) {
    onChange({ ...section, steps: steps.map((st, i) => (i === s ? { ...st, ...patch } : st)) });
  }

  // Removing a step moves its fields into the previous step (or the next one, for step 1).
  function removeStep(s: number) {
    if (stepCount <= 1) return;
    const nextFields = fields.map((f) => {
      const fs = stepOf(f);
      if (fs === s) return { ...f, step: Math.max(s - 1, 0) };
      if (fs > s) return { ...f, step: fs - 1 };
      return f;
    });
    onChange({ ...section, steps: steps.filter((_, i) => i !== s), fields: nextFields });
  }

  // ── Fields list helpers ─────────────────────────────────────────────────────

  const addField = (step: number) => {
    onChange({ ...section, fields: [...fields, { ...newField(), step }] });
  };

  const removeField = useCallback(
    (idx: number) => onChange({ ...section, fields: fields.filter((_, i) => i !== idx) }),
    [fields, onChange, section]
  );

  // Move field `from` into `toStep`, placed before field `before` (or at the end of the step when null).
  const moveField = (from: number, toStep: number, before: number | null) => {
    const next = deepClone(fields);
    const item = { ...next[from], step: toStep };
    next.splice(from, 1);
    let at: number;
    if (before === null) {
      const lastInStep = next.reduce((acc, f, i) => (stepOf(f) === toStep ? i : acc), -1);
      at = lastInStep === -1 ? next.length : lastInStep + 1;
    } else {
      at = before > from ? before - 1 : before;
    }
    next.splice(at, 0, item);
    onChange({ ...section, fields: next });
  };

  // ── Drag & drop (drag a field by its grip onto another field or a step box) ──

  const dragFromRef = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ step: number; before: number | null } | null>(null);

  const clearDrag = () => {
    dragFromRef.current = null;
    setDraggingIdx(null);
    setDropTarget(null);
  };

  const aimAt = (e: React.DragEvent, step: number, before: number | null) => {
    if (dragFromRef.current === null) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget?.step !== step || dropTarget?.before !== before) setDropTarget({ step, before });
  };

  const dropAt = (e: React.DragEvent, step: number, before: number | null) => {
    if (dragFromRef.current === null) return;
    e.preventDefault();
    e.stopPropagation();
    const from = dragFromRef.current;
    clearDrag();
    if (before !== from) moveField(from, step, before);
  };

  const updateField = useCallback(
    (idx: number, patch: Partial<SendAMessageField>) => {
      const next = deepClone(fields);
      next[idx] = { ...next[idx], ...patch } as SendAMessageField;
      onChange({ ...section, fields: next });
    },
    [fields, onChange, section]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Section text ── */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input className="input w-full" value={section.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="Send Us a Message" />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input className="input w-full" value={section.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} placeholder="Short tagline" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea className="textarea w-full" rows={2} value={section.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Optional paragraph above the form" />
      </div>

      {/* ── Button / success text ── */}
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Submit button label</label>
          <input className="input w-full" value={section.submitLabel ?? ''} onChange={(e) => set('submitLabel', e.target.value)} placeholder="Send Message" />
        </div>
        <div>
          <label className="block text-sm font-medium">Success title</label>
          <input className="input w-full" value={section.successTitle ?? ''} onChange={(e) => set('successTitle', e.target.value)} placeholder="We'll be in touch!" />
        </div>
        <div>
          <label className="block text-sm font-medium">Success message</label>
          <input className="input w-full" value={section.successMessage ?? ''} onChange={(e) => set('successMessage', e.target.value)} placeholder="Your message has been received." />
        </div>
      </div>

      {/* ── Background ── */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Background image URL</label>
          <div className="flex gap-2">
            <input className="input flex-1" value={section.backgroundUrl ?? ''} onChange={(e) => set('backgroundUrl', e.target.value || undefined)} placeholder="Leave blank for none" />
            <button
              type="button"
              className="btn btn-inverted"
              onClick={async () => {
                const picked = await openMediaPicker(`configs/${siteId}/assets/`);
                if (picked) set('backgroundUrl', picked);
              }}
            >Pick…</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Overlay opacity ({section.overlayOpacity ?? 50}%)</label>
          <input
            type="range" min={0} max={100}
            className="w-full mt-2"
            value={section.overlayOpacity ?? 50}
            onChange={(e) => set('overlayOpacity', Number(e.target.value))}
            disabled={!section.backgroundUrl}
          />
        </div>
      </div>

      {/* ── Submission mode ── */}
      <div className="space-y-3">
        <div className="text-sm font-semibold border-b pb-1">Submission</div>
        <div>
          <label className="block text-sm font-medium">Submission type</label>
          <select
            className="select w-full max-w-xs"
            value={submissionType}
            onChange={(e) => setSubmissionType(e.target.value as 'resend' | 'googleForm')}
          >
            <option value="resend">Email (Resend)</option>
            <option value="googleForm">Google Form</option>
          </select>
        </div>

        {submissionType === 'resend' && (
          <div>
            <label className="block text-sm font-medium">Recipient email</label>
            <input
              className="input w-full max-w-sm"
              value={submission?.type === 'resend' ? (submission.recipientEmail ?? '') : (section.recipientEmail ?? '')}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Falls back to settings notification email"
            />
          </div>
        )}

        {submissionType === 'googleForm' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Google Form URL</label>
              <input
                className="input w-full"
                value={submission?.type === 'googleForm' ? submission.formUrl : ''}
                onChange={(e) => setGoogleFormUrl(e.target.value)}
                placeholder="https://docs.google.com/forms/d/e/.../formResponse"
              />
              <p className="text-xs text-muted mt-1">Use the <code>formResponse</code> URL (not viewform).</p>
            </div>

            {fields.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Field → Google Form entry ID mapping</label>
                <div className="space-y-2">
                  {fields.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm w-40 truncate text-muted flex-shrink-0">{f.label || f.id}</span>
                      <input
                        className="input flex-1"
                        placeholder="entry.123456789"
                        value={submission?.type === 'googleForm' ? (submission.fieldMap[f.id] ?? '') : ''}
                        onChange={(e) => setFieldMapEntry(f.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Form fields ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-1">
          <div className="text-sm font-semibold">Form Fields ({fields.length})</div>
          <button className="btn btn-ghost text-sm" onClick={addStep}>
            <FontAwesomeIcon icon={faPlus} className="mr-1 text-xs" />Add Step
          </button>
        </div>
        <p className="text-xs text-muted">
          Drag a field by its <FontAwesomeIcon icon={faGripVertical} className="text-xs" /> handle to reorder it or move it to another step.
          With one step the form shows as a single page.
        </p>

        {steps.map((step, s) => {
          // Global indexes of this step's fields, in display order
          const stepFieldIdxs = fields.map((_, i) => i).filter((i) => stepOf(fields[i]) === s);
          const isStepTarget = dropTarget?.step === s;
          return (
          <div
            key={s}
            className={[
              'rounded-xl border p-3 space-y-3',
              isStepTarget ? 'ring-2 ring-[var(--admin-primary)]' : '',
            ].join(' ')}
            onDragOver={(e) => aimAt(e, s, null)}
            onDrop={(e) => dropAt(e, s, null)}
          >
            {/* Step header */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold flex-shrink-0">Step {s + 1}</span>
              <input
                className="input flex-1"
                value={step.title ?? ''}
                onChange={(e) => updateStep(s, { title: e.target.value })}
                placeholder="Step title (optional), e.g. Contact info"
              />
              <button className="btn btn-ghost text-sm" onClick={() => addField(s)}>
                <FontAwesomeIcon icon={faPlus} className="mr-1 text-xs" />Add Field
              </button>
              {stepCount > 1 && (
                <button
                  className="btn btn-ghost text-red-500"
                  onClick={() => removeStep(s)}
                  title="Remove step (its fields move to the previous step)"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              )}
            </div>

            {stepFieldIdxs.length === 0 && (
              <div className="text-sm text-muted rounded-lg border border-dashed p-4 text-center">
                No fields in this step. Click &quot;Add Field&quot; or drag one here.
              </div>
            )}

        {stepFieldIdxs.map((idx, pos) => {
          const field = fields[idx];
          const isFieldTarget = dropTarget?.before === idx && draggingIdx !== idx;
          return (
          <Fragment key={idx}>
          {isFieldTarget && <div className="h-1 rounded bg-[var(--admin-primary)]" aria-hidden="true" />}
          <div
            className={['card admin-card card-solid p-4 space-y-3', draggingIdx === idx ? 'opacity-40' : ''].join(' ')}
            onDragOver={(e) => aimAt(e, s, idx)}
            onDrop={(e) => dropAt(e, s, idx)}
          >
            {/* Row header (drag handle) */}
            <div
              className="flex items-center justify-between"
              draggable
              onDragStart={(e) => {
                dragFromRef.current = idx;
                setDraggingIdx(idx);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(idx));
              }}
              onDragEnd={clearDrag}
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="cursor-grab active:cursor-grabbing text-muted" title="Drag to reorder or move to another step">
                  <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
                </span>
                {field.label || <em className="opacity-40">Untitled field</em>}
              </span>
              <div className="flex gap-1">
                <button className="btn btn-ghost" onClick={() => moveField(idx, s, stepFieldIdxs[pos - 1])} disabled={pos === 0} title="Move up">
                  <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
                </button>
                <button className="btn btn-ghost" onClick={() => moveField(stepFieldIdxs[pos + 1], s, idx)} disabled={pos === stepFieldIdxs.length - 1} title="Move down">
                  <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                </button>
                <button className="btn btn-ghost text-red-500" onClick={() => removeField(idx)} title="Remove">
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Label</label>
                <input className="input w-full" value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} placeholder="e.g. Your Name" />
              </div>
              <div>
                <label className="block text-sm font-medium">Field ID</label>
                <input className="input w-full" value={field.id} onChange={(e) => updateField(idx, { id: e.target.value })} placeholder="e.g. name" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Type</label>
                <select className="select w-full" value={field.type} onChange={(e) => updateField(idx, { type: e.target.value as SendAMessageFieldType })}>
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Placeholder</label>
                <input className="input w-full" value={field.placeholder ?? ''} onChange={(e) => updateField(idx, { placeholder: e.target.value })} placeholder="Hint text inside the field" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.required === true}
                onChange={(e) => updateField(idx, { required: e.target.checked })}
                className="accent-[var(--admin-primary)]"
              />
              Required
            </label>

            {field.type === 'select' && (
              <div>
                <label className="block text-sm font-medium mb-1">Options (one per line)</label>
                <textarea
                  className="textarea w-full font-mono text-xs"
                  rows={4}
                  value={(field.options ?? []).join('\n')}
                  onChange={(e) =>
                    updateField(idx, {
                      options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder={"Option A\nOption B\nOption C"}
                />
              </div>
            )}
          </div>
          </Fragment>
          );
        })}
          </div>
          );
        })}
      </div>

    </div>
  );
}
