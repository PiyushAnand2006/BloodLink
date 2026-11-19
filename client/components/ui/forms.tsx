"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

const CONTROL_CLASSES =
  "w-full rounded border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 disabled:bg-subtle disabled:text-muted";

export function Field({
  label,
  error,
  hint,
  required,
  children,
  htmlFor,
  className = "",
}: {
  label: string;
  error?: FieldError | string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  const message = typeof error === "string" ? error : error?.message;
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-navy">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {hint && !message && <p className="text-xs text-muted">{hint}</p>}
      {message && (
        <p className="text-xs font-medium text-danger" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL_CLASSES} ${className}`} {...rest} />;
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${CONTROL_CLASSES} ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL_CLASSES} min-h-[72px] ${className}`} {...rest} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-navy">{label}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-50 ${
          checked ? "bg-success" : "bg-line"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="sr-only">{checked ? "On" : "Off"}</span>
    </div>
  );
}
