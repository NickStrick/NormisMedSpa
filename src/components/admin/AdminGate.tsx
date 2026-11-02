'use client';

import { useEffect, useRef, useState } from 'react';
import { ADMIN_EXIT_EVENT, flushAdminSaves } from '@/lib/adminAutoSave';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const hidingRef = useRef(false);

  useEffect(() => {
    // Hiding: save any unsaved admin edits first. If a save fails, stay open
    // so the panel's error message is visible and nothing is lost.
    const hide = async () => {
      if (!enabledRef.current || hidingRef.current) return;
      hidingRef.current = true;
      try {
        if (await flushAdminSaves({ quiet: true })) {
          enabledRef.current = false;
          setEnabled(false);
        }
      } finally {
        hidingRef.current = false;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const hasAKey = e.code === 'KeyA' || `${e.key}`?.toLowerCase() === 'a';
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const ctrlAndMeta = e.ctrlKey && e.metaKey;
      const altOrShift = e.altKey || e.shiftKey;
      const isToggle = hasAKey && (ctrlAndMeta || (ctrlOrMeta && altOrShift));
      if (!isToggle || hidingRef.current) return;

      if (!enabledRef.current) {
        enabledRef.current = true;
        setEnabled(true);
        return;
      }
      hide();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(ADMIN_EXIT_EVENT, hide);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(ADMIN_EXIT_EVENT, hide);
    };
  }, []);

  if (!enabled) return null;
  return <>{children}</>;
}
