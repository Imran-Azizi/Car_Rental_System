'use client';
import { forwardRef } from 'react';
import { toEnglishNums } from '@/lib/utils';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  allowDecimal?: boolean;
}

/**
 * Drop-in replacement for <input> for numeric fields.
 * Automatically converts Persian/Dari/Arabic-Indic digits to English (0-9)
 * on both keystroke and paste. Renders as type="text" with inputMode="decimal".
 */
const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ allowDecimal = true, onChange, onPaste, className, ...props }, ref) => {
    const clean = (v: string) => {
      const eng = toEnglishNums(v);
      return allowDecimal
        ? eng.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
        : eng.replace(/[^0-9]/g, '');
    };

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        className={className}
        onChange={(e) => {
          const cleaned = clean(e.target.value);
          if (e.target.value !== cleaned) e.target.value = cleaned;
          onChange?.(e);
        }}
        onPaste={(e) => {
          e.preventDefault();
          const pasted = clean(e.clipboardData.getData('text'));
          const start = e.currentTarget.selectionStart ?? 0;
          const end = e.currentTarget.selectionEnd ?? 0;
          const next = clean(
            e.currentTarget.value.slice(0, start) + pasted + e.currentTarget.value.slice(end)
          );
          e.currentTarget.value = next;
          // Synthetic onChange to notify React state
          const syntheticEvent = { ...e, target: { ...e.currentTarget, value: next } };
          onChange?.(syntheticEvent as any);
          onPaste?.(e);
        }}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';
export default NumericInput;
