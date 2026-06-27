import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

import type { SelectOption } from '../../data/proposal'
import { cn } from '../../utils/cn'

interface FieldShellProps {
  children: ReactNode
  error?: string
  helperText?: string
  id: string
  label: string
  required?: boolean
}

const controlClasses =
  'min-h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

function FieldShell({
  children,
  error,
  helperText,
  id,
  label,
  required = false,
}: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-800" htmlFor={id}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-red-600">
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-red-600" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs leading-5 text-slate-500" id={`${id}-helper`}>
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'> {
  error?: string
  helperText?: string
  id: string
  label: string
  required?: boolean
}

export function InputField({
  className,
  error,
  helperText,
  id,
  label,
  required,
  ...inputProps
}: InputFieldProps) {
  const descriptionId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined

  return (
    <FieldShell
      error={error}
      helperText={helperText}
      id={id}
      label={label}
      required={required}
    >
      <input
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={cn(controlClasses, error && 'border-red-500 focus:border-red-600 focus:ring-red-100', className)}
        id={id}
        required={required}
        {...inputProps}
      />
    </FieldShell>
  )
}

interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'required'> {
  error?: string
  helperText?: string
  id: string
  label: string
  options: SelectOption[]
  placeholder: string
  required?: boolean
}

export function SelectField({
  className,
  error,
  helperText,
  id,
  label,
  options,
  placeholder,
  required,
  ...selectProps
}: SelectFieldProps) {
  const descriptionId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined

  return (
    <FieldShell
      error={error}
      helperText={helperText}
      id={id}
      label={label}
      required={required}
    >
      <select
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={cn(controlClasses, error && 'border-red-500 focus:border-red-600 focus:ring-red-100', className)}
        id={id}
        required={required}
        {...selectProps}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'required'> {
  error?: string
  helperText?: string
  id: string
  label: string
  required?: boolean
}

export function TextAreaField({
  className,
  error,
  helperText,
  id,
  label,
  required,
  ...textAreaProps
}: TextAreaFieldProps) {
  const descriptionId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined

  return (
    <FieldShell
      error={error}
      helperText={helperText}
      id={id}
      label={label}
      required={required}
    >
      <textarea
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={cn(
          controlClasses,
          'min-h-28 resize-y',
          error && 'border-red-500 focus:border-red-600 focus:ring-red-100',
          className,
        )}
        id={id}
        required={required}
        {...textAreaProps}
      />
    </FieldShell>
  )
}
