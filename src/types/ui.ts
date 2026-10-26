export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  /** Reason the option is unavailable; rendered next to the label and announced to AT. */
  hint?: string
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'
export type AlertTone = 'error' | 'warning' | 'info' | 'success'
