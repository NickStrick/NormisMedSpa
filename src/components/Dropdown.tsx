// src/components/Dropdown.tsx
'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

/** Shared look for storefront form controls; same size and border as the booking time buttons. */
export const FIELD_CONTROL_CLASS =
  // Fixed height rather than padding: text inputs enforce a taller minimum line height than buttons
  'product-select !py-0 h-[54px] w-full bg-[var(--bg)] text-[var(--text-1)] border-2 border-black/40 hover:border-black/60 outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30';

export type DropdownOption = { value: string; label: string };

// Roughly the open list's max height (max-h-64) plus its gap; below this much room, open upward.
const LIST_ROOM_PX = 280;

/**
 * Styled replacement for a native <select>, whose open list browsers won't let us style.
 * A hidden <select> mirrors the current value so the control still takes part in forms.
 */
export default function Dropdown({
  value,
  options,
  onChange,
  labelId,
  name,
  className = '',
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** id of the visible label element */
  labelId?: string;
  name?: string;
  className?: string;
}) {
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const openList = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) setOpenUp(window.innerHeight - rect.bottom < LIST_ROOM_PX && rect.top > LIST_ROOM_PX);
    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  // Close when clicking anywhere outside
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  // Keep the keyboard-highlighted option in view in long lists
  useEffect(() => {
    if (open) listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  const optionId = (i: number) => `${baseId}-option-${i}`;

  return (
    <div ref={rootRef} className="relative">
      <select
        hidden
        tabIndex={-1}
        aria-hidden
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* !pr-11 leaves room for the chevron against .product-select's padding */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${baseId}-list`}
        aria-labelledby={labelId}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        disabled={options.length === 0}
        className={`${FIELD_CONTROL_CLASS} !pr-11 relative text-left cursor-pointer text-nowrap ${open ? '!border-[var(--primary)]' : ''} ${className}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        {selected?.label ?? ' '}
        <ChevronDown
          className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <motion.div
          ref={listRef}
          id={`${baseId}-list`}
          role="listbox"
          aria-labelledby={labelId}
          initial={{ opacity: 0, y: openUp ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          // preventDefault keeps focus on the button, so keyboard use continues after a click
          onMouseDown={(e) => e.preventDefault()}
          className={`absolute z-30 left-0 w-full min-w-max max-h-64 overflow-y-auto p-1.5 rounded-[var(--round-xl)] bg-[var(--bg)] border-2 border-[var(--primary)] shadow-[var(--elev-2)] ${
            openUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {options.map((o, i) => {
            const isSelected = i === selectedIndex;
            return (
              <div
                key={o.value}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(i)}
                className={`flex items-center justify-between gap-4 cursor-pointer rounded-xl px-4 py-2.5 text-lg transition-colors ${
                  isSelected ? 'font-semibold text-[var(--primary)]' : 'text-[var(--text-1)]'
                } ${i === activeIndex ? 'bg-[var(--bg-2)]' : ''}`}
              >
                <span className="text-nowrap">{o.label}</span>
                {isSelected && <Check className="w-5 h-5 flex-none" aria-hidden />}
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
