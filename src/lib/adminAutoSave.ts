'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { SiteConfig } from '@/types/site';
import { linkMatchingSocials } from '@/lib/socialLinks';

// -----------------------------
// Shared config save: every admin panel PUTs the whole SiteConfig, so a panel
// holding a stale copy could overwrite another panel's earlier save. Instead,
// only the top-level keys this panel changed (draft vs original) are written
// on top of the last config saved this session.
// -----------------------------
let lastSaved: SiteConfig | null = null;

export async function saveAdminConfig(siteId: string, draft: SiteConfig, original: SiteConfig): Promise<SiteConfig> {
  const merged = { ...(lastSaved ?? original) } as Record<string, unknown>;
  const keys = new Set([...Object.keys(draft), ...Object.keys(original)]) as Set<keyof SiteConfig>;
  for (const key of keys) {
    if (JSON.stringify(draft[key]) !== JSON.stringify(original[key])) merged[key] = draft[key];
  }

  const variant = (process.env.NEXT_PUBLIC_CONFIG_VARIANT ?? 'draft') as 'draft' | 'published';
  const res = await fetch(`/api/admin/config/${encodeURIComponent(siteId)}?variant=${variant}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-local-admin': '1' },
    // Custom social rows matching a Settings → Social Media link get connected to it
    body: JSON.stringify(linkMatchingSocials(merged as SiteConfig)),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Save failed with HTTP ${res.status}`);
  }

  const saved: SiteConfig = await res.json();
  lastSaved = saved;
  if (!quietSaves) savedListeners.forEach((l) => l());
  return saved;
}

// -----------------------------
// "Saved" prompt: AdminBar listens for successful saves and asks whether to keep
// editing or exit admin mode. Saves made while hiding the admin UI stay quiet.
// -----------------------------
const savedListeners = new Set<() => void>();
let quietSaves = false;

export function onAdminSaved(listener: () => void): () => void {
  savedListeners.add(listener);
  return () => {
    savedListeners.delete(listener);
  };
}

/** Ask AdminGate to hide the admin UI (same as ctrl + alt + a). */
export const ADMIN_EXIT_EVENT = 'cm-admin-exit';
export function exitAdminMode() {
  window.dispatchEvent(new Event(ADMIN_EXIT_EVENT));
}

// -----------------------------
// Save-on-hide registry: admin panels with unsaved edits register their Save
// handler here, and AdminGate flushes them before hiding the admin UI.
// -----------------------------
type Saver = () => Promise<boolean>;

const savers = new Set<Saver>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Register `save` while `isDirty` is true. `save` resolves true on success. */
export function useAdminAutoSave(isDirty: boolean, save: Saver) {
  useEffect(() => {
    if (!isDirty) return;
    savers.add(save);
    notify();
    return () => {
      savers.delete(save);
      notify();
    };
  }, [isDirty, save]);
}

/** True while any admin panel has unsaved edits (drives the bottom save banner). */
export function useAdminHasUnsaved(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => savers.size > 0,
    () => false
  );
}

/**
 * Run every pending save (one at a time, since each PUTs the whole config). Resolves true if all succeeded.
 * `quiet` skips the "Saved" prompt (used when hiding the admin UI).
 */
export async function flushAdminSaves({ quiet = false } = {}): Promise<boolean> {
  let ok = true;
  quietSaves = quiet;
  try {
    for (const save of Array.from(savers)) {
      const saved = await save().catch(() => false);
      ok = ok && saved;
    }
  } finally {
    quietSaves = false;
  }
  return ok;
}
